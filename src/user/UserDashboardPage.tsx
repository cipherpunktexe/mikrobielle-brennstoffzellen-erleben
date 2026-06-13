import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
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
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { MeasurementChart } from '../common/MeasurementChart'
import { MeasurementMetricsCard } from '../common/MeasurementMetricsCard'
import { useAppSnackbar } from '../common/AppSnackbarContext'
import { useLoginDialog } from '../common/LoginDialogContext'
import { UnifiedList, type UnifiedListColumn } from '../common/UnifiedList'
import { QrScannerDialog } from '../common/qr/QrScannerDialog'
import { createContextMeasurementFormatter, formatMeasurement, formatTimestamp } from '../common/format'
import { extractGeneratorCodeFromQrValue } from '../common/qr/qr'
import {
  linkCurrentUserToGeneratorByCode,
  subscribeToAuth,
  subscribeToGenerator,
  subscribeToLeaderboard,
  subscribeToMeasurements,
  subscribeToUserProfile,
  updateCurrentUserDisplayName,
} from '../data/firebaseData'
import type {
  Generator,
  LeaderboardEntry,
  Measurement,
  UserProfile,
} from '../data/domain'

type MeasurementViewMode = 'chart' | 'list'

function GuestDashboardSkeleton({ onLogin }: { onLogin: () => void }) {
  return (
    <Stack
      spacing={{ xs: 2.5, md: 3 }}
      role="region"
      aria-labelledby="guest-dashboard-title"
      sx={{ maxWidth: 760, mx: 'auto' }}
    >
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          <Stack spacing={2.5} alignItems="center">
            <Stack spacing={1} alignItems="center">
              <Typography
                id="guest-dashboard-title"
                variant="h2"
                sx={{ fontSize: { xs: '2rem', sm: '2.6rem' } }}
              >
                Deine Brennstoffzelle
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 520 }}>
                Melde dich an, um deine Messwerte, Platzierung und Brennstoffzelle zu sehen.
              </Typography>
            </Stack>
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginOutlinedIcon />}
              onClick={onLogin}
              sx={{
                minWidth: { xs: '100%', sm: 260 },
                minHeight: 54,
                fontSize: '1.05rem',
              }}
            >
              Jetzt anmelden
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1.25} aria-hidden="true" sx={{ opacity: 0.42, px: { xs: 1, sm: 4 } }}>
        <Skeleton variant="rounded" height={28} width="42%" />
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={72} />
      </Stack>
    </Stack>
  )
}

export function UserDashboardPage() {
  const { showSnackbar } = useAppSnackbar()
  const { openLoginDialog } = useLoginDialog()
  const [authUserId, setAuthUserId] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [generator, setGenerator] = useState<Generator | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [measurementViewMode, setMeasurementViewMode] = useState<MeasurementViewMode>('list')
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null)
  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [displayNameLoading, setDisplayNameLoading] = useState(false)

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

  async function handleQrDetected(value: string) {
    try {
      const code = extractGeneratorCodeFromQrValue(value)

      if (!code) {
        throw new Error('Der gescannte QR-Code enthält keinen gültigen Link zur Brennstoffzelle.')
      }

      const linkedGenerator = await linkCurrentUserToGeneratorByCode(code)
      showSnackbar({
        message: `Brennstoffzelle ${linkedGenerator.code} wurde erfolgreich verknüpft.`,
        severity: 'success',
      })
      setScannerOpen(false)
    } catch (linkingError) {
      showSnackbar({
        message:
          linkingError instanceof Error
            ? linkingError.message
            : 'Die Brennstoffzelle konnte nicht verknüpft werden.',
        severity: 'error',
      })
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
    setNameDialogOpen(true)
  }

  function handleCloseNameDialog() {
    if (displayNameLoading) {
      return
    }

    setNameDialogOpen(false)
  }

  async function handleDisplayNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDisplayNameLoading(true)

    try {
      await updateCurrentUserDisplayName(displayNameInput)
      showSnackbar({ message: 'Anzeigename aktualisiert.', severity: 'success' })
      setNameDialogOpen(false)
    } catch (updateError) {
      showSnackbar({
        message:
          updateError instanceof Error
            ? updateError.message
            : 'Der Anzeigename konnte nicht aktualisiert werden.',
        severity: 'error',
      })
    } finally {
      setDisplayNameLoading(false)
    }
  }

  const ranking = generator
    ? leaderboard.findIndex((entry) => entry.generatorId === generator.id) + 1
    : 0
  const orderedMeasurements = [...measurements].sort((left, right) => {
    const leftMs = left.createdAt?.toMillis() ?? 0
    const rightMs = right.createdAt?.toMillis() ?? 0
    return leftMs - rightMs
  })
  const measurementValues = orderedMeasurements.map((measurement) => measurement.value)
  const formatMeasurementInContext = createContextMeasurementFormatter(measurementValues)
  const latestMeasurementValueLabel = formatMeasurementInContext(orderedMeasurements.at(-1)?.value)
  const maxMeasurementValueLabel = formatMeasurementInContext(
    measurementValues.length > 0 ? Math.max(...measurementValues) : undefined,
  )
  const profileMenuOpen = Boolean(profileMenuAnchor)
  const measurementListColumns: UnifiedListColumn<Measurement>[] = [
    {
      key: 'time',
      header: 'Zeitpunkt',
      mobileLabel: 'Zeitpunkt',
      width: 'minmax(120px, 1fr)',
      render: (measurement) => (
        <Typography variant="body2">{formatTimestamp(measurement.createdAt)}</Typography>
      ),
    },
    {
      key: 'value',
      header: 'Wert',
      mobileLabel: 'Wert',
      width: '86px',
      align: 'right',
      render: (measurement) => (
        <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
          {formatMeasurement(measurement.value)}
        </Typography>
      ),
    },
  ]

  if (loadingAuth) {
    return (
      <Box sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
        <CircularProgress color="inherit" />
      </Box>
    )
  }

  if (!authUserId) {
    return <GuestDashboardSkeleton onLogin={openLoginDialog} />
  }

  if (profile?.status === 'blocked' || profile?.status === 'deleted') {
    return (
      <Stack spacing={2}>
        <Alert severity={profile.status === 'blocked' ? 'warning' : 'error'}>
          {profile.status === 'blocked'
            ? 'Dieses Konto ist gesperrt. Brennstoffzelle, Messwerte und Ranking werden nicht mehr angezeigt.'
            : 'Dieses Konto wurde gelöscht. Brennstoffzelle, Messwerte und Ranking werden nicht mehr angezeigt.'}
        </Alert>
      </Stack>
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
          aria-label="Optionen für Anzeigenamen"
          onClick={handleOpenProfileMenu}
          sx={{
            alignSelf: 'flex-start',
            width: 34,
            height: 34,
            borderRadius: 1.75,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            bgcolor: (theme) => alpha(theme.palette.common.white, 0.72),
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.common.white, 0.96),
            },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

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
            ) : (
              <>
                <MeasurementMetricsCard
                  currentValue={latestMeasurementValueLabel}
                  maxValue={maxMeasurementValueLabel}
                />
                {measurementViewMode === 'chart' ? (
                  <MeasurementChart measurements={measurements} showMetricsCard={false} />
                ) : (
                  <UnifiedList
                    items={measurements}
                    columns={measurementListColumns}
                    getItemKey={(measurement) => measurement.id}
                    ariaLabel="Messwerthistorie"
                    emptyPrimary="Noch keine Messwerte"
                    minDesktopWidth={236}
                  />
                )}
              </>
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
        <MenuItem onClick={handleOpenNameDialog}>Anzeigenamen ändern</MenuItem>
      </Menu>

      <Dialog open={nameDialogOpen} onClose={handleCloseNameDialog} fullWidth maxWidth="xs">
        <DialogTitle>Anzeigenamen ändern</DialogTitle>
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
