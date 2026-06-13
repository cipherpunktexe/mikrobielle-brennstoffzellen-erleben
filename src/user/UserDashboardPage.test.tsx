import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { renderWithProviders } from '../app/renderWithProviders'
import { UserDashboardPage } from './UserDashboardPage'

const firebaseMockState = vi.hoisted(() => ({
  authUser: null as { uid: string } | null,
  profile: undefined as
    | {
        id: string
        name: string
        email: string
        role: 'user'
        status: 'active'
        generatorId?: string
      }
    | null
    | undefined,
}))

vi.mock('../data/firebaseData', () => ({
  linkCurrentUserToGeneratorByCode: vi.fn(),
  login: vi.fn(),
  registerUserWithGenerator: vi.fn(),
  signInWithGoogle: vi.fn(),
  subscribeToAuth: (callback: (user: { uid: string } | null) => void) => {
    callback(firebaseMockState.authUser)
    return vi.fn()
  },
  subscribeToGenerator: vi.fn(() => vi.fn()),
  subscribeToLeaderboard: vi.fn(() => vi.fn()),
  subscribeToMeasurements: vi.fn(() => vi.fn()),
  subscribeToUserProfile: vi.fn(
    (
      _uid: string,
      callback: (profile: typeof firebaseMockState.profile) => void,
    ) => {
      if (firebaseMockState.profile !== undefined) {
        callback(firebaseMockState.profile)
      }

      return vi.fn()
    },
  ),
  updateCurrentUserDisplayName: vi.fn(),
}))

describe('UserDashboardPage', () => {
  beforeEach(() => {
    firebaseMockState.authUser = null
    firebaseMockState.profile = undefined
  })

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

  test('shows a dashboard skeleton while the signed-in profile is loading', async () => {
    firebaseMockState.authUser = { uid: 'user-1' }

    renderWithProviders(<UserDashboardPage />)

    expect(
      await screen.findByRole('status', { name: /deine brennstoffzelle wird geladen/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/für diese brennstoffzelle liegen noch keine messwerte vor/i))
      .not.toBeInTheDocument()
  })

  test('keeps the skeleton visible while generator values are loading', async () => {
    firebaseMockState.authUser = { uid: 'user-1' }
    firebaseMockState.profile = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      status: 'active',
      generatorId: 'generator-1',
    }

    renderWithProviders(<UserDashboardPage />)

    expect(
      await screen.findByRole('status', { name: /deine brennstoffzelle wird geladen/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/für diese brennstoffzelle liegen noch keine messwerte vor/i))
      .not.toBeInTheDocument()
  })
})
