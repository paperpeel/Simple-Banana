
import React from 'react';
import { GeneratedImage } from '../types';

interface GalleryProps {
  images: GeneratedImage[];
  onSelect: (image: GeneratedImage) => void;
  onDelete: (image: GeneratedImage) => void;
  t: any; // Translation object
}

// Helper to format bytes
const formatBytes = (bytes: number, decimals = 1) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const Gallery: React.FC<GalleryProps> = ({ images, onSelect, onDelete, t }) => {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>{t.galleryEmpty}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((img) => {
        // Calculate approx size if not saved (for legacy items)
        // Base64 string length * 0.75 gives approx byte size
        const estimatedSize = img.fileSize || Math.round((img.url.length - 22) * 0.75);
        
        return (
          <div 
            key={img.id} 
            onClick={() => onSelect(img)}
            className="group relative aspect-square bg-neutral-900 rounded-xl overflow-hidden cursor-pointer border border-neutral-800 hover:border-banana-500 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-banana-500/10"
          >
            <img 
              src={img.url} 
              alt={img.prompt} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
               {/* Delete Button (Overlay) */}
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   onDelete(img);
                 }}
                 className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 border border-white/10"
                 title={t.delete}
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                 </svg>
               </button>

               <p className="text-xs text-white line-clamp-2 font-medium mb-1">{img.prompt}</p>
               <div className="flex justify-between items-center text-[10px] text-neutral-400">
                  <div className="flex gap-1.5">
                    <span className="text-banana-300 bg-banana-900/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {img.settings.imageSize}
                    </span>
                    <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300">
                      {formatBytes(estimatedSize)}
                    </span>
                  </div>
                  <span>
                    {new Date(img.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Gallery;