import GoogleIcon from '@mui/icons-material/Google'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { login, signInWithGoogle } from '../data/firebaseData'
import { LoginDialogContext } from './LoginDialogContext'

interface LoginDialogProviderProps {
  children: ReactNode
}

export function LoginDialogProvider({ children }: LoginDialogProviderProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [values, setValues] = useState({
    email: '',
    password: '',
  })

  const openLoginDialog = useCallback(() => {
    setError('')
    setOpen(true)
  }, [])

  function closeLoginDialog() {
    if (!loading) {
      setOpen(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(values)
      setOpen(false)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Anmeldung fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')

    try {
      await signInWithGoogle()
      setOpen(false)
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : 'Google-Anmeldung fehlgeschlagen.',
      )
    } finally {
      setLoading(false)
    }
  }

  const contextValue = useMemo(() => ({ openLoginDialog }), [openLoginDialog])

  return (
    <LoginDialogContext.Provider value={contextValue}>
      {children}
      <Dialog open={open} onClose={closeLoginDialog} fullWidth maxWidth="xs">
        <DialogTitle>Anmelden</DialogTitle>
        <Stack component="form" onSubmit={handleLogin}>
          <DialogContent>
            <Stack spacing={2}>
              <Typography color="text.secondary">
                Melde dich an, um deine Brennstoffzelle und Messwerte zu sehen.
              </Typography>
              {error ? <Alert severity="error">{error}</Alert> : null}
              <TextField
                label="E-Mail"
                type="email"
                value={values.email}
                onChange={(event) =>
                  setValues((current) => ({ ...current, email: event.target.value }))
                }
                autoComplete="email"
                autoFocus
                required
                fullWidth
              />
              <TextField
                label="Passwort"
                type="password"
                value={values.password}
                onChange={(event) =>
                  setValues((current) => ({ ...current, password: event.target.value }))
                }
                autoComplete="current-password"
                required
                fullWidth
              />
              <Button disabled={loading} type="submit" variant="contained" fullWidth>
                {loading ? 'Bitte warten...' : 'Anmelden'}
              </Button>
              <Divider>oder</Divider>
              <Button
                disabled={loading}
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={() => void handleGoogleLogin()}
                fullWidth
              >
                Mit Google anmelden
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeLoginDialog} disabled={loading}>
              Abbrechen
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </LoginDialogContext.Provider>
  )
}
