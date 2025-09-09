"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props} className="bg-card border-border">
          <div className="grid gap-1">
            {title && <ToastTitle className="text-gray-900 dark:text-yellow-400">{title}</ToastTitle>}
            {description && (
              <ToastDescription className="text-gray-600 dark:text-gray-300">{description}</ToastDescription>
            )}
          </div>
          {action}
          <ToastClose className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-yellow-400" />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
