'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number; // in ms, defaults to 2000
}

interface ToastContextType {
  showSuccess: (message: string, title?: string, duration?: number) => void;
  showError: (message: string, title?: string, duration?: number) => void;
  showInfo: (message: string, title?: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  dismiss: () => {},
});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration: number = 2000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = {
        id,
        type,
        title: title || (type === 'success' ? 'Berhasil!' : type === 'error' ? 'Perhatian' : 'Informasi'),
        message,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after specified duration (2000 ms default)
      setTimeout(() => {
        dismiss(id);
      }, duration);
    },
    [dismiss]
  );

  const showSuccess = useCallback(
    (message: string, title?: string, duration: number = 2000) => {
      addToast('success', message, title, duration);
    },
    [addToast]
  );

  const showError = useCallback(
    (message: string, title?: string, duration: number = 2500) => {
      addToast('error', message, title, duration);
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string, duration: number = 2000) => {
      addToast('info', message, title, duration);
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo, dismiss }}>
      {children}

      {/* Floating Modern Toast Stack Container */}
      <div
        aria-live="polite"
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 w-[92vw] max-w-md pointer-events-none"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-toast-in ${
                isSuccess
                  ? 'bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-[0_12px_40px_-10px_rgba(16,185,129,0.4)]'
                  : isError
                  ? 'bg-slate-900/95 border-rose-500/40 text-slate-100 shadow-[0_12px_40px_-10px_rgba(244,63,94,0.4)]'
                  : 'bg-slate-900/95 border-amber-500/40 text-slate-100 shadow-[0_12px_40px_-10px_rgba(245,158,11,0.4)]'
              }`}
            >
              <div className="flex items-start gap-3.5 p-3.5 sm:p-4">
                {/* Glow Icon Badge */}
                <div
                  className={`flex-shrink-0 p-2 rounded-xl flex items-center justify-center relative ${
                    isSuccess
                      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30'
                      : isError
                      ? 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-400/30'
                      : 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-400/30'
                  }`}
                >
                  {isSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isError ? (
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Info className="w-5 h-5 text-amber-400" />
                  )}
                  {/* Subtle pulsing indicator */}
                  <span
                    className={`absolute -top-1 -right-1 flex h-2.5 w-2.5`}
                  >
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isSuccess ? 'bg-emerald-400' : isError ? 'bg-rose-400' : 'bg-amber-400'
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        isSuccess ? 'bg-emerald-500' : isError ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                    />
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-bold tracking-wide text-white">
                      {toast.title}
                    </h4>
                    {isSuccess && (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs sm:text-xs text-slate-300 mt-0.5 leading-relaxed break-words font-medium">
                    {toast.message}
                  </p>
                </div>

                {/* Manual Close Button */}
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="flex-shrink-0 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Tutup notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2-Second Animated Progress Bar Countdown */}
              <div className="h-1 w-full bg-slate-800/80 overflow-hidden">
                <div
                  className={`h-full ${
                    isSuccess
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300'
                      : isError
                      ? 'bg-gradient-to-r from-rose-500 to-rose-300'
                      : 'bg-gradient-to-r from-amber-400 to-amber-200'
                  }`}
                  style={{
                    animation: `shrinkToastProgress ${toast.duration}ms linear forwards`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
