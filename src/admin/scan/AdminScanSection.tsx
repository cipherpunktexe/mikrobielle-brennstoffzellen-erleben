import EditNoteIcon from '@mui/icons-material/EditNote'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { formatElapsedTime, formatMeasurement } from '../../common/format'
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
  const recentPreviewMeasurements = recentMeasurements.slice(0, 3)
  const hiddenRecentMeasurements = recentMeasurements.slice(3)

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
      align: 'right',
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
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          {formatElapsedTime(item.createdAt)}
        </Typography>
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
              
              <UnifiedList
                items={recentPreviewMeasurements}
                columns={columns}
                getItemKey={(item) => item.id}
                ariaLabel="Letzte eigene Messwerte"
                emptyPrimary="Noch keine eigenen Messwerte"
                emptySecondary="Sobald du Werte speicherst, erscheinen sie hier."
                forceDesktopLayoutOnMobile
                minDesktopWidth={260}
              />
              {hiddenRecentCount > 0 ? (
                <Accordion
                  disableGutters
                  elevation={0}
                  expanded={showAllRecent}
                  onChange={(_event, expanded) => setShowAllRecent(expanded)}
                  sx={{
                    border: '1px solid rgba(121,101,66,0.14)',
                    borderRadius: 2.5,
                    bgcolor: 'rgba(255,255,255,0.16)',
                    '&:before': {
                      display: 'none',
                    },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 44 }}>
                    <Typography fontWeight={600}>
                      {showAllRecent ? 'Weniger anzeigen' : `Mehr anzeigen (${hiddenRecentCount})`}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <UnifiedList
                      items={hiddenRecentMeasurements}
                      columns={columns}
                      getItemKey={(item) => item.id}
                      ariaLabel="Weitere eigene Messwerte"
                      emptyPrimary="Keine weiteren Messwerte"
                      forceDesktopLayoutOnMobile
                      minDesktopWidth={260}
                    />
                  </AccordionDetails>
                </Accordion>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
