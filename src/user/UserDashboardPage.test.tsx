import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { renderWithProviders } from '../app/renderWithProviders'
import { UserDashboardPage } from './UserDashboardPage'
import { UserRegistrationPage } from './UserRegistrationPage'

vi.mock('../data/firebaseData', () => ({
  linkCurrentUserToGeneratorByCode: vi.fn(),
  login: vi.fn(),
  registerUserWithGenerator: vi.fn(),
  signInWithGoogle: vi.fn(),
  subscribeToAuth: (callback: (user: null) => void) => {
    callback(null)
    return vi.fn()
  },
  subscribeToGenerator: vi.fn(),
  subscribeToLeaderboard: vi.fn(() => vi.fn()),
  subscribeToMeasurements: vi.fn(),
  subscribeToUserProfile: vi.fn(),
  updateCurrentUserDisplayName: vi.fn(),
}))

describe('UserDashboardPage', () => {
  test('focuses the guest view on login and opens the shared dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserDashboardPage />)

    const loginButton = await screen.findByRole('button', { name: /jetzt anmelden/i })

    expect(
      screen.getByRole('region', { name: /deine brennstoffzelle/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/melde dich an, um deine messwerte/i)).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /e-mail/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/brennstoffzellen-code/i)).not.toBeInTheDocument()

    await user.click(loginButton)

    expect(screen.getByRole('dialog', { name: /anmelden/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /e-mail/i })).toBeInTheDocument()
  })

  test('opens registration with the qr code on the user page', async () => {
    renderWithProviders(<UserDashboardPage />, {
      initialEntries: ['/user?register=00AF'],
    })

    expect(await screen.findByRole('dialog', { name: /registrieren/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /brennstoffzellen-code/i })).toHaveValue('00af')
  })

  test('redirects previous register links to the registration dialog', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/register/:code" element={<UserRegistrationPage />} />
        <Route path="/user" element={<UserDashboardPage />} />
      </Routes>,
      {
        initialEntries: ['/register/00B1'],
      },
    )

    expect(await screen.findByRole('dialog', { name: /registrieren/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /brennstoffzellen-code/i })).toHaveValue('00b1')
  })
})
