import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LogoutIcon from '@mui/icons-material/Logout'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { AuthCard } from '../components/AuthCard'
import { DashboardCard } from '../components/DashboardCard'
import { formatMeasurement, formatTimestamp } from '../lib/format'
import {
  login,
  logout,
  signInWithGoogle,
  subscribeToAuth,
  subscribeToGenerator,
  subscribeToLeaderboard,
  subscribeToMeasurements,
  subscribeToUserProfile,
} from '../services/firebaseData'
import type { Generator, LeaderboardEntry, Measurement, UserProfile } from '../types/domain'

export function UserDashboardPage() {
  const [authUserId, setAuthUserId] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [generator, setGenerator] = useState<Generator | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    return subscribeToAuth((user) => {
      setAuthUserId(user?.uid ?? '')
      setLoadingAuth(false)
    })
  }, [])

  useEffect(() => {
    if (!authUserId) {
      setProfile(null)
      return
    }

    return subscribeToUserProfile(authUserId, setProfile)
  }, [authUserId])

  useEffect(() => {
    if (!profile?.generatorId) {
      setGenerator(null)
      setMeasurements([])
      return
    }

    const unsubscribeGenerator = subscribeToGenerator(profile.generatorId, setGenerator)
    const unsubscribeMeasurements = subscribeToMeasurements(profile.generatorId, setMeasurements)

    return () => {
      unsubscribeGenerator()
      unsubscribeMeasurements()
    }
  }, [profile?.generatorId])

  useEffect(() => subscribeToLeaderboard(setLeaderboard), [])

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

  const latestMeasurement = measurements[0]
  const ranking = generator
    ? leaderboard.findIndex((entry) => entry.generatorId === generator.id) + 1
    : 0

  if (loadingAuth) {
    return (
      <Box sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
        <CircularProgress color="inherit" />
      </Box>
    )
  }

  if (!authUserId) {
    return (
      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, md: 6 }}>
          <AuthCard
            title="User-Login"
            description="Nutzer melden sich mit Firebase Authentication an und sehen danach Generator, Messwert und Leaderboard."
            values={formValues}
            submitLabel="Einloggen"
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
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h4">Nutzer-Workflow</Typography>
                <Typography color="text.secondary">
                  Der QR-Link zur Registrierung liegt unter `/register/:code`. Nach der
                  Registrierung wird der Generator automatisch angelegt.
                </Typography>
                <List dense disablePadding>
                  <ListItem disableGutters>
                    <ListItemText
                      primary="QR-Code scannen"
                      secondary="Der Link öffnet den passenden Registrierungsflow."
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText
                      primary="Account anlegen"
                      secondary="Authentication und Firestore werden in einem Schritt beschrieben."
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText
                      primary="Messwert sehen"
                      secondary="Die Ansicht aktualisiert sich live über Firestore."
                    />
                  </ListItem>
                </List>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
      >
        <div>
          <Typography variant="overline">User</Typography>
          <Typography variant="h2">
            {profile?.name ? `Willkommen, ${profile.name}` : 'Nutzer-Dashboard'}
          </Typography>
        </div>
        <Button variant="outlined" startIcon={<LogoutIcon />} onClick={() => void logout()}>
          Abmelden
        </Button>
      </Stack>

      {profile?.role === 'admin' ? (
        <Alert severity="info">
          Dieses Konto ist als Admin markiert. Für die Messwertmaske ist der Bereich
          `/admin` vorgesehen.
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard
            eyebrow="Generator"
            title="Zugeteilter Code"
            value={generator?.code ?? 'offen'}
            helper={generator ? 'Mit dem Nutzerkonto verknüpft.' : 'Noch kein Generator vorhanden.'}
            accent="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard
            eyebrow="Aktuell"
            title="Letzter Messwert"
            value={formatMeasurement(latestMeasurement?.value)}
            helper={formatTimestamp(latestMeasurement?.createdAt)}
            icon={<WaterDropIcon />}
            accent="success"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard
            eyebrow="Ranking"
            title="Leaderboard"
            value={ranking ? `#${ranking}` : 'n/a'}
            helper={
              ranking
                ? `Von ${leaderboard.length} aktiven Generatoren.`
                : 'Sobald ein Messwert vorliegt, erscheint der Generator im Ranking.'
            }
            icon={<EmojiEventsIcon />}
            accent="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h4">Leaderboard</Typography>
                <Typography color="text.secondary">
                  Das vollständige Ranking wird auf einer eigenen Seite angezeigt.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/leaderboard"
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                >
                  Zum Leaderboard
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                Letzte Messungen
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Zeitpunkt</TableCell>
                    <TableCell align="right">Wert</TableCell>
                    <TableCell>Eingetragen von</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {measurements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        Für diesen Generator liegen noch keine Messwerte vor.
                      </TableCell>
                    </TableRow>
                  ) : (
                    measurements.map((measurement) => (
                      <TableRow key={measurement.id}>
                        <TableCell>{formatTimestamp(measurement.createdAt)}</TableCell>
                        <TableCell align="right">
                          {formatMeasurement(measurement.value)}
                        </TableCell>
                        <TableCell>{measurement.enteredBy}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
