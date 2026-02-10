"use client";

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = type === 'success' 
    ? 'bg-green-900 border-green-600' 
    : type === 'error' 
    ? 'bg-red-900 border-red-600' 
    : 'bg-blue-900 border-blue-600';

  const textColor = type === 'success' 
    ? 'text-green-400' 
    : type === 'error' 
    ? 'text-red-400' 
    : 'text-blue-400';

  const Icon = type === 'success' 
    ? CheckCircle 
    : type === 'error' 
    ? AlertCircle 
    : Info;

  return (
    <div 
      className={`${bgColor} bg-opacity-30 border rounded-lg p-4 shadow-lg flex items-start gap-3 min-w-[320px] max-w-md animate-slide-in`}
    >
      <Icon className={`w-5 h-5 ${textColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <p className={`${textColor} text-sm leading-5 break-words`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100000] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
