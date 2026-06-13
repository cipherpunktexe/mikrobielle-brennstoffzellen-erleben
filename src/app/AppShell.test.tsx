import '@testing-library/jest-dom/vitest'
import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { LoginDialogProvider } from '../common/LoginDialogProvider'
import { theme } from './theme'
import { AppShell } from './AppShell'

vi.mock('../data/firebaseData', () => ({
  getUserProfile: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  signInWithGoogle: vi.fn(),
  subscribeToAuth: (callback: (user: null) => void) => {
    callback(null)
    return vi.fn()
  },
}))

describe('AppShell', () => {
  test('opens the login dialog instead of navigating away', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider theme={theme}>
        <LoginDialogProvider>
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<AppShell />}>
                <Route index element={<div>Startseite</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </LoginDialogProvider>
      </ThemeProvider>,
    )

    const loginButton = await screen.findByRole('button', { name: /^anmelden$/i })
    await user.click(loginButton)

    expect(screen.getByRole('dialog', { name: /anmelden/i })).toBeInTheDocument()
    expect(screen.getByText('Startseite')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /account-menü öffnen/i })).not.toBeInTheDocument()
  })
})
