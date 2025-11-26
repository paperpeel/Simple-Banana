
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

export interface ReferenceImage {
  data: string; // Base64 string (raw)
  mimeType: string;
}

export interface GenerationSettings {
  prompt: string;
  model: ModelType;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  negativePrompt?: string;
  referenceImages?: ReferenceImage[];
}

// Base interface for persistent history (metadata only)
export interface HistoryItem {
  id: string;
  prompt: string;
  timestamp: number;
  settings: {
    model: ModelType;
    aspectRatio: AspectRatio;
    imageSize: ImageSize;
    referenceImageCount?: number;
  };
}

// Extended interface for session storage (includes heavy image data)
export interface GeneratedImage extends HistoryItem {
  url: string;
  fileSize?: number; // Size in bytes
}

export interface AppConfig {
  baseUrl: string;
  apiKey: string;
}
