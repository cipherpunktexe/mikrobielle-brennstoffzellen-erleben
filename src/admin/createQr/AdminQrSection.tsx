import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SaveIcon from '@mui/icons-material/Save'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { QrLayoutPreview } from './QrLayoutPreview'
import type { QrCodeNumberPlacement, QrPdfPageSize } from '../../common/qr/qr'
import type { QrExportStepKey } from '../types'

interface AdminQrSectionProps {
  exportStatus: string
  exportError: string
  exportStepOpen: Record<QrExportStepKey, boolean>
  exportCount: string
  exportQrSize: string
  exportPageSize: QrPdfPageSize
  exportDigits: string
  exportCodePlacement: QrCodeNumberPlacement
  exportNextCode: string
  exportNextSequence: number | null
  parsedExportDigits: number
  previewTotalCards: number
  exportLayoutPreview: ReturnType<typeof import('../../common/qr/qr').getQrPdfLayoutPreview> | null
  onToggleExportStep: (step: QrExportStepKey) => void
  onSetExportCount: (value: string) => void
  onSetExportQrSize: (value: string) => void
  onSetExportPageSize: (value: QrPdfPageSize) => void
  onSetExportDigits: (value: string) => void
  onSetExportCodePlacement: (value: QrCodeNumberPlacement) => void
  onExport: () => void
  formatMutedDecimal: (sequence: number) => string
}

export function AdminQrSection({
  exportStatus,
  exportError,
  exportStepOpen,
  exportCount,
  exportQrSize,
  exportPageSize,
  exportDigits,
  exportCodePlacement,
  exportNextCode,
  exportNextSequence,
  parsedExportDigits,
  previewTotalCards,
  exportLayoutPreview,
  onToggleExportStep,
  onSetExportCount,
  onSetExportQrSize,
  onSetExportPageSize,
  onSetExportDigits,
  onSetExportCodePlacement,
  onExport,
  formatMutedDecimal,
}: AdminQrSectionProps) {
  const stepChipSx = {
    minWidth: { xs: 32, sm: 36 },
    height: { xs: 32, sm: 36 },
    borderRadius: 999,
    fontWeight: 700,
    fontSize: { xs: '0.8rem', sm: '0.875rem' },
  }
  const stepCardSx = { flex: 1, borderRadius: { xs: 2, sm: 2.5 } }

  function getStepContentPadding(open: boolean) {
    return {
      px: { xs: 1.25, sm: 2 },
      py: { xs: open ? 1.25 : 0.9, sm: open ? 1.75 : 1.2 },
    }
  }

  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Stack spacing={{ xs: 1.75, sm: 3 }}>
              <Box>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                  QR-Export
                </Typography>
              </Box>
              {exportStatus ? <Alert severity="success">{exportStatus}</Alert> : null}
              {exportError ? <Alert severity="error">{exportError}</Alert> : null}
              <Stack spacing={{ xs: 1.2, sm: 2 }}>
                <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="flex-start">
                  <Chip label="1" color="primary" sx={stepChipSx} />
                  <Card variant="outlined" sx={stepCardSx}>
                    <CardContent sx={getStepContentPadding(exportStepOpen.count)}>
                      <Stack spacing={exportStepOpen.count ? 1.25 : 0.35}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography fontWeight={700} sx={{ fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
                            Anzahl
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => onToggleExportStep('count')}
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
                        <Collapse in={exportStepOpen.count} unmountOnExit>
                          <TextField
                            label="Anzahl"
                            type="number"
                            value={exportCount}
                            onChange={(event) => onSetExportCount(event.target.value)}
                            fullWidth
                          />
                        </Collapse>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
                <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="flex-start">
                  <Chip label="2" color="primary" sx={stepChipSx} />
                  <Card variant="outlined" sx={stepCardSx}>
                    <CardContent sx={getStepContentPadding(exportStepOpen.layout)}>
                      <Stack spacing={exportStepOpen.layout ? 1.25 : 0.35}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography fontWeight={700} sx={{ fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
                            Größe und Format
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => onToggleExportStep('layout')}
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
                        <Collapse in={exportStepOpen.layout} unmountOnExit>
                          <Stack spacing={{ xs: 1.1, sm: 1.5 }}>
                            <TextField
                              label="QR-Größe in mm"
                              type="number"
                              value={exportQrSize}
                              onChange={(event) => onSetExportQrSize(event.target.value)}
                              fullWidth
                            />
                            <TextField
                              label="Seitenformat"
                              select
                              value={exportPageSize}
                              onChange={(event) => onSetExportPageSize(event.target.value as QrPdfPageSize)}
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
                <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="flex-start">
                  <Chip label="3" color="primary" sx={stepChipSx} />
                  <Card variant="outlined" sx={stepCardSx}>
                    <CardContent sx={getStepContentPadding(exportStepOpen.number)}>
                      <Stack spacing={exportStepOpen.number ? 1.25 : 0.35}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography fontWeight={700} sx={{ fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
                            Nummer
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => onToggleExportStep('number')}
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
                        <Collapse in={exportStepOpen.number} unmountOnExit>
                          <Stack spacing={2}>
                            <TextField
                              label="Stellen"
                              type="number"
                              value={exportDigits}
                              onChange={(event) => onSetExportDigits(event.target.value)}
                              fullWidth
                            />
                            <TextField
                              label="Position der Nummer"
                              select
                              value={exportCodePlacement}
                              onChange={(event) =>
                                onSetExportCodePlacement(event.target.value as QrCodeNumberPlacement)}
                              fullWidth
                              SelectProps={{ native: true }}
                            >
                              <option value="below">Unter dem QR-Code</option>
                              <option value="center">Im QR-Code (mittig)</option>
                            </TextField>
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
                                {exportNextSequence === null ? '-' : formatMutedDecimal(exportNextSequence)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Collapse>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
                <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="flex-start">
                  <Chip label="4" color="primary" sx={stepChipSx} />
                  <Card variant="outlined" sx={stepCardSx}>
                    <CardContent sx={getStepContentPadding(exportStepOpen.export)}>
                      <Stack spacing={exportStepOpen.export ? 1.25 : 0.35}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography fontWeight={700} sx={{ fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
                            Export
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => onToggleExportStep('export')}
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
                        <Collapse in={exportStepOpen.export} unmountOnExit>
                          <Button variant="contained" onClick={onExport} startIcon={<SaveIcon />} fullWidth>
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
          <CardContent sx={{ p: { xs: 1.5, sm: 3 }, height: '100%' }}>
            <Stack spacing={{ xs: 1.75, sm: 2.5 }} sx={{ height: '100%' }}>
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
                codePlacement={exportCodePlacement}
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
