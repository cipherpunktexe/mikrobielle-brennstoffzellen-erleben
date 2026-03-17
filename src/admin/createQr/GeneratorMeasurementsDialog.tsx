import EditNoteIcon from '@mui/icons-material/EditNote'
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  Button,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { UnifiedList, type UnifiedListColumn } from '../../common/UnifiedList'
import { formatMeasurement, formatTimestamp } from '../../common/format'
import type { Generator, Measurement } from '../../data/domain'
import type { MeasurementFormState } from '../types'
import type { MeasurementUnit } from '../types'
import { MeasurementFormDialog } from './MeasurementFormDialog'

interface GeneratorMeasurementsDialogProps {
  open: boolean
  selectedMeasurementGenerator: Generator | null
  measurementError: string
  generatorMeasurementsLoading: boolean
  generatorMeasurements: Measurement[]
  editingMeasurement: Measurement | null
  measurementForm: MeasurementFormState
  measurementUnit: MeasurementUnit
  measurementSaving: boolean
  onClose: () => void
  onSetMeasurementForm: (updater: (current: MeasurementFormState) => MeasurementFormState) => void
  onSetMeasurementUnit: (unit: MeasurementUnit) => void
  onSaveMeasurement: () => void
  onCloseMeasurementEditor: () => void
  onOpenMeasurementEditor: (measurement: Measurement) => void
}

export function GeneratorMeasurementsDialog({
  open,
  selectedMeasurementGenerator,
  measurementError,
  generatorMeasurementsLoading,
  generatorMeasurements,
  editingMeasurement,
  measurementForm,
  measurementUnit,
  measurementSaving,
  onClose,
  onSetMeasurementForm,
  onSetMeasurementUnit,
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
      render: (measurement) => (
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
      ),
    },
  ]

  return (
    <>
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
              <UnifiedList
                items={generatorMeasurements}
                columns={columns}
                getItemKey={(measurement) => measurement.id}
                ariaLabel="Messwerte der ausgewählten Brennstoffzelle"
                emptyPrimary="Noch keine Messwerte"
                emptySecondary="Für diese Brennstoffzelle wurden noch keine Werte eingetragen."
                renderItemAction={(measurement) => (
                  <IconButton
                    size="small"
                    aria-label="Messwert bearbeiten"
                    onClick={() => onOpenMeasurementEditor(measurement)}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 1.75,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      bgcolor: (theme) => alpha(theme.palette.common.white, 0.72),
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.common.white, 0.96),
                      },
                    }}
                  >
                    <EditNoteIcon fontSize="small" />
                  </IconButton>
                )}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Schließen</Button>
        </DialogActions>
      </Dialog>

      <MeasurementFormDialog
        open={Boolean(editingMeasurement)}
        title="Messwert bearbeiten"
        submitLabel="Speichern"
        saving={measurementSaving}
        error={measurementError}
        onClose={onCloseMeasurementEditor}
        onSubmit={(event) => {
          event.preventDefault()
          onSaveMeasurement()
        }}
        valueField={{
          value: measurementForm.value,
          onChange: (value) =>
            onSetMeasurementForm((current) => ({
              ...current,
              value: value.replace(/\./g, ','),
            })),
          autoFocus: true,
        }}
        unitField={{
          value: measurementUnit,
          onChange: onSetMeasurementUnit,
        }}
        enteredByField={{
          value: measurementForm.enteredBy,
          onChange: (enteredBy) =>
            onSetMeasurementForm((current) => ({
              ...current,
              enteredBy,
            })),
        }}
      />
    </>
  )
}
