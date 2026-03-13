import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
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
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { AuthCard } from '../components/AuthCard'
import { QrScannerDialog } from '../components/QrScannerDialog'
import { formatMeasurement, formatTimestamp } from '../lib/format'
import { extractGeneratorCodeFromQrValue } from '../lib/qr'
import {
  linkCurrentUserToGeneratorByCode,
  login,
  signInWithGoogle,
  subscribeToAuth,
  subscribeToGenerator,
  subscribeToLeaderboard,
  subscribeToMeasurements,
  subscribeToUserProfile,
} from '../services/firebaseData'
import type { Generator, LeaderboardEntry, Measurement, UserProfile } from '../types/domain'

export function UserDashboardPage() {
  const theme = useTheme()
  const isMobileViewport = useMediaQuery(theme.breakpoints.down('sm'))
  const [authUserId, setAuthUserId] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [generator, setGenerator] = useState<Generator | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [linkStatus, setLinkStatus] = useState('')
  const [linkError, setLinkError] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
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

  async function handleQrDetected(value: string) {
    setLinkError('')
    setLinkStatus('')

    try {
      const code = extractGeneratorCodeFromQrValue(value)

      if (!code) {
        throw new Error('Der gescannte QR-Code enthaelt keinen gueltigen Link zur Brennstoffzelle.')
      }

      const linkedGenerator = await linkCurrentUserToGeneratorByCode(code)
      setLinkStatus(`Brennstoffzelle ${linkedGenerator.code} wurde erfolgreich verknuepft.`)
      setScannerOpen(false)
    } catch (linkingError) {
      setLinkError(
        linkingError instanceof Error
          ? linkingError.message
          : 'Die Brennstoffzelle konnte nicht verknuepft werden.',
      )
    }
  }

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
      <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch">
        <Grid size={{ xs: 12, md: 6 }}>
          <AuthCard
            title="User-Login"
            description="Nutzer melden sich an und sehen danach Brennstoffzelle, Platzierung und Messwerthistorie."
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
            <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
              <Stack spacing={1.5}>
                <Typography variant="h5">Deine Brennstoffzelle</Typography>
                <Typography color="text.secondary">
                  Nach dem Login siehst du deinen Brennstoffzellen-Code, deine aktuelle Platzierung
                  und die letzten Messwerte.
                </Typography>
                <List dense disablePadding>
                  <ListItem disableGutters>
                    <ListItemText primary="Brennstoffzellen-Code" secondary="Automatisch mit dem Konto verknüpft." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText primary="Platzierung" secondary="Live aus dem Leaderboard berechnet." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText primary="Messwerthistorie" secondary="Alle Einträge in chronologischer Reihenfolge." />
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
    <Stack spacing={{ xs: 2, md: 2.5 }}>
      <Box>
        <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', sm: '2.2rem' } }}>
          {`Willkommen, ${profile?.name ?? ''}!`.trim()}
        </Typography>
      </Box>

      {profile?.role === 'admin' ? (
        <Alert severity="info">
          Dieses Konto ist als Admin markiert. Für die Messwertmaske ist der Bereich
          `/admin` vorgesehen.
        </Alert>
      ) : null}

      {linkStatus ? <Alert severity="success">{linkStatus}</Alert> : null}
      {linkError ? <Alert severity="error">{linkError}</Alert> : null}

      <Card>
        <CardContent sx={{ p: { xs: 2.25, sm: 2.5 } }}>
          <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
            <Grid size={{ xs: 12, sm: 5 }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Brennstoffzellen-Code
                </Typography>
                <Typography variant="h5" sx={{ overflowWrap: 'anywhere' }}>
                  {generator?.code ?? 'offen'}
                </Typography>
                {!profile?.generatorId ? (
                  <Typography variant="body2" color="text.secondary">
                    Noch keine Brennstoffzelle verknuepft.
                  </Typography>
                ) : null}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Aktuelle Platzierung
                </Typography>
                <Typography variant="h5">
                  {ranking ? `#${ranking}` : 'n/a'}
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              {profile?.generatorId ? (
                <Button
                  component={RouterLink}
                  to="/leaderboard"
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  size="small"
                  fullWidth
                >
                  Leaderboard
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<QrCodeScannerIcon />}
                  size="small"
                  fullWidth
                  onClick={() => {
                    setLinkError('')
                    setLinkStatus('')
                    setScannerOpen(true)
                  }}
                >
                  QR-Scanner oeffnen
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 2.25, sm: 2.5 } }}>
          <Stack spacing={1.5}>
            <Typography variant="h5">Messwerthistorie</Typography>
            {measurements.length === 0 ? (
              <Typography color="text.secondary">
                Für diese Brennstoffzelle liegen noch keine Messwerte vor.
              </Typography>
            ) : isMobileViewport ? (
              <Stack
                divider={<Divider flexItem />}
                sx={{
                  border: '1px solid rgba(121,101,66,0.16)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  bgcolor: 'rgba(248,242,231,0.42)',
                }}
              >
                {measurements.map((measurement) => (
                  <Stack
                    key={measurement.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                    sx={{ px: 1.5, py: 1.25 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary">
                        Zeitpunkt
                      </Typography>
                      <Typography variant="body2">{formatTimestamp(measurement.createdAt)}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography variant="caption" color="text.secondary">
                        Wert
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatMeasurement(measurement.value)}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Box sx={{ overflowX: 'auto', mx: { xs: -0.5, sm: 0 } }}>
                <Table size="small" sx={{ minWidth: 520 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Zeitpunkt</TableCell>
                      <TableCell align="right">Wert</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {measurements.map((measurement) => (
                      <TableRow key={measurement.id}>
                        <TableCell>{formatTimestamp(measurement.createdAt)}</TableCell>
                        <TableCell align="right">
                          {formatMeasurement(measurement.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <QrScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleQrDetected}
      />
    </Stack>
  )
}
