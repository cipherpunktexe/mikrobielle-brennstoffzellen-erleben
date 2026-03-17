import type { FormEvent } from 'react'
import { MeasurementFormDialog } from './MeasurementFormDialog'
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
    <MeasurementFormDialog
      open={open}
      title="Messwert eintragen"
      submitLabel="Speichern"
      saving={scanMeasurementSaving}
      error={scanMeasurementError}
      maxWidth="xs"
      onClose={onClose}
      onSubmit={onSubmit}
      codeField={{
        value: scanCode,
        onChange: onSetScanCode,
        disabled: scanMeasurementCodeLocked,
      }}
      valueField={{
        label: 'Wert',
        value: scanMeasurementInput,
        onChange: onSetScanMeasurementInput,
        autoFocus: true,
      }}
      unitField={{
        value: scanMeasurementUnit,
        onChange: onSetScanMeasurementUnit,
      }}
      dateTimeField={{
        value: scanMeasurementDateTime,
        onChange: onSetScanMeasurementDateTime,
      }}
      helperText={
        convertedScanMeasurementVolts !== null
          ? formatScientificVolts(convertedScanMeasurementVolts)
          : null
      }
    />
  )
}
