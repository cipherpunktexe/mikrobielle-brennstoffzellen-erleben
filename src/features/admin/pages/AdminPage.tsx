import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import EditNoteIcon from '@mui/icons-material/EditNote'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState, type FormEvent, type ReactNode, type SyntheticEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthCard } from '../../../shared/ui/AuthCard'
import { QrScannerDialog } from '../../../shared/qr/QrScannerDialog'
import { formatCode, formatMeasurement, formatTimestamp } from '../../../shared/utils/format'
import {
  buildGeneratorQrValue,
  downloadQrPdf,
  extractGeneratorCodeFromQrValue,
  getQrPdfLayoutPreview,
} from '../../../shared/utils/qr'
import type { QrPdfLayoutMode } from '../../../shared/utils/qr'
import {
  addMeasurementByCode,
  findGeneratorForAdmin,
  findUserProfileByEmailForAdmin,
  findUserProfileForAdmin,
  getAdminProfiles,
  getGeneratorByCode,
  getMeasurementsForAdmin,
  getRecentMeasurementsEnteredBy,
  getUserProfile,
  login,
  logout,
  signInWithGoogle,
  subscribeToAuth,
  updateGeneratorAsAdmin,
  updateMeasurementAsAdmin,
  updateUserProfileAsAdmin,
} from '../../../shared/data/firebaseData'
import type {
  Generator,
  Measurement,
  UserProfile,
  UserRole,
} from '../../../shared/types/domain'
import type { AdminRecentMeasurementItem } from '../../../shared/data/firebaseData'

type AdminTabValue = 'qr' | 'scan' | 'moderation' | 'admins'
type ModerationTabValue = 'users' | 'generators' | 'measurements'
type MeasurementUnit = 'uV' | 'mV' | 'V' | 'kV'

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

  return `${measurements.length} Einträge`
}

function getCurrentDateTimeInputValue() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16)
}

function convertMeasurementToVolts(value: number, unit: MeasurementUnit) {
  switch (unit) {
    case 'uV':
      return value / 1_000_000
    case 'mV':
      return value / 1_000
    case 'kV':
      return value * 1_000
    case 'V':
    default:
      return value
  }
}

export function AdminPage() {
  const navigate = useNavigate()
  const params = useParams()
  const routeCode = formatCode(params.code ?? '')

  const [authUserId, setAuthUserId] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTabValue>(routeCode ? 'scan' : 'qr')
  const [moderationTab, setModerationTab] = useState<ModerationTabValue>('users')

  const [exportPrefix, setExportPrefix] = useState('station')
  const [exportCount, setExportCount] = useState('12')
  const [exportLayoutMode, setExportLayoutMode] = useState<QrPdfLayoutMode>('cardsPerPage')
  const [exportCardsPerPage, setExportCardsPerPage] = useState('12')
  const [exportQrSize, setExportQrSize] = useState('42')
  const [exportStatus, setExportStatus] = useState('')
  const [exportError, setExportError] = useState('')

  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanCode, setScanCode] = useState(routeCode)
  const [scanMeasurementCodeLocked, setScanMeasurementCodeLocked] = useState(false)
  const [scanStatus, setScanStatus] = useState('')
  const [scanError, setScanError] = useState('')
  const [scanMeasurementDialogOpen, setScanMeasurementDialogOpen] = useState(false)
  const [scanMeasurementInput, setScanMeasurementInput] = useState('1.42')
  const [scanMeasurementUnit, setScanMeasurementUnit] = useState<MeasurementUnit>('V')
  const [scanMeasurementDateTime, setScanMeasurementDateTime] = useState(
    getCurrentDateTimeInputValue,
  )
  const [scanMeasurementSaving, setScanMeasurementSaving] = useState(false)
  const [scanMeasurementError, setScanMeasurementError] = useState('')
  const [recentMeasurements, setRecentMeasurements] = useState<AdminRecentMeasurementItem[]>([])

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

  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([])
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminSubmitting, setAdminSubmitting] = useState(false)
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

  useEffect(() => {
    if (!authUserId) {
      setProfile(null)
      return
    }

    void getUserProfile(authUserId).then(setProfile)
  }, [authUserId])

  useEffect(() => {
    if (!routeCode) {
      return
    }

    setActiveTab('scan')
    setScanCode(routeCode)
    setGeneratorLookup(routeCode)
    setMeasurementLookup(routeCode)
  }, [routeCode])

  useEffect(() => {
    if (activeTab !== 'admins' || !authUserId) {
      return
    }

    void loadAdminUsers()
  }, [activeTab, authUserId])

  const selectedMeasurement =
    measurementItems.find((item) => item.id === selectedMeasurementId) ?? null
  const parsedExportCount = Number.parseInt(exportCount, 10)
  let exportLayoutPreview: ReturnType<typeof getQrPdfLayoutPreview> | null = null

  if (Number.isFinite(parsedExportCount) && parsedExportCount > 0) {
    try {
      exportLayoutPreview = getQrPdfLayoutPreview(parsedExportCount, {
        mode: exportLayoutMode,
        cardsPerPage: Number.parseInt(exportCardsPerPage, 10),
        qrSizeMm: Number.parseFloat(exportQrSize),
      })
    } catch {
      exportLayoutPreview = null
    }
  }

  useEffect(() => {
    const enteredBy = profile?.email?.trim() || authUserId

    if (activeTab !== 'scan' || !enteredBy) {
      return
    }

    void loadRecentMeasurements(enteredBy)
  }, [activeTab, authUserId, profile?.email])

  function handleAdminTabChange(_event: SyntheticEvent, value: AdminTabValue) {
    setActiveTab(value)
  }

  function handleModerationTabChange(_event: SyntheticEvent, value: ModerationTabValue) {
    setModerationTab(value)
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
      const cardsPerPage = Number.parseInt(exportCardsPerPage, 10)
      const qrSizeMm = Number.parseFloat(exportQrSize)

      if (!Number.isFinite(count) || count < 1 || count > 200) {
        throw new Error('Bitte eine Anzahl zwischen 1 und 200 angeben.')
      }

      const normalizedPrefix = formatCode(exportPrefix)

      if (!normalizedPrefix) {
        throw new Error('Bitte ein gültiges Präfix angeben.')
      }

      const cards = createStationCodes(normalizedPrefix, count).map((code) => ({
        code,
        scanValue: buildGeneratorQrValue(code),
      }))

      await downloadQrPdf(cards, {
        mode: exportLayoutMode,
        cardsPerPage,
        qrSizeMm,
        fileName: `${normalizedPrefix}-qr-codes.pdf`,
      })
      setExportStatus(`PDF mit ${count} QR-Codes wurde erstellt.`)
    } catch (exportIssue) {
      setExportError(exportIssue instanceof Error ? exportIssue.message : 'Export fehlgeschlagen.')
    }
  }

  async function loadRecentMeasurements(enteredBy: string) {
    try {
      const items = await getRecentMeasurementsEnteredBy(enteredBy)
      setRecentMeasurements(items)
    } catch {
      setRecentMeasurements([])
    }
  }

  function openScanMeasurementDialog(code = '', codeLocked = false) {
    setScanCode(code)
    setScanMeasurementCodeLocked(codeLocked)
    setScanMeasurementInput('1.42')
    setScanMeasurementUnit('V')
    setScanMeasurementDateTime(getCurrentDateTimeInputValue())
    setScanMeasurementError('')
    setScanMeasurementDialogOpen(true)
  }

  function handleOpenManualMeasurementDialog() {
    setScanStatus('')
    setScanError('')
    openScanMeasurementDialog(routeCode)
  }

  function handleCloseScanMeasurementDialog() {
    if (scanMeasurementSaving) {
      return
    }

    setScanMeasurementDialogOpen(false)
    setScanMeasurementCodeLocked(false)
    setScanMeasurementError('')
  }

  async function handleDetectedQrValue(value: string) {
    const code = extractGeneratorCodeFromQrValue(value)

    if (!code) {
      throw new Error('Der QR-Code enthält keinen gültigen Brennstoffzellen-Code.')
    }

    const foundGenerator = await getGeneratorByCode(code)

    if (!foundGenerator) {
      throw new Error('Zu diesem Code wurde keine Brennstoffzelle gefunden.')
    }

    setScannerOpen(false)
    setActiveTab('scan')
    setScanCode(code)
    setScanError('')
    setScanStatus(`QR-Code erkannt: ${code}`)
    navigate(`/admin/generator/${code}`)
    openScanMeasurementDialog(code, true)
  }

  async function handleScanMeasurementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setScanMeasurementSaving(true)
    setScanMeasurementError('')
    setScanStatus('')
    setScanError('')

    try {
      const normalizedCode = formatCode(scanCode)

      if (!normalizedCode) {
        throw new Error('Bitte einen Brennstoffzellen-Code eingeben.')
      }

      const numericValue = Number.parseFloat(scanMeasurementInput)

      if (Number.isNaN(numericValue)) {
        throw new Error('Bitte einen gültigen Messwert eingeben.')
      }

      const measuredAt = new Date(scanMeasurementDateTime)

      if (Number.isNaN(measuredAt.getTime())) {
        throw new Error('Bitte ein gültiges Datum und eine gültige Uhrzeit angeben.')
      }

      const linkedGenerator = await addMeasurementByCode({
        code: normalizedCode,
        value: convertMeasurementToVolts(numericValue, scanMeasurementUnit),
        enteredBy: profile?.email ?? authUserId,
        createdAt: measuredAt,
      })

      await loadRecentMeasurements(profile?.email?.trim() || authUserId)
      setScanCode(normalizedCode)
      setScanMeasurementDialogOpen(false)
      setScanMeasurementCodeLocked(false)
      setScanStatus(`Messwert für ${linkedGenerator.code} wurde gespeichert.`)
    } catch (submitIssue) {
      setScanMeasurementError(
        submitIssue instanceof Error
          ? submitIssue.message
          : 'Messwert konnte nicht gespeichert werden.',
      )
    } finally {
      setScanMeasurementSaving(false)
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
        throw new Error('Keine Brennstoffzelle für diese Messwerte gefunden.')
      }

      const measurements = await getMeasurementsForAdmin(foundGenerator.id)

      setMeasurementGenerator(foundGenerator)
      setMeasurementItems(measurements)
      selectMeasurement(measurements[0] ?? null)

      if (!measurements.length) {
        setMeasurementStatus('Brennstoffzelle geladen, aber noch ohne Messwerte.')
        return
      }

      setMeasurementStatus(`Messwerte für ${foundGenerator.code} geladen.`)
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
        throw new Error('Bitte einen gültigen Messwert eingeben.')
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

  async function loadAdminUsers() {
    try {
      const admins = await getAdminProfiles()
      setAdminUsers(admins)
    } catch (loadIssue) {
      setAdminError(
        loadIssue instanceof Error ? loadIssue.message : 'Admin-Übersicht konnte nicht geladen werden.',
      )
    }
  }

  function handleOpenAdminDialog() {
    setAdminStatus('')
    setAdminError('')
    setAdminEmail('')
    setAdminDialogOpen(true)
  }

  function handleCloseAdminDialog() {
    if (adminSubmitting) {
      return
    }

    setAdminDialogOpen(false)
    setAdminEmail('')
    setAdminError('')
  }

  async function handlePromoteAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAdminSubmitting(true)
    setAdminStatus('')
    setAdminError('')

    try {
      const foundUser = await findUserProfileByEmailForAdmin(adminEmail)

      if (!foundUser) {
        throw new Error('Es gibt keinen bereits registrierten Nutzer mit dieser E-Mail-Adresse.')
      }

      if (foundUser.role === 'admin') {
        setAdminStatus(`${foundUser.name} hat bereits Admin-Rechte.`)
        await loadAdminUsers()
        setAdminDialogOpen(false)
        setAdminEmail('')
        return
      }

      await updateUserProfileAsAdmin(foundUser.id, {
        name: foundUser.name,
        email: foundUser.email,
        role: 'admin',
      })

      const refreshedUser = await findUserProfileForAdmin(foundUser.id)

      if (!refreshedUser) {
        throw new Error('Der Nutzer konnte nach dem Speichern nicht erneut geladen werden.')
      }

      await loadAdminUsers()
      setAdminStatus(`${refreshedUser.name} ist jetzt Admin.`)
      setAdminDialogOpen(false)
      setAdminEmail('')
    } catch (promoteIssue) {
      setAdminError(
        promoteIssue instanceof Error
          ? promoteIssue.message
          : 'Admin-Rolle konnte nicht vergeben werden.',
      )
    } finally {
      setAdminSubmitting(false)
    }
  }

  if (!authUserId) {
    return (
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <AuthCard
            title="Admin-Login"
            description="Admins melden sich über Firebase Authentication an und verwalten danach QR-Codes, Scans und Moderation an einer Stelle."
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
                  Voraussetzung ist ein Firestore-User mit <code>role: "admin"</code> für das angemeldete Konto.
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
                    Erzeuge ein A4-PDF mit automatisch optimiertem QR-Layout.
                  </Typography>
                  {exportStatus ? <Alert severity="success">{exportStatus}</Alert> : null}
                  {exportError ? <Alert severity="error">{exportError}</Alert> : null}
                  <TextField
                    label="Pr?fix"
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
                  <TextField
                    label="Layout-Modus"
                    select
                    value={exportLayoutMode}
                    onChange={(event) => setExportLayoutMode(event.target.value as QrPdfLayoutMode)}
                    fullWidth
                    SelectProps={{ native: true }}
                  >
                    <option value="cardsPerPage">Karten pro Seite</option>
                    <option value="qrSize">QR-Größe in mm</option>
                  </TextField>
                  {exportLayoutMode === 'cardsPerPage' ? (
                    <TextField
                      label="Karten pro Seite"
                      type="number"
                      value={exportCardsPerPage}
                      onChange={(event) => setExportCardsPerPage(event.target.value)}
                      helperText="Das Layout nutzt den Platz auf A4 automatisch bestmöglich aus."
                      fullWidth
                    />
                  ) : (
                    <TextField
                      label="QR-Größe in mm"
                      type="number"
                      value={exportQrSize}
                      onChange={(event) => setExportQrSize(event.target.value)}
                      helperText="Die Anzahl pro Seite wird aus der QR-Größe automatisch berechnet."
                      fullWidth
                    />
                  )}
                  <Button
                    variant="contained"
                    onClick={() => void handleExport()}
                    startIcon={<SaveIcon />}
                    fullWidth
                  >
                    PDF herunterladen
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
                    Layout-Vorschau
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Chip label={`Präfix ${formatCode(exportPrefix) || '-'}`} />
                    <Chip label={`${exportCount || '0'} Karten`} />
                    {exportLayoutPreview ? <Chip label={`${exportLayoutPreview.columns} x ${exportLayoutPreview.rows}`} /> : null}
                    {exportLayoutPreview ? <Chip label={`${exportLayoutPreview.cardsPerPage} pro Seite`} /> : null}
                    {exportLayoutPreview ? <Chip label={`QR ${exportLayoutPreview.qrSizeMm.toFixed(0)} mm`} /> : null}
                    {exportLayoutPreview ? <Chip label={exportLayoutPreview.orientation === 'landscape' ? 'A4 quer' : 'A4 hoch'} /> : null}
                    {exportLayoutPreview ? <Chip label={`${exportLayoutPreview.pageCount} Seiten`} /> : null}
                  </Stack>
                  <Divider />
                  <Typography color="text.secondary">
                    Das PDF wird automatisch so auf A4 verteilt, dass die QR-Codes bei der gewählten
                    Vorgabe möglichst groß bleiben und der Platz effizient genutzt wird.
                  </Typography>
                  <Typography color="text.secondary">
                    Neue Karten enthalten den App-internen QR-Payload und können direkt aus dem PDF
                    gedruckt werden.
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
                <Stack spacing={2.5}>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                    Messwerte erfassen
                  </Typography>
                  <Typography color="text.secondary">
                    Scanne einen QR-Code oder trage einen Messwert manuell ein.
                  </Typography>
                  {scanStatus ? <Alert severity="success">{scanStatus}</Alert> : null}
                  {scanError ? <Alert severity="error">{scanError}</Alert> : null}
                  <Button
                    variant="contained"
                    startIcon={<QrCodeScannerIcon />}
                    onClick={() => setScannerOpen(true)}
                    fullWidth
                  >
                    Scanner öffnen
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EditNoteIcon />}
                    onClick={handleOpenManualMeasurementDialog}
                    fullWidth
                  >
                    Manuell Messwert hinzufügen
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
                    Letzte eigene Einträge
                  </Typography>
                  <Typography color="text.secondary">
                    Hier siehst du die zuletzt von dir eingetragenen Messwerte.
                  </Typography>
                  <List
                    dense
                    disablePadding
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      bgcolor: 'background.default',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    {recentMeasurements.length ? (
                      recentMeasurements.map((item, index) => (
                        <ListItem
                          key={item.id}
                          divider={index < recentMeasurements.length - 1}
                          sx={{ py: 1.25 }}
                        >
                          <ListItemText
                            primary={`${item.generatorCode} ? ${formatMeasurement(item.value)}`}
                            secondary={
                              item.ownerName
                                ? `${item.ownerName} ? ${formatTimestamp(item.createdAt)}`
                                : formatTimestamp(item.createdAt)
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem sx={{ py: 2 }}>
                        <ListItemText
                          primary="Noch keine eigenen Messwerte"
                          secondary="Sobald du Werte speicherst, erscheinen sie hier."
                        />
                      </ListItem>
                    )}
                  </List>
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
                      label="Verknüpfte Brennstoffzelle"
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
          <Grid size={{ xs: 12 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Stack spacing={2.5}>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                    Admins
                  </Typography>
                  <Typography color="text.secondary">
                    Übersicht aller aktuell freigeschalteten Admin-Konten.
                  </Typography>
                  {adminStatus ? <Alert severity="success">{adminStatus}</Alert> : null}
                  {adminError ? <Alert severity="error">{adminError}</Alert> : null}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Chip label={`${adminUsers.length} Admins`} />
                    <Button
                      variant="contained"
                      startIcon={<PersonAddAlt1Icon />}
                      onClick={handleOpenAdminDialog}
                    >
                      Admin hinzufügen
                    </Button>
                  </Stack>
                  <List
                    disablePadding
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      bgcolor: 'background.default',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    {adminUsers.length ? (
                      adminUsers.map((adminUser, index) => (
                        <ListItem
                          key={adminUser.id}
                          divider={index < adminUsers.length - 1}
                          sx={{ py: 1.5, alignItems: 'flex-start' }}
                        >
                          <ListItemText
                            primary={adminUser.name}
                            secondary={
                              adminUser.generatorId
                                ? `${adminUser.email} · Brennstoffzelle ${adminUser.generatorId}`
                                : adminUser.email
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem sx={{ py: 2 }}>
                        <ListItemText
                          primary="Noch keine Admins gefunden"
                          secondary="Sobald Konten die Admin-Rolle haben, erscheinen sie hier."
                        />
                      </ListItem>
                    )}
                  </List>
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

      <Dialog
        open={scanMeasurementDialogOpen}
        onClose={handleCloseScanMeasurementDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Messwert eintragen</DialogTitle>
        <Box component="form" onSubmit={handleScanMeasurementSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Brennstoffzellen-Code"
                value={scanCode}
                onChange={(event) => setScanCode(formatCode(event.target.value))}
                disabled={scanMeasurementCodeLocked}
                fullWidth
              />
              <TextField
                label="Wert"
                value={scanMeasurementInput}
                onChange={(event) => setScanMeasurementInput(event.target.value)}
                autoFocus
                fullWidth
              />
              <TextField
                label="Einheit"
                select
                value={scanMeasurementUnit}
                onChange={(event) => setScanMeasurementUnit(event.target.value as MeasurementUnit)}
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="uV">uV</option>
                <option value="mV">mV</option>
                <option value="V">V</option>
                <option value="kV">kV</option>
              </TextField>
              <TextField
                label="Datum und Uhrzeit"
                type="datetime-local"
                value={scanMeasurementDateTime}
                onChange={(event) => setScanMeasurementDateTime(event.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              {scanMeasurementError ? <Alert severity="error">{scanMeasurementError}</Alert> : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseScanMeasurementDialog} disabled={scanMeasurementSaving}>
              Abbrechen
            </Button>
            <Button type="submit" variant="contained" disabled={scanMeasurementSaving}>
              Speichern
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={adminDialogOpen} onClose={handleCloseAdminDialog} fullWidth maxWidth="xs">
        <DialogTitle>Admin hinzufügen</DialogTitle>
        <Box component="form" onSubmit={handlePromoteAdmin}>
          <DialogContent>
            <Stack spacing={2}>
              <Typography color="text.secondary">
                Gib die E-Mail-Adresse eines bereits registrierten Nutzers ein.
              </Typography>
              <TextField
                label="E-Mail"
                type="email"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                autoFocus
                fullWidth
              />
              {adminError ? <Alert severity="error">{adminError}</Alert> : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAdminDialog} disabled={adminSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" variant="contained" disabled={adminSubmitting}>
              Admin hinzufügen
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  )
}
