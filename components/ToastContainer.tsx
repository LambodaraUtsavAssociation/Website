'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { toast, ToastMessage } from '@/lib/toastStore';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start space-x-3 transition-all duration-300 animate-fade-in ${
              isSuccess
                ? 'bg-charcoal-900/95 border-green-500/40 text-ivory-50 shadow-green-950/40'
                : isError
                ? 'bg-charcoal-900/95 border-red-500/40 text-ivory-50 shadow-red-950/40'
                : isWarning
                ? 'bg-charcoal-900/95 border-gold-500/40 text-ivory-50 shadow-gold-950/40'
                : 'bg-charcoal-900/95 border-saffron-500/40 text-ivory-50 shadow-saffron-950/40'
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-green-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-red-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-gold-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-saffron-400" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h5 className="font-semibold text-xs uppercase tracking-wider text-ivory-100">
                {t.title}
              </h5>
              {t.message && (
                <p className="text-xs text-ivory-300 mt-1 leading-relaxed font-sans">
                  {t.message}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-ivory-400 hover:text-ivory-100 p-1 flex-shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
