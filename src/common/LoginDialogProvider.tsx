import GoogleIcon from '@mui/icons-material/Google'
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useCallback, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { login, registerUserWithGenerator, signInWithGoogle } from '../data/firebaseData'
import { formatCode } from './format'
import { LoginDialogContext } from './LoginDialogContext'

interface LoginDialogProviderProps {
  children: ReactNode
}

type AuthDialogMode = 'login' | 'register'

export function LoginDialogProvider({ children }: LoginDialogProviderProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthDialogMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [values, setValues] = useState({
    name: '',
    code: '',
    email: '',
    password: '',
  })

  const openLoginDialog = useCallback(() => {
    setMode('login')
    setError('')
    setOpen(true)
  }, [])

  const openRegistrationDialog = useCallback((code = '') => {
    setMode('register')
    setError('')
    setValues((current) => ({ ...current, code: formatCode(code) }))
    setOpen(true)
  }, [])

  function closeLoginDialog() {
    if (!loading) {
      setOpen(false)
    }
  }

  function handleModeChange(nextMode: AuthDialogMode | null) {
    if (!nextMode || loading) {
      return
    }

    setMode(nextMode)
    setError('')
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

  async function handleRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await registerUserWithGenerator(values)
      setOpen(false)
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : 'Registrierung konnte nicht abgeschlossen werden.',
      )
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

  const contextValue = useMemo(
    () => ({ openLoginDialog, openRegistrationDialog }),
    [openLoginDialog, openRegistrationDialog],
  )

  return (
    <LoginDialogContext.Provider value={contextValue}>
      {children}
      <Dialog open={open} onClose={closeLoginDialog} fullWidth maxWidth="xs">
        <DialogTitle>{mode === 'login' ? 'Anmelden' : 'Registrieren'}</DialogTitle>
        <Stack
          component="form"
          onSubmit={mode === 'login' ? handleLogin : handleRegistration}
        >
          <DialogContent>
            <Stack spacing={2}>
              <ToggleButtonGroup
                value={mode}
                exclusive
                fullWidth
                size="small"
                onChange={(_, nextMode: AuthDialogMode | null) => handleModeChange(nextMode)}
                aria-label="Anmelden oder registrieren"
              >
                <ToggleButton value="login">
                  <LoginOutlinedIcon fontSize="small" sx={{ mr: 0.75 }} />
                  Anmelden
                </ToggleButton>
                <ToggleButton value="register">
                  <PersonAddAlt1Icon fontSize="small" sx={{ mr: 0.75 }} />
                  Registrieren
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography color="text.secondary">
                {mode === 'login'
                  ? 'Melde dich an, um deine Brennstoffzelle und Messwerte zu sehen.'
                  : 'Erstelle mit deinem Brennstoffzellen-Code ein neues Konto.'}
              </Typography>
              {error ? <Alert severity="error">{error}</Alert> : null}
              {mode === 'register' ? (
                <>
                  <TextField
                    label="Name"
                    value={values.name}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, name: event.target.value }))
                    }
                    autoComplete="name"
                    autoFocus
                    required
                    fullWidth
                  />
                  <TextField
                    label="Brennstoffzellen-Code"
                    value={values.code}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, code: event.target.value }))
                    }
                    helperText="Den Code findest du auf dem QR-Zettel deiner Brennstoffzelle."
                    required
                    fullWidth
                  />
                </>
              ) : null}
              <TextField
                label="E-Mail"
                type="email"
                value={values.email}
                onChange={(event) =>
                  setValues((current) => ({ ...current, email: event.target.value }))
                }
                autoComplete="email"
                autoFocus={mode === 'login'}
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
                {loading
                  ? 'Bitte warten...'
                  : mode === 'login'
                    ? 'Anmelden'
                    : 'Konto erstellen'}
              </Button>
              {mode === 'login' ? (
                <>
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
                </>
              ) : null}
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
