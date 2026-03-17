import EditNoteIcon from '@mui/icons-material/EditNote'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { formatMeasurement, formatTimestamp } from '../../common/format'
import { UnifiedList, type UnifiedListColumn } from '../../common/UnifiedList'
import type { AdminRecentMeasurementItem } from '../../data/firebaseData'

interface AdminScanSectionProps {
  scanStatus: string
  scanError: string
  recentMeasurements: AdminRecentMeasurementItem[]
  onOpenScanner: () => void
  onOpenManualMeasurementDialog: () => void
  onEditRecentMeasurement: (measurement: AdminRecentMeasurementItem) => void
}

export function AdminScanSection({
  scanStatus,
  scanError,
  recentMeasurements,
  onOpenScanner,
  onOpenManualMeasurementDialog,
  onEditRecentMeasurement,
}: AdminScanSectionProps) {
  const [showAllRecent, setShowAllRecent] = useState(false)
  const hiddenRecentCount = Math.max(0, recentMeasurements.length - 3)
  const visibleRecentMeasurements = showAllRecent ? recentMeasurements : recentMeasurements.slice(0, 3)

  useEffect(() => {
    if (recentMeasurements.length <= 3) {
      setShowAllRecent(false)
    }
  }, [recentMeasurements.length])

  const columns: UnifiedListColumn<AdminRecentMeasurementItem>[] = [
    {
      key: 'code',
      header: 'Code',
      mobileLabel: 'Code',
      width: 'minmax(96px, 120px)',
      render: (item) => (
        <Box>
          <Typography
            variant="body2"
            sx={{ fontFamily: '"Consolas", "Courier New", monospace', fontWeight: 700 }}
          >
            {item.generatorCode.toUpperCase()}
          </Typography>
          {item.ownerName ? (
            <Typography variant="caption" color="text.secondary">
              {item.ownerName}
            </Typography>
          ) : null}
        </Box>
      ),
    },
    {
      key: 'value',
      header: 'Wert',
      mobileLabel: 'Wert',
      width: 'minmax(110px, 140px)',
      render: (item) => (
        <Typography variant="body2" fontWeight={600}>
          {formatMeasurement(item.value)}
        </Typography>
      ),
    },
    {
      key: 'time',
      header: 'Zeitpunkt',
      mobileLabel: 'Zeitpunkt',
      width: 'minmax(0, 1fr)',
      render: (item) => <Typography variant="body2">{formatTimestamp(item.createdAt)}</Typography>,
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
              <Typography color="text.secondary">
                Scanne einen QR-Code oder trage einen Messwert manuell ein.
              </Typography>
              {scanStatus ? <Alert severity="success">{scanStatus}</Alert> : null}
              {scanError ? <Alert severity="error">{scanError}</Alert> : null}
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
              <Typography color="text.secondary">
                Hier siehst du die zuletzt von dir eingetragenen Messwerte.
              </Typography>
              <UnifiedList
                items={visibleRecentMeasurements}
                columns={columns}
                getItemKey={(item) => item.id}
                ariaLabel="Letzte eigene Messwerte"
                emptyPrimary="Noch keine eigenen Messwerte"
                emptySecondary="Sobald du Werte speicherst, erscheinen sie hier."
                renderItemAction={(item) => (
                  <IconButton
                    size="small"
                    aria-label={`Messwert ${formatMeasurement(item.value)} von ${item.generatorCode.toUpperCase()} bearbeiten`}
                    onClick={() => onEditRecentMeasurement(item)}
                  >
                    <EditNoteIcon fontSize="small" />
                  </IconButton>
                )}
              />
              {hiddenRecentCount > 0 ? (
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={showAllRecent ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setShowAllRecent((current) => !current)}
                  sx={{ alignSelf: 'flex-start', px: 0.5 }}
                >
                  {showAllRecent ? 'Weniger anzeigen' : `Mehr anzeigen (${hiddenRecentCount})`}
                </Button>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
