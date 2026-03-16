import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditNoteIcon from '@mui/icons-material/EditNote'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import SaveIcon from '@mui/icons-material/Save'
import SearchIcon from '@mui/icons-material/Search'
import ShowChartIcon from '@mui/icons-material/ShowChart'
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
  Divider,
  Grid,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  useEffect,
  useState,
  type ReactElement,
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
  setUserLifecycleStatusAsAdmin,
  subscribeToAuth,
  updateMeasurementAsAdmin,
  updateUserProfileAsAdmin,
} from '../../../shared/data/firebaseData'
import type {
  EntityLifecycleStatus,
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

interface ModerationListEntry {
  user: UserProfile
  generator: Generator | null
  status: EntityLifecycleStatus
}

interface MeasurementFormState {
  value: string
  enteredBy: string
}

type QrExportStepKey = 'count' | 'layout' | 'number' | 'export'

const adminTabItems: { value: AdminTabValue; label: string; icon: ReactElement }[] = [
  { value: 'scan', label: 'Scannen', icon: <QrCodeScannerIcon fontSize="small" /> },
  { value: 'qr', label: 'QR erstellen', icon: <QrCode2Icon fontSize="small" /> },
  { value: 'moderation', label: 'Moderieren', icon: <EditNoteIcon fontSize="small" /> },
]

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

function getModerationEntryStatus(
  user: Pick<UserProfile, 'status'>,
  generator: Pick<Generator, 'status'> | null,
): EntityLifecycleStatus {
  if (user.status === 'deleted' || generator?.status === 'deleted') {
    return 'deleted'
  }

  if (user.status === 'blocked' || generator?.status === 'blocked') {
    return 'blocked'
  }

  return 'active'
}

function getLifecycleStatusLabel(status: Exclude<EntityLifecycleStatus, 'active'>) {
  return status === 'blocked' ? 'Gesperrt' : 'Gelöscht'
}

function isAdminTabValue(value: string | undefined): value is AdminTabValue {
  return value === 'qr' || value === 'scan' || value === 'moderation'
}

export function AdminPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobileViewport = useMediaQuery(theme.breakpoints.down('sm'))
  const params = useParams()
  const routeCode = formatCode(params.code ?? '')
  const routeTab = params.tab
  const activeTab: AdminTabValue = isAdminTabValue(routeTab)
    ? routeTab
    : routeCode
      ? 'scan'
      : 'scan'

  const [authUserId, setAuthUserId] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

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
  const [moderationSearchOpen, setModerationSearchOpen] = useState(false)
  const [mobileAdminNavOpen, setMobileAdminNavOpen] = useState(false)
  const [trashMenuAnchorEl, setTrashMenuAnchorEl] = useState<HTMLElement | null>(null)
  const [trashDialogOpen, setTrashDialogOpen] = useState(false)
  const [moderationMenuAnchorEl, setModerationMenuAnchorEl] = useState<HTMLElement | null>(null)
  const [menuUser, setMenuUser] = useState<UserProfile | null>(null)
  const [menuGenerator, setMenuGenerator] = useState<Generator | null>(null)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [userDangerOpen, setUserDangerOpen] = useState(false)
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
  const [userForm, setUserForm] = useState<UserFormState>(createEmptyUserForm)
  const [userLifecycleActionLoading, setUserLifecycleActionLoading] = useState<
    '' | Exclude<EntityLifecycleStatus, 'active'>
  >('')

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

    setScanCode(routeCode)
  }, [routeCode])

  useEffect(() => {
    if (routeCode) {
      if (routeTab !== 'scan') {
        navigate(`/admin/scan/generator/${routeCode}`, { replace: true })
      }
      return
    }

    if (!isAdminTabValue(routeTab)) {
      navigate(`/admin/${activeTab}`, { replace: true })
    }
  }, [activeTab, navigate, routeCode, routeTab])

  useEffect(() => {
    if (activeTab !== 'moderation') {
      return
    }

    void loadModerationEntries()
  }, [activeTab])

  useEffect(() => {
    setMobileAdminNavOpen(false)
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

  function navigateToAdminTab(value: AdminTabValue) {
    setMobileAdminNavOpen(false)

    if (value === activeTab && !(value === 'scan' && routeCode)) {
      return
    }

    if (value === 'scan' && routeCode) {
      navigate(`/admin/scan/generator/${routeCode}`)
      return
    }

    navigate(`/admin/${value}`)
  }

  function handleAdminTabChange(_event: SyntheticEvent, value: AdminTabValue) {
    navigateToAdminTab(value)
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
    setScanCode(code)
    setScanError('')
    setScanStatus(`QR-Code erkannt: ${code}`)
    navigate(`/admin/scan/generator/${code}`)
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
      status: getModerationEntryStatus(user, linkedGenerator),
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
      user.status ?? 'active',
      user.generatorId ?? '',
      generator?.code ?? '',
      generator?.ownerUid ?? '',
      generator?.ownerName ?? '',
      generator?.status ?? 'active',
    ]
      .join(' ')
      .toLocaleLowerCase('de-DE')
    return haystack.includes(normalizedModerationSearch)
  })
  const activeModerationEntries = filteredModerationEntries.filter((entry) => entry.status === 'active')
  const trashedModerationEntries = filteredModerationEntries.filter((entry) => entry.status !== 'active')
  const editingUserGenerator =
    editingUser
      ? moderationEntries.find((entry) => entry.user.id === editingUser.id)?.generator ?? null
      : null

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

  function handleOpenTrashMenu(event: MouseEvent<HTMLElement>) {
    setTrashMenuAnchorEl(event.currentTarget)
  }

  function handleCloseTrashMenu() {
    setTrashMenuAnchorEl(null)
  }

  function handleOpenTrashDialog() {
    setTrashDialogOpen(true)
    handleCloseTrashMenu()
  }

  function handleCloseTrashDialog() {
    setTrashDialogOpen(false)
  }

  function handleOpenUserDialog(user: UserProfile) {
    setModerationStatus('')
    setModerationError('')
    setUserDangerOpen(false)
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
    setUserDangerOpen(false)
    setEditingUser(null)
    setUserForm(createEmptyUserForm())
    setUserLifecycleActionLoading('')
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

  async function handleUserLifecycleAction(status: Exclude<EntityLifecycleStatus, 'active'>) {
    if (!editingUser || userLifecycleActionLoading) {
      return
    }

    const actionLabel = status === 'blocked' ? 'sperren' : 'löschen'
    const confirmed = window.confirm(
      `Nutzer ${editingUser.name} wirklich ${actionLabel}? Der Eintrag wandert in den Papierkorb und die Messwerte werden nicht mehr normal angezeigt.`,
    )

    if (!confirmed) {
      return
    }

    setUserLifecycleActionLoading(status)
    setModerationStatus('')
    setModerationError('')

    try {
      const linkedEntry = moderationEntries.find((entry) => entry.user.id === editingUser.id)
      await setUserLifecycleStatusAsAdmin(editingUser, status)
      await loadModerationEntries()

      if (selectedMeasurementGenerator?.id === linkedEntry?.generator?.id) {
        handleCloseGeneratorMeasurementsDialog()
      }

      setModerationStatus(
        `${editingUser.name} wurde ${status === 'blocked' ? 'gesperrt' : 'gelöscht'} und in den Papierkorb verschoben.`,
      )
      handleCloseUserDialog()
    } catch (actionIssue) {
      setModerationError(
        actionIssue instanceof Error
          ? actionIssue.message
          : 'Der Nutzerstatus konnte nicht aktualisiert werden.',
      )
    } finally {
      setUserLifecycleActionLoading('')
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

  function renderModerationList(
    entries: ModerationListEntry[],
    options: {
      ariaLabel: string
      emptyPrimary: string
      emptySecondary?: string
      showStatus?: boolean
    },
  ) {
    return renderModerationCards(entries, options)

    return (
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
            gridTemplateColumns: options.showStatus
              ? 'minmax(0, 1.2fr) minmax(110px, 140px) minmax(100px, 120px)'
              : 'minmax(0, 1.4fr) minmax(110px, 140px)',
            gap: 2,
            px: 2,
            py: 1.25,
            pr: 7,
            bgcolor: 'rgba(36,28,19,0.05)',
            borderBottom: entries.length ? (theme) => `1px solid ${theme.palette.divider}` : 'none',
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            Nutzer
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            Code
          </Typography>
          {options.showStatus ? (
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Status
            </Typography>
          ) : null}
        </Box>
        <List disablePadding aria-label={options.ariaLabel}>
          {entries.length ? (
            entries.map(({ user, generator, status }, index) => (
              <ListItem
                key={user.id}
                disablePadding
                divider={index < entries.length - 1}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleModerationMenuOpen(event, user, generator)
                    }}
                    aria-label={`Aktionen für ${user.name}`}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 1.75,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      bgcolor: 'rgba(255,255,255,0.72)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.96)',
                      },
                      '&:focus-visible': {
                        outline: '2px solid rgba(143,122,81,0.55)',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemButton
                  disabled={!generator}
                  aria-label={
                    generator
                      ? `Messwerte von ${user.name} mit Code ${generator.code.toUpperCase()} öffnen`
                      : `${user.name} hat keine verknüpfte Brennstoffzelle`
                  }
                  onClick={() => {
                    if (generator) {
                      void handleOpenGeneratorMeasurements(generator)
                    }
                  }}
                  sx={{
                    px: 2,
                    py: 1.5,
                    pr: 7,
                    alignItems: 'stretch',
                    '&.Mui-disabled': {
                      opacity: 1,
                      cursor: 'default',
                    },
                    '&:hover': {
                      bgcolor: generator ? 'rgba(255,255,255,0.22)' : 'transparent',
                    },
                    '&:focus-visible': {
                      outline: '2px solid rgba(143,122,81,0.55)',
                      outlineOffset: -2,
                      bgcolor: 'rgba(255,255,255,0.22)',
                    },
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box
                      sx={{
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: options.showStatus
                            ? 'minmax(0, 1.2fr) minmax(110px, 140px) minmax(100px, 120px)'
                            : 'minmax(0, 1.4fr) minmax(110px, 140px)',
                        },
                        gap: { xs: 0.75, sm: 2 },
                        alignItems: 'center',
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
                          {status !== 'active' ? (
                            <Chip
                              size="small"
                              label={getLifecycleStatusLabel(status)}
                              color={status === 'blocked' ? 'warning' : 'default'}
                              sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                            />
                          ) : null}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: '"Consolas", "Courier New", monospace',
                            fontWeight: 700,
                          }}
                        >
                          {generator ? generator.code.toUpperCase() : '-'}
                        </Typography>
                      </Box>
                      {options.showStatus ? (
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                          {status !== 'active' ? (
                            <Chip
                              size="small"
                              label={getLifecycleStatusLabel(status)}
                              color={status === 'blocked' ? 'warning' : 'default'}
                            />
                          ) : null}
                        </Box>
                      ) : null}
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))
          ) : (
            <ListItem sx={{ py: 2 }}>
              <ListItemText
                primary={options.emptyPrimary}
                secondary={options.emptySecondary}
              />
            </ListItem>
          )}
        </List>
      </Box>
    )
  }

  function renderModerationCards(
    entries: ModerationListEntry[],
    options: {
      ariaLabel: string
      emptyPrimary: string
      emptySecondary?: string
      showStatus?: boolean
    },
  ) {
    return (
      <Box
        sx={{
          borderRadius: 2.5,
          overflow: 'hidden',
          border: '1px solid rgba(121,101,66,0.14)',
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', sm: 'grid' },
            gridTemplateColumns: options.showStatus
              ? 'minmax(0, 1.2fr) 124px 112px'
              : 'minmax(0, 1.4fr) 124px',
            gap: 1.5,
            px: 2,
            py: 1,
            pr: 6,
            borderBottom: entries.length ? '1px solid rgba(121,101,66,0.1)' : 'none',
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em' }}>
            Nutzer
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em' }}>
            Code
          </Typography>
          {options.showStatus ? (
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em' }}>
              Status
            </Typography>
          ) : null}
        </Box>
        <List disablePadding aria-label={options.ariaLabel}>
          {entries.length ? (
            entries.map(({ user, generator, status }, index) => (
              <ListItem
                key={user.id}
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleModerationMenuOpen(event, user, generator)
                    }}
                    aria-label={`Aktionen für ${user.name}`}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.75,
                      color: 'rgba(110,103,95,0.92)',
                      '&:hover': {
                        bgcolor: 'rgba(121,101,66,0.08)',
                      },
                      '&:focus-visible': {
                        outline: '2px solid rgba(143,122,81,0.55)',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                }
                sx={{
                  borderBottom: index < entries.length - 1 ? '1px solid rgba(121,101,66,0.1)' : 'none',
                }}
              >
                <ListItemButton
                  disabled={!generator}
                  aria-label={
                    generator
                      ? `Messwerte von ${user.name} mit Code ${generator.code.toUpperCase()} öffnen`
                      : `${user.name} hat keine verknüpfte Brennstoffzelle`
                  }
                  onClick={() => {
                    if (generator) {
                      void handleOpenGeneratorMeasurements(generator)
                    }
                  }}
                  sx={{
                    px: { xs: 1.5, sm: 1.75 },
                    py: 1.3,
                    pr: 6,
                    alignItems: 'center',
                    borderRadius: 0,
                    '&.Mui-disabled': {
                      opacity: 1,
                      cursor: 'default',
                    },
                    '&:hover': {
                      bgcolor: generator ? 'rgba(255,255,255,0.34)' : 'transparent',
                    },
                    '&:focus-visible': {
                      outline: '2px solid rgba(143,122,81,0.55)',
                      outlineOffset: -2,
                      bgcolor: 'rgba(255,255,255,0.34)',
                    },
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box
                      sx={{
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: options.showStatus
                            ? 'minmax(0, 1.2fr) 124px 112px'
                            : 'minmax(0, 1.4fr) 124px',
                        },
                        gap: { xs: 1, sm: 1.5 },
                        alignItems: 'center',
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
                          {status !== 'active' ? (
                            <Chip
                              size="small"
                              label={getLifecycleStatusLabel(status)}
                              color={status === 'blocked' ? 'warning' : 'default'}
                              sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                            />
                          ) : null}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                      <Box sx={{ minWidth: 0, justifySelf: 'start', width: '100%' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: '"Consolas", "Courier New", monospace',
                            fontWeight: 700,
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap',
                            textAlign: 'left',
                          }}
                        >
                          {generator ? generator.code.toUpperCase() : '-'}
                        </Typography>
                      </Box>
                      {options.showStatus ? (
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                          {status !== 'active' ? (
                            <Chip
                              size="small"
                              label={getLifecycleStatusLabel(status)}
                              color={status === 'blocked' ? 'warning' : 'default'}
                            />
                          ) : null}
                        </Box>
                      ) : null}
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))
          ) : (
            <ListItem sx={{ px: 1, py: 1 }}>
              <ListItemText primary={options.emptyPrimary} secondary={options.emptySecondary} />
            </ListItem>
          )}
        </List>
      </Box>
    )
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

  const activeAdminTabItem =
    adminTabItems.find((item) => item.value === activeTab) ?? adminTabItems[0]

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }}>
      <Card>
        {isMobileViewport ? (
          <Box sx={{ p: 1.25 }}>
            <Stack spacing={1}>
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                onClick={() => setMobileAdminNavOpen((current) => !current)}
                endIcon={
                  <ExpandMoreIcon
                    sx={{
                      transform: mobileAdminNavOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 180ms ease',
                    }}
                  />
                }
                sx={{
                  justifyContent: 'space-between',
                  px: 1.5,
                  py: 1.15,
                  borderRadius: 999,
                  borderColor: 'rgba(61,177,236,0.38)',
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                  {activeAdminTabItem.icon}
                  <Typography fontWeight={700} noWrap>
                    {activeAdminTabItem.label}
                  </Typography>
                </Stack>
              </Button>
              <Collapse in={mobileAdminNavOpen}>
                <Box
                  sx={{
                    borderRadius: 4,
                    border: '1px solid rgba(121,101,66,0.14)',
                    overflow: 'hidden',
                    bgcolor: 'rgba(255,255,255,0.82)',
                  }}
                >
                  <List disablePadding>
                    {adminTabItems.map((item, index) => (
                      <ListItemButton
                        key={item.value}
                        selected={item.value === activeTab}
                        onClick={() => navigateToAdminTab(item.value)}
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderBottom:
                            index < adminTabItems.length - 1 ? '1px solid rgba(121,101,66,0.08)' : 'none',
                          '&.Mui-selected': {
                            bgcolor: 'rgba(61,177,236,0.08)',
                            borderRight: '3px solid #0B6E69',
                          },
                          '&.Mui-selected:hover': {
                            bgcolor: 'rgba(61,177,236,0.12)',
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                          {item.icon}
                          <Typography fontWeight={item.value === activeTab ? 700 : 600} noWrap>
                            {item.label}
                          </Typography>
                        </Stack>
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              </Collapse>
            </Stack>
          </Box>
        ) : (
          <Tabs
            value={activeTab}
            onChange={handleAdminTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: { xs: 1, sm: 2 }, pt: 1 }}
          >
            {adminTabItems.map((item) => (
              <Tab
                key={item.value}
                value={item.value}
                label={item.label}
                icon={item.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        )}
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

              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: moderationSearchOpen ? 1 : '0 0 58px',
                    width: moderationSearchOpen ? 'auto' : 58,
                    height: 54,
                    minWidth: 0,
                    border: '1px solid',
                    borderColor: moderationSearchOpen ? 'rgba(11,110,105,0.46)' : 'rgba(121,101,66,0.18)',
                    borderRadius: 999,
                    bgcolor: 'rgba(255,255,255,0.92)',
                    overflow: 'hidden',
                    boxShadow: moderationSearchOpen ? '0 10px 24px rgba(36,28,19,0.08)' : '0 2px 8px rgba(36,28,19,0.04)',
                    transition:
                      'flex-basis 240ms ease, width 240ms ease, border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
                  }}
                >
                  <IconButton
                    aria-label={moderationSearchOpen ? 'Suche einklappen' : 'Suche ausklappen'}
                    onClick={() => {
                      setModerationSearchOpen((current) => !current)
                    }}
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 999,
                      ml: 0.25,
                      color: moderationSearchOpen ? '#0B6E69' : 'rgba(110,103,95,0.92)',
                      flexShrink: 0,
                      transition: 'color 180ms ease, background-color 180ms ease',
                      '&:hover': {
                        bgcolor: 'rgba(11,110,105,0.08)',
                      },
                    }}
                  >
                    <SearchIcon sx={{ fontSize: 30 }} />
                  </IconButton>
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      opacity: moderationSearchOpen ? 1 : 0,
                      maxWidth: moderationSearchOpen ? '100%' : 0,
                      transform: moderationSearchOpen ? 'translateX(0)' : 'translateX(-10px)',
                      transition: 'max-width 240ms ease, opacity 180ms ease, transform 220ms ease',
                      pointerEvents: moderationSearchOpen ? 'auto' : 'none',
                      overflow: 'hidden',
                    }}
                  >
                    <InputBase
                      value={moderationSearch}
                      onChange={(event) => setModerationSearch(event.target.value)}
                      placeholder="Suche"
                      inputProps={{ 'aria-label': 'Suchen' }}
                      sx={{
                        width: '100%',
                        color: 'rgba(60,48,33,0.96)',
                        fontSize: '1.05rem',
                        px: 0.5,
                        py: 1.2,
                        '& input::placeholder': {
                          color: 'rgba(110,103,95,0.9)',
                          opacity: 1,
                        },
                      }}
                    />
                  </Box>
                  <IconButton
                    aria-label={moderationSearch ? 'Suche leeren' : 'Suche einklappen'}
                    size="small"
                    onClick={() => {
                      if (moderationSearch) {
                        setModerationSearch('')
                        return
                      }

                      setModerationSearchOpen(false)
                    }}
                    sx={{
                      mr: 0.75,
                      color: 'rgba(110,103,95,0.9)',
                      opacity: moderationSearchOpen ? 1 : 0,
                      pointerEvents: moderationSearchOpen ? 'auto' : 'none',
                      transition: 'opacity 180ms ease, color 180ms ease',
                      '&:hover': {
                        bgcolor: 'rgba(121,101,66,0.08)',
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                <IconButton
                  aria-label={`Weitere Aktionen${trashedModerationEntries.length ? ` (${trashedModerationEntries.length})` : ''}`}
                  onClick={handleOpenTrashMenu}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.25,
                    flexShrink: 0,
                    color: 'rgba(110,103,95,0.92)',
                    '&:hover': {
                      bgcolor: 'rgba(121,101,66,0.08)',
                    },
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Box
                sx={{
                  borderRadius: 2.5,
                  overflow: 'hidden',
                  border: '1px solid rgba(121,101,66,0.14)',
                }}
              >
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'grid' },
                    gridTemplateColumns: 'minmax(0, 1.4fr) 124px',
                    gap: 1.5,
                    px: 2,
                    py: 1,
                    pr: 6,
                    borderBottom: activeModerationEntries.length
                      ? '1px solid rgba(121,101,66,0.1)'
                      : 'none',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em' }}>
                    Nutzer
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em' }}>
                    Code
                  </Typography>
                </Box>
                <List disablePadding aria-label="Moderationsliste">
                  {activeModerationEntries.length ? (
                    activeModerationEntries.map(({ user, generator }, index) => (
                      <ListItem
                        key={user.id}
                        disablePadding
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleModerationMenuOpen(event, user, generator)
                            }}
                            aria-label={`Aktionen für ${user.name}`}
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 1.75,
                              color: 'rgba(110,103,95,0.92)',
                              '&:hover': {
                                bgcolor: 'rgba(121,101,66,0.08)',
                              },
                              '&:focus-visible': {
                                outline: '2px solid rgba(143,122,81,0.55)',
                                outlineOffset: 2,
                              },
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        }
                        sx={{
                          borderBottom:
                            index < activeModerationEntries.length - 1
                              ? '1px solid rgba(121,101,66,0.1)'
                              : 'none',
                        }}
                      >
                        <ListItemButton
                          disabled={!generator}
                          aria-label={
                            generator
                              ? `Messwerte von ${user.name} mit Code ${generator.code.toUpperCase()} öffnen`
                              : `${user.name} hat keine verknüpfte Brennstoffzelle`
                          }
                          onClick={() => {
                            if (generator) {
                              void handleOpenGeneratorMeasurements(generator)
                            }
                          }}
                          sx={{
                            px: { xs: 1.5, sm: 1.75 },
                            py: 1.3,
                            pr: 6,
                            alignItems: 'center',
                            borderRadius: 0,
                            '&.Mui-disabled': {
                              opacity: 1,
                              cursor: 'default',
                            },
                            '&:hover': {
                              bgcolor: generator ? 'rgba(255,255,255,0.34)' : 'transparent',
                            },
                            '&:focus-visible': {
                              outline: '2px solid rgba(143,122,81,0.55)',
                              outlineOffset: -2,
                              bgcolor: 'rgba(255,255,255,0.34)',
                            },
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Box
                              sx={{
                                width: '100%',
                                display: 'grid',
                                gridTemplateColumns: {
                                  xs: '1fr',
                                  sm: 'minmax(0, 1.4fr) 124px',
                                },
                                gap: { xs: 1, sm: 1.5 },
                                alignItems: 'center',
                              }}
                            >
                              <Box sx={{ minWidth: 0 }}>
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}
                                >
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
                              <Box sx={{ minWidth: 0, justifySelf: 'start', width: '100%' }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: '"Consolas", "Courier New", monospace',
                                    fontWeight: 700,
                                    letterSpacing: '0.03em',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'left',
                                  }}
                                >
                                  {generator ? generator.code.toUpperCase() : '-'}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </ListItemButton>
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
        anchorEl={trashMenuAnchorEl}
        open={Boolean(trashMenuAnchorEl)}
        onClose={handleCloseTrashMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 210,
            overflow: 'hidden',
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: '0 22px 44px rgba(36,28,19,0.16)',
          },
        }}
      >
        <MenuItem onClick={handleOpenTrashDialog} sx={{ gap: 1.25 }}>
          <DeleteOutlineOutlinedIcon fontSize="small" />
          {trashedModerationEntries.length
            ? `Papierkorb (${trashedModerationEntries.length})`
            : 'Papierkorb'}
        </MenuItem>
      </Menu>

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
              void handleOpenGeneratorMeasurements(menuGenerator)
              handleCloseModerationMenu()
            }
          }}
          disabled={!menuGenerator}
          sx={{ gap: 1.25, borderRadius: 2, mx: 0.5, my: 0.25 }}
        >
          <ShowChartIcon fontSize="small" />
          Messwerte
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
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
                InputLabelProps={{ shrink: true }}
                value={editingUserGenerator?.code ?? 'Keine'}
                disabled
                fullWidth
              />
              <Box>
                <Button
                  type="button"
                  color="inherit"
                  endIcon={
                    <ExpandMoreIcon
                      sx={{
                        transform: userDangerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 160ms ease',
                      }}
                    />
                  }
                  onClick={() => setUserDangerOpen((current) => !current)}
                  sx={{ px: 0, minWidth: 0 }}
                >
                  Sperren / Loeschen
                </Button>
                <Collapse in={userDangerOpen}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ pt: 1.25 }}>
                    <Button
                      type="button"
                      onClick={() => void handleUserLifecycleAction('blocked')}
                      disabled={Boolean(userLifecycleActionLoading) || editingUser?.status === 'blocked'}
                    >
                      {userLifecycleActionLoading === 'blocked'
                        ? 'Sperren...'
                        : editingUser?.status === 'blocked'
                          ? 'Gesperrt'
                          : 'Sperren'}
                    </Button>
                    <Button
                      type="button"
                      color="error"
                      onClick={() => void handleUserLifecycleAction('deleted')}
                      disabled={Boolean(userLifecycleActionLoading) || editingUser?.status === 'deleted'}
                    >
                      {userLifecycleActionLoading === 'deleted'
                        ? 'Loeschen...'
                        : editingUser?.status === 'deleted'
                          ? 'Geloescht'
                          : 'Loeschen'}
                    </Button>
                  </Stack>
                </Collapse>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUserDialog} disabled={Boolean(userLifecycleActionLoading)}>
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={Boolean(userLifecycleActionLoading)}
            >
              Speichern
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={trashDialogOpen} onClose={handleCloseTrashDialog} fullWidth maxWidth="md">
        <DialogTitle>Papierkorb</DialogTitle>
        <DialogContent>
          {renderModerationList(trashedModerationEntries, {
            ariaLabel: 'Papierkorb',
            emptyPrimary: 'Papierkorb leer',
            emptySecondary: 'Gesperrte oder gelöschte Nutzer erscheinen hier.',
            showStatus: true,
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTrashDialog}>Schließen</Button>
        </DialogActions>
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
