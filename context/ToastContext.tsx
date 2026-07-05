import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Toast, type ToastPayload, type ToastVariant } from '@/components/ui/Toast';

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<(ToastPayload & { key: number }) | null>(null);

  const dismiss = useCallback(() => setToast(null), []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ message, variant, key: Date.now() });
  }, []);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);

  const value = useMemo(
    () => ({ showToast, showSuccess, showError }),
    [showToast, showSuccess, showError],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Toast
          key={toast.key}
          message={toast.message}
          variant={toast.variant}
          visible
          onDismiss={dismiss}
        />
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
