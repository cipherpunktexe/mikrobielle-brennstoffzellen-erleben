import { Alert, Snackbar } from '@mui/material'
import type { AlertColor } from '@mui/material'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react'

interface AppSnackbarState {
  open: boolean
  message: string
  severity: AlertColor
  autoHideDuration: number
}

interface ShowAppSnackbarOptions {
  message: string
  severity?: AlertColor
  autoHideDuration?: number
}

interface AppSnackbarContextValue {
  showSnackbar: (options: ShowAppSnackbarOptions) => void
  closeSnackbar: () => void
}

const DEFAULT_AUTO_HIDE_DURATION_MS = 3500

const AppSnackbarContext = createContext<AppSnackbarContextValue | null>(null)

interface AppSnackbarProviderProps {
  children: ReactNode
}

export function AppSnackbarProvider({ children }: AppSnackbarProviderProps) {
  const [snackbar, setSnackbar] = useState<AppSnackbarState>({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: DEFAULT_AUTO_HIDE_DURATION_MS,
  })

  const closeSnackbar = useCallback(() => {
    setSnackbar((current) => ({
      ...current,
      open: false,
    }))
  }, [])

  const handleSnackbarClose = useCallback(
    (_event?: Event | SyntheticEvent, reason?: string) => {
      if (reason === 'clickaway') {
        return
      }

      closeSnackbar()
    },
    [closeSnackbar],
  )

  const showSnackbar = useCallback((options: ShowAppSnackbarOptions) => {
    const message = options.message.trim()

    if (!message) {
      return
    }

    setSnackbar({
      open: true,
      message,
      severity: options.severity ?? 'info',
      autoHideDuration: options.autoHideDuration ?? DEFAULT_AUTO_HIDE_DURATION_MS,
    })
  }, [])

  const contextValue = useMemo<AppSnackbarContextValue>(() => ({
    showSnackbar,
    closeSnackbar,
  }), [closeSnackbar, showSnackbar])

  return (
    <AppSnackbarContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={snackbar.open}
        onClose={handleSnackbarClose}
        autoHideDuration={snackbar.autoHideDuration}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={handleSnackbarClose}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppSnackbarContext.Provider>
  )
}

export function useAppSnackbar() {
  const context = useContext(AppSnackbarContext)

  if (!context) {
    throw new Error('useAppSnackbar muss innerhalb von AppSnackbarProvider verwendet werden.')
  }

  return context
}

