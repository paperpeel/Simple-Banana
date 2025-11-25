
import { AspectRatio, ImageSize, ModelType } from './types';

export const ASPECT_RATIO_OPTIONS = [
  { label: 'Square (1:1)', value: AspectRatio.SQUARE },
  { label: 'Portrait (3:4)', value: AspectRatio.PORTRAIT },
  { label: 'Landscape (4:3)', value: AspectRatio.LANDSCAPE },
  { label: 'Mobile (9:16)', value: AspectRatio.WIDESCREEN_PORTRAIT },
  { label: 'Cinema (16:9)', value: AspectRatio.WIDESCREEN_LANDSCAPE },
];

export const IMAGE_SIZE_OPTIONS = [
  { label: 'Standard (1K)', value: ImageSize.ONE_K },
  { label: 'High Res (2K)', value: ImageSize.TWO_K },
  { label: 'Ultra Res (4K)', value: ImageSize.FOUR_K },
];

export const MODEL_OPTIONS = [
  { label: 'Nano Banana (Fast)', value: ModelType.NANO_BANANA, description: 'Best for speed and general tasks' },
  { label: 'Nano Banana Pro (Quality)', value: ModelType.NANO_BANANA_PRO, description: 'High fidelity with size controls' },
];

export const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
export const DEFAULT_MODEL = ModelType.NANO_BANANA_PRO;
export const MAX_REFERENCE_IMAGES = 5;
