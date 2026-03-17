import type { AlertColor } from '@mui/material'
import { createContext, useContext } from 'react'

export interface ShowAppSnackbarOptions {
  message: string
  severity?: AlertColor
  autoHideDuration?: number
}

export interface AppSnackbarContextValue {
  showSnackbar: (options: ShowAppSnackbarOptions) => void
  closeSnackbar: () => void
}

export const AppSnackbarContext = createContext<AppSnackbarContextValue | null>(null)

export function useAppSnackbar() {
  const context = useContext(AppSnackbarContext)

  if (!context) {
    throw new Error('useAppSnackbar muss innerhalb von AppSnackbarProvider verwendet werden.')
  }

  return context
}
