import EditNoteIcon from '@mui/icons-material/EditNote'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { formatMeasurement, formatTimestamp } from '../../app/format'
import type { AdminRecentMeasurementItem } from '../../app/firebaseData'

interface AdminScanSectionProps {
  scanStatus: string
  scanError: string
  recentMeasurements: AdminRecentMeasurementItem[]
  onOpenScanner: () => void
  onOpenManualMeasurementDialog: () => void
}

export function AdminScanSection({
  scanStatus,
  scanError,
  recentMeasurements,
  onOpenScanner,
  onOpenManualMeasurementDialog,
}: AdminScanSectionProps) {
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
                              <Typography variant="caption" color="text.secondary" sx={{ display: { sm: 'none' } }}>
                                {item.ownerName}
                              </Typography>
                            ) : null}
                          </Box>
                          <Typography variant="body2" fontWeight={600}>
                            {formatMeasurement(item.value)}
                          </Typography>
                          <Box>
                            <Typography variant="body2">{formatTimestamp(item.createdAt)}</Typography>
                            {item.ownerName ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
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
  )
}
