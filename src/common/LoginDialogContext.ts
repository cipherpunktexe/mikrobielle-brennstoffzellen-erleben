import { createContext, useContext } from 'react'

interface LoginDialogContextValue {
  openLoginDialog: () => void
  openRegistrationDialog: (code?: string) => void
}

export const LoginDialogContext = createContext<LoginDialogContextValue | null>(null)

export function useLoginDialog() {
  const context = useContext(LoginDialogContext)

  if (!context) {
    throw new Error('useLoginDialog muss innerhalb von LoginDialogProvider verwendet werden.')
  }

  return context
}
