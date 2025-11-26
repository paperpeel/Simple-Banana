
import React, { useState, useEffect, useRef } from 'react';
import { AspectRatio, ImageSize, GenerationSettings, GeneratedImage, ModelType, Language } from './types';
import { ASPECT_RATIO_OPTIONS, IMAGE_SIZE_OPTIONS, MODEL_OPTIONS, DEFAULT_BASE_URL, DEFAULT_MODEL, MAX_REFERENCE_IMAGES } from './constants';
import { generateImage } from './services/geminiService';
import SettingsModal from './components/SettingsModal';
import Gallery from './components/Gallery';
import { translations } from './locales';

// Interface for managing UI state of uploaded images
interface UploadedImage {
  id: string;
  preview: string; // Full data URL for display
  raw: string;     // Base64 string for API
  mime: string;    // Mime type
}

const HISTORY_STORAGE_KEY = 'gemini_image_history';

const App: React.FC = () => {
  // Language State (Default Chinese)
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'zh';
  });

  const t = translations[language];

  // Config State
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    return localStorage.getItem('gemini_base_url') || DEFAULT_BASE_URL;
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  
  // Generation State
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>(DEFAULT_MODEL);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.ONE_K);
  
  // Reference Images State
  const [refImages, setRefImages] = useState<UploadedImage[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [history, setHistory] = useState<GeneratedImage[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load history from storage", e);
      return [];
    }
  });
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // Scroll ref
  const resultsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('gemini_base_url', baseUrl);
    localStorage.setItem('gemini_api_key', apiKey);
  }, [baseUrl, apiKey]);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  // Persistent History Logic with Quota Management
  const updateHistory = (newHistory: GeneratedImage[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      setStorageWarning(null);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn("LocalStorage quota exceeded. Trimming history.");
        // Recursively remove oldest items until it fits
        const trimmedHistory = [...newHistory];
        // We assume newHistory has the newest item at index 0. We remove from the end.
        if (trimmedHistory.length > 0) {
           trimmedHistory.pop(); // Remove oldest
           updateHistory(trimmedHistory); // Recursive call to try saving again
           setStorageWarning(t.storageFull);
           setTimeout(() => setStorageWarning(null), 5000);
        }
      } else {
        console.error("Error saving history:", e);
      }
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  const handleSettingsSave = (newUrl: string, newKey: string) => {
    setBaseUrl(newUrl);
    setApiKey(newKey);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (refImages.length >= MAX_REFERENCE_IMAGES) {
        setError(t.maxImagesReached);
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit check
         setError(t.errorImageLarge);
         return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        
        // Extract raw base64 and mime type
        const matches = result.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
           const newImage: UploadedImage = {
             id: crypto.randomUUID(),
             preview: result,
             mime: matches[1],
             raw: matches[2]
           };
           setRefImages(prev => [...prev, newImage]);
           setError(null);
        } else {
           setError(t.errorProcessImage);
        }
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    }
  };

  const removeRefImage = (idToRemove: string) => {
    setRefImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && refImages.length === 0) return;
    if (!apiKey) {
      setError(t.errorApiKey);
      setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSelectedImage(null);

    const settings: GenerationSettings = {
      prompt,
      model,
      aspectRatio,
      imageSize,
      referenceImages: refImages.length > 0 ? refImages.map(img => ({
        data: img.raw,
        mimeType: img.mime
      })) : undefined
    };

    try {
      const imageUrl = await generateImage({ settings, baseUrl, apiKey });
      
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: imageUrl,
        prompt: settings.prompt,
        timestamp: Date.now(),
        settings: {
          model: settings.model,
          aspectRatio: settings.aspectRatio,
          imageSize: settings.imageSize,
          referenceImageCount: refImages.length
        }
      };

      const newHistory = [newImage, ...history];
      updateHistory(newHistory);
      setSelectedImage(newImage);
      
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);

    } catch (err: any) {
      setError(err.message || t.errorGenFailed);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `nano-banana-${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteImage = (img: GeneratedImage) => {
    const newHistory = history.filter(item => item.id !== img.id);
    updateHistory(newHistory);
    if (selectedImage?.id === img.id) {
      setSelectedImage(null);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(t.confirmClear)) {
      updateHistory([]);
      setSelectedImage(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-neutral-200 font-sans selection:bg-banana-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-banana-400 to-banana-600 flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-banana-500/20">
              N
            </div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              {t.appTitle}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
            >
              {language === 'en' ? '中' : 'En'}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-full transition-colors ${!apiKey ? 'text-red-400 bg-red-900/20 animate-pulse' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
              title={t.settings}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Col: Controls */}
        <div className="w-full lg:w-1/3 xl:w-1/4 space-y-6">
          <form onSubmit={handleGenerate} className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800 space-y-6">
            
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">{t.model}</label>
              <div className="flex flex-col gap-2">
                {MODEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setModel(opt.value)}
                    className={`flex items-start p-3 rounded-xl border text-left transition-all ${
                      model === opt.value
                        ? 'bg-neutral-800 border-banana-500/50 shadow-md shadow-black/20'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 mr-3 flex items-center justify-center ${
                      model === opt.value ? 'border-banana-500' : 'border-neutral-600'
                    }`}>
                      {model === opt.value && <div className="w-2 h-2 rounded-full bg-banana-500" />}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${model === opt.value ? 'text-white' : 'text-neutral-400'}`}>
                        {t.modelOptions[opt.value]}
                      </div>
                      <div className="text-xs text-neutral-600 mt-0.5">{t.modelDescriptions[opt.value]}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Image Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2 flex justify-between">
                <span>{t.refImage}</span>
                <span className="text-xs text-neutral-500 font-normal">{refImages.length}/{MAX_REFERENCE_IMAGES} {t.optional}</span>
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {/* Existing Images */}
                {refImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-neutral-700 group">
                    <img src={img.preview} alt="Reference" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button"
                        onClick={() => removeRefImage(img.id)}
                        className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full backdrop-blur-sm transition-transform hover:scale-110"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                         </svg>
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Upload Button */}
                {refImages.length < MAX_REFERENCE_IMAGES && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-neutral-800 hover:border-banana-500/50 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors group bg-neutral-950/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-600 group-hover:text-banana-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                )}
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Prompt Input */}
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-white mb-2">
                {t.prompt}
              </label>
              <textarea
                id="prompt"
                rows={4}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white placeholder-neutral-600 focus:ring-2 focus:ring-banana-500 focus:border-transparent outline-none resize-none transition-all"
                placeholder={t.promptPlaceholder}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate(e);
                  }
                }}
              />
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">{t.aspectRatioLabel}</label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAspectRatio(opt.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                      aspectRatio === opt.value
                        ? 'bg-neutral-800 text-banana-400 border-banana-500/50'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {t.aspectRatios[opt.value]}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Size (Only enabled for Pro) */}
            <div className={model !== ModelType.NANO_BANANA_PRO ? 'opacity-50 pointer-events-none' : ''}>
              <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-neutral-400">{t.qualitySizeLabel}</label>
                 {model !== ModelType.NANO_BANANA_PRO && (
                   <span className="text-[10px] text-banana-600/70 border border-banana-900/30 rounded px-1.5">{t.proOnly}</span>
                 )}
              </div>
              <div className="flex bg-neutral-950 rounded-lg p-1 border border-neutral-800">
                {IMAGE_SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setImageSize(opt.value)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      imageSize === opt.value
                        ? 'bg-neutral-800 text-white shadow'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {t.imageSizes[opt.value]}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating || (!prompt.trim() && refImages.length === 0)}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                isGenerating || (!prompt.trim() && refImages.length === 0)
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-banana-500 to-banana-600 text-black hover:from-banana-400 hover:to-banana-500 shadow-lg shadow-banana-500/25 active:scale-95'
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-neutral-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.thinking}
                </>
              ) : (
                <>
                  {t.generate}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Proxy Indicator */}
          {baseUrl !== DEFAULT_BASE_URL && (
            <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <div className="text-xs text-blue-200">
                <span className="font-semibold block">{t.proxyActive}</span>
                <span className="opacity-70 truncate max-w-[200px] block">{baseUrl}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Results */}
        <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col gap-6">
          
          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-200 px-4 py-3 rounded-xl flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          {storageWarning && (
            <div className="bg-yellow-900/20 border border-yellow-900/50 text-yellow-200 px-4 py-3 rounded-xl flex items-start gap-3 animate-fade-in-down">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <span>{storageWarning}</span>
            </div>
          )}

          {/* Selected/Latest Image Preview */}
          {selectedImage ? (
             <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-1 lg:p-2 overflow-hidden relative group">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.prompt} 
                  className="w-full h-auto rounded-xl max-h-[60vh] object-contain mx-auto bg-black/40"
                />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteImage(selectedImage)}
                      className="bg-red-900/80 hover:bg-red-600 text-white p-2 rounded-lg backdrop-blur-sm transition-colors border border-white/10"
                      title={t.delete}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDownload(selectedImage)}
                      className="bg-black/70 hover:bg-black text-white p-2 rounded-lg backdrop-blur-sm transition-colors border border-white/10"
                      title={t.download}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                </div>
                <div className="p-4">
                  <p className="text-white text-lg font-medium leading-tight">{selectedImage.prompt}</p>
                  <div className="flex gap-4 mt-2 text-sm text-neutral-500">
                    <span className="uppercase tracking-wide">{selectedImage.settings.model.includes('flash') ? 'Banana' : 'Banana Pro'}</span>
                    <span>{selectedImage.settings.imageSize}</span>
                    <span>{t.aspectRatios[selectedImage.settings.aspectRatio]}</span>
                    {selectedImage.settings.referenceImageCount && selectedImage.settings.referenceImageCount > 0 && (
                        <span className="flex items-center gap-1 text-banana-400">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                           </svg>
                           {selectedImage.settings.referenceImageCount} {t.imagesCount}
                        </span>
                    )}
                  </div>
                </div>
             </div>
          ) : (
            // Placeholder when no generation happened yet
            !isGenerating && history.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-600 bg-neutral-900/20 border border-neutral-800 rounded-2xl border-dashed">
                    <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-lg font-medium text-neutral-500">{t.readyToCreate}</p>
                    <p className="text-sm">{t.setApiKeyInfo}</p>
                </div>
            )
          )}

          {/* History Grid */}
          {history.length > 0 && (
            <div className="mt-8 border-t border-neutral-800 pt-8">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-semibold text-white">{t.gallery}</h3>
                 <button 
                    onClick={handleClearHistory}
                    className="text-xs text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t.clearHistory}
                 </button>
              </div>
              <Gallery 
                images={history} 
                onSelect={setSelectedImage} 
                onDelete={handleDeleteImage}
                t={t} 
              />
            </div>
          )}
          
          <div ref={resultsEndRef} />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentBaseUrl={baseUrl}
        currentApiKey={apiKey}
        onSave={handleSettingsSave}
        t={t}
      />

    </div>
  );
};

export default App;
