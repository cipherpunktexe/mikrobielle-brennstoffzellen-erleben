import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  useEffect,
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
import { TrashDialog } from './moderate/TrashDialog'
import { GeneratorMeasurementsDialog } from './createQr/GeneratorMeasurementsDialog'
import { ScanMeasurementDialog } from './createQr/ScanMeasurementDialog'
import { AuthCard } from '../common/AuthCard'
import { QrScannerDialog } from '../common/qr/QrScannerDialog'
import { formatCode } from '../common/format'
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
import { formatMutedDecimal, formatScientificVolts } from './utils'

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

export function AdminPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobileViewport = useMediaQuery(theme.breakpoints.down('sm'))
  const params = useParams()
  const routeCode = formatCode(params.code ?? '')
  const routeTab = params.tab
  const activeTab: AdminTabValue = isAdminTabValue(routeTab) ? routeTab : 'scan'

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
  const [measurementForm, setMeasurementForm] = useState<MeasurementFormState>(
    createEmptyMeasurementForm,
  )
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

  useEffect(() => {
    const enteredBy = profile?.email?.trim() || authUserId

    if (activeTab !== 'scan' || !enteredBy) {
      return
    }

    void loadRecentMeasurements(enteredBy)
  }, [activeTab, authUserId, profile?.email])

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
  const trashedModerationEntries = filteredModerationEntries.filter((entry) => entry.status !== 'active')
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
          exportStatus={exportStatus}
          exportError={exportError}
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
          onSetExportQrSize={setExportQrSize}
          onSetExportPageSize={setExportPageSize}
          onSetExportDigits={setExportDigits}
          onExport={() => void handleExport()}
          formatMutedDecimal={formatMutedDecimal}
        />
      ) : null}

      {activeTab === 'scan' ? (
        <AdminScanSection
          scanStatus={scanStatus}
          scanError={scanError}
          recentMeasurements={recentMeasurements}
          onOpenScanner={() => setScannerOpen(true)}
          onOpenManualMeasurementDialog={handleOpenManualMeasurementDialog}
        />
      ) : null}

      {activeTab === 'moderation' ? (
        <AdminModerationSection
          moderationStatus={moderationStatus}
          moderationError={moderationError}
          moderationLoading={moderationLoading}
          moderationSearch={moderationSearch}
          moderationSearchOpen={moderationSearchOpen}
          moderationEntriesCount={moderationEntries.length}
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
        trashedModerationEntriesCount={trashedModerationEntries.length}
        menuUser={menuUser}
        menuGenerator={menuGenerator}
        onCloseTrashMenu={handleCloseTrashMenu}
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

      <GeneratorMeasurementsDialog
        open={generatorMeasurementsDialogOpen}
        selectedMeasurementGenerator={selectedMeasurementGenerator}
        measurementError={measurementError}
        generatorMeasurementsLoading={generatorMeasurementsLoading}
        generatorMeasurements={generatorMeasurements}
        editingMeasurementId={editingMeasurementId}
        measurementForm={measurementForm}
        measurementSaving={measurementSaving}
        onClose={handleCloseGeneratorMeasurementsDialog}
        onSetMeasurementForm={setMeasurementForm}
        onSaveMeasurement={(measurementId) => {
          void handleMeasurementSave(measurementId)
        }}
        onCloseMeasurementEditor={handleCloseMeasurementEditor}
        onOpenMeasurementEditor={handleOpenMeasurementEditor}
      />

      <QrScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleDetectedQrValue}
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
        onSetScanMeasurementInput={setScanMeasurementInput}
        onSetScanMeasurementUnit={setScanMeasurementUnit}
        onSetScanMeasurementDateTime={setScanMeasurementDateTime}
        formatScientificVolts={formatScientificVolts}
      />
    </Stack>
  )
}
