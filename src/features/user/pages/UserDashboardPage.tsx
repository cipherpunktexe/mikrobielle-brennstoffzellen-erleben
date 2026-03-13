import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import ViewListIcon from '@mui/icons-material/ViewList'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { MeasurementChart } from '../../measurements/components/MeasurementChart'
import { AuthCard } from '../../../shared/ui/AuthCard'
import { QrScannerDialog } from '../../../shared/qr/QrScannerDialog'
import { formatMeasurement, formatTimestamp } from '../../../shared/utils/format'
import { extractGeneratorCodeFromQrValue } from '../../../shared/utils/qr'
import {
  linkCurrentUserToGeneratorByCode,
  login,
  signInWithGoogle,
  subscribeToAuth,
  subscribeToGenerator,
  subscribeToLeaderboard,
  subscribeToMeasurements,
  subscribeToUserProfile,
  updateCurrentUserDisplayName,
} from '../../../shared/data/firebaseData'
import type {
  Generator,
  LeaderboardEntry,
  Measurement,
  UserProfile,
} from '../../../shared/types/domain'

type MeasurementViewMode = 'chart' | 'list'

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
  const [measurementViewMode, setMeasurementViewMode] = useState<MeasurementViewMode>('list')
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null)
  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [displayNameLoading, setDisplayNameLoading] = useState(false)
  const [displayNameError, setDisplayNameError] = useState('')
  const [displayNameStatus, setDisplayNameStatus] = useState('')
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

  function handleOpenProfileMenu(event: MouseEvent<HTMLElement>) {
    setProfileMenuAnchor(event.currentTarget)
  }

  function handleCloseProfileMenu() {
    setProfileMenuAnchor(null)
  }

  function handleOpenNameDialog() {
    handleCloseProfileMenu()
    setDisplayNameInput(profile?.name ?? '')
    setDisplayNameError('')
    setNameDialogOpen(true)
  }

  function handleCloseNameDialog() {
    if (displayNameLoading) {
      return
    }

    setNameDialogOpen(false)
    setDisplayNameError('')
  }

  async function handleDisplayNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDisplayNameLoading(true)
    setDisplayNameError('')
    setDisplayNameStatus('')

    try {
      await updateCurrentUserDisplayName(displayNameInput)
      setDisplayNameStatus('Anzeigename aktualisiert.')
      setNameDialogOpen(false)
    } catch (updateError) {
      setDisplayNameError(
        updateError instanceof Error
          ? updateError.message
          : 'Der Anzeigename konnte nicht aktualisiert werden.',
      )
    } finally {
      setDisplayNameLoading(false)
    }
  }

  const ranking = generator
    ? leaderboard.findIndex((entry) => entry.generatorId === generator.id) + 1
    : 0
  const profileMenuOpen = Boolean(profileMenuAnchor)

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
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', sm: '2.2rem' } }}>
            {`Willkommen, ${profile?.name ?? ''}!`.trim()}
          </Typography>
        </Box>
        <IconButton
          aria-label="Optionen fuer Anzeigenamen"
          onClick={handleOpenProfileMenu}
          sx={{ alignSelf: 'flex-start' }}
        >
          <MoreVertIcon />
        </IconButton>
      </Stack>

      {displayNameStatus ? <Alert severity="success">{displayNameStatus}</Alert> : null}

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
            <Grid size={{ xs: 12, sm: profile?.generatorId ? 5 : 8 }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Brennstoffzellen-Code
                </Typography>
                {profile?.generatorId ? (
                  <Typography variant="h5" sx={{ overflowWrap: 'anywhere' }}>
                    {generator?.code ?? 'offen'}
                  </Typography>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<QrCodeScannerIcon />}
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                    onClick={() => {
                      setLinkError('')
                      setLinkStatus('')
                      setScannerOpen(true)
                    }}
                  >
                    Verknüpfen
                  </Button>
                )}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Platzierung nach Maximalwert
                </Typography>
                <Typography variant="h5">
                  {ranking ? `#${ranking}` : 'n/a'}
                </Typography>
              </Stack>
            </Grid>
            {profile?.generatorId ? (
              <Grid size={{ xs: 12, sm: 3 }}>
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
              </Grid>
            ) : null}
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 2.25, sm: 2.5 } }}>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={1.5}
            >
              <Typography variant="h5">Messwerthistorie</Typography>
              <ToggleButtonGroup
                value={measurementViewMode}
                exclusive
                size="small"
                onChange={(_, nextMode: MeasurementViewMode | null) => {
                  if (nextMode) {
                    setMeasurementViewMode(nextMode)
                  }
                }}
                sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
              >
                <ToggleButton value="chart" aria-label="Diagramm anzeigen">
                  <ShowChartIcon fontSize="small" sx={{ mr: 0.75 }} />
                  Diagramm
                </ToggleButton>
                <ToggleButton value="list" aria-label="Liste anzeigen">
                  <ViewListIcon fontSize="small" sx={{ mr: 0.75 }} />
                  Liste
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            {measurements.length === 0 ? (
              <Typography color="text.secondary">
                Für diese Brennstoffzelle liegen noch keine Messwerte vor.
              </Typography>
            ) : measurementViewMode === 'chart' ? (
              <MeasurementChart measurements={measurements} />
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

      <Menu
        anchorEl={profileMenuAnchor}
        open={profileMenuOpen}
        onClose={handleCloseProfileMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleOpenNameDialog}>Anzeigenamen aendern</MenuItem>
      </Menu>

      <Dialog open={nameDialogOpen} onClose={handleCloseNameDialog} fullWidth maxWidth="xs">
        <DialogTitle>Anzeigenamen aendern</DialogTitle>
        <Box component="form" onSubmit={handleDisplayNameSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Anzeigename"
                value={displayNameInput}
                onChange={(event) => setDisplayNameInput(event.target.value)}
                autoFocus
                fullWidth
              />
              {displayNameError ? <Alert severity="error">{displayNameError}</Alert> : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseNameDialog} disabled={displayNameLoading}>
              Abbrechen
            </Button>
            <Button type="submit" variant="contained" disabled={displayNameLoading}>
              Speichern
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  )
}
