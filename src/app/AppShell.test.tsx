import '@testing-library/jest-dom/vitest'
import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { LoginDialogProvider } from '../common/LoginDialogProvider'
import { theme } from './theme'
import { AppShell } from './AppShell'

function setViewportWidth(width: number) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('max-width:899.95px') ? width < 900 : width < 600,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

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
  function renderAppShell() {
    return render(
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
  }

  test('opens the login dialog from the desktop header', async () => {
    setViewportWidth(1200)
    const user = userEvent.setup()
    renderAppShell()

    const loginButton = await screen.findByRole('button', { name: /^anmelden$/i })
    await user.click(loginButton)

    expect(screen.getByRole('dialog', { name: /anmelden/i })).toBeInTheDocument()
    expect(screen.getByText('Startseite')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /account-menü öffnen/i })).not.toBeInTheDocument()
  })

  test('shows the login action inside the mobile navigation menu', async () => {
    setViewportWidth(390)
    const user = userEvent.setup()
    renderAppShell()

    expect(screen.queryByRole('button', { name: /^anmelden$/i })).not.toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: /navigation öffnen/i }))
    await user.click(await screen.findByRole('menuitem', { name: /anmelden/i }))

    expect(screen.getByRole('dialog', { name: /anmelden/i })).toBeInTheDocument()
  })
})
