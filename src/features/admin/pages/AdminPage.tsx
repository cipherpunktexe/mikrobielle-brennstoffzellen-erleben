import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import EditNoteIcon from '@mui/icons-material/EditNote'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import SaveIcon from '@mui/icons-material/Save'
import SolarPowerOutlinedIcon from '@mui/icons-material/SolarPowerOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import {
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QrLayoutPreview } from '../components/QrLayoutPreview'
import { AuthCard } from '../../../shared/ui/AuthCard'
import { QrScannerDialog } from '../../../shared/qr/QrScannerDialog'
import { formatCode, formatMeasurement, formatTimestamp } from '../../../shared/utils/format'
import {
  buildGeneratorQrValue,
  downloadQrPdf,
  extractGeneratorCodeFromQrValue,
  getQrPdfLayoutPreview,
} from '../../../shared/utils/qr'
import type { QrPdfPageSize } from '../../../shared/utils/qr'
import {
  addMeasurementByCode,
  getNextGeneratorCodePreview,
  getGeneratorByCode,
  getMeasurementsForAdmin,
  getRecentMeasurementsEnteredBy,
  getUserProfile,
  listGeneratorsForAdmin,
  listUserProfilesForAdmin,
  login,
  logout,
  reserveNextGeneratorCodes,
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

type AdminTabValue = 'qr' | 'scan' | 'moderation'
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

interface ModerationListEntry {
  user: UserProfile
  generator: Generator | null
}

interface MeasurementFormState {
  value: string
  enteredBy: string
}

type QrExportStepKey = 'count' | 'layout' | 'number' | 'export'

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

function formatMutedDecimal(sequence: number) {
  return sequence.toString(10)
}

function formatScientificVolts(value: number) {
  return `${value.toExponential(3)} V`
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

  const [exportCount, setExportCount] = useState('1')
  const [exportQrSize, setExportQrSize] = useState('42')
  const [exportPageSize, setExportPageSize] = useState<QrPdfPageSize>('a4')
  const [exportDigits, setExportDigits] = useState('4')
  const [exportNextCode, setExportNextCode] = useState('')
  const [exportNextSequence, setExportNextSequence] = useState<number | null>(null)
  const [exportStatus, setExportStatus] = useState('')
  const [exportError, setExportError] = useState('')
  const [exportStepOpen, setExportStepOpen] = useState<Record<QrExportStepKey, boolean>>({
    count: true,
    layout: false,
    number: false,
    export: true,
  })

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

  const [moderationUsers, setModerationUsers] = useState<UserProfile[]>([])
  const [moderationGenerators, setModerationGenerators] = useState<Generator[]>([])
  const [moderationLoading, setModerationLoading] = useState(false)
  const [moderationStatus, setModerationStatus] = useState('')
  const [moderationError, setModerationError] = useState('')
  const [moderationSearch, setModerationSearch] = useState('')
  const [moderationMenuAnchorEl, setModerationMenuAnchorEl] = useState<HTMLElement | null>(null)
  const [menuUser, setMenuUser] = useState<UserProfile | null>(null)
  const [menuGenerator, setMenuGenerator] = useState<Generator | null>(null)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [generatorDialogOpen, setGeneratorDialogOpen] = useState(false)
  const [generatorMeasurementsDialogOpen, setGeneratorMeasurementsDialogOpen] = useState(false)
  const [generatorMeasurementsLoading, setGeneratorMeasurementsLoading] = useState(false)
  const [generatorMeasurements, setGeneratorMeasurements] = useState<Measurement[]>([])
  const [selectedMeasurementGenerator, setSelectedMeasurementGenerator] = useState<Generator | null>(
    null,
  )
  const [editingMeasurementId, setEditingMeasurementId] = useState('')
  const [measurementForm, setMeasurementForm] = useState<MeasurementFormState>(createEmptyMeasurementForm)
  const [measurementSaving, setMeasurementSaving] = useState(false)
  const [measurementError, setMeasurementError] = useState('')
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editingGenerator, setEditingGenerator] = useState<Generator | null>(null)
  const [userForm, setUserForm] = useState<UserFormState>(createEmptyUserForm)
  const [generatorForm, setGeneratorForm] = useState<GeneratorFormState>(createEmptyGeneratorForm)

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
  }, [routeCode])

  useEffect(() => {
    if (activeTab !== 'moderation') {
      return
    }

    void loadModerationEntries()
  }, [activeTab])

  useEffect(() => {
    if (profile?.role !== 'admin') {
      setExportNextCode('')
      setExportNextSequence(null)
      return
    }

    const digits = Number.parseInt(exportDigits, 10)

    void getNextGeneratorCodePreview(Number.isFinite(digits) && digits > 0 ? digits : 4)
      .then((preview) => {
        setExportNextCode(preview.code)
        setExportNextSequence(preview.sequence)
      })
      .catch(() => {
        setExportNextCode('')
        setExportNextSequence(null)
      })
  }, [profile?.role, exportDigits])

  const parsedExportCount = Number.parseInt(exportCount, 10)
  const requestedQrSize = Number.parseFloat(exportQrSize)
  const parsedExportDigits = Number.parseInt(exportDigits, 10)
  const parsedScanMeasurementInput = Number.parseFloat(scanMeasurementInput)
  const convertedScanMeasurementVolts =
    Number.isFinite(parsedScanMeasurementInput) && scanMeasurementUnit !== 'V'
      ? convertMeasurementToVolts(parsedScanMeasurementInput, scanMeasurementUnit)
      : null
  let exportLayoutPreview: ReturnType<typeof getQrPdfLayoutPreview> | null = null

  if (Number.isFinite(parsedExportCount) && parsedExportCount > 0) {
    try {
      exportLayoutPreview = getQrPdfLayoutPreview(parsedExportCount, {
        mode: 'qrSize',
        qrSizeMm: requestedQrSize,
        pageSize: exportPageSize,
      })
    } catch {
      exportLayoutPreview = null
    }
  }

  const previewTotalCards = Number.isFinite(parsedExportCount) && parsedExportCount > 0 ? parsedExportCount : 1

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

  function toggleExportStep(step: QrExportStepKey) {
    setExportStepOpen((current) => ({
      ...current,
      [step]: !current[step],
    }))
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
      const qrSizeMm = Number.parseFloat(exportQrSize)
      const digits = Number.parseInt(exportDigits, 10)

      if (!Number.isFinite(count) || count < 1 || count > 200) {
        throw new Error('Bitte eine Anzahl zwischen 1 und 200 angeben.')
      }

      if (!Number.isFinite(qrSizeMm) || qrSizeMm <= 0) {
        throw new Error('Bitte eine gültige QR-Größe angeben.')
      }

      if (!Number.isFinite(digits) || digits < 1 || digits > 12) {
        throw new Error('Bitte eine Stellenzahl zwischen 1 und 12 angeben.')
      }

      const reservation = await reserveNextGeneratorCodes(count, digits)
      const cards = reservation.codes.map((code) => ({
        code,
        scanValue: buildGeneratorQrValue(code),
      }))

      await downloadQrPdf(cards, {
        mode: 'qrSize',
        qrSizeMm,
        pageSize: exportPageSize,
      })
      setExportNextCode(reservation.nextCode)
      setExportNextSequence(reservation.nextSequence)
      setExportStatus(
        `PDF mit ${count} QR-Codes wurde erstellt. Bereich ${reservation.startCode} bis ${reservation.endCode}.`,
      )
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

  async function loadModerationEntries() {
    setModerationLoading(true)
    setModerationError('')

    try {
      const [users, generators] = await Promise.all([
        listUserProfilesForAdmin(),
        listGeneratorsForAdmin(),
      ])
      setModerationUsers(users)
      setModerationGenerators(generators)
    } catch (loadIssue) {
      setModerationError(
        loadIssue instanceof Error
          ? loadIssue.message
          : 'Die Liste konnte nicht geladen werden.',
      )
    } finally {
      setModerationLoading(false)
    }
  }

  const normalizedModerationSearch = moderationSearch.trim().toLocaleLowerCase('de-DE')
  const moderationEntries = moderationUsers.map((user) => {
    const linkedGenerator =
      moderationGenerators.find((generator) => generator.id === user.generatorId) ??
      moderationGenerators.find((generator) => generator.ownerUid === user.id) ??
      null

    return {
      user,
      generator: linkedGenerator,
    } satisfies ModerationListEntry
  })
  const filteredModerationEntries = moderationEntries.filter(({ user, generator }) => {
    if (!normalizedModerationSearch) {
      return true
    }

    const haystack = [
      user.name,
      user.email,
      user.role,
      user.generatorId ?? '',
      generator?.code ?? '',
      generator?.ownerUid ?? '',
      generator?.ownerName ?? '',
    ]
      .join(' ')
      .toLocaleLowerCase('de-DE')
    return haystack.includes(normalizedModerationSearch)
  })

  function handleModerationMenuOpen(
    event: MouseEvent<HTMLElement>,
    user: UserProfile,
    generator: Generator | null,
  ) {
    event.stopPropagation()
    setMenuUser(user)
    setMenuGenerator(generator)
    setModerationMenuAnchorEl(event.currentTarget)
  }

  function handleCloseModerationMenu() {
    setModerationMenuAnchorEl(null)
    setMenuUser(null)
    setMenuGenerator(null)
  }

  function handleOpenUserDialog(user: UserProfile) {
    setModerationStatus('')
    setModerationError('')
    setEditingUser(user)
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
    })
    setUserDialogOpen(true)
    handleCloseModerationMenu()
  }

  function handleCloseUserDialog() {
    setUserDialogOpen(false)
    setEditingUser(null)
    setUserForm(createEmptyUserForm())
  }

  async function handleUserSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingUser) {
      return
    }

    setModerationStatus('')
    setModerationError('')

    try {
      await updateUserProfileAsAdmin(editingUser.id, userForm)
      await loadModerationEntries()
      setModerationStatus(`Nutzer ${userForm.name.trim() || editingUser.name} aktualisiert.`)
      handleCloseUserDialog()
    } catch (saveIssue) {
      setModerationError(
        saveIssue instanceof Error ? saveIssue.message : 'Nutzer konnte nicht gespeichert werden.',
      )
    }
  }

  function handleOpenGeneratorDialog(generator: Generator) {
    setModerationStatus('')
    setModerationError('')
    setEditingGenerator(generator)
    setGeneratorForm({
      code: generator.code,
      ownerUid: generator.ownerUid,
      ownerName: generator.ownerName ?? '',
    })
    setGeneratorDialogOpen(true)
    handleCloseModerationMenu()
  }

  function handleCloseGeneratorDialog() {
    setGeneratorDialogOpen(false)
    setEditingGenerator(null)
    setGeneratorForm(createEmptyGeneratorForm())
  }

  async function handleGeneratorSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingGenerator) {
      return
    }

    setModerationStatus('')
    setModerationError('')

    try {
      await updateGeneratorAsAdmin(editingGenerator.id, generatorForm)
      await loadModerationEntries()
      setModerationStatus(`Brennstoffzelle ${formatCode(generatorForm.code)} aktualisiert.`)
      handleCloseGeneratorDialog()
    } catch (saveIssue) {
      setModerationError(
        saveIssue instanceof Error
          ? saveIssue.message
          : 'Brennstoffzelle konnte nicht gespeichert werden.',
      )
    }
  }

  async function loadGeneratorMeasurements(generatorId: string) {
    const measurements = await getMeasurementsForAdmin(generatorId)
    setGeneratorMeasurements(measurements)
  }

  async function handleOpenGeneratorMeasurements(generator: Generator) {
    setModerationStatus('')
    setModerationError('')
    setMeasurementError('')
    setEditingMeasurementId('')
    setMeasurementForm(createEmptyMeasurementForm())
    setSelectedMeasurementGenerator(generator)
    setGeneratorMeasurements([])
    setGeneratorMeasurementsLoading(true)
    setGeneratorMeasurementsDialogOpen(true)

    try {
      await loadGeneratorMeasurements(generator.id)
    } catch (loadIssue) {
      setModerationError(
        loadIssue instanceof Error ? loadIssue.message : 'Messwerte konnten nicht geladen werden.',
      )
    } finally {
      setGeneratorMeasurementsLoading(false)
    }
  }

  function handleCloseGeneratorMeasurementsDialog() {
    setGeneratorMeasurementsDialogOpen(false)
    setSelectedMeasurementGenerator(null)
    setGeneratorMeasurements([])
    setGeneratorMeasurementsLoading(false)
    setEditingMeasurementId('')
    setMeasurementForm(createEmptyMeasurementForm())
    setMeasurementSaving(false)
    setMeasurementError('')
  }

  function handleOpenMeasurementEditor(measurement: Measurement) {
    setMeasurementError('')
    setEditingMeasurementId(measurement.id)
    setMeasurementForm({
      value: measurement.value.toString(),
      enteredBy: measurement.enteredBy,
    })
  }

  function handleCloseMeasurementEditor() {
    if (measurementSaving) {
      return
    }

    setEditingMeasurementId('')
    setMeasurementForm(createEmptyMeasurementForm())
    setMeasurementError('')
  }

  async function handleMeasurementSave(measurementId: string) {
    if (!selectedMeasurementGenerator) {
      return
    }

    setMeasurementSaving(true)
    setMeasurementError('')
    setModerationStatus('')
    setModerationError('')

    try {
      const numericValue = Number.parseFloat(measurementForm.value)

      if (Number.isNaN(numericValue)) {
        throw new Error('Bitte einen gültigen Messwert in V eingeben.')
      }

      await updateMeasurementAsAdmin(measurementId, {
        value: numericValue,
        enteredBy: measurementForm.enteredBy,
      })

      await loadGeneratorMeasurements(selectedMeasurementGenerator.id)
      setModerationStatus(`Messwert für ${selectedMeasurementGenerator.code} aktualisiert.`)
      handleCloseMeasurementEditor()
    } catch (saveIssue) {
      setMeasurementError(
        saveIssue instanceof Error
          ? saveIssue.message
          : 'Messwert konnte nicht gespeichert werden.',
      )
    } finally {
      setMeasurementSaving(false)
    }
  }

  async function handlePromoteUserToAdmin() {
    if (!menuUser || menuUser.role === 'admin') {
      handleCloseModerationMenu()
      return
    }

    setModerationStatus('')
    setModerationError('')

    try {
      await updateUserProfileAsAdmin(menuUser.id, {
        name: menuUser.name,
        email: menuUser.email,
        role: 'admin',
      })
      await loadModerationEntries()
      setModerationStatus(`${menuUser.name} ist jetzt Admin.`)
    } catch (promoteIssue) {
      setModerationError(
        promoteIssue instanceof Error
          ? promoteIssue.message
          : 'Admin-Rechte konnten nicht vergeben werden.',
      )
    } finally {
      handleCloseModerationMenu()
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
        </Tabs>
      </Card>

      <TabPanel active={activeTab} value="qr">
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                      QR-Export
                    </Typography>
                  </Box>
                  {exportStatus ? <Alert severity="success">{exportStatus}</Alert> : null}
                  {exportError ? <Alert severity="error">{exportError}</Alert> : null}
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Chip
                        label="1"
                        color="primary"
                        sx={{ minWidth: 36, height: 36, borderRadius: 999 }}
                      />
                      <Card variant="outlined" sx={{ flex: 1 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Typography fontWeight={700}>Anzahl</Typography>
                              <IconButton
                                size="small"
                                onClick={() => toggleExportStep('count')}
                                aria-label="Step 1 ein- oder ausklappen"
                              >
                                <ExpandMoreIcon
                                  sx={{
                                    transform: exportStepOpen.count ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease',
                                  }}
                                />
                              </IconButton>
                            </Stack>
                            <Collapse in={exportStepOpen.count}>
                              <TextField
                                label="Anzahl"
                                type="number"
                                value={exportCount}
                                onChange={(event) => setExportCount(event.target.value)}
                                fullWidth
                              />
                            </Collapse>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Chip
                        label="2"
                        color="primary"
                        sx={{ minWidth: 36, height: 36, borderRadius: 999 }}
                      />
                      <Card variant="outlined" sx={{ flex: 1 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Typography fontWeight={700}>Größe und Format</Typography>
                              <IconButton
                                size="small"
                                onClick={() => toggleExportStep('layout')}
                                aria-label="Step 2 ein- oder ausklappen"
                              >
                                <ExpandMoreIcon
                                  sx={{
                                    transform: exportStepOpen.layout ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease',
                                  }}
                                />
                              </IconButton>
                            </Stack>
                            <Collapse in={exportStepOpen.layout}>
                              <Stack spacing={1.5}>
                                <TextField
                                  label="QR-Größe in mm"
                                  type="number"
                                  value={exportQrSize}
                                  onChange={(event) => setExportQrSize(event.target.value)}
                                  fullWidth
                                />
                                <TextField
                                  label="Seitenformat"
                                  select
                                  value={exportPageSize}
                                  onChange={(event) => setExportPageSize(event.target.value as QrPdfPageSize)}
                                  fullWidth
                                  SelectProps={{ native: true }}
                                >
                                  <option value="a4">A4</option>
                                  <option value="a5">A5</option>
                                  <option value="a6">A6</option>
                                  <option value="qr">QR-Code</option>
                                </TextField>
                              </Stack>
                            </Collapse>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Chip
                        label="3"
                        color="primary"
                        sx={{ minWidth: 36, height: 36, borderRadius: 999 }}
                      />
                      <Card variant="outlined" sx={{ flex: 1 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Typography fontWeight={700}>Nummer</Typography>
                              <IconButton
                                size="small"
                                onClick={() => toggleExportStep('number')}
                                aria-label="Step 3 ein- oder ausklappen"
                              >
                                <ExpandMoreIcon
                                  sx={{
                                    transform: exportStepOpen.number ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease',
                                  }}
                                />
                              </IconButton>
                            </Stack>
                            <Collapse in={exportStepOpen.number}>
                              <Stack spacing={2}>
                                <TextField
                                  label="Stellen"
                                  type="number"
                                  value={exportDigits}
                                  onChange={(event) => setExportDigits(event.target.value)}
                                  fullWidth
                                />
                                <Box>
                                  <Typography
                                    variant="h3"
                                    sx={{
                                      fontFamily: '"Consolas", "Courier New", monospace',
                                      fontSize: { xs: '1.9rem', sm: '2.4rem' },
                                      letterSpacing: '0.08em',
                                      lineHeight: 1,
                                    }}
                                  >
                                    {exportNextCode || '-'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {exportNextSequence === null
                                      ? '-'
                                      : formatMutedDecimal(exportNextSequence)}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Collapse>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Chip
                        label="4"
                        color="primary"
                        sx={{ minWidth: 36, height: 36, borderRadius: 999 }}
                      />
                      <Card variant="outlined" sx={{ flex: 1 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Typography fontWeight={700}>Export</Typography>
                              <IconButton
                                size="small"
                                onClick={() => toggleExportStep('export')}
                                aria-label="Step 4 ein- oder ausklappen"
                              >
                                <ExpandMoreIcon
                                  sx={{
                                    transform: exportStepOpen.export ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease',
                                  }}
                                />
                              </IconButton>
                            </Stack>
                            <Collapse in={exportStepOpen.export}>
                              <Button
                                variant="contained"
                                onClick={() => void handleExport()}
                                startIcon={<SaveIcon />}
                                fullWidth
                              >
                                PDF herunterladen
                              </Button>
                            </Collapse>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 }, height: '100%' }}>
                <Stack spacing={2.5} sx={{ height: '100%' }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={1.5}
                  >
                    <Box>
                      <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                        Vorschau
                      </Typography>
                    </Box>
                  </Stack>
                  <QrLayoutPreview
                    layout={exportLayoutPreview}
                    totalCards={previewTotalCards}
                    digits={Number.isFinite(parsedExportDigits) && parsedExportDigits > 0 ? parsedExportDigits : 4}
                    startSequence={exportNextSequence}
                  />
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
                  <Box
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      bgcolor: 'background.default',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: { xs: 'none', sm: 'grid' },
                        gridTemplateColumns: 'minmax(96px, 120px) minmax(110px, 140px) minmax(0, 1fr)',
                        gap: 2,
                        px: 2,
                        py: 1.25,
                        bgcolor: 'rgba(36,28,19,0.05)',
                        borderBottom: recentMeasurements.length
                          ? (theme) => `1px solid ${theme.palette.divider}`
                          : 'none',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        Code
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        Wert
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        Zeitpunkt
                      </Typography>
                    </Box>
                    <List disablePadding>
                      {recentMeasurements.length ? (
                        recentMeasurements.map((item, index) => (
                          <ListItem
                            key={item.id}
                            divider={index < recentMeasurements.length - 1}
                            sx={{ px: 2, py: 1.5 }}
                          >
                            <Box
                              sx={{
                                width: '100%',
                                display: 'grid',
                                gridTemplateColumns: {
                                  xs: '1fr',
                                  sm: 'minmax(96px, 120px) minmax(110px, 140px) minmax(0, 1fr)',
                                },
                                gap: { xs: 0.75, sm: 2 },
                                alignItems: 'center',
                              }}
                            >
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontFamily: '"Consolas", "Courier New", monospace', fontWeight: 700 }}
                                >
                                  {item.generatorCode.toUpperCase()}
                                </Typography>
                                {item.ownerName ? (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: { sm: 'none' } }}
                                  >
                                    {item.ownerName}
                                  </Typography>
                                ) : null}
                              </Box>
                              <Typography variant="body2" fontWeight={600}>
                                {formatMeasurement(item.value)}
                              </Typography>
                              <Box>
                                <Typography variant="body2">
                                  {formatTimestamp(item.createdAt)}
                                </Typography>
                                {item.ownerName ? (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: { xs: 'none', sm: 'block' } }}
                                  >
                                    {item.ownerName}
                                  </Typography>
                                ) : null}
                              </Box>
                            </Box>
                          </ListItem>
                        ))
                      ) : (
                        <ListItem sx={{ px: 2, py: 2 }}>
                          <ListItemText
                            primary="Noch keine eigenen Messwerte"
                            secondary="Sobald du Werte speicherst, erscheinen sie hier."
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel active={activeTab} value="moderation">
        <Card>
          <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
            <Stack spacing={2}>
              {moderationStatus ? <Alert severity="success">{moderationStatus}</Alert> : null}
              {moderationError ? <Alert severity="error">{moderationError}</Alert> : null}

              {moderationLoading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Einträge werden geladen...</Typography>
                </Stack>
              ) : null}

              <TextField
                label="Suchen"
                value={moderationSearch}
                onChange={(event) => setModerationSearch(event.target.value)}
                placeholder="Name, E-Mail, Code oder Rolle"
                fullWidth
              />
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: 'background.default',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'grid' },
                    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(110px, 140px)',
                    gap: 2,
                    px: 2,
                    py: 1.25,
                    pr: 7,
                    bgcolor: 'rgba(36,28,19,0.05)',
                    borderBottom: filteredModerationEntries.length
                      ? (theme) => `1px solid ${theme.palette.divider}`
                      : 'none',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Nutzer
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Code
                  </Typography>
                </Box>
                <List disablePadding>
                  {filteredModerationEntries.length ? (
                    filteredModerationEntries.map(({ user, generator }, index) => (
                      <ListItem
                        key={user.id}
                        divider={index < filteredModerationEntries.length - 1}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleModerationMenuOpen(event, user, generator)
                            }}
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 1.75,
                              border: (theme) => `1px solid ${theme.palette.divider}`,
                              bgcolor: 'rgba(255,255,255,0.72)',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.96)',
                              },
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        }
                        sx={{ px: 2, py: 1.5 }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            display: 'grid',
                            gridTemplateColumns: {
                              xs: '1fr',
                              sm: 'minmax(0, 1.4fr) minmax(110px, 140px)',
                            },
                            gap: { xs: 0.75, sm: 2 },
                            alignItems: 'center',
                            cursor: generator ? 'pointer' : 'default',
                          }}
                          onClick={() => {
                            if (generator) {
                              void handleOpenGeneratorMeasurements(generator)
                            }
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>
                                {user.name}
                              </Typography>
                              {user.role === 'admin' ? (
                                <Box
                                  component="span"
                                  aria-label="Admin"
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#8F6410',
                                    flexShrink: 0,
                                  }}
                                >
                                  <AdminPanelSettingsOutlinedIcon fontSize="small" />
                                </Box>
                              ) : null}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: '"Consolas", "Courier New", monospace', fontWeight: 700 }}
                            >
                              {generator ? generator.code.toUpperCase() : '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    ))
                  ) : (
                    <ListItem sx={{ py: 2 }}>
                      <ListItemText
                        primary={moderationEntries.length ? 'Keine Treffer' : 'Noch keine Einträge'}
                        secondary={
                          moderationEntries.length
                            ? 'Passe den Suchbegriff an, um weitere Einträge zu sehen.'
                            : 'Registrierte Konten erscheinen hier automatisch.'
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </Box>

            </Stack>
          </CardContent>
        </Card>
      </TabPanel>

      <Menu
        anchorEl={moderationMenuAnchorEl}
        open={Boolean(moderationMenuAnchorEl)}
        onClose={handleCloseModerationMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 250,
            overflow: 'hidden',
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: '0 22px 44px rgba(36,28,19,0.16)',
          },
        }}
        MenuListProps={{
          dense: true,
          sx: { p: 0.75 },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuUser) {
              handleOpenUserDialog(menuUser)
            }
          }}
          sx={{ gap: 1.25, borderRadius: 2, mx: 0.5, my: 0.25 }}
        >
          <PersonOutlineIcon fontSize="small" />
          Nutzer bearbeiten
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuGenerator) {
              handleOpenGeneratorDialog(menuGenerator)
            }
          }}
          disabled={!menuGenerator}
          sx={{ gap: 1.25, borderRadius: 2, mx: 0.5, my: 0.25 }}
        >
          <SolarPowerOutlinedIcon fontSize="small" />
          Brennstoffzelle bearbeiten
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuGenerator) {
              void handleOpenGeneratorMeasurements(menuGenerator)
              handleCloseModerationMenu()
            }
          }}
          disabled={!menuGenerator}
          sx={{ gap: 1.25, borderRadius: 2, mx: 0.5, my: 0.25 }}
        >
          <ScienceOutlinedIcon fontSize="small" />
          Messwerte
        </MenuItem>
        <MenuItem
          onClick={() => void handlePromoteUserToAdmin()}
          disabled={menuUser?.role === 'admin'}
          sx={{ gap: 1.25, borderRadius: 2, mx: 0.5, my: 0.25 }}
        >
          <AdminPanelSettingsOutlinedIcon fontSize="small" />
          {menuUser?.role === 'admin' ? 'Bereits Admin' : 'Zum Admin machen'}
        </MenuItem>
      </Menu>

      <Dialog open={userDialogOpen} onClose={handleCloseUserDialog} fullWidth maxWidth="sm">
        <DialogTitle>Nutzer bearbeiten</DialogTitle>
        <Box component="form" onSubmit={handleUserSave}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={userForm.name}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, name: event.target.value }))
                }
                fullWidth
              />
              <TextField
                label="E-Mail"
                value={userForm.email}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, email: event.target.value }))
                }
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
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </TextField>
              <TextField
                label="Verknüpfte Brennstoffzelle"
                value={editingUser?.generatorId ?? 'Keine'}
                disabled
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUserDialog}>Abbrechen</Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />}>
              Speichern
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={generatorDialogOpen}
        onClose={handleCloseGeneratorDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleGeneratorSave}>
          <DialogTitle>Brennstoffzelle bearbeiten</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Code"
                value={generatorForm.code}
                onChange={(event) =>
                  setGeneratorForm((current) => ({
                    ...current,
                    code: formatCode(event.target.value),
                  }))
                }
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
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseGeneratorDialog}>Abbrechen</Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />}>
              Speichern
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={generatorMeasurementsDialogOpen}
        onClose={handleCloseGeneratorMeasurementsDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedMeasurementGenerator
            ? `Messwerte für ${selectedMeasurementGenerator.ownerName?.trim() || selectedMeasurementGenerator.code}`
            : 'Messwerte'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {selectedMeasurementGenerator ? (
              <Typography color="text.secondary">
                {selectedMeasurementGenerator.code} | {selectedMeasurementGenerator.ownerUid}
              </Typography>
            ) : null}

            {measurementError ? <Alert severity="error">{measurementError}</Alert> : null}

            {generatorMeasurementsLoading ? (
              <Typography color="text.secondary">Messwerte werden geladen...</Typography>
            ) : (
              <List
                disablePadding
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: 'background.default',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                {generatorMeasurements.length ? (
                  generatorMeasurements.map((measurement, index) => (
                    <ListItem
                      key={measurement.id}
                      divider={index < generatorMeasurements.length - 1}
                      sx={{ py: 1.5 }}
                    >
                      {editingMeasurementId === measurement.id ? (
                        <Stack spacing={1.5} sx={{ width: '100%' }}>
                          <TextField
                            label="Wert in V"
                            value={measurementForm.value}
                            onChange={(event) =>
                              setMeasurementForm((current) => ({
                                ...current,
                                value: event.target.value,
                              }))
                            }
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
                            fullWidth
                          />
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => void handleMeasurementSave(measurement.id)}
                              disabled={measurementSaving}
                            >
                              Speichern
                            </Button>
                            <Button
                              size="small"
                              onClick={handleCloseMeasurementEditor}
                              disabled={measurementSaving}
                            >
                              Abbrechen
                            </Button>
                          </Stack>
                        </Stack>
                      ) : (
                        <Stack
                          direction="row"
                          spacing={1.5}
                          justifyContent="space-between"
                          alignItems="flex-start"
                          sx={{ width: '100%' }}
                        >
                          <ListItemText
                            primary={formatMeasurement(measurement.value)}
                            secondary={`${measurement.enteredBy} | ${formatTimestamp(measurement.createdAt)}`}
                          />
                          <IconButton
                            size="small"
                            aria-label="Messwert bearbeiten"
                            onClick={() => handleOpenMeasurementEditor(measurement)}
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 1.75,
                              border: (theme) => `1px solid ${theme.palette.divider}`,
                              bgcolor: 'rgba(255,255,255,0.72)',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.96)',
                              },
                            }}
                          >
                            <EditNoteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      )}
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="Noch keine Messwerte"
                      secondary="Für diese Brennstoffzelle wurden noch keine Werte eingetragen."
                    />
                  </ListItem>
                )}
              </List>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGeneratorMeasurementsDialog}>Schließen</Button>
        </DialogActions>
      </Dialog>

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
              <Stack spacing={1}>
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
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
                    sx={{ width: 112, flexShrink: 0 }}
                    SelectProps={{ native: true }}
                  >
                    <option value="uV">uV</option>
                    <option value="mV">mV</option>
                    <option value="V">V</option>
                    <option value="kV">kV</option>
                  </TextField>
                </Stack>
                {convertedScanMeasurementVolts !== null ? (
                  <Typography variant="body2" color="text.secondary">
                    {formatScientificVolts(convertedScanMeasurementVolts)}
                  </Typography>
                ) : null}
              </Stack>
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

    </Stack>
  )
}
