import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { QrScannerDialog } from './QrScannerDialog'

test('uses the compact admin layout and converts a manual code into the current qr link', async () => {
  const user = userEvent.setup()
  const onDetected = vi.fn()

  render(
    <QrScannerDialog
      open
      mode="admin"
      onClose={vi.fn()}
      onDetected={onDetected}
    />,
  )

  expect(screen.getByRole('dialog', { name: /brennstoffzelle scannen/i })).toBeInTheDocument()
  expect(screen.queryByText(/Richte die Kamera/)).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /code manuell eingeben/i }))
  await user.type(screen.getByPlaceholderText(/001c/i), '00AF')
  await user.click(screen.getByRole('button', { name: /übernehmen/i }))

  expect(onDetected).toHaveBeenCalledWith(
    'https://mikrobielle-brennstoffzellen.web.app/user?register=00af',
  )
})
