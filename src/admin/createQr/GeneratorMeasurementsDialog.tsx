import EditNoteIcon from '@mui/icons-material/EditNote'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { UnifiedList, type UnifiedListColumn } from '../../common/UnifiedList'
import { formatMeasurement, formatTimestamp } from '../../common/format'
import type { Generator, Measurement } from '../../data/domain'
import type { MeasurementFormState } from '../types'

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
  const columns: UnifiedListColumn<Measurement>[] = [
    {
      key: 'entry',
      header: 'Messwert',
      mobileLabel: 'Messwert',
      width: 'minmax(0, 1fr)',
      render: (measurement) => {
        const isEditing = editingMeasurementId === measurement.id

        if (isEditing) {
          return (
            <Stack spacing={1.25} sx={{ width: '100%' }}>
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
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onSaveMeasurement(measurement.id)}
                  disabled={measurementSaving}
                >
                  Speichern
                </Button>
                <Button size="small" onClick={onCloseMeasurementEditor} disabled={measurementSaving}>
                  Abbrechen
                </Button>
              </Stack>
            </Stack>
          )
        }

        return (
          <Stack spacing={0.35}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {formatMeasurement(measurement.value)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {measurement.enteredBy}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(measurement.createdAt)}
            </Typography>
          </Stack>
        )
      },
    },
  ]

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {selectedMeasurementGenerator
          ? `Messwerte fuer ${selectedMeasurementGenerator.ownerName?.trim() || selectedMeasurementGenerator.code}`
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
            <UnifiedList
              items={generatorMeasurements}
              columns={columns}
              getItemKey={(measurement) => measurement.id}
              ariaLabel="Messwerte der ausgewaehlten Brennstoffzelle"
              emptyPrimary="Noch keine Messwerte"
              emptySecondary="Fuer diese Brennstoffzelle wurden noch keine Werte eingetragen."
              renderItemAction={(measurement) =>
                editingMeasurementId === measurement.id ? null : (
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
                )
              }
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schliessen</Button>
      </DialogActions>
    </Dialog>
  )
}
