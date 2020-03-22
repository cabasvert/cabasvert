import { IonLoading, IonToast } from '@ionic/react'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

export interface ToastOptions {
  header?: string;
  message?: string;
  color?: string;
}

interface Feedback {
  showToast(options: ToastOptions): void

  showLoading(text: string): void
  dismissLoading(): void
}

const FeedbackContext = createContext<Feedback | undefined>(undefined)

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) throw new Error('No FeedbackProvider in context')
  return context
}

export const FeedbackProvider: React.FC = ({ children }) => {
  const [loadingText, setLoadingText] = useState<string | undefined>(undefined)
  const [toastOptions, setToastOptions] = useState<ToastOptions | undefined>(undefined)

  const showToast = useCallback((options: ToastOptions) => setToastOptions(options), [])

  const showLoading = useCallback((text: string) => setLoadingText(text), [])
  const dismissLoading = useCallback(() => setLoadingText(undefined), [])

  const context = useMemo(() => ({ showToast, showLoading, dismissLoading }), [])

  return <>
    <FeedbackContext.Provider value={context}>{children}</FeedbackContext.Provider>
    <IonLoading isOpen={!!loadingText} message={loadingText} />
    <IonToast
      isOpen={!!toastOptions}
      header={toastOptions?.header} message={toastOptions?.message}
      color={toastOptions?.color} duration={4000} />
  </>
}
