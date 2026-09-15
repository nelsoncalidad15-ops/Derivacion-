import React from 'react';
import { Info, X } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  title,
  content,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-slate-600 leading-relaxed text-base font-normal">
          {content}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
