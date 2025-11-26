
import { GenerationSettings, ModelType } from '../types';

interface GenerateImageParams {
  settings: GenerationSettings;
  baseUrl?: string;
  apiKey?: string;
}

export const generateImage = async ({ settings, baseUrl, apiKey }: GenerateImageParams): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in Settings.");
  }

  // 1. Construct the Endpoint URL
  // We handle the URL construction manually to ensure the Proxy URL is respected 100%.
  let apiBase = baseUrl || "https://generativelanguage.googleapis.com";
  
  // Remove trailing slash if present to avoid double slashes
  if (apiBase.endsWith('/')) {
    apiBase = apiBase.slice(0, -1);
  }

  // Determine method: standard generateContent or streamGenerateContent
  // streamGenerateContent is used if settings.useStream is true.
  // Streaming helps keep the connection alive (avoiding proxy timeouts) for long tasks like 4K images.
  const method = settings.useStream ? 'streamGenerateContent' : 'generateContent';
  
  // The REST API endpoint format:
  // POST https://{base}/v1beta/models/{model}:{method}?key={key}
  const endpoint = `${apiBase}/v1beta/models/${settings.model}:${method}?key=${apiKey}`;

  console.log(`[Gemini Service] Requesting: ${endpoint.replace(apiKey, 'HIDDEN_KEY')} (Stream: ${!!settings.useStream})`);

  // 2. Construct the Payload (Raw REST API Format)
  const parts: any[] = [];

  // 2.1 Add Reference Images (if any)
  if (settings.referenceImages && settings.referenceImages.length > 0) {
    settings.referenceImages.forEach(img => {
      parts.push({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType,
        },
      });
    });
  }

  // 2.2 Add Text Prompt
  parts.push({
    text: settings.prompt,
  });

  // 2.3 Construct Configuration
  // For Gemini 2.5/3 models, image generation parameters usually reside in generationConfig.
  const generationConfig: any = {};
  
  const imageConfig: any = {
    aspectRatio: settings.aspectRatio,
  };

  // Only add imageSize for the Pro model
  if (settings.model === ModelType.NANO_BANANA_PRO) {
    imageConfig.imageSize = settings.imageSize;
  }

  // Inject imageConfig into generationConfig
  // This structure matches the expected JSON for these specific models.
  generationConfig.imageConfig = imageConfig;

  // Final Payload
  const payload = {
    contents: [
      {
        parts: parts
      }
    ],
    generationConfig: generationConfig
  };

  // 3. Execute Request
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    // 4. Handle HTTP Errors
    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        // Google APIs usually return detailed error messages in error.message
        if (errorData.error && errorData.error.message) {
          errorMsg = `API Error: ${errorData.error.message}`;
        }
      } catch (e) {
        // Fallback if response isn't JSON
      }
      
      // Provide user-friendly hints for common proxy issues
      if (response.status === 404) {
        throw new Error("Proxy Error (404): The endpoint was not found. Please check your Proxy URL setting. It should usually be just the domain (e.g., https://your-worker.dev) without path suffixes.");
      }
      if (response.status === 403 || response.status === 401) {
        throw new Error("Permission Error: Invalid API Key or access denied by proxy.");
      }
      
      throw new Error(errorMsg);
    }

    // 5. Parse Response
    let candidates: any[] = [];
    let promptFeedback: any = null;

    if (settings.useStream) {
      // HANDLE STREAMING RESPONSE ROBUSTLY
      // We manually read the stream to handle both JSON Array format `[...]` and SSE format `data: {...}`
      // This prevents "Unexpected token 'd'" errors if the server returns SSE.
      
      const reader = response.body?.getReader();
      let responseText = '';
      
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
             responseText += decoder.decode(); // Flush end of stream
             break;
          }
          responseText += decoder.decode(value, { stream: true });
        }
      } else {
        // Fallback for environments without streams
        responseText = await response.text();
      }

      // Strategy A: Try parsing as standard JSON (Array or Object)
      try {
        const data = JSON.parse(responseText);
        if (Array.isArray(data)) {
           data.forEach(chunk => {
             if (chunk.candidates) candidates.push(...chunk.candidates);
             if (chunk.promptFeedback) promptFeedback = chunk.promptFeedback;
           });
        } else {
           if (data.candidates) candidates = data.candidates;
           if (data.promptFeedback) promptFeedback = data.promptFeedback;
        }
      } catch (e) {
        // Strategy B: Parsing failed, likely SSE format (lines starting with 'data:')
        // Regex to match "data: {...}" lines
        console.warn("Standard JSON parse failed, attempting SSE parse...", e);
        const lines = responseText.split('\n');
        for (const line of lines) {
           const trimmed = line.trim();
           if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.substring(5).trim();
              if (jsonStr === '[DONE]') continue;
              if (jsonStr) {
                 try {
                    const chunk = JSON.parse(jsonStr);
                    if (chunk.candidates) candidates.push(...chunk.candidates);
                    if (chunk.promptFeedback) promptFeedback = chunk.promptFeedback;
                 } catch (innerE) {
                    // Ignore malformed individual chunks
                    console.debug("Skipping malformed SSE chunk:", innerE);
                 }
              }
           }
        }
      }

    } else {
      // HANDLE STANDARD RESPONSE
      const data = await response.json();
      candidates = data.candidates || [];
      promptFeedback = data.promptFeedback;
    }

    // 6. Extract Image
    if ((!candidates || candidates.length === 0) && !promptFeedback) {
      throw new Error("API returned no candidates.");
    }

    // Check for prompt feedback block (safety filters)
    if (promptFeedback && promptFeedback.blockReason) {
      throw new Error(`Generation blocked: ${promptFeedback.blockReason}`);
    }

    // For stream, we might have multiple candidate chunks, but usually the image is in one of them.
    // We iterate through ALL candidates found.
    
    let generatedImage: string | null = null;
    let generatedText = "";

    // Iterate backwards because in streaming, the final result is often at the end, 
    // but for images, it might be the only non-empty one.
    for (const candidate of candidates) {
        if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
                // Check for inlineData (Base64 Image)
                if (part.inlineData && part.inlineData.data) {
                  const base64EncodeString = part.inlineData.data;
                  const mimeType = part.inlineData.mimeType || 'image/png';
                  generatedImage = `data:${mimeType};base64,${base64EncodeString}`;
                  break; // Found the image
                }
                // Check for text (Refusal or Explanation)
                if (part.text) {
                  generatedText += part.text;
                }
            }
        }
        if (generatedImage) break;
    }

    // Success: Return image URL
    if (generatedImage) {
      return generatedImage;
    }

    // Failure: No image found
    if (generatedText) {
      const cleanText = generatedText.trim();
      if (cleanText.length > 0) {
         throw new Error(`Model returned text instead of image: "${cleanText}"`);
      }
    }
    
    // Check finish reasons on the candidates
    const finishReasons = candidates.map(c => c.finishReason).filter(r => r && r !== "STOP");
    if (finishReasons.length > 0) {
      throw new Error(`Generation stopped. Reason: ${finishReasons.join(', ')}`);
    }

    throw new Error("No image data found in the response. The model might have been blocked.");

  } catch (error) {
    console.error("Gemini Request Error:", error);
    if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
            throw new Error(`Network Error: Could not connect to ${apiBase}. Please check your Proxy URL and CORS settings.`);
        }
        throw error;
    }
    throw new Error("An unexpected error occurred.");
  }
};
