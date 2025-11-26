
import React, { useState, useEffect } from 'react';
import { DEFAULT_BASE_URL } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBaseUrl: string;
  currentApiKey: string;
  currentUseStream: boolean;
  onSave: (url: string, key: string, useStream: boolean) => void;
  t: any; // Translation object
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentBaseUrl, 
  currentApiKey, 
  currentUseStream,
  onSave, 
  t 
}) => {
  const [url, setUrl] = useState(currentBaseUrl);
  const [key, setKey] = useState(currentApiKey);
  const [useStream, setUseStream] = useState(currentUseStream);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setUrl(currentBaseUrl);
    setKey(currentApiKey);
    setUseStream(currentUseStream);
  }, [currentBaseUrl, currentApiKey, currentUseStream, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(url, key, useStream);
    onClose();
  };

  const handleReset = () => {
    setUrl(DEFAULT_BASE_URL);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-dark-800 border border-neutral-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-banana-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {t.settings}
        </h2>

        {/* API Key Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            {t.apiKey}
          </label>
          <div className="relative">
            <input 
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={t.apiKeyPlaceholder}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-banana-500 focus:border-transparent outline-none transition-all pr-10"
            />
            <button 
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-3 text-neutral-500 hover:text-white"
            >
              {showKey ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            {t.apiKeyHelp}
          </p>
        </div>
        
        {/* Proxy URL Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            {t.proxyUrl}
          </label>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t.proxyUrlPlaceholder}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-banana-500 focus:border-transparent outline-none transition-all"
          />
          <div className="text-xs text-neutral-500 mt-2">
            {t.proxyHelp}
          </div>
        </div>

        {/* Stream Mode Toggle */}
        <div className="mb-6 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
           <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">
                 {t.streamMode}
              </label>
              <div 
                 onClick={() => setUseStream(!useStream)}
                 className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${useStream ? 'bg-banana-500' : 'bg-neutral-700'}`}
              >
                 <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${useStream ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
           </div>
           <p className="text-xs text-neutral-500 mt-2">
             {t.streamModeHelp}
           </p>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-neutral-700">
             <button 
            onClick={handleReset}
            className="text-sm text-neutral-500 hover:text-white underline"
          >
            {t.resetUrl}
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-banana-500 text-black font-semibold hover:bg-banana-400 transition-colors shadow-lg shadow-banana-900/20"
            >
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
