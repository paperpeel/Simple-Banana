
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

  // Initialize client with user-provided API key and Base URL (Proxy)
  const ai = new GoogleGenAI({ 
    apiKey: apiKey,
    requestOptions: {
      baseUrl: baseUrl
    }
  } as any);

  try {
    const parts: any[] = [];

    // Add Reference Image if present
    if (settings.referenceImage && settings.referenceImageMimeType) {
      parts.push({
        inlineData: {
          data: settings.referenceImage,
          mimeType: settings.referenceImageMimeType,
        },
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

    // Parse response to find the image
    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const base64EncodeString = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            return `data:${mimeType};base64,${base64EncodeString}`;
          }
        }
      }
    }

    throw new Error("No image data found in the response.");

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    if (error instanceof Error) {
        // Enhance error message for common proxy issues
        if (error.message.includes("404")) {
           throw new Error(`Proxy Error: Endpoint not found (404). Check your Base URL.`);
        }
        if (error.message.includes("403") || error.message.includes("401")) {
           throw new Error(`Permission Error: Check your API Key.`);
        }
        throw new Error(`Generation failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during generation.");
  }
};
