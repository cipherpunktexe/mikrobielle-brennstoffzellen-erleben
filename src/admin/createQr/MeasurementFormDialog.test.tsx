import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { MeasurementFormDialog } from './MeasurementFormDialog'

test('opens a decimal keyboard for the measurement value', () => {
  render(
    <MeasurementFormDialog
      open
      title="Messwert eintragen"
      onClose={vi.fn()}
      onSubmit={vi.fn()}
      valueField={{
        value: '1,42',
        onChange: vi.fn(),
      }}
    />,
  )

  expect(screen.getByRole('textbox', { name: /wert in v/i })).toHaveAttribute(
    'inputmode',
    'decimal',
  )
})
