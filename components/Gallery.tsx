
import React from 'react';
import { GeneratedImage } from '../types';

interface GalleryProps {
  images: GeneratedImage[];
  onSelect: (image: GeneratedImage) => void;
  t: any; // Translation object
}

const Gallery: React.FC<GalleryProps> = ({ images, onSelect, t }) => {
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
      {images.map((img) => (
        <div 
          key={img.id} 
          onClick={() => onSelect(img)}
          className="group relative aspect-square bg-neutral-900 rounded-xl overflow-hidden cursor-pointer border border-neutral-800 hover:border-banana-500 transition-all duration-300"
        >
          <img 
            src={img.url} 
            alt={img.prompt} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
             <p className="text-xs text-white line-clamp-2">{img.prompt}</p>
             <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-banana-300 bg-banana-900/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {img.settings.imageSize}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {new Date(img.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Gallery;
