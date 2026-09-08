import React from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg bg-white transition-all transform translate-y-0 ${
            t.type === 'success'
              ? 'border-emerald-200 text-emerald-900 bg-emerald-50/90'
              : t.type === 'error'
              ? 'border-red-200 text-red-900 bg-red-50/90'
              : t.type === 'warning'
              ? 'border-amber-200 text-amber-900 bg-amber-50/90'
              : 'border-blue-200 text-blue-900 bg-blue-50/90'
          }`}
        >
          <div className="mt-0.5 flex-shrink-0">
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {t.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
            {t.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          </div>
          <div className="flex-1 text-xs font-medium leading-relaxed">{t.message}</div>
          <button
            onClick={() => removeToast(t.id)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
