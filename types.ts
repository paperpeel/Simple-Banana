
export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT = "3:4",
  LANDSCAPE = "4:3",
  WIDESCREEN_PORTRAIT = "9:16",
  WIDESCREEN_LANDSCAPE = "16:9"
}

export enum ImageSize {
  ONE_K = "1K",
  TWO_K = "2K",
  FOUR_K = "4K"
}

export enum ModelType {
  NANO_BANANA = "gemini-2.5-flash-image",
  NANO_BANANA_PRO = "gemini-3-pro-image-preview"
}

export type Language = 'en' | 'zh';

export interface GenerationSettings {
  prompt: string;
  model: ModelType;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  negativePrompt?: string;
  referenceImage?: string; // Base64 string (raw)
  referenceImageMimeType?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  settings: {
    model: ModelType;
    aspectRatio: AspectRatio;
    imageSize: ImageSize;
    hasReferenceImage?: boolean;
  };
}

export interface AppConfig {
  baseUrl: string;
  apiKey: string;
}
