
import React from 'react';
import { HistoryItem, AspectRatio } from '../types';

interface HistoryListProps {
  items: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onDelete: (item: HistoryItem) => void;
  t: any;
}

const HistoryList: React.FC<HistoryListProps> = ({ items, onRestore, onDelete, t }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>{t.historyEmpty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3 transition-colors hover:border-neutral-700 group"
        >
          <div className="flex justify-between items-start gap-4">
            <p className="text-sm text-neutral-200 line-clamp-2 font-medium flex-grow">
              {item.prompt}
            </p>
            <button
              onClick={() => onDelete(item)}
              className="text-neutral-600 hover:text-red-400 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title={t.delete}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-800/50 pt-3">
            <div className="flex gap-2 items-center">
               <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">
                 {item.settings.model.includes('flash') ? 'Banana' : 'Pro'}
               </span>
               <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">
                 {t.aspectRatios[item.settings.aspectRatio]}
               </span>
               <span className="text-neutral-600">
                 {new Date(item.timestamp).toLocaleString()}
               </span>
            </div>
            
            <button
              onClick={() => onRestore(item)}
              className="flex items-center gap-1.5 text-banana-500 hover:text-banana-400 font-medium transition-colors px-2 py-1 rounded hover:bg-banana-500/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t.restoreParams}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;
