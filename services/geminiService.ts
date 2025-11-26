
import { GoogleGenAI } from "@google/genai";
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

  // Initialize client configuration
  const clientConfig: any = { 
    apiKey: apiKey 
  };

  // PROXY LOGIC: "Nuclear Option" - Fetch Interceptor
  // If a custom Base URL is provided, we override the global fetch behavior for this client instance.
  // This guarantees that the request goes to the proxy, regardless of what the SDK tries to do internally.
  if (baseUrl && !baseUrl.includes("generativelanguage.googleapis.com")) {
    console.log("[Nano Banana Service] Activating Proxy Interceptor:", baseUrl);
    
    // Remove trailing slash from user's URL for clean replacement
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // The default Google endpoint that the SDK will try to hit
    const defaultEndpoint = "https://generativelanguage.googleapis.com";

    // Custom fetch implementation
    const customFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      let urlStr = input.toString();
      
      // Check if the SDK is trying to hit the default endpoint
      if (urlStr.includes(defaultEndpoint)) {
        // Replace the default endpoint with the user's proxy URL
        const newUrl = urlStr.replace(defaultEndpoint, cleanBaseUrl);
        console.debug(`[Proxy Redirect] ${urlStr} -> ${newUrl}`);
        
        // Return the fetch call with the modified URL
        return fetch(newUrl, init);
      }
      
      // Fallback for other URLs (unlikely in this context)
      return fetch(input, init);
    };

    // Inject the custom fetch into requestOptions.
    // This is supported by the @google/genai SDK to override the transport layer.
    clientConfig.requestOptions = {
      fetch: customFetch
    };
  }

  const ai = new GoogleGenAI(clientConfig);

  try {
    const parts: any[] = [];

    // Add Reference Images if present
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

    // Add Text Prompt
    parts.push({
      text: settings.prompt,
    });

    // Construct Image Configuration
    // Note: imageSize is ONLY supported on the Pro model
    const imageConfig: any = {
      aspectRatio: settings.aspectRatio,
    };

    if (settings.model === ModelType.NANO_BANANA_PRO) {
      imageConfig.imageSize = settings.imageSize;
    }

    const response = await ai.models.generateContent({
      model: settings.model,
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: imageConfig,
      },
    });

    // Enhanced parsing logic
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("API returned no candidates.");
    }

    const candidate = response.candidates[0];
    let generatedImage: string | null = null;
    let generatedText = "";

    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64EncodeString = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          generatedImage = `data:${mimeType};base64,${base64EncodeString}`;
          break; // Prioritize finding the image
        }
        if (part.text) {
          generatedText += part.text;
        }
      }
    }

    if (generatedImage) {
      return generatedImage;
    }

    // If no image found, try to explain why
    if (generatedText) {
      const cleanText = generatedText.trim();
      if (cleanText.length > 0) {
         // Usually contains refusal reason like "I cannot generate..."
         throw new Error(`Model returned text instead of image: "${cleanText}"`);
      }
    }

    if (candidate.finishReason && candidate.finishReason !== "STOP") {
      throw new Error(`Generation stopped. Reason: ${candidate.finishReason}`);
    }

    throw new Error("No image data found in the response. The model might have been blocked or returned an empty response.");

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    if (error instanceof Error) {
        // Enhance error message for common proxy issues
        if (error.message.includes("404")) {
           throw new Error(`Proxy Error: Endpoint not found (404). Your proxy URL might be incorrect or the server is down.`);
        }
        if (error.message.includes("403") || error.message.includes("401")) {
           throw new Error(`Permission Error: Invalid API Key or Proxy refused connection.`);
        }
        if (error.message.includes("Failed to fetch")) {
            throw new Error(`Network Error: Could not connect to Proxy. Check CORS settings on your proxy server.`);
        }
        // Pass through the enhanced error messages from above
        throw error;
    }
    throw new Error("An unexpected error occurred during generation.");
  }
};
