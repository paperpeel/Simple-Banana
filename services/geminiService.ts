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

  // The REST API endpoint format:
  // POST https://{base}/v1beta/models/{model}:generateContent?key={key}
  const endpoint = `${apiBase}/v1beta/models/${settings.model}:generateContent?key=${apiKey}`;

  console.log(`[Gemini Service] Requesting: ${endpoint.replace(apiKey, 'HIDDEN_KEY')}`);

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

    // 5. Parse Successful Response
    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      // Check for prompt feedback block (safety filters)
      if (data.promptFeedback && data.promptFeedback.blockReason) {
        throw new Error(`Generation blocked: ${data.promptFeedback.blockReason}`);
      }
      throw new Error("API returned no candidates.");
    }

    const candidate = data.candidates[0];
    let generatedImage: string | null = null;
    let generatedText = "";

    // Iterate through parts to find image or text
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        // Check for inlineData (Base64 Image)
        if (part.inlineData && part.inlineData.data) {
          const base64EncodeString = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          generatedImage = `data:${mimeType};base64,${base64EncodeString}`;
          break; // Found the image, stop looking
        }
        // Check for text (Refusal or Explanation)
        if (part.text) {
          generatedText += part.text;
        }
      }
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

    if (candidate.finishReason && candidate.finishReason !== "STOP") {
      throw new Error(`Generation stopped. Reason: ${candidate.finishReason}`);
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