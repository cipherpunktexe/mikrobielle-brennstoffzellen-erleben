import EditNoteIcon from '@mui/icons-material/EditNote'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { Generator, Measurement } from '../../../../shared/types/domain'
import type { MeasurementFormState } from '../../types'
import { formatMeasurement, formatTimestamp } from '../../../../shared/utils/format'

interface GeneratorMeasurementsDialogProps {
  open: boolean
  selectedMeasurementGenerator: Generator | null
  measurementError: string
  generatorMeasurementsLoading: boolean
  generatorMeasurements: Measurement[]
  editingMeasurementId: string
  measurementForm: MeasurementFormState
  measurementSaving: boolean
  onClose: () => void
  onSetMeasurementForm: (updater: (current: MeasurementFormState) => MeasurementFormState) => void
  onSaveMeasurement: (measurementId: string) => void
  onCloseMeasurementEditor: () => void
  onOpenMeasurementEditor: (measurement: Measurement) => void
}

export function GeneratorMeasurementsDialog({
  open,
  selectedMeasurementGenerator,
  measurementError,
  generatorMeasurementsLoading,
  generatorMeasurements,
  editingMeasurementId,
  measurementForm,
  measurementSaving,
  onClose,
  onSetMeasurementForm,
  onSaveMeasurement,
  onCloseMeasurementEditor,
  onOpenMeasurementEditor,
}: GeneratorMeasurementsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
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
                  <ListItem key={measurement.id} divider={index < generatorMeasurements.length - 1} sx={{ py: 1.5 }}>
                    {editingMeasurementId === measurement.id ? (
                      <Stack spacing={1.5} sx={{ width: '100%' }}>
                        <TextField
                          label="Wert in V"
                          value={measurementForm.value}
                          onChange={(event) =>
                            onSetMeasurementForm((current) => ({
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
                            onSetMeasurementForm((current) => ({
                              ...current,
                              enteredBy: event.target.value,
                            }))
                          }
                          fullWidth
                        />
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="contained" onClick={() => onSaveMeasurement(measurement.id)} disabled={measurementSaving}>
                            Speichern
                          </Button>
                          <Button size="small" onClick={onCloseMeasurementEditor} disabled={measurementSaving}>
                            Abbrechen
                          </Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start" sx={{ width: '100%' }}>
                        <ListItemText
                          primary={formatMeasurement(measurement.value)}
                          secondary={`${measurement.enteredBy} | ${formatTimestamp(measurement.createdAt)}`}
                        />
                        <IconButton
                          size="small"
                          aria-label="Messwert bearbeiten"
                          onClick={() => onOpenMeasurementEditor(measurement)}
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
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  )
}
