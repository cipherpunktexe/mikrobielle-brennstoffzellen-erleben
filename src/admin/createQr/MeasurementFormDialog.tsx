import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'
import type { FormEvent, ReactNode } from 'react'
import type { MeasurementUnit } from '../types'

interface MeasurementCodeField {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label?: string
}

interface MeasurementValueField {
  value: string
  onChange: (value: string) => void
  label?: string
  autoFocus?: boolean
}

interface MeasurementUnitField {
  value: MeasurementUnit
  onChange: (value: MeasurementUnit) => void
  label?: string
}

interface MeasurementEnteredByField {
  value: string
  onChange: (value: string) => void
  label?: string
}

interface MeasurementDateTimeField {
  value: string
  onChange: (value: string) => void
  label?: string
}

interface MeasurementFormDialogProps {
  open: boolean
  title: string
  submitLabel?: string
  saving?: boolean
  error?: string
  helperText?: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md'
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  codeField?: MeasurementCodeField
  valueField: MeasurementValueField
  unitField?: MeasurementUnitField
  enteredByField?: MeasurementEnteredByField
  dateTimeField?: MeasurementDateTimeField
}

export function MeasurementFormDialog({
  open,
  title,
  submitLabel = 'Speichern',
  saving = false,
  error = '',
  helperText,
  maxWidth = 'sm',
  onClose,
  onSubmit,
  codeField,
  valueField,
  unitField,
  enteredByField,
  dateTimeField,
}: MeasurementFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle>{title}</DialogTitle>
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            {codeField ? (
              <TextField
                label={codeField.label ?? 'Brennstoffzellen-Code'}
                value={codeField.value}
                onChange={(event) => codeField.onChange(event.target.value)}
                disabled={codeField.disabled}
                fullWidth
              />
            ) : null}

            {unitField ? (
              <Stack spacing={1}>
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <TextField
                    label={valueField.label ?? 'Wert'}
                    value={valueField.value}
                    onChange={(event) => valueField.onChange(event.target.value)}
                    autoFocus={valueField.autoFocus}
                    fullWidth
                  />
                  <TextField
                    label={unitField.label ?? 'Einheit'}
                    select
                    value={unitField.value}
                    onChange={(event) => unitField.onChange(event.target.value as MeasurementUnit)}
                    sx={{ width: 112, flexShrink: 0 }}
                    SelectProps={{ native: true }}
                  >
                    <option value="uV">uV</option>
                    <option value="mV">mV</option>
                    <option value="V">V</option>
                    <option value="kV">kV</option>
                  </TextField>
                </Stack>
                {helperText ? (
                  <Typography variant="body2" color="text.secondary">
                    {helperText}
                  </Typography>
                ) : null}
              </Stack>
            ) : (
              <TextField
                label={valueField.label ?? 'Wert in V'}
                value={valueField.value}
                onChange={(event) => valueField.onChange(event.target.value)}
                autoFocus={valueField.autoFocus}
                fullWidth
              />
            )}

            {enteredByField ? (
              <TextField
                label={enteredByField.label ?? 'Eingetragen von'}
                value={enteredByField.value}
                onChange={(event) => enteredByField.onChange(event.target.value)}
                fullWidth
              />
            ) : null}

            {dateTimeField ? (
              <TextField
                label={dateTimeField.label ?? 'Datum und Uhrzeit'}
                type="datetime-local"
                value={dateTimeField.value}
                onChange={(event) => dateTimeField.onChange(event.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            ) : null}

            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Abbrechen
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
