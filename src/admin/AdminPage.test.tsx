import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { vi } from 'vitest'
import { renderWithProviders } from '../app/renderWithProviders'
import { AdminPage } from './AdminPage'

vi.mock('../data/firebaseData', () => ({
  addMeasurementByCode: vi.fn(),
  getGeneratorByCode: vi.fn(),
  getMeasurementsForAdmin: vi.fn(),
  getNextGeneratorCodePreview: vi.fn(),
  getRecentMeasurementsEnteredBy: vi.fn(),
  getUserProfile: vi.fn(() => new Promise(() => undefined)),
  listGeneratorsForAdmin: vi.fn(),
  listUserProfilesForAdmin: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  reserveNextGeneratorCodes: vi.fn(),
  setUserLifecycleStatusAsAdmin: vi.fn(),
  signInWithGoogle: vi.fn(),
  subscribeToAuth: (callback: (user: { uid: string }) => void) => {
    callback({ uid: 'admin-1' })
    return vi.fn()
  },
  updateMeasurementAsAdmin: vi.fn(),
  updateUserProfileAsAdmin: vi.fn(),
}))

test('shows a neutral skeleton while the admin role is loading', async () => {
  renderWithProviders(<AdminPage />, { initialEntries: ['/admin/scan'] })

  expect(
    await screen.findByRole('status', { name: /admin-bereich wird geladen/i }),
  ).toBeInTheDocument()
  expect(screen.queryByText(/keine admin-rolle/i)).not.toBeInTheDocument()
})
