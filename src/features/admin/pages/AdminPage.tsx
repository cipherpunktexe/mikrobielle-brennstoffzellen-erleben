import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import EditNoteIcon from '@mui/icons-material/EditNote'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PrintIcon from '@mui/icons-material/Print'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import SaveIcon from '@mui/icons-material/Save'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState, type FormEvent, type ReactNode, type SyntheticEvent } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { AuthCard } from '../../../shared/ui/AuthCard'
import { QrScannerDialog } from '../../../shared/qr/QrScannerDialog'
import { formatCode, formatMeasurement, formatTimestamp } from '../../../shared/utils/format'
import { extractGeneratorCodeFromQrValue, printQrCards } from '../../../shared/utils/qr'
import {
  addMeasurementByCode,
  findGeneratorForAdmin,
  findUserProfileForAdmin,
  getGeneratorByCode,
  getMeasurementsForAdmin,
  getUserProfile,
  login,
  logout,
  signInWithGoogle,
  subscribeToAuth,
  subscribeToLeaderboard,
  updateGeneratorAsAdmin,
  updateMeasurementAsAdmin,
  updateUserProfileAsAdmin,
} from '../../../shared/data/firebaseData'
import type {
  Generator,
  LeaderboardEntry,
  Measurement,
  UserProfile,
  UserRole,
} from '../../../shared/types/domain'

type AdminTabValue = 'qr' | 'scan' | 'moderation' | 'admins'
type ModerationTabValue = 'users' | 'generators' | 'measurements'

interface UserFormState {
  name: string
  email: string
  role: UserRole
}

interface GeneratorFormState {
  code: string
  ownerUid: string
  ownerName: string
}

interface MeasurementFormState {
  value: string
  enteredBy: string
}

function createStationCodes(prefix: string, count: number) {
  return Array.from(
    { length: count },
    (_, index) => `${formatCode(prefix)}-${String(index + 1).padStart(3, '0')}`,
  )
}

function TabPanel({
  active,
  value,
  children,
}: {
  active: string
  value: string
  children: ReactNode
}) {
  return (
    <Box role="tabpanel" hidden={active !== value}>
      {active === value ? children : null}
    </Box>
  )
}

function createEmptyUserForm(): UserFormState {
  return {
    name: '',
    email: '',
    role: 'user',
  }
}

function createEmptyGeneratorForm(): GeneratorFormState {
  return {
    code: '',
    ownerUid: '',
    ownerName: '',
  }
}

function createEmptyMeasurementForm(): MeasurementFormState {
  return {
    value: '',
    enteredBy: '',
  }
}

function getMeasurementSummary(measurements: Measurement[]) {
  if (!measurements.length) {
    return 'Noch keine Messwerte'
  }

  return `${measurements.length} Eintraege`
}

export function AdminPage() {
  const navigate = useNavigate()
  const params = useParams()
  const routeCode = formatCode(params.code ?? '')

  const [authUserId, setAuthUserId] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [activeTab, setActiveTab] = useState<AdminTabValue>(routeCode ? 'scan' : 'qr')
  const [moderationTab, setModerationTab] = useState<ModerationTabValue>('users')

  const [exportPrefix, setExportPrefix] = useState('station')
  const [exportCount, setExportCount] = useState('12')
  const [exportStatus, setExportStatus] = useState('')
  const [exportError, setExportError] = useState('')

  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanCode, setScanCode] = useState(routeCode)
  const [generator, setGenerator] = useState<Generator | null>(null)
  const [scanStatus, setScanStatus] = useState('')
  const [scanError, setScanError] = useState('')
  const [measurementValue, setMeasurementValue] = useState('1.42')

  const [userLookup, setUserLookup] = useState('')
  const [loadedUser, setLoadedUser] = useState<UserProfile | null>(null)
  const [userForm, setUserForm] = useState<UserFormState>(createEmptyUserForm)
  const [userStatus, setUserStatus] = useState('')
  const [userError, setUserError] = useState('')

  const [generatorLookup, setGeneratorLookup] = useState(routeCode)
  const [loadedGenerator, setLoadedGenerator] = useState<Generator | null>(null)
  const [generatorForm, setGeneratorForm] = useState<GeneratorFormState>(createEmptyGeneratorForm)
  const [generatorStatus, setGeneratorStatus] = useState('')
  const [generatorError, setGeneratorError] = useState('')

  const [measurementLookup, setMeasurementLookup] = useState(routeCode)
  const [measurementGenerator, setMeasurementGenerator] = useState<Generator | null>(null)
  const [measurementItems, setMeasurementItems] = useState<Measurement[]>([])
  const [selectedMeasurementId, setSelectedMeasurementId] = useState('')
  const [measurementForm, setMeasurementForm] = useState<MeasurementFormState>(
    createEmptyMeasurementForm,
  )
  const [measurementStatus, setMeasurementStatus] = useState('')
  const [measurementError, setMeasurementError] = useState('')

  const [adminLookup, setAdminLookup] = useState('')
  const [adminCandidate, setAdminCandidate] = useState<UserProfile | null>(null)
  const [adminStatus, setAdminStatus] = useState('')
  const [adminError, setAdminError] = useState('')

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
    if (!routeCode) {
      setGenerator(null)
      return
    }

    setActiveTab('scan')
    setScanCode(routeCode)
    setGeneratorLookup(routeCode)
    setMeasurementLookup(routeCode)
    void loadGeneratorForScan(routeCode)
  }, [routeCode])

  const currentLeaderboardEntry = generator
    ? leaderboard.find((entry) => entry.generatorId === generator.id)
    : null

  const selectedMeasurement =
    measurementItems.find((item) => item.id === selectedMeasurementId) ?? null

  function handleAdminTabChange(_event: SyntheticEvent, value: AdminTabValue) {
    setActiveTab(value)
  }

  function handleModerationTabChange(_event: SyntheticEvent, value: ModerationTabValue) {
    setModerationTab(value)
  }

  async function loadGeneratorForScan(code: string) {
    const normalizedCode = formatCode(code)

    if (!normalizedCode) {
      setGenerator(null)
      return
    }

    const foundGenerator = await getGeneratorByCode(normalizedCode)
    setGenerator(foundGenerator)
  }

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
    setExportStatus('')
    setExportError('')

    try {
      const count = Number.parseInt(exportCount, 10)

      if (!Number.isFinite(count) || count < 1 || count > 200) {
        throw new Error('Bitte eine Anzahl zwischen 1 und 200 angeben.')
      }

      const normalizedPrefix = formatCode(exportPrefix)

      if (!normalizedPrefix) {
        throw new Error('Bitte ein gueltiges Praefix angeben.')
      }

      const origin = window.location.origin
      const cards = createStationCodes(normalizedPrefix, count).map((code) => ({
        code,
        userUrl: `${origin}/register/${code}`,
        adminUrl: `${origin}/admin/generator/${code}`,
      }))

      await printQrCards(cards)
      setExportStatus('Druckansicht fuer die QR-Codes wurde geoeffnet.')
    } catch (exportIssue) {
      setExportError(exportIssue instanceof Error ? exportIssue.message : 'Export fehlgeschlagen.')
    }
  }

  async function handleLookup() {
    setScanStatus('')
    setScanError('')

    try {
      const normalizedCode = formatCode(scanCode)

      if (!normalizedCode) {
        throw new Error('Bitte zuerst einen Brennstoffzellen-Code eingeben oder scannen.')
      }

      const foundGenerator = await getGeneratorByCode(normalizedCode)

      if (!foundGenerator) {
        throw new Error('Zu diesem Code wurde keine Brennstoffzelle gefunden.')
      }

      setGenerator(foundGenerator)
      setScanCode(normalizedCode)
      navigate(`/admin/generator/${normalizedCode}`)
      setScanStatus(`Brennstoffzelle ${foundGenerator.code} geladen.`)
    } catch (lookupIssue) {
      setScanError(
        lookupIssue instanceof Error
          ? lookupIssue.message
          : 'Brennstoffzelle konnte nicht geladen werden.',
      )
    }
  }

  async function handleDetectedQrValue(value: string) {
    const code = extractGeneratorCodeFromQrValue(value)

    if (!code) {
      throw new Error('Der QR-Code enthaelt keinen gueltigen Brennstoffzellen-Code.')
    }

    setScannerOpen(false)
    setActiveTab('scan')
    setScanCode(code)
    setScanError('')
    setScanStatus(`QR-Code erkannt: ${code}`)
    navigate(`/admin/generator/${code}`)
    await loadGeneratorForScan(code)
  }

  async function handleMeasurementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setScanStatus('')
    setScanError('')

    try {
      const numericValue = Number.parseFloat(measurementValue)

      if (Number.isNaN(numericValue)) {
        throw new Error('Bitte einen gueltigen Messwert eingeben.')
      }

      const linkedGenerator = await addMeasurementByCode(
        scanCode,
        numericValue,
        profile?.email ?? authUserId,
      )

      setGenerator(linkedGenerator)
      setScanStatus(`Messwert fuer ${linkedGenerator.code} wurde gespeichert.`)
    } catch (submitIssue) {
      setScanError(
        submitIssue instanceof Error
          ? submitIssue.message
          : 'Messwert konnte nicht gespeichert werden.',
      )
    }
  }

  async function handleUserLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUserStatus('')
    setUserError('')

    try {
      const foundUser = await findUserProfileForAdmin(userLookup)

      if (!foundUser) {
        throw new Error('Kein Nutzer mit dieser ID oder E-Mail gefunden.')
      }

      setLoadedUser(foundUser)
      setUserForm({
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
      })
      setUserStatus(`Nutzer ${foundUser.name} geladen.`)
    } catch (lookupIssue) {
      setLoadedUser(null)
      setUserForm(createEmptyUserForm())
      setUserError(
        lookupIssue instanceof Error ? lookupIssue.message : 'Nutzer konnte nicht geladen werden.',
      )
    }
  }

  async function handleUserSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!loadedUser) {
      return
    }

    setUserStatus('')
    setUserError('')

    try {
      await updateUserProfileAsAdmin(loadedUser.id, userForm)
      const refreshedUser = await findUserProfileForAdmin(loadedUser.id)

      if (!refreshedUser) {
        throw new Error('Der Nutzer konnte nach dem Speichern nicht erneut geladen werden.')
      }

      setLoadedUser(refreshedUser)
      setUserForm({
        name: refreshedUser.name,
        email: refreshedUser.email,
        role: refreshedUser.role,
      })
      setUserStatus('Nutzerprofil aktualisiert.')
    } catch (saveIssue) {
      setUserError(
        saveIssue instanceof Error ? saveIssue.message : 'Nutzer konnte nicht gespeichert werden.',
      )
    }
  }

  async function handleGeneratorLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneratorStatus('')
    setGeneratorError('')

    try {
      const foundGenerator = await findGeneratorForAdmin(generatorLookup)

      if (!foundGenerator) {
        throw new Error('Keine Brennstoffzelle mit diesem Code oder dieser ID gefunden.')
      }

      setLoadedGenerator(foundGenerator)
      setGeneratorForm({
        code: foundGenerator.code,
        ownerUid: foundGenerator.ownerUid,
        ownerName: foundGenerator.ownerName ?? '',
      })
      setGeneratorStatus(`Brennstoffzelle ${foundGenerator.code} geladen.`)
    } catch (lookupIssue) {
      setLoadedGenerator(null)
      setGeneratorForm(createEmptyGeneratorForm())
      setGeneratorError(
        lookupIssue instanceof Error
          ? lookupIssue.message
          : 'Brennstoffzelle konnte nicht geladen werden.',
      )
    }
  }

  async function handleGeneratorSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!loadedGenerator) {
      return
    }

    setGeneratorStatus('')
    setGeneratorError('')

    try {
      await updateGeneratorAsAdmin(loadedGenerator.id, generatorForm)
      const refreshedGenerator = await findGeneratorForAdmin(loadedGenerator.id)

      if (!refreshedGenerator) {
        throw new Error('Die Brennstoffzelle konnte nach dem Speichern nicht erneut geladen werden.')
      }

      setLoadedGenerator(refreshedGenerator)
      setGeneratorForm({
        code: refreshedGenerator.code,
        ownerUid: refreshedGenerator.ownerUid,
        ownerName: refreshedGenerator.ownerName ?? '',
      })
      setGeneratorStatus('Brennstoffzelle aktualisiert.')
    } catch (saveIssue) {
      setGeneratorError(
        saveIssue instanceof Error
          ? saveIssue.message
          : 'Brennstoffzelle konnte nicht gespeichert werden.',
      )
    }
  }

  function selectMeasurement(measurement: Measurement | null) {
    setSelectedMeasurementId(measurement?.id ?? '')
    setMeasurementForm(
      measurement
        ? {
            value: measurement.value.toString(),
            enteredBy: measurement.enteredBy,
          }
        : createEmptyMeasurementForm(),
    )
  }

  async function handleMeasurementLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMeasurementStatus('')
    setMeasurementError('')

    try {
      const foundGenerator = await findGeneratorForAdmin(measurementLookup)

      if (!foundGenerator) {
        throw new Error('Keine Brennstoffzelle fuer diese Messwerte gefunden.')
      }

      const measurements = await getMeasurementsForAdmin(foundGenerator.id)

      setMeasurementGenerator(foundGenerator)
      setMeasurementItems(measurements)
      selectMeasurement(measurements[0] ?? null)

      if (!measurements.length) {
        setMeasurementStatus('Brennstoffzelle geladen, aber noch ohne Messwerte.')
        return
      }

      setMeasurementStatus(`Messwerte fuer ${foundGenerator.code} geladen.`)
    } catch (lookupIssue) {
      setMeasurementGenerator(null)
      setMeasurementItems([])
      selectMeasurement(null)
      setMeasurementError(
        lookupIssue instanceof Error
          ? lookupIssue.message
          : 'Messwerte konnten nicht geladen werden.',
      )
    }
  }

  async function handleMeasurementSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedMeasurement || !measurementGenerator) {
      return
    }

    setMeasurementStatus('')
    setMeasurementError('')

    try {
      const numericValue = Number.parseFloat(measurementForm.value)

      if (Number.isNaN(numericValue)) {
        throw new Error('Bitte einen gueltigen Messwert eingeben.')
      }

      await updateMeasurementAsAdmin(selectedMeasurement.id, {
        value: numericValue,
        enteredBy: measurementForm.enteredBy,
      })

      const refreshedMeasurements = await getMeasurementsForAdmin(measurementGenerator.id)
      setMeasurementItems(refreshedMeasurements)
      const refreshedSelection =
        refreshedMeasurements.find((item) => item.id === selectedMeasurement.id) ?? null
      selectMeasurement(refreshedSelection)
      setMeasurementStatus('Messwert aktualisiert.')
    } catch (saveIssue) {
      setMeasurementError(
        saveIssue instanceof Error ? saveIssue.message : 'Messwert konnte nicht gespeichert werden.',
      )
    }
  }

  async function handleAdminLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAdminStatus('')
    setAdminError('')

    try {
      const foundUser = await findUserProfileForAdmin(adminLookup)

      if (!foundUser) {
        throw new Error('Kein Nutzer mit dieser ID oder E-Mail gefunden.')
      }

      setAdminCandidate(foundUser)
      setAdminStatus(`Nutzer ${foundUser.name} geladen.`)
    } catch (lookupIssue) {
      setAdminCandidate(null)
      setAdminError(
        lookupIssue instanceof Error ? lookupIssue.message : 'Nutzer konnte nicht geladen werden.',
      )
    }
  }

  async function handlePromoteAdmin() {
    if (!adminCandidate) {
      return
    }

    setAdminStatus('')
    setAdminError('')

    try {
      await updateUserProfileAsAdmin(adminCandidate.id, {
        name: adminCandidate.name,
        email: adminCandidate.email,
        role: 'admin',
      })

      const refreshedUser = await findUserProfileForAdmin(adminCandidate.id)

      if (!refreshedUser) {
        throw new Error('Der Nutzer konnte nach dem Speichern nicht erneut geladen werden.')
      }

      setAdminCandidate(refreshedUser)
      setAdminStatus(`${refreshedUser.name} ist jetzt Admin.`)
    } catch (promoteIssue) {
      setAdminError(
        promoteIssue instanceof Error
          ? promoteIssue.message
          : 'Admin-Rolle konnte nicht vergeben werden.',
      )
    }
  }

  if (!authUserId) {
    return (
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <AuthCard
            title="Admin-Login"
            description="Admins melden sich ueber Firebase Authentication an und verwalten danach QR-Codes, Scans und Moderation an einer Stelle."
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
                  Die Admin-Seite ist jetzt in drei Bereiche getrennt: QR erstellen, Scannen und Moderieren.
                </Typography>
                <Typography color="text.secondary">
                  Voraussetzung ist ein Firestore-User mit <code>role: "admin"</code> fuer das angemeldete Konto.
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
          Das angemeldete Konto hat keine Admin-Rolle. Lege in Firestore unter{' '}
          <code>users/{'{uid}'}</code> den Wert <code>role: "admin"</code> an.
        </Alert>
        <Button
          variant="outlined"
          onClick={() => void logout()}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
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
            Verwaltungsbereich
          </Typography>
          <Typography color="text.secondary">
            QR-Erstellung, Scan-Workflow und Moderation sind sauber getrennt.
          </Typography>
        </div>
        <Button
          variant="outlined"
          onClick={() => void logout()}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Abmelden
        </Button>
      </Stack>

      <Card>
        <Tabs
          value={activeTab}
          onChange={handleAdminTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: { xs: 1, sm: 2 }, pt: 1 }}
        >
          <Tab value="qr" label="QR erstellen" icon={<QrCode2Icon />} iconPosition="start" />
          <Tab value="scan" label="Scannen" icon={<QrCodeScannerIcon />} iconPosition="start" />
          <Tab
            value="moderation"
            label="Moderieren"
            icon={<EditNoteIcon />}
            iconPosition="start"
          />
          <Tab
            value="admins"
            label="Admins ernennen"
            icon={<AdminPanelSettingsIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Card>

      <TabPanel active={activeTab} value="qr">
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Stack spacing={2}>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                    QR-Codes exportieren
                  </Typography>
                  <Typography color="text.secondary">
                    Nutzer- und Admin-QR-Codes werden als druckfertige Karten erzeugt.
                  </Typography>
                  {exportStatus ? <Alert severity="success">{exportStatus}</Alert> : null}
                  {exportError ? <Alert severity="error">{exportError}</Alert> : null}
                  <TextField
                    label="Praefix"
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
                    Druckansicht oeffnen
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Stack spacing={2.5}>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                    Ausgabe
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Chip label={`Praefix ${formatCode(exportPrefix) || '-'}`} />
                    <Chip label={`${exportCount || '0'} Karten`} />
                    <Chip label="2 QR-Codes pro Karte" />
                  </Stack>
                  <Divider />
                  <Typography color="text.secondary">
                    Jede Karte enthaelt einen Nutzer-Link fuer die Verknuepfung und einen
                    Admin-Link fuer das direkte Scannen und Eintragen von Messwerten.
                  </Typography>
                  <Typography color="text.secondary">
                    Die bestehenden Routen bleiben unveraendert: <code>/register/:code</code> und{' '}
                    <code>/admin/generator/:code</code>.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel active={activeTab} value="scan">
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Stack spacing={2}>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                    Code erfassen
                  </Typography>
                  <Typography color="text.secondary">
                    Entweder einen QR-Code scannen oder den Brennstoffzellen-Code direkt eingeben.
                  </Typography>
                  {scanStatus ? <Alert severity="success">{scanStatus}</Alert> : null}
                  {scanError ? <Alert severity="error">{scanError}</Alert> : null}
                  <Button
                    variant="contained"
                    startIcon={<QrCodeScannerIcon />}
                    onClick={() => setScannerOpen(true)}
                    fullWidth
                  >
                    Scanner oeffnen
                  </Button>
                  <TextField
                    fullWidth
                    label="Brennstoffzellen-Code"
                    value={scanCode}
                    onChange={(event) => setScanCode(formatCode(event.target.value))}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => void handleLookup()}
                    startIcon={<OpenInNewIcon />}
                    fullWidth
                  >
                    Brennstoffzelle laden
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Stack component="form" spacing={2} onSubmit={handleMeasurementSubmit}>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                    Messwert speichern
                  </Typography>
                  <Typography color="text.secondary">
                    Der Messwert wird fuer den aktuell geladenen Code gespeichert.
                  </Typography>
                  <TextField
                    label="Brennstoffzellen-Code"
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

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    spacing={1}
                  >
                    <div>
                      <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                        Aktuelle Auswahl
                      </Typography>
                      <Typography color="text.secondary">
                        Zusammenfassung der geladenen Brennstoffzelle.
                      </Typography>
                    </div>
                    <Button
                      component={RouterLink}
                      to="/leaderboard"
                      variant="text"
                      endIcon={<OpenInNewIcon />}
                    >
                      Leaderboard
                    </Button>
                  </Stack>

                  <Grid container spacing={{ xs: 2, md: 3 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="overline">Code</Typography>
                          <Typography variant="h5">{generator?.code ?? 'Noch kein Code'}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="overline">Nutzername</Typography>
                          <Typography variant="h5">
                            {generator?.ownerName?.trim() || 'Noch keine Zuordnung'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="overline">Bester Wert</Typography>
                          <Typography variant="h5">
                            {formatMeasurement(currentLeaderboardEntry?.maxValue)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatTimestamp(currentLeaderboardEntry?.maxMeasuredAt)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel active={activeTab} value="moderation">
        <Card sx={{ mb: { xs: 2, md: 3 } }}>
          <Tabs
            value={moderationTab}
            onChange={handleModerationTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: { xs: 1, sm: 2 }, pt: 1 }}
          >
            <Tab value="users" label="Nutzer" />
            <Tab value="generators" label="Brennstoffzellen" />
            <Tab value="measurements" label="Messwerte" />
          </Tabs>
        </Card>

        <TabPanel active={moderationTab} value="users">
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                  <Stack component="form" spacing={2} onSubmit={handleUserLookup}>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                      Nutzer laden
                    </Typography>
                    <Typography color="text.secondary">
                      Suche per Dokument-ID oder E-Mail-Adresse.
                    </Typography>
                    {userStatus ? <Alert severity="success">{userStatus}</Alert> : null}
                    {userError ? <Alert severity="error">{userError}</Alert> : null}
                    <TextField
                      label="Nutzer-ID oder E-Mail"
                      value={userLookup}
                      onChange={(event) => setUserLookup(event.target.value)}
                      fullWidth
                    />
                    <Button type="submit" variant="outlined" startIcon={<SearchIcon />} fullWidth>
                      Nutzer laden
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                  <Stack component="form" spacing={2} onSubmit={handleUserSave}>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                      Nutzer bearbeiten
                    </Typography>
                    <TextField
                      label="Name"
                      value={userForm.name}
                      onChange={(event) =>
                        setUserForm((current) => ({ ...current, name: event.target.value }))
                      }
                      disabled={!loadedUser}
                      fullWidth
                    />
                    <TextField
                      label="E-Mail"
                      value={userForm.email}
                      onChange={(event) =>
                        setUserForm((current) => ({ ...current, email: event.target.value }))
                      }
                      disabled={!loadedUser}
                      fullWidth
                    />
                    <TextField
                      label="Rolle"
                      select
                      value={userForm.role}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          role: event.target.value as UserRole,
                        }))
                      }
                      disabled={!loadedUser}
                      fullWidth
                      SelectProps={{ native: true }}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </TextField>
                    <TextField
                      label="Verknuepfte Brennstoffzelle"
                      value={loadedUser?.generatorId ?? 'Keine'}
                      disabled
                      fullWidth
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={!loadedUser}
                      fullWidth
                    >
                      Nutzer speichern
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel active={moderationTab} value="generators">
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                  <Stack component="form" spacing={2} onSubmit={handleGeneratorLookup}>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                      Brennstoffzelle laden
                    </Typography>
                    <Typography color="text.secondary">
                      Suche per Code oder Dokument-ID.
                    </Typography>
                    {generatorStatus ? <Alert severity="success">{generatorStatus}</Alert> : null}
                    {generatorError ? <Alert severity="error">{generatorError}</Alert> : null}
                    <TextField
                      label="Code oder ID"
                      value={generatorLookup}
                      onChange={(event) => setGeneratorLookup(event.target.value)}
                      fullWidth
                    />
                    <Button type="submit" variant="outlined" startIcon={<SearchIcon />} fullWidth>
                      Brennstoffzelle laden
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                  <Stack component="form" spacing={2} onSubmit={handleGeneratorSave}>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                      Brennstoffzelle bearbeiten
                    </Typography>
                    <TextField
                      label="Code"
                      value={generatorForm.code}
                      onChange={(event) =>
                        setGeneratorForm((current) => ({
                          ...current,
                          code: formatCode(event.target.value),
                        }))
                      }
                      disabled={!loadedGenerator}
                      fullWidth
                    />
                    <TextField
                      label="Owner UID"
                      value={generatorForm.ownerUid}
                      onChange={(event) =>
                        setGeneratorForm((current) => ({
                          ...current,
                          ownerUid: event.target.value,
                        }))
                      }
                      disabled={!loadedGenerator}
                      fullWidth
                    />
                    <TextField
                      label="Anzeigename"
                      value={generatorForm.ownerName}
                      onChange={(event) =>
                        setGeneratorForm((current) => ({
                          ...current,
                          ownerName: event.target.value,
                        }))
                      }
                      disabled={!loadedGenerator}
                      fullWidth
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={!loadedGenerator}
                      fullWidth
                    >
                      Brennstoffzelle speichern
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel active={moderationTab} value="measurements">
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                  <Stack component="form" spacing={2} onSubmit={handleMeasurementLookup}>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                      Messreihe laden
                    </Typography>
                    <Typography color="text.secondary">
                      Suche per Brennstoffzellen-Code oder Dokument-ID.
                    </Typography>
                    {measurementStatus ? <Alert severity="success">{measurementStatus}</Alert> : null}
                    {measurementError ? <Alert severity="error">{measurementError}</Alert> : null}
                    <TextField
                      label="Code oder ID"
                      value={measurementLookup}
                      onChange={(event) => setMeasurementLookup(event.target.value)}
                      fullWidth
                    />
                    <Button type="submit" variant="outlined" startIcon={<SearchIcon />} fullWidth>
                      Messreihe laden
                    </Button>
                    <Divider />
                    <Stack spacing={1}>
                      <Typography variant="overline">Auswahl</Typography>
                      <Typography variant="body2">
                        {measurementGenerator?.code ?? 'Noch keine Brennstoffzelle geladen'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getMeasurementSummary(measurementItems)}
                      </Typography>
                    </Stack>
                    <List
                      dense
                      disablePadding
                      sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: 'background.default' }}
                    >
                      {measurementItems.map((item) => (
                        <ListItemButton
                          key={item.id}
                          selected={selectedMeasurementId === item.id}
                          onClick={() => selectMeasurement(item)}
                          divider
                        >
                          <ListItemText
                            primary={formatMeasurement(item.value)}
                            secondary={formatTimestamp(item.createdAt)}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                  <Stack component="form" spacing={2} onSubmit={handleMeasurementSave}>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                      Messwert bearbeiten
                    </Typography>
                    <TextField
                      label="Messwert in Volt"
                      value={measurementForm.value}
                      onChange={(event) =>
                        setMeasurementForm((current) => ({
                          ...current,
                          value: event.target.value,
                        }))
                      }
                      disabled={!selectedMeasurement}
                      fullWidth
                    />
                    <TextField
                      label="Eingetragen von"
                      value={measurementForm.enteredBy}
                      onChange={(event) =>
                        setMeasurementForm((current) => ({
                          ...current,
                          enteredBy: event.target.value,
                        }))
                      }
                      disabled={!selectedMeasurement}
                      fullWidth
                    />
                    <TextField
                      label="Zeitstempel"
                      value={
                        selectedMeasurement
                          ? formatTimestamp(selectedMeasurement.createdAt)
                          : 'Keine Auswahl'
                      }
                      disabled
                      fullWidth
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={!selectedMeasurement}
                      fullWidth
                    >
                      Messwert speichern
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </TabPanel>

      <TabPanel active={activeTab} value="admins">
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Stack component="form" spacing={2} onSubmit={handleAdminLookup}>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                    Nutzer suchen
                  </Typography>
                  <Typography color="text.secondary">
                    Suche per Dokument-ID oder E-Mail und vergebe danach die Admin-Rolle.
                  </Typography>
                  {adminStatus ? <Alert severity="success">{adminStatus}</Alert> : null}
                  {adminError ? <Alert severity="error">{adminError}</Alert> : null}
                  <TextField
                    label="Nutzer-ID oder E-Mail"
                    value={adminLookup}
                    onChange={(event) => setAdminLookup(event.target.value)}
                    fullWidth
                  />
                  <Button type="submit" variant="outlined" startIcon={<SearchIcon />} fullWidth>
                    Nutzer laden
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Stack spacing={2}>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                    Admin-Rolle vergeben
                  </Typography>
                  <TextField
                    label="Name"
                    value={adminCandidate?.name ?? ''}
                    disabled
                    fullWidth
                  />
                  <TextField
                    label="E-Mail"
                    value={adminCandidate?.email ?? ''}
                    disabled
                    fullWidth
                  />
                  <TextField
                    label="Aktuelle Rolle"
                    value={adminCandidate?.role ?? 'Keine Auswahl'}
                    disabled
                    fullWidth
                  />
                  <TextField
                    label="Verknuepfte Brennstoffzelle"
                    value={adminCandidate?.generatorId ?? 'Keine'}
                    disabled
                    fullWidth
                  />
                  {adminCandidate?.role === 'admin' ? (
                    <Alert severity="info">Dieser Nutzer hat bereits Admin-Rechte.</Alert>
                  ) : null}
                  <Button
                    variant="contained"
                    startIcon={<AdminPanelSettingsIcon />}
                    onClick={() => void handlePromoteAdmin()}
                    disabled={!adminCandidate || adminCandidate.role === 'admin'}
                    fullWidth
                  >
                    Zum Admin ernennen
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <QrScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleDetectedQrValue}
      />
    </Stack>
  )
}
