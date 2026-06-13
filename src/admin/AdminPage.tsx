import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type SyntheticEvent,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminNavigation } from './AdminNavigation'
import { AdminQrSection } from './createQr/AdminQrSection'
import { AdminScanSection } from './scan/AdminScanSection'
import { AdminModerationSection } from './moderate/AdminModerationSection'
import { ModerationMenus } from './moderate/ModerationMenus'
import { EditUserDialog } from './createQr/EditUserDialog'
import { BlockedDialog } from './moderate/BlockedDialog'
import { TrashDialog } from './moderate/TrashDialog'
import { GeneratorMeasurementsDialog } from './createQr/GeneratorMeasurementsDialog'
import { ScanMeasurementDialog } from './createQr/ScanMeasurementDialog'
import { MeasurementFormDialog } from './createQr/MeasurementFormDialog'
import { AuthCard } from '../common/AuthCard'
import { useAppSnackbar } from '../common/AppSnackbarContext'
import { QrScannerDialog } from '../common/qr/QrScannerDialog'
import { formatCode, formatDecimalInput, parseDecimalInput } from '../common/format'
import {
  buildGeneratorQrValue,
  downloadQrPdf,
  extractGeneratorCodeFromQrValue,
  getQrPdfLayoutPreview,
} from '../common/qr/qr'
import type { QrPdfPageSize } from '../common/qr/qr'
import {
  addMeasurementByCode,
  getGeneratorByCode,
  getMeasurementsForAdmin,
  getNextGeneratorCodePreview,
  getRecentMeasurementsEnteredBy,
  getUserProfile,
  listGeneratorsForAdmin,
  listUserProfilesForAdmin,
  login,
  logout,
  reserveNextGeneratorCodes,
  setUserLifecycleStatusAsAdmin,
  signInWithGoogle,
  subscribeToAuth,
  updateMeasurementAsAdmin,
  updateUserProfileAsAdmin,
} from '../data/firebaseData'
import type { AdminRecentMeasurementItem } from '../data/firebaseData'
import type {
  EntityLifecycleStatus,
  Generator,
  Measurement,
  UserProfile,
} from '../data/domain'
import type {
  AdminTabValue,
  MeasurementFormState,
  MeasurementUnit,
  ModerationListEntry,
  QrExportStepKey,
  UserFormState,
} from './types'
import { formatMutedDecimal, formatScientificVolts, getGeneratorScanError } from './utils'

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

function isAdminTabValue(value: string | undefined): value is AdminTabValue {
  return value === 'qr' || value === 'scan' || value === 'moderation'
}

const SCAN_RESULT_SUPPRESSION_MS = 5000

export function AdminPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobileViewport = useMediaQuery(theme.breakpoints.down('sm'))
  const params = useParams()
  const routeCode = formatCode(params.code ?? '')
  const routeTab = params.tab
  const activeTab: AdminTabValue = isAdminTabValue(routeTab) ? routeTab : 'scan'
  const { showSnackbar } = useAppSnackbar()

  const [authUserId, setAuthUserId] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoadedForUid, setProfileLoadedForUid] = useState('')
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
  const [scanMeasurementInput, setScanMeasurementInput] = useState('1,42')
  const [scanMeasurementUnit, setScanMeasurementUnit] = useState<MeasurementUnit>('V')
  const [scanMeasurementDateTime, setScanMeasurementDateTime] = useState(
    getCurrentDateTimeInputValue,
  )
  const [scanMeasurementSaving, setScanMeasurementSaving] = useState(false)
  const [scanMeasurementError, setScanMeasurementError] = useState('')
  const [recentMeasurements, setRecentMeasurements] = useState<AdminRecentMeasurementItem[]>([])
  const [editingRecentMeasurement, setEditingRecentMeasurement] =
    useState<AdminRecentMeasurementItem | null>(null)
  const [recentMeasurementForm, setRecentMeasurementForm] = useState<MeasurementFormState>(
    createEmptyMeasurementForm,
  )
  const [recentMeasurementUnit, setRecentMeasurementUnit] = useState<MeasurementUnit>('V')
  const [recentMeasurementSaving, setRecentMeasurementSaving] = useState(false)
  const [recentMeasurementError, setRecentMeasurementError] = useState('')

  const [moderationUsers, setModerationUsers] = useState<UserProfile[]>([])
  const [moderationGenerators, setModerationGenerators] = useState<Generator[]>([])
  const [moderationLoading, setModerationLoading] = useState(false)
  const [moderationStatus, setModerationStatus] = useState('')
  const [moderationError, setModerationError] = useState('')
  const [moderationSearch, setModerationSearch] = useState('')
  const [moderationSearchOpen, setModerationSearchOpen] = useState(false)
  const [mobileAdminNavOpen, setMobileAdminNavOpen] = useState(false)
  const [trashMenuAnchorEl, setTrashMenuAnchorEl] = useState<HTMLElement | null>(null)
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false)
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
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null)
  const [measurementForm, setMeasurementForm] = useState<MeasurementFormState>(
    createEmptyMeasurementForm,
  )
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('V')
  const [measurementSaving, setMeasurementSaving] = useState(false)
  const [measurementError, setMeasurementError] = useState('')
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [userForm, setUserForm] = useState<UserFormState>(createEmptyUserForm)
  const [userLifecycleActionLoading, setUserLifecycleActionLoading] = useState<
    '' | EntityLifecycleStatus
  >('')

  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  })
  const lastHandledScanRef = useRef<{ code: string; timestamp: number }>({
    code: '',
    timestamp: 0,
  })

  useEffect(() => {
    if (!exportStatus.trim()) {
      return
    }

    showSnackbar({ message: exportStatus, severity: 'success' })
  }, [exportStatus, showSnackbar])

  useEffect(() => {
    if (!exportError.trim()) {
      return
    }

    showSnackbar({ message: exportError, severity: 'error' })
  }, [exportError, showSnackbar])

  useEffect(() => {
    if (!scanStatus.trim()) {
      return
    }

    showSnackbar({ message: scanStatus, severity: 'success' })
  }, [scanStatus, showSnackbar])

  useEffect(() => {
    if (!scanError.trim()) {
      return
    }

    showSnackbar({ message: scanError, severity: 'error' })
  }, [scanError, showSnackbar])

  useEffect(() => {
    if (!moderationStatus.trim()) {
      return
    }

    showSnackbar({ message: moderationStatus, severity: 'success' })
  }, [moderationStatus, showSnackbar])

  useEffect(() => {
    if (!moderationError.trim()) {
      return
    }

    showSnackbar({ message: moderationError, severity: 'error' })
  }, [moderationError, showSnackbar])

  useEffect(() => {
    return subscribeToAuth((user) => {
      setAuthUserId(user?.uid ?? '')
    })
  }, [])

  useEffect(() => {
    if (!authUserId) {
      setProfile(null)
      setProfileLoadedForUid('')
      return
    }

    let active = true

    void getUserProfile(authUserId)
      .then((nextProfile) => {
        if (!active) {
          return
        }

        setProfile(nextProfile)
        setProfileLoadedForUid(authUserId)
      })
      .catch(() => {
        if (!active) {
          return
        }

        setProfile(null)
        setProfileLoadedForUid(authUserId)
      })

    return () => {
      active = false
    }
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
    if (activeTab !== 'moderation' || profile?.role !== 'admin') {
      return
    }

    void loadModerationEntries()
  }, [activeTab, profile?.role])

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

  useEffect(() => {
    const enteredBy = profile?.email?.trim() || authUserId

    if (activeTab !== 'scan' || profile?.role !== 'admin' || !enteredBy) {
      return
    }

    void loadRecentMeasurements(enteredBy)
  }, [activeTab, authUserId, profile?.email, profile?.role])

  const parsedExportCount = Number.parseInt(exportCount, 10)
  const requestedQrSize = parseDecimalInput(exportQrSize)
  const parsedExportDigits = Number.parseInt(exportDigits, 10)
  const parsedScanMeasurementInput = parseDecimalInput(scanMeasurementInput)
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

  const previewTotalCards =
    Number.isFinite(parsedExportCount) && parsedExportCount > 0 ? parsedExportCount : 1

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
  const blockedModerationEntries = filteredModerationEntries.filter((entry) => entry.status === 'blocked')
  const trashedModerationEntries = filteredModerationEntries.filter((entry) => entry.status === 'deleted')
  const editingUserGenerator =
    editingUser
      ? moderationEntries.find((entry) => entry.user.id === editingUser.id)?.generator ?? null
      : null

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
      const qrSizeMm = parseDecimalInput(exportQrSize)
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
    setScanMeasurementInput('1,42')
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

    if (scanMeasurementDialogOpen) {
      return
    }

    const now = Date.now()
    const lastHandled = lastHandledScanRef.current

    if (
      lastHandled.code === code &&
      now - lastHandled.timestamp < SCAN_RESULT_SUPPRESSION_MS
    ) {
      return
    }

    const foundGenerator = await getGeneratorByCode(code, { includeInactive: true })

    setScanCode(code)
    setScanError('')
    navigate(`/admin/scan/generator/${code}`)

    if (!foundGenerator) {
      setScanStatus('')
      showSnackbar({
        message: `Code ${code.toUpperCase()} ist noch nicht verknüpft.`,
        severity: 'info',
        autoHideDuration: 4500,
      })
      setScanMeasurementDialogOpen(false)
      setScanMeasurementCodeLocked(false)
      lastHandledScanRef.current = { code, timestamp: now }
      return
    }

    const scanIssue = getGeneratorScanError(code, foundGenerator.status)

    if (scanIssue) {
      throw new Error(scanIssue)
    }

    setScanStatus(`QR-Code erkannt: ${code}`)
    openScanMeasurementDialog(code, true)
    lastHandledScanRef.current = { code, timestamp: now }
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

      const numericValue = parseDecimalInput(scanMeasurementInput)

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
        loadIssue instanceof Error ? loadIssue.message : 'Die Liste konnte nicht geladen werden.',
      )
    } finally {
      setModerationLoading(false)
    }
  }

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

  function handleOpenBlockedDialog() {
    setBlockedDialogOpen(true)
    handleCloseTrashMenu()
  }

  function handleCloseBlockedDialog() {
    setBlockedDialogOpen(false)
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

  async function handleUserLifecycleAction(status: EntityLifecycleStatus) {
    if (!editingUser || userLifecycleActionLoading) {
      return
    }

    const actionLabel =
      status === 'active' ? 'wiederherstellen' : status === 'blocked' ? 'sperren' : 'löschen'
    const successMessage =
      status === 'active'
        ? `${editingUser.name} wurde wiederhergestellt.`
        : status === 'blocked'
          ? `${editingUser.name} wurde gesperrt und in die Sektion "Gesperrt" verschoben.`
          : `${editingUser.name} wurde gelöscht und in den Papierkorb verschoben.`
    const confirmed = window.confirm(
      status === 'active'
        ? `Nutzer ${editingUser.name} wirklich ${actionLabel}?`
        : `Nutzer ${editingUser.name} wirklich ${actionLabel}? Die Messwerte werden nicht mehr normal angezeigt.`,
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

      setModerationStatus(successMessage)
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
    return measurements
  }

  async function handleOpenGeneratorMeasurements(generator: Generator, initialMeasurementId?: string) {
    setModerationStatus('')
    setModerationError('')
    setMeasurementError('')
    setEditingMeasurement(null)
    setMeasurementForm(createEmptyMeasurementForm())
    setSelectedMeasurementGenerator(generator)
    setGeneratorMeasurements([])
    setGeneratorMeasurementsLoading(true)
    setGeneratorMeasurementsDialogOpen(true)

    try {
      const measurements = await loadGeneratorMeasurements(generator.id)

      if (initialMeasurementId) {
        const initialMeasurement = measurements.find((measurement) => measurement.id === initialMeasurementId)

        if (initialMeasurement) {
          handleOpenMeasurementEditor(initialMeasurement)
        }
      }
    } catch (loadIssue) {
      setModerationError(
        loadIssue instanceof Error ? loadIssue.message : 'Messwerte konnten nicht geladen werden.',
      )
    } finally {
      setGeneratorMeasurementsLoading(false)
    }
  }

  function handleEditRecentMeasurement(item: AdminRecentMeasurementItem) {
    setScanStatus('')
    setScanError('')
    setRecentMeasurementError('')
    setEditingRecentMeasurement(item)
    setRecentMeasurementUnit('V')
    setRecentMeasurementForm({
      value: formatDecimalInput(item.value),
      enteredBy: item.enteredBy,
    })
  }

  function handleCloseRecentMeasurementEditor() {
    if (recentMeasurementSaving) {
      return
    }

    setEditingRecentMeasurement(null)
    setRecentMeasurementUnit('V')
    setRecentMeasurementForm(createEmptyMeasurementForm())
    setRecentMeasurementError('')
  }

  async function handleSaveRecentMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingRecentMeasurement) {
      return
    }

    setRecentMeasurementSaving(true)
    setRecentMeasurementError('')
    setScanStatus('')
    setScanError('')

    try {
      const numericValue = parseDecimalInput(recentMeasurementForm.value)

      if (Number.isNaN(numericValue)) {
        throw new Error('Bitte einen gültigen Messwert eingeben.')
      }

      await updateMeasurementAsAdmin(editingRecentMeasurement.id, {
        value: convertMeasurementToVolts(numericValue, recentMeasurementUnit),
        enteredBy: recentMeasurementForm.enteredBy,
      })

      const enteredBy = profile?.email?.trim() || authUserId

      if (enteredBy) {
        await loadRecentMeasurements(enteredBy)
      }

      if (selectedMeasurementGenerator?.id === editingRecentMeasurement.generatorId) {
        await loadGeneratorMeasurements(selectedMeasurementGenerator.id)
      }

      setScanStatus(
        `Messwert für ${editingRecentMeasurement.generatorCode.toUpperCase()} wurde aktualisiert.`,
      )
      setEditingRecentMeasurement(null)
      setRecentMeasurementUnit('V')
      setRecentMeasurementForm(createEmptyMeasurementForm())
      setRecentMeasurementError('')
    } catch (saveIssue) {
      setRecentMeasurementError(
        saveIssue instanceof Error ? saveIssue.message : 'Messwert konnte nicht gespeichert werden.',
      )
    } finally {
      setRecentMeasurementSaving(false)
    }
  }

  function handleCloseGeneratorMeasurementsDialog() {
    setGeneratorMeasurementsDialogOpen(false)
    setSelectedMeasurementGenerator(null)
    setGeneratorMeasurements([])
    setGeneratorMeasurementsLoading(false)
    setEditingMeasurement(null)
    setMeasurementUnit('V')
    setMeasurementForm(createEmptyMeasurementForm())
    setMeasurementSaving(false)
    setMeasurementError('')
  }

  function handleOpenMeasurementEditor(measurement: Measurement) {
    setMeasurementError('')
    setEditingMeasurement(measurement)
    setMeasurementUnit('V')
    setMeasurementForm({
      value: formatDecimalInput(measurement.value),
      enteredBy: measurement.enteredBy,
    })
  }

  function handleCloseMeasurementEditor() {
    if (measurementSaving) {
      return
    }

    setEditingMeasurement(null)
    setMeasurementUnit('V')
    setMeasurementForm(createEmptyMeasurementForm())
    setMeasurementError('')
  }

  async function handleMeasurementSave() {
    if (!selectedMeasurementGenerator || !editingMeasurement) {
      return
    }

    setMeasurementSaving(true)
    setMeasurementError('')
    setModerationStatus('')
    setModerationError('')

    try {
      const numericValue = parseDecimalInput(measurementForm.value)

      if (Number.isNaN(numericValue)) {
        throw new Error('Bitte einen gültigen Messwert eingeben.')
      }

      await updateMeasurementAsAdmin(editingMeasurement.id, {
        value: convertMeasurementToVolts(numericValue, measurementUnit),
        enteredBy: measurementForm.enteredBy,
      })

      await loadGeneratorMeasurements(selectedMeasurementGenerator.id)
      setModerationStatus(`Messwert für ${selectedMeasurementGenerator.code} aktualisiert.`)
      handleCloseMeasurementEditor()
    } catch (saveIssue) {
      setMeasurementError(
        saveIssue instanceof Error ? saveIssue.message : 'Messwert konnte nicht gespeichert werden.',
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

  if (profileLoadedForUid !== authUserId) {
    return (
      <Stack
        spacing={2.5}
        role="status"
        aria-label="Admin-Bereich wird geladen"
      >
        <Skeleton variant="rounded" height={52} />
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Skeleton variant="rounded" height={220} />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Skeleton variant="rounded" height={220} />
          </Grid>
        </Grid>
      </Stack>
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
      <AdminNavigation
        activeTab={activeTab}
        isMobileViewport={isMobileViewport}
        mobileAdminNavOpen={mobileAdminNavOpen}
        onToggleMobileNav={() => setMobileAdminNavOpen((current) => !current)}
        onTabChange={handleAdminTabChange}
        onNavigateToTab={navigateToAdminTab}
      />

      {activeTab === 'qr' ? (
        <AdminQrSection
          exportStepOpen={exportStepOpen}
          exportCount={exportCount}
          exportQrSize={exportQrSize}
          exportPageSize={exportPageSize}
          exportDigits={exportDigits}
          exportNextCode={exportNextCode}
          exportNextSequence={exportNextSequence}
          parsedExportDigits={parsedExportDigits}
          previewTotalCards={previewTotalCards}
          exportLayoutPreview={exportLayoutPreview}
          onToggleExportStep={toggleExportStep}
          onSetExportCount={setExportCount}
          onSetExportQrSize={(value) => setExportQrSize(value.replace(/\./g, ','))}
          onSetExportPageSize={setExportPageSize}
          onSetExportDigits={setExportDigits}
          onExport={() => void handleExport()}
          formatMutedDecimal={formatMutedDecimal}
        />
      ) : null}

      {activeTab === 'scan' ? (
        <AdminScanSection
          recentMeasurements={recentMeasurements}
          onOpenScanner={() => setScannerOpen(true)}
          onOpenManualMeasurementDialog={handleOpenManualMeasurementDialog}
          onEditRecentMeasurement={handleEditRecentMeasurement}
        />
      ) : null}

      {activeTab === 'moderation' ? (
        <AdminModerationSection
          moderationLoading={moderationLoading}
          moderationSearch={moderationSearch}
          moderationSearchOpen={moderationSearchOpen}
          moderationEntriesCount={moderationEntries.length}
          blockedModerationEntriesCount={blockedModerationEntries.length}
          trashedModerationEntriesCount={trashedModerationEntries.length}
          activeModerationEntries={activeModerationEntries}
          onSetModerationSearch={setModerationSearch}
          onSetModerationSearchOpen={setModerationSearchOpen}
          onOpenTrashMenu={handleOpenTrashMenu}
          onOpenActions={handleModerationMenuOpen}
          onOpenMeasurements={(generator) => {
            void handleOpenGeneratorMeasurements(generator)
          }}
        />
      ) : null}

      <ModerationMenus
        trashMenuAnchorEl={trashMenuAnchorEl}
        moderationMenuAnchorEl={moderationMenuAnchorEl}
        blockedModerationEntriesCount={blockedModerationEntries.length}
        trashedModerationEntriesCount={trashedModerationEntries.length}
        menuUser={menuUser}
        menuGenerator={menuGenerator}
        onCloseTrashMenu={handleCloseTrashMenu}
        onOpenBlockedDialog={handleOpenBlockedDialog}
        onOpenTrashDialog={handleOpenTrashDialog}
        onCloseModerationMenu={handleCloseModerationMenu}
        onOpenUserDialog={handleOpenUserDialog}
        onOpenGeneratorMeasurements={(generator) => {
          void handleOpenGeneratorMeasurements(generator)
        }}
        onPromoteUserToAdmin={() => void handlePromoteUserToAdmin()}
      />

      <EditUserDialog
        open={userDialogOpen}
        editingUser={editingUser}
        editingUserGenerator={editingUserGenerator}
        userForm={userForm}
        userDangerOpen={userDangerOpen}
        userLifecycleActionLoading={userLifecycleActionLoading}
        onClose={handleCloseUserDialog}
        onSubmit={handleUserSave}
        onSetUserForm={setUserForm}
        onSetUserDangerOpen={setUserDangerOpen}
        onUserLifecycleAction={(status) => {
          void handleUserLifecycleAction(status)
        }}
      />

      <TrashDialog
        open={trashDialogOpen}
        entries={trashedModerationEntries}
        onClose={handleCloseTrashDialog}
        onOpenActions={handleModerationMenuOpen}
        onOpenMeasurements={(generator) => {
          void handleOpenGeneratorMeasurements(generator)
        }}
      />

      <BlockedDialog
        open={blockedDialogOpen}
        entries={blockedModerationEntries}
        onClose={handleCloseBlockedDialog}
        onOpenActions={handleModerationMenuOpen}
        onOpenMeasurements={(generator) => {
          void handleOpenGeneratorMeasurements(generator)
        }}
      />

      <GeneratorMeasurementsDialog
        open={generatorMeasurementsDialogOpen}
        selectedMeasurementGenerator={selectedMeasurementGenerator}
        measurementError={measurementError}
        generatorMeasurementsLoading={generatorMeasurementsLoading}
        generatorMeasurements={generatorMeasurements}
        editingMeasurement={editingMeasurement}
        measurementForm={measurementForm}
        measurementUnit={measurementUnit}
        measurementSaving={measurementSaving}
        onClose={handleCloseGeneratorMeasurementsDialog}
        onSetMeasurementForm={setMeasurementForm}
        onSetMeasurementUnit={setMeasurementUnit}
        onSaveMeasurement={() => {
          void handleMeasurementSave()
        }}
        onCloseMeasurementEditor={handleCloseMeasurementEditor}
        onOpenMeasurementEditor={handleOpenMeasurementEditor}
      />

      <QrScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleDetectedQrValue}
        mode="admin"
      />

      <ScanMeasurementDialog
        open={scanMeasurementDialogOpen}
        scanCode={scanCode}
        scanMeasurementCodeLocked={scanMeasurementCodeLocked}
        scanMeasurementInput={scanMeasurementInput}
        scanMeasurementUnit={scanMeasurementUnit}
        scanMeasurementDateTime={scanMeasurementDateTime}
        scanMeasurementSaving={scanMeasurementSaving}
        scanMeasurementError={scanMeasurementError}
        convertedScanMeasurementVolts={convertedScanMeasurementVolts}
        onClose={handleCloseScanMeasurementDialog}
        onSubmit={handleScanMeasurementSubmit}
        onSetScanCode={(value) => setScanCode(formatCode(value))}
        onSetScanMeasurementInput={(value) => setScanMeasurementInput(value.replace(/\./g, ','))}
        onSetScanMeasurementUnit={setScanMeasurementUnit}
        onSetScanMeasurementDateTime={setScanMeasurementDateTime}
        formatScientificVolts={formatScientificVolts}
      />

      <MeasurementFormDialog
        open={Boolean(editingRecentMeasurement)}
        title={
          editingRecentMeasurement
            ? `Messwert ${editingRecentMeasurement.generatorCode.toUpperCase()} bearbeiten`
            : 'Messwert bearbeiten'
        }
        submitLabel="Speichern"
        saving={recentMeasurementSaving}
        error={recentMeasurementError}
        onClose={handleCloseRecentMeasurementEditor}
        onSubmit={handleSaveRecentMeasurement}
        valueField={{
          value: recentMeasurementForm.value,
          onChange: (value) =>
            setRecentMeasurementForm((current) => ({
              ...current,
              value: value.replace(/\./g, ','),
            })),
          autoFocus: true,
        }}
        unitField={{
          value: recentMeasurementUnit,
          onChange: setRecentMeasurementUnit,
        }}
        enteredByField={{
          value: recentMeasurementForm.enteredBy,
          onChange: (enteredBy) =>
            setRecentMeasurementForm((current) => ({
              ...current,
              enteredBy,
            })),
        }}
      />
    </Stack>
  )
}
