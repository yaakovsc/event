import React, { createContext, useContext, useState, useCallback } from 'react'
import { cn } from '../utils/cn'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx.showToast
}

const variantConfig: Record<ToastVariant, { icon: React.ReactNode; classes: string }> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    classes: 'bg-white dark:bg-gray-800 border-l-4 border-green-500',
  },
  error: {
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    classes: 'bg-white dark:bg-gray-800 border-l-4 border-red-500',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    classes: 'bg-white dark:bg-gray-800 border-l-4 border-yellow-500',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-500" />,
    classes: 'bg-white dark:bg-gray-800 border-l-4 border-blue-500',
  },
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((toast) => {
        const { icon, classes } = variantConfig[toast.variant]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg shadow-lg',
              classes
            )}
          >
            <span className="flex-shrink-0 mt-0.5">{icon}</span>
            <p className="flex-1 text-sm text-gray-800 dark:text-gray-100">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
