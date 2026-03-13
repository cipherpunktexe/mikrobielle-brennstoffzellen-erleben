import EditNoteIcon from '@mui/icons-material/EditNote'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import SaveIcon from '@mui/icons-material/Save'
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
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Slider,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
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
  getGeneratorByCode,
  getMeasurementsForAdmin,
  getRecentMeasurementsEnteredBy,
  getUserProfile,
  listGeneratorsForAdmin,
  listUserProfilesForAdmin,
  login,
  logout,
  signInWithGoogle,
  subscribeToAuth,
  updateGeneratorAsAdmin,
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
type ModerationTabValue = 'users' | 'generators'
type MeasurementUnit = 'uV' | 'mV' | 'V' | 'kV'
type ExportPreviewMode = 'single' | 'page'

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
  const [exportPreviewMode, setExportPreviewMode] = useState<ExportPreviewMode>('page')
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

  const [moderationUsers, setModerationUsers] = useState<UserProfile[]>([])
  const [moderationGenerators, setModerationGenerators] = useState<Generator[]>([])
  const [moderationLoading, setModerationLoading] = useState(false)
  const [moderationStatus, setModerationStatus] = useState('')
  const [moderationError, setModerationError] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [generatorSearch, setGeneratorSearch] = useState('')
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<HTMLElement | null>(null)
  const [generatorMenuAnchorEl, setGeneratorMenuAnchorEl] = useState<HTMLElement | null>(null)
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

    void loadModerationEntries(moderationTab)
  }, [activeTab, moderationTab])

  const parsedExportCount = Number.parseInt(exportCount, 10)
  const requestedCardsPerPage = Number.parseInt(exportCardsPerPage, 10)
  const requestedQrSize = Number.parseFloat(exportQrSize)
  let exportLayoutPreview: ReturnType<typeof getQrPdfLayoutPreview> | null = null

  if (Number.isFinite(parsedExportCount) && parsedExportCount > 0) {
    try {
      exportLayoutPreview = getQrPdfLayoutPreview(parsedExportCount, {
        mode: exportLayoutMode,
        cardsPerPage: requestedCardsPerPage,
        qrSizeMm: requestedQrSize,
      })
    } catch {
      exportLayoutPreview = null
    }
  }

  const normalizedExportPrefix = formatCode(exportPrefix) || 'station'
  const previewTotalCards = Number.isFinite(parsedExportCount) && parsedExportCount > 0 ? parsedExportCount : 1
  const previewCardsVisible =
    exportPreviewMode === 'single'
      ? 1
      : Math.min(exportLayoutPreview?.cardsPerPage ?? 1, previewTotalCards)
  const previewCardLabels = createStationCodes(normalizedExportPrefix, previewCardsVisible)
  const cardsPerPageSliderMax = Math.max(1, Math.min(previewTotalCards, 24))
  const previewPageLabel = exportLayoutPreview
    ? `Seite 1 / ${exportLayoutPreview.pageCount}`
    : 'Seite 1 / 1'

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

  async function loadModerationEntries(targetTab: ModerationTabValue) {
    setModerationLoading(true)
    setModerationError('')

    try {
      if (targetTab === 'users') {
        const users = await listUserProfilesForAdmin()
        setModerationUsers(users)
      } else {
        const generators = await listGeneratorsForAdmin()
        setModerationGenerators(generators)
      }
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

  const normalizedUserSearch = userSearch.trim().toLocaleLowerCase('de-DE')
  const normalizedGeneratorSearch = generatorSearch.trim().toLocaleLowerCase('de-DE')
  const filteredModerationUsers = moderationUsers.filter((user) => {
    if (!normalizedUserSearch) {
      return true
    }

    const haystack = [user.name, user.email, user.role, user.generatorId ?? '']
      .join(' ')
      .toLocaleLowerCase('de-DE')
    return haystack.includes(normalizedUserSearch)
  })
  const filteredModerationGenerators = moderationGenerators.filter((generator) => {
    if (!normalizedGeneratorSearch) {
      return true
    }

    const haystack = [generator.ownerName ?? '', generator.code, generator.ownerUid]
      .join(' ')
      .toLocaleLowerCase('de-DE')
    return haystack.includes(normalizedGeneratorSearch)
  })

  function handleUserMenuOpen(event: MouseEvent<HTMLElement>, user: UserProfile) {
    event.stopPropagation()
    setMenuUser(user)
    setUserMenuAnchorEl(event.currentTarget)
  }

  function handleGeneratorMenuOpen(event: MouseEvent<HTMLElement>, generator: Generator) {
    event.stopPropagation()
    setMenuGenerator(generator)
    setGeneratorMenuAnchorEl(event.currentTarget)
  }

  function handleCloseUserMenu() {
    setUserMenuAnchorEl(null)
    setMenuUser(null)
  }

  function handleCloseGeneratorMenu() {
    setGeneratorMenuAnchorEl(null)
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
    handleCloseUserMenu()
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
      await loadModerationEntries('users')
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
    handleCloseGeneratorMenu()
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
      await loadModerationEntries('generators')
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

  async function handleOpenGeneratorMeasurements(generator: Generator) {
    setModerationStatus('')
    setModerationError('')
    setSelectedMeasurementGenerator(generator)
    setGeneratorMeasurements([])
    setGeneratorMeasurementsLoading(true)
    setGeneratorMeasurementsDialogOpen(true)

    try {
      const measurements = await getMeasurementsForAdmin(generator.id)
      setGeneratorMeasurements(measurements)
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
  }

  async function handlePromoteUserToAdmin() {
    if (!menuUser || menuUser.role === 'admin') {
      handleCloseUserMenu()
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
      await loadModerationEntries('users')
      setModerationStatus(`${menuUser.name} ist jetzt Admin.`)
    } catch (promoteIssue) {
      setModerationError(
        promoteIssue instanceof Error
          ? promoteIssue.message
          : 'Admin-Rechte konnten nicht vergeben werden.',
      )
    } finally {
      handleCloseUserMenu()
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
        </Tabs>
      </Card>

      <TabPanel active={activeTab} value="qr">
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                      QR-Export
                    </Typography>
                    <Typography color="text.secondary">
                      Erzeuge ein A4-PDF mit automatisch optimierter Seitenbelegung.
                    </Typography>
                  </Box>
                  {exportStatus ? <Alert severity="success">{exportStatus}</Alert> : null}
                  {exportError ? <Alert severity="error">{exportError}</Alert> : null}
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Chip label="1" color="primary" sx={{ minWidth: 36, height: 36, borderRadius: 999 }} />
                      <Card variant="outlined" sx={{ flex: 1 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1.5}>
                            <Typography fontWeight={700}>Generatoren</Typography>
                            <TextField
                              label="Präfix"
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
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Chip label="2" color="primary" sx={{ minWidth: 36, height: 36, borderRadius: 999 }} />
                      <Card variant="outlined" sx={{ flex: 1 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={2}>
                            <Typography fontWeight={700}>Drucklayout</Typography>
                            <ToggleButtonGroup
                              exclusive
                              value={exportLayoutMode}
                              onChange={(_event, value: QrPdfLayoutMode | null) => {
                                if (value) {
                                  setExportLayoutMode(value)
                                }
                              }}
                              fullWidth
                              size="small"
                            >
                              <ToggleButton value="cardsPerPage">Pro Seite</ToggleButton>
                              <ToggleButton value="qrSize">QR-Größe</ToggleButton>
                            </ToggleButtonGroup>
                            {exportLayoutMode === 'cardsPerPage' ? (
                              <Stack spacing={1}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography fontWeight={600}>Karten pro Seite</Typography>
                                  <Typography color="text.secondary">{exportCardsPerPage}</Typography>
                                </Stack>
                                <Slider
                                  value={Math.max(1, Math.min(cardsPerPageSliderMax, requestedCardsPerPage || 1))}
                                  min={1}
                                  max={cardsPerPageSliderMax}
                                  step={1}
                                  onChange={(_event, value) => setExportCardsPerPage(String(value))}
                                  valueLabelDisplay="auto"
                                />
                                <Typography variant="body2" color="text.secondary">
                                  Das Layout nutzt den A4-Platz automatisch bestmöglich aus.
                                </Typography>
                              </Stack>
                            ) : (
                              <Stack spacing={1.5}>
                                <TextField
                                  label="QR-Größe in mm"
                                  type="number"
                                  value={exportQrSize}
                                  onChange={(event) => setExportQrSize(event.target.value)}
                                  fullWidth
                                />
                                <Typography variant="body2" color="text.secondary">
                                  Die Anzahl pro Seite wird aus der QR-Größe automatisch berechnet.
                                </Typography>
                              </Stack>
                            )}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
                              {exportLayoutPreview ? <Chip label={`${exportLayoutPreview.columns} × ${exportLayoutPreview.rows}`} /> : null}
                              {exportLayoutPreview ? <Chip label={`${exportLayoutPreview.cardsPerPage} pro Seite`} /> : null}
                              {exportLayoutPreview ? <Chip label={`QR ${exportLayoutPreview.qrSizeMm.toFixed(0)} mm`} /> : null}
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Chip label="3" color="primary" sx={{ minWidth: 36, height: 36, borderRadius: 999 }} />
                      <Card variant="outlined" sx={{ flex: 1 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1.5}>
                            <Typography fontWeight={700}>Export</Typography>
                            <Button
                              variant="contained"
                              onClick={() => void handleExport()}
                              startIcon={<SaveIcon />}
                              fullWidth
                            >
                              PDF herunterladen
                            </Button>
                            <Typography variant="body2" color="text.secondary">
                              Die Karten enthalten den App-internen QR-Payload und sind direkt
                              druckbar.
                            </Typography>
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
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Stack spacing={2.5}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={1.5}
                  >
                    <Box>
                      <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                        Ticket-Vorschau
                      </Typography>
                      <Typography color="text.secondary">
                        Vorschau für Einzelkarte oder komplette Seite.
                      </Typography>
                    </Box>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={exportPreviewMode}
                      onChange={(_event, value: ExportPreviewMode | null) => {
                        if (value) {
                          setExportPreviewMode(value)
                        }
                      }}
                    >
                      <ToggleButton value="single">Einzeln</ToggleButton>
                      <ToggleButton value="page">Seite</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={`Präfix ${normalizedExportPrefix}`} />
                    <Chip label={`${previewTotalCards} Karten`} />
                    {exportLayoutPreview ? (
                      <Chip label={exportLayoutPreview.orientation === 'landscape' ? 'A4 quer' : 'A4 hoch'} />
                    ) : null}
                    {exportLayoutPreview ? <Chip label={`${exportLayoutPreview.pageCount} Seiten`} /> : null}
                  </Stack>
                  <Box
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 4,
                      bgcolor: 'rgba(36,28,19,0.06)',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box
                      sx={{
                        mx: 'auto',
                        width: '100%',
                        maxWidth:
                          exportPreviewMode === 'single'
                            ? 360
                            : exportLayoutPreview?.orientation === 'landscape'
                              ? 760
                              : 560,
                        aspectRatio:
                          exportPreviewMode === 'single'
                            ? '0.72'
                            : exportLayoutPreview?.orientation === 'landscape'
                              ? '1.414 / 1'
                              : '1 / 1.414',
                        bgcolor: '#fbf7ef',
                        borderRadius: 3,
                        border: '1px solid rgba(36,28,19,0.14)',
                        p: { xs: 2, sm: 3 },
                        display: 'flex',
                        alignItems: 'stretch',
                        justifyContent: 'center',
                      }}
                    >
                      {exportPreviewMode === 'single' ? (
                        <Box
                          sx={{
                            width: '100%',
                            maxWidth: 280,
                            borderRadius: 2.5,
                            border: '1px solid rgba(36,28,19,0.18)',
                            bgcolor: '#fffdf8',
                            p: 2,
                            display: 'grid',
                            gridTemplateRows: 'auto 1fr auto',
                            gap: 1.5,
                          }}
                        >
                          <Typography align="center" fontWeight={700}>
                            {previewCardLabels[0]}
                          </Typography>
                          <Box
                            sx={{
                              borderRadius: 2,
                              border: '1px dashed rgba(36,28,19,0.24)',
                              bgcolor: 'rgba(36,28,19,0.03)',
                              display: 'grid',
                              placeItems: 'center',
                              minHeight: 220,
                            }}
                          >
                            <Stack spacing={1} alignItems="center">
                              <Box
                                sx={{
                                  width: 96,
                                  height: 96,
                                  borderRadius: 2,
                                  border: '1px dashed rgba(36,28,19,0.24)',
                                  bgcolor: '#f6efe2',
                                  display: 'grid',
                                  placeItems: 'center',
                                }}
                              >
                                <Typography fontWeight={700}>QR</Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                App-QR-Code
                              </Typography>
                            </Stack>
                          </Box>
                          <Typography variant="body2" color="text.secondary" align="center">
                            Scannen in der App
                          </Typography>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            display: 'grid',
                            gridTemplateColumns: `repeat(${exportLayoutPreview?.columns ?? 1}, minmax(0, 1fr))`,
                            gap: 1.25,
                            alignContent: 'start',
                          }}
                        >
                          {previewCardLabels.map((label, index) => (
                            <Box
                              key={label}
                              sx={{
                                borderRadius: 2,
                                border: '1px solid rgba(36,28,19,0.14)',
                                bgcolor: '#fffdf8',
                                p: 1,
                                minHeight: 84,
                                display: 'grid',
                                placeItems: 'center',
                              }}
                            >
                              <Box
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: 1.5,
                                  border: '1px dashed rgba(36,28,19,0.2)',
                                  display: 'grid',
                                  placeItems: 'center',
                                  p: 1,
                                }}
                              >
                                <Typography variant="body2" fontWeight={700} align="center" sx={{ wordBreak: 'break-word' }}>
                                  {label || `#${index + 1}`}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      {previewPageLabel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {exportPreviewMode === 'single'
                        ? '1 Ticket in der Einzelansicht'
                        : `${previewCardsVisible} von ${previewTotalCards} Tickets auf dieser Seite`}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'none' }}>
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

          <Grid size={{ xs: 12, lg: 8 }} sx={{ display: 'none' }}>
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
        <Card>
          <Tabs
            value={moderationTab}
            onChange={handleModerationTabChange}
            variant="fullWidth"
            sx={{ px: { xs: 1, sm: 2 }, pt: 1 }}
          >
            <Tab value="users" label="Nutzer" />
            <Tab value="generators" label="Brennstoffzellen" />
          </Tabs>
          <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
            <Stack spacing={2}>
              {moderationStatus ? <Alert severity="success">{moderationStatus}</Alert> : null}
              {moderationError ? <Alert severity="error">{moderationError}</Alert> : null}

              {moderationLoading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Einträge werden geladen...</Typography>
                </Stack>
              ) : null}

              <TabPanel active={moderationTab} value="users">
                <Stack spacing={2}>
                  <TextField
                    label="Nutzer suchen"
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Name, E-Mail oder Rolle"
                    fullWidth
                  />
                  <List
                    disablePadding
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      bgcolor: 'background.default',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    {filteredModerationUsers.length ? (
                      filteredModerationUsers.map((user, index) => (
                        <ListItem
                          key={user.id}
                          divider={index < filteredModerationUsers.length - 1}
                          secondaryAction={
                            <IconButton edge="end" onClick={(event) => handleUserMenuOpen(event, user)}>
                              <MoreVertIcon />
                            </IconButton>
                          }
                          sx={{ py: 1.25 }}
                        >
                          <ListItemText
                            primary={user.name}
                            secondary={
                              user.generatorId
                                ? `${user.email} | ${user.role} | ${user.generatorId}`
                                : `${user.email} | ${user.role}`
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem sx={{ py: 2 }}>
                        <ListItemText
                          primary={moderationUsers.length ? 'Keine Treffer' : 'Noch keine Nutzer gefunden'}
                          secondary={
                            moderationUsers.length
                              ? 'Passe den Suchbegriff an, um weitere Nutzer zu sehen.'
                              : 'Registrierte Konten erscheinen hier automatisch.'
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Stack>
              </TabPanel>

              <TabPanel active={moderationTab} value="generators">
                <Stack spacing={2}>
                  <TextField
                    label="Brennstoffzellen suchen"
                    value={generatorSearch}
                    onChange={(event) => setGeneratorSearch(event.target.value)}
                    placeholder="Code, Anzeigename oder Owner UID"
                    fullWidth
                  />
                  <List
                    disablePadding
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      bgcolor: 'background.default',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    {filteredModerationGenerators.length ? (
                      filteredModerationGenerators.map((generator, index) => (
                        <ListItem
                          key={generator.id}
                          disablePadding
                          divider={index < filteredModerationGenerators.length - 1}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              onClick={(event) => handleGeneratorMenuOpen(event, generator)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          }
                        >
                          <ListItemButton onClick={() => void handleOpenGeneratorMeasurements(generator)}>
                            <ListItemText
                              primary={generator.ownerName?.trim() || generator.code}
                              secondary={
                                generator.ownerName?.trim()
                                  ? `${generator.code} | ${generator.ownerUid}`
                                  : generator.ownerUid
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))
                    ) : (
                      <ListItem sx={{ py: 2 }}>
                        <ListItemText
                          primary={
                            moderationGenerators.length
                              ? 'Keine Treffer'
                              : 'Noch keine Brennstoffzellen gefunden'
                          }
                          secondary={
                            moderationGenerators.length
                              ? 'Passe den Suchbegriff an, um weitere Brennstoffzellen zu sehen.'
                              : 'Sobald Brennstoffzellen angelegt sind, erscheinen sie hier.'
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Stack>
              </TabPanel>
            </Stack>
          </CardContent>
        </Card>
      </TabPanel>

      <Menu
        anchorEl={userMenuAnchorEl}
        open={Boolean(userMenuAnchorEl)}
        onClose={handleCloseUserMenu}
      >
        <MenuItem
          onClick={() => {
            if (menuUser) {
              handleOpenUserDialog(menuUser)
            }
          }}
        >
          Bearbeiten
        </MenuItem>
        <MenuItem onClick={() => void handlePromoteUserToAdmin()} disabled={menuUser?.role === 'admin'}>
          {menuUser?.role === 'admin' ? 'Bereits Admin' : 'Zum Admin machen'}
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={generatorMenuAnchorEl}
        open={Boolean(generatorMenuAnchorEl)}
        onClose={handleCloseGeneratorMenu}
      >
        <MenuItem
          onClick={() => {
            if (menuGenerator) {
              handleOpenGeneratorDialog(menuGenerator)
            }
          }}
        >
          Bearbeiten
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
                    <ListItem key={measurement.id} divider={index < generatorMeasurements.length - 1}>
                      <ListItemText
                        primary={formatMeasurement(measurement.value)}
                        secondary={`${measurement.enteredBy} | ${formatTimestamp(measurement.createdAt)}`}
                      />
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

    </Stack>
  )
}
