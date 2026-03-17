import EditNoteIcon from '@mui/icons-material/EditNote'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import {
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { formatMeasurement } from '../../common/format'
import { UnifiedList, type UnifiedListColumn } from '../../common/UnifiedList'
import type { AdminRecentMeasurementItem } from '../../data/firebaseData'

interface AdminScanSectionProps {
  recentMeasurements: AdminRecentMeasurementItem[]
  onOpenScanner: () => void
  onOpenManualMeasurementDialog: () => void
  onEditRecentMeasurement: (measurement: AdminRecentMeasurementItem) => void
}

function getCreatedAtMs(createdAt: unknown) {
  if (!createdAt) {
    return null
  }

  if (createdAt instanceof Date) {
    const ms = createdAt.getTime()
    return Number.isFinite(ms) ? ms : null
  }

  if (typeof createdAt === 'object') {
    const withToMillis = createdAt as { toMillis?: () => number }

    if (typeof withToMillis.toMillis === 'function') {
      const ms = withToMillis.toMillis()
      return Number.isFinite(ms) ? ms : null
    }

    const withToDate = createdAt as { toDate?: () => Date }

    if (typeof withToDate.toDate === 'function') {
      const dateValue = withToDate.toDate()
      const ms = dateValue.getTime()
      return Number.isFinite(ms) ? ms : null
    }
  }

  return null
}

function formatElapsedFromMs(createdAtMs: number | null, nowMs: number) {
  if (createdAtMs === null) {
    return 'unbekannt'
  }

  const elapsedMs = Math.max(0, nowMs - createdAtMs)
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60_000))

  if (elapsedMinutes < 10) {
    return `${elapsedMinutes}min`
  }

  const hours = Math.floor(elapsedMinutes / 60)
  const minutes = elapsedMinutes % 60

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}:${minutes.toString().padStart(2, '0')}h`
}

export function AdminScanSection({
  recentMeasurements,
  onOpenScanner,
  onOpenManualMeasurementDialog,
  onEditRecentMeasurement,
}: AdminScanSectionProps) {
  const sixHoursInMs = 6 * 60 * 60 * 1000
  const nowMs = Date.now()
  const recentMeasurementsInLastSixHours = recentMeasurements.filter((item) => {
    const createdAtMs = getCreatedAtMs(item.createdAt)

    if (createdAtMs === null) {
      return false
    }

    const elapsedMs = nowMs - createdAtMs
    return elapsedMs >= 0 && elapsedMs <= sixHoursInMs
  })

  const columns: UnifiedListColumn<AdminRecentMeasurementItem>[] = [
    {
      key: 'code',
      header: 'Code',
      mobileLabel: 'Code',
      width: '56px',
      render: (item) => (
        <Typography
          variant="body2"
          sx={{ fontFamily: '"Consolas", "Courier New", monospace', fontWeight: 700 }}
        >
          {item.generatorCode.toUpperCase()}
        </Typography>
      ),
    },
    {
      key: 'value',
      header: 'Messwert',
      mobileLabel: 'Messwert',
      width: '84px',
      align: 'left',
      render: (item) => (
        <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
          {formatMeasurement(item.value)}
        </Typography>
      ),
    },
    {
      key: 'elapsed',
      header: 'Zeit',
      mobileLabel: 'Zeit',
      width: '68px',
      render: (item) => (
        <Chip
          size="small"
          label={formatElapsedFromMs(getCreatedAtMs(item.createdAt), nowMs)}
          sx={{
            height: 24,
            fontWeight: 600,
            '& .MuiChip-label': {
              px: 1,
              whiteSpace: 'nowrap',
            },
          }}
        />
      ),
    },
    {
      key: 'action',
      header: '',
      mobileLabel: 'Aktion',
      width: '36px',
      align: 'right',
      render: (item) => (
        <IconButton
          size="small"
          aria-label={`Messwert ${formatMeasurement(item.value)} von ${item.generatorCode.toUpperCase()} bearbeiten`}
          onClick={() => onEditRecentMeasurement(item)}
          sx={{ width: 30, height: 30, p: 0 }}
        >
          <EditNoteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
            <Stack spacing={2.5}>
              <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                Messwerte erfassen
              </Typography>
              <Button variant="contained" startIcon={<QrCodeScannerIcon />} onClick={onOpenScanner} fullWidth>
                Scanner öffnen
              </Button>
              <Button
                variant="outlined"
                startIcon={<EditNoteIcon />}
                onClick={onOpenManualMeasurementDialog}
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
              
              <UnifiedList
                items={recentMeasurementsInLastSixHours}
                columns={columns}
                getItemKey={(item) => item.id}
                ariaLabel="Letzte eigene Messwerte"
                emptyPrimary="Noch keine eigenen Messwerte"
                emptySecondary="Es werden nur Einträge aus den letzten 6 Stunden angezeigt."
                forceDesktopLayoutOnMobile
                minDesktopWidth={260}
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
