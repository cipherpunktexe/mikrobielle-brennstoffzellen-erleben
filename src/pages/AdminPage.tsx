import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PrintIcon from '@mui/icons-material/Print'
import SaveIcon from '@mui/icons-material/Save'
import SensorsIcon from '@mui/icons-material/Sensors'
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
import { useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { AuthCard } from '../components/AuthCard'
import { DashboardCard } from '../components/DashboardCard'
import { formatCode, formatMeasurement, formatTimestamp } from '../lib/format'
import { printQrCards } from '../lib/qr'
import {
  addMeasurementByCode,
  getGeneratorByCode,
  getUserProfile,
  login,
  logout,
  signInWithGoogle,
  subscribeToAuth,
  subscribeToLeaderboard,
} from '../services/firebaseData'
import type { Generator, LeaderboardEntry, UserProfile } from '../types/domain'

function createStationCodes(prefix: string, count: number) {
  return Array.from(
    { length: count },
    (_, index) => `${formatCode(prefix)}-${String(index + 1).padStart(3, '0')}`,
  )
}

export function AdminPage() {
  const navigate = useNavigate()
  const params = useParams()
  const routeCode = formatCode(params.code ?? '')
  const [authUserId, setAuthUserId] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [generator, setGenerator] = useState<Generator | null>(null)
  const [scanCode, setScanCode] = useState(routeCode)
  const [measurementValue, setMeasurementValue] = useState('1.42')
  const [exportPrefix, setExportPrefix] = useState('station')
  const [exportCount, setExportCount] = useState('12')
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    return subscribeToAuth((user) => {
      setAuthUserId(user?.uid ?? '')
    })
  }, [])

  useEffect(() => subscribeToLeaderboard(setLeaderboard), [])

  useEffect(() => {
    if (!authUserId) {
      setProfile(null)
      return
    }

    void getUserProfile(authUserId).then(setProfile)
  }, [authUserId])

  useEffect(() => {
    setScanCode(routeCode)

    if (!routeCode) {
      setGenerator(null)
      return
    }

    void getGeneratorByCode(routeCode).then(setGenerator)
  }, [routeCode])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      await login(formValues)
    } catch (loginError) {
      setAuthError(loginError instanceof Error ? loginError.message : 'Login fehlgeschlagen.')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setAuthLoading(true)
    setAuthError('')

    try {
      await signInWithGoogle()
    } catch (loginError) {
      setAuthError(
        loginError instanceof Error ? loginError.message : 'Google-Anmeldung fehlgeschlagen.',
      )
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleExport() {
    setStatus('')
    setError('')

    try {
      const count = Number.parseInt(exportCount, 10)

      if (!Number.isFinite(count) || count < 1 || count > 200) {
        throw new Error('Bitte eine Anzahl zwischen 1 und 200 angeben.')
      }

      const origin = window.location.origin
      const cards = createStationCodes(exportPrefix, count).map((code) => ({
        code,
        userUrl: `${origin}/register/${code}`,
        adminUrl: `${origin}/admin/generator/${code}`,
      }))

      await printQrCards(cards)
      setStatus('Druckansicht für die QR-Codes wurde geöffnet.')
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Export fehlgeschlagen.')
    }
  }

  function handleLookup() {
    if (!scanCode) {
      setError('Bitte zuerst einen Stationscode eingeben oder einen Admin-Link öffnen.')
      return
    }

    navigate(`/admin/generator/${scanCode}`)
  }

  async function handleMeasurementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('')
    setError('')

    try {
      const numericValue = Number.parseFloat(measurementValue)

      if (Number.isNaN(numericValue)) {
        throw new Error('Bitte einen gültigen Messwert eingeben.')
      }

      const linkedGenerator = await addMeasurementByCode(
        scanCode,
        numericValue,
        profile?.email ?? authUserId,
      )

      setGenerator(linkedGenerator)
      setStatus(`Messwert für ${linkedGenerator.code} wurde gespeichert.`)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Messwert konnte nicht gespeichert werden.',
      )
    }
  }

  const currentLeaderboardEntry = generator
    ? leaderboard.find((entry) => entry.generatorId === generator.id)
    : null

  if (!authUserId) {
    return (
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <AuthCard
            title="Admin-Login"
            description="Admins melden sich über Firebase Authentication an und arbeiten dann mit QR-Codes, Generatoren und Messwerten."
            values={formValues}
            submitLabel="Als Admin anmelden"
            googleLabel="Mit Google anmelden"
            loading={authLoading}
            error={authError}
            onChange={(field, value) =>
              setFormValues((current) => ({ ...current, [field]: value }))
            }
            onSubmit={handleLogin}
            onGoogleSignIn={handleGoogleLogin}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
              <Stack spacing={2}>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                  Admin-Workflow
                </Typography>
                <Typography color="text.secondary">
                  `/admin` dient zum QR-Export. `/admin/generator/:code` ist die direkte
                  Messwertmaske für einen Generatorcode.
                </Typography>
                <Typography color="text.secondary">
                  Voraussetzung ist ein Firestore-User mit `role: "admin"` für das
                  angemeldete Auth-Konto.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  if (profile?.role !== 'admin') {
    return (
      <Stack spacing={3}>
        <Alert severity="warning">
          Das angemeldete Konto hat keine Admin-Rolle. Lege in Firestore unter `users/{'{uid}'}`
          den Wert `role: "admin"` an.
        </Alert>
        <Button variant="outlined" onClick={() => void logout()} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Abmelden
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2}
      >
        <div>
          <Typography variant="overline">Admin</Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.9rem', sm: undefined } }}>
            QR-Export und Messwerterfassung
          </Typography>
        </div>
        <Button variant="outlined" onClick={() => void logout()} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Abmelden
        </Button>
      </Stack>

      {status ? <Alert severity="success">{status}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard
            eyebrow="QR"
            title="Exportbereich"
            value={`${exportCount} Karten`}
            helper="Druckt Nutzer- und Admin-QR-Codes im Doppelpack."
            accent="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard
            eyebrow="Scan"
            title="Aktiver Code"
            value={scanCode || 'kein Code'}
            helper="Aus Route oder manueller Eingabe."
            icon={<SensorsIcon />}
            accent="secondary"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard
            eyebrow="Ranking"
            title="Aktueller Wert"
            value={formatMeasurement(currentLeaderboardEntry?.latestValue)}
            helper={formatTimestamp(currentLeaderboardEntry?.measuredAt)}
            accent="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
              <Stack spacing={2}>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                  QR-Codes exportieren
                </Typography>
                <TextField
                  label="Stationspräfix"
                  value={exportPrefix}
                  onChange={(event) => setExportPrefix(event.target.value)}
                  helperText='Ergebnisformat: "station-001", "station-002", ...'
                  fullWidth
                />
                <TextField
                  label="Anzahl"
                  type="number"
                  value={exportCount}
                  onChange={(event) => setExportCount(event.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={() => void handleExport()}
                  startIcon={<PrintIcon />}
                  fullWidth
                >
                  Druckfertige QR-Karten öffnen
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
              <Stack spacing={2}>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                  Generator aufrufen
                </Typography>
                <Typography color="text.secondary">
                  Admins können einen QR-Link direkt öffnen oder einen Stationscode manuell eingeben.
                </Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Stationscode"
                    value={scanCode}
                    onChange={(event) => setScanCode(formatCode(event.target.value))}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleLookup}
                    startIcon={<OpenInNewIcon />}
                    sx={{ width: { xs: '100%', md: 'auto' } }}
                  >
                    Maske öffnen
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
              <Stack component="form" spacing={2} onSubmit={handleMeasurementSubmit}>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                  Messwert eintragen
                </Typography>
                <TextField
                  label="Generatorcode"
                  value={scanCode}
                  onChange={(event) => setScanCode(formatCode(event.target.value))}
                  required
                  fullWidth
                />
                <TextField
                  label="Messwert in Volt"
                  value={measurementValue}
                  onChange={(event) => setMeasurementValue(event.target.value)}
                  required
                  fullWidth
                />
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} fullWidth>
                  Messwert speichern
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
              <Stack spacing={2}>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                  Leaderboard
                </Typography>
                <Typography color="text.secondary">
                  Das vollständige Ranking befindet sich auf einer eigenen Seite und
                  aktualisiert sich live aus den gespeicherten Messwerten.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/leaderboard"
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
                >
                  Zum Leaderboard
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
