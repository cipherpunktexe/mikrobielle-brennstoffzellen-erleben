import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { renderWithProviders } from '../app/renderWithProviders'
import { UserDashboardPage } from './UserDashboardPage'

vi.mock('../data/firebaseData', () => ({
  linkCurrentUserToGeneratorByCode: vi.fn(),
  login: vi.fn(),
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
  test('shows only a login button for guests and opens the shared dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserDashboardPage />)

    const loginButton = await screen.findByRole('button', { name: /^anmelden$/i })

    expect(screen.queryByRole('textbox', { name: /e-mail/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/brennstoffzellen-code/i)).not.toBeInTheDocument()

    await user.click(loginButton)

    expect(screen.getByRole('dialog', { name: /anmelden/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /e-mail/i })).toBeInTheDocument()
  })
})
