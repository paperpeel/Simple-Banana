
import { AspectRatio, ImageSize, ModelType } from './types';

export const translations = {
  en: {
    appTitle: "Nano Banana Pro",
    settings: "Settings",
    apiKey: "API Key",
    apiKeyPlaceholder: "AIzaSy...",
    apiKeyHelp: "Your key is stored locally and sent only to the configured Proxy/URL.",
    proxyUrl: "Proxy / Base URL",
    proxyUrlPlaceholder: "https://generativelanguage.googleapis.com",
    proxyHelp: "Required if you cannot access Google APIs directly. Point this to your backend server.",
    resetUrl: "Reset URL",
    cancel: "Cancel",
    save: "Save Settings",
    galleryEmpty: "No images generated yet.",
    model: "Model",
    refImage: "Reference Image",
    optional: "(Optional)",
    uploadText: "Click to upload reference",
    prompt: "Prompt",
    promptPlaceholder: "Describe your image...",
    aspectRatioLabel: "Aspect Ratio",
    qualitySizeLabel: "Quality / Size",
    proOnly: "Pro Only",
    generate: "Generate",
    thinking: "Thinking...",
    proxyActive: "Proxy Active",
    readyToCreate: "Ready to create.",
    setApiKeyInfo: "Set your API Key, then enter a prompt.",
    gallery: "Gallery",
    download: "Download",
    refImageUsed: "Ref Image Used",
    errorApiKey: "API Key is missing. Please add it in settings.",
    errorImageLarge: "Image is too large. Please choose an image under 5MB.",
    errorProcessImage: "Failed to process image file.",
    errorGenFailed: "Failed to generate image.",
    
    // Option Mappings
    modelOptions: {
      [ModelType.NANO_BANANA]: "Nano Banana (Fast)",
      [ModelType.NANO_BANANA_PRO]: "Nano Banana Pro (Quality)"
    },
    modelDescriptions: {
      [ModelType.NANO_BANANA]: "Best for speed and general tasks",
      [ModelType.NANO_BANANA_PRO]: "High fidelity with size controls"
    },
    aspectRatios: {
      [AspectRatio.SQUARE]: 'Square (1:1)',
      [AspectRatio.PORTRAIT]: 'Portrait (3:4)',
      [AspectRatio.LANDSCAPE]: 'Landscape (4:3)',
      [AspectRatio.WIDESCREEN_PORTRAIT]: 'Mobile (9:16)',
      [AspectRatio.WIDESCREEN_LANDSCAPE]: 'Cinema (16:9)',
    },
    imageSizes: {
      [ImageSize.ONE_K]: 'Standard (1K)',
      [ImageSize.TWO_K]: 'High Res (2K)',
      [ImageSize.FOUR_K]: 'Ultra Res (4K)',
    }
  },
  zh: {
    appTitle: "Nano Banana Pro",
    settings: "设置",
    apiKey: "API 密钥",
    apiKeyPlaceholder: "AIzaSy...",
    apiKeyHelp: "您的密钥仅存储在本地，并仅发送到配置的代理/URL。",
    proxyUrl: "代理 / 基础 URL",
    proxyUrlPlaceholder: "https://generativelanguage.googleapis.com",
    proxyHelp: "如果您无法直接访问 Google API（如国内环境），请在此处填写您的后端代理地址。",
    resetUrl: "重置 URL",
    cancel: "取消",
    save: "保存设置",
    galleryEmpty: "暂无生成的图片。",
    model: "模型",
    refImage: "参考图",
    optional: "(可选)",
    uploadText: "点击上传参考图",
    prompt: "提示词",
    promptPlaceholder: "描述您想要生成的画面...",
    aspectRatioLabel: "画面比例",
    qualitySizeLabel: "画质 / 尺寸",
    proOnly: "Pro 专属",
    generate: "生成图片",
    thinking: "思考中...",
    proxyActive: "代理已启用",
    readyToCreate: "准备开始",
    setApiKeyInfo: "请先设置 API 密钥，然后输入提示词。",
    gallery: "图库",
    download: "下载",
    refImageUsed: "使用了参考图",
    errorApiKey: "缺少 API 密钥。请在设置中添加。",
    errorImageLarge: "图片过大。请选择小于 5MB 的图片。",
    errorProcessImage: "处理图片文件失败。",
    errorGenFailed: "生成图片失败。",

    // Option Mappings
    modelOptions: {
      [ModelType.NANO_BANANA]: "Nano Banana (极速版)",
      [ModelType.NANO_BANANA_PRO]: "Nano Banana Pro (画质版)"
    },
    modelDescriptions: {
      [ModelType.NANO_BANANA]: "速度快，适合通用任务",
      [ModelType.NANO_BANANA_PRO]: "高保真，支持尺寸控制"
    },
    aspectRatios: {
      [AspectRatio.SQUARE]: '正方形 (1:1)',
      [AspectRatio.PORTRAIT]: '纵向 (3:4)',
      [AspectRatio.LANDSCAPE]: '横向 (4:3)',
      [AspectRatio.WIDESCREEN_PORTRAIT]: '手机屏 (9:16)',
      [AspectRatio.WIDESCREEN_LANDSCAPE]: '宽屏 (16:9)',
    },
    imageSizes: {
      [ImageSize.ONE_K]: '标准 (1K)',
      [ImageSize.TWO_K]: '高清 (2K)',
      [ImageSize.FOUR_K]: '超清 (4K)',
    }
  }
};
