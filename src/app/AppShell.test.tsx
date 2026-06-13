import '@testing-library/jest-dom/vitest'
import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { theme } from './theme'
import { AppShell } from './AppShell'

vi.mock('../data/firebaseData', () => ({
  getUserProfile: vi.fn(),
  logout: vi.fn(),
  subscribeToAuth: (callback: (user: null) => void) => {
    callback(null)
    return vi.fn()
  },
}))

describe('AppShell', () => {
  test('shows a direct login button instead of a guest avatar', async () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<div>Startseite</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    const loginLink = await screen.findByRole('link', { name: /anmelden/i })

    expect(loginLink).toHaveAttribute('href', '/user')
    expect(screen.queryByRole('button', { name: /account-menü öffnen/i })).not.toBeInTheDocument()
  })
})
