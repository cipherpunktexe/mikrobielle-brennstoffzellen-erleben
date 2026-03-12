import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AppShell } from './AppShell'
import { theme } from '../theme'

const { subscribeToAuthMock, getUserProfileMock, logoutMock } = vi.hoisted(() => ({
  subscribeToAuthMock: vi.fn(),
  getUserProfileMock: vi.fn(),
  logoutMock: vi.fn(),
}))

vi.mock('../services/firebaseData', () => ({
  subscribeToAuth: subscribeToAuthMock,
  getUserProfile: getUserProfileMock,
  logout: logoutMock,
}))

function renderShell() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<div>Startseite</div>} />
            <Route path="user" element={<div>User</div>} />
            <Route path="leaderboard" element={<div>Leaderboard</div>} />
            <Route path="admin" element={<div>Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  )
}

describe('AppShell', () => {
  beforeEach(() => {
    subscribeToAuthMock.mockReset()
    getUserProfileMock.mockReset()
    logoutMock.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('hides the admin navigation for guests and shows guest account info', async () => {
    subscribeToAuthMock.mockImplementation((callback: (user: null) => void) => {
      callback(null)
      return vi.fn()
    })

    render(renderShell())

    expect(
      screen.queryByRole('link', {
        name: /admin/i,
      }),
    ).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /account-menü öffnen/i }))

    expect(screen.getByText('Gast')).toBeInTheDocument()
    expect(screen.getByText('Nicht angemeldet')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /logout/i })).toHaveAttribute('aria-disabled', 'true')
  })

  test('shows the admin navigation for users with admin role', async () => {
    subscribeToAuthMock.mockImplementation(
      (callback: (user: { uid: string; email: string }) => void) => {
        callback({
          uid: 'admin-1',
          email: 'admin@example.com',
        })
        return vi.fn()
      },
    )
    getUserProfileMock.mockResolvedValue({
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    })

    render(renderShell())

    expect(await screen.findByRole('link', { name: /admin/i })).toBeInTheDocument()
  })
})
