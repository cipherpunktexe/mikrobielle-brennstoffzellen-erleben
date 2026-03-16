import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { type FormEvent, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { formatCode } from '../app/format'
import { registerUserWithGenerator } from '../app/firebaseData'

export function UserRegistrationPage() {
  const navigate = useNavigate()
  const params = useParams()
  const scannedCode = formatCode(params.code ?? '')
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await registerUserWithGenerator({
        ...formValues,
        code: scannedCode,
      })
      setSuccess('Account und Brennstoffzelle wurden erfolgreich angelegt.')
      navigate('/user')
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Registrierung konnte nicht abgeschlossen werden.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <div>
                <Typography variant="overline">User Flow</Typography>
                <Typography variant="h2" gutterBottom>
                  Registrierung für {scannedCode || 'unbekannten QR-Code'}
                </Typography>
                <Typography color="text.secondary">
                  Mit diesem QR-Link wird die Brennstoffzelle erst bei der Registrierung
                  erstellt und direkt mit dem neuen Nutzerkonto verknüpft.
                </Typography>
              </div>

              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}

              <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                <TextField
                  label="Name"
                  value={formValues.name}
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                  fullWidth
                />
                <TextField
                  label="E-Mail"
                  type="email"
                  value={formValues.email}
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                  fullWidth
                />
                <TextField
                  label="Passwort"
                  type="password"
                  value={formValues.password}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                  helperText="Firebase Authentication nutzt dieses Passwort für den Login."
                  fullWidth
                />
                <Button
                  disabled={loading}
                  type="submit"
                  variant="contained"
                  startIcon={<PersonAddAlt1Icon />}
                >
                  {loading
                    ? 'Registrierung läuft...'
                    : 'Account erstellen und Brennstoffzelle verknüpfen'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Stack spacing={3}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={1.5}>
                <Typography variant="h5">Was beim Submit passiert</Typography>
                <Typography color="text.secondary">
                  1. Firebase Authentication erstellt den User.
                </Typography>
                <Typography color="text.secondary">
                  2. In `generators` entsteht ein neuer Brennstoffzellen-Eintrag mit dem QR-Code.
                </Typography>
                <Typography color="text.secondary">
                  3. In `users` wird der Firestore-User mit `generatorId` gespeichert.
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h5">Weiter zur Übersicht</Typography>
                <Typography color="text.secondary">
                  Bereits registriert oder nach dem Scan direkt zum Dashboard wechseln.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/user"
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                >
                  Zum User-Bereich
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  )
}
