import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'
import type { FormEvent } from 'react'
import type { MeasurementUnit } from '../types'

interface ScanMeasurementDialogProps {
  open: boolean
  scanCode: string
  scanMeasurementCodeLocked: boolean
  scanMeasurementInput: string
  scanMeasurementUnit: MeasurementUnit
  scanMeasurementDateTime: string
  scanMeasurementSaving: boolean
  scanMeasurementError: string
  convertedScanMeasurementVolts: number | null
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSetScanCode: (value: string) => void
  onSetScanMeasurementInput: (value: string) => void
  onSetScanMeasurementUnit: (value: MeasurementUnit) => void
  onSetScanMeasurementDateTime: (value: string) => void
  formatScientificVolts: (value: number) => string
}

export function ScanMeasurementDialog({
  open,
  scanCode,
  scanMeasurementCodeLocked,
  scanMeasurementInput,
  scanMeasurementUnit,
  scanMeasurementDateTime,
  scanMeasurementSaving,
  scanMeasurementError,
  convertedScanMeasurementVolts,
  onClose,
  onSubmit,
  onSetScanCode,
  onSetScanMeasurementInput,
  onSetScanMeasurementUnit,
  onSetScanMeasurementDateTime,
  formatScientificVolts,
}: ScanMeasurementDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Messwert eintragen</DialogTitle>
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Brennstoffzellen-Code"
              value={scanCode}
              onChange={(event) => onSetScanCode(event.target.value)}
              disabled={scanMeasurementCodeLocked}
              fullWidth
            />
            <Stack spacing={1}>
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <TextField
                  label="Wert"
                  value={scanMeasurementInput}
                  onChange={(event) => onSetScanMeasurementInput(event.target.value)}
                  autoFocus
                  fullWidth
                />
                <TextField
                  label="Einheit"
                  select
                  value={scanMeasurementUnit}
                  onChange={(event) => onSetScanMeasurementUnit(event.target.value as MeasurementUnit)}
                  sx={{ width: 112, flexShrink: 0 }}
                  SelectProps={{ native: true }}
                >
                  <option value="uV">uV</option>
                  <option value="mV">mV</option>
                  <option value="V">V</option>
                  <option value="kV">kV</option>
                </TextField>
              </Stack>
              {convertedScanMeasurementVolts !== null ? (
                <Typography variant="body2" color="text.secondary">
                  {formatScientificVolts(convertedScanMeasurementVolts)}
                </Typography>
              ) : null}
            </Stack>
            <TextField
              label="Datum und Uhrzeit"
              type="datetime-local"
              value={scanMeasurementDateTime}
              onChange={(event) => onSetScanMeasurementDateTime(event.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            {scanMeasurementError ? <Alert severity="error">{scanMeasurementError}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={scanMeasurementSaving}>
            Abbrechen
          </Button>
          <Button type="submit" variant="contained" disabled={scanMeasurementSaving}>
            Speichern
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
