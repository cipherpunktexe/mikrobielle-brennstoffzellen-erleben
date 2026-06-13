import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'
import { renderWithProviders } from '../app/renderWithProviders'
import { AdminPage } from './AdminPage'

const adminMocks = vi.hoisted(() => ({
  profileMode: 'pending' as 'pending' | 'admin',
  getGeneratorByCode: vi.fn(),
}))

vi.mock('../data/firebaseData', () => ({
  addMeasurementByCode: vi.fn(),
  getGeneratorByCode: adminMocks.getGeneratorByCode,
  getMeasurementsForAdmin: vi.fn(),
  getNextGeneratorCodePreview: vi.fn(async () => ({
    code: '0001',
    sequence: 1,
  })),
  getRecentMeasurementsEnteredBy: vi.fn(async () => []),
  getUserProfile: vi.fn(() =>
    adminMocks.profileMode === 'admin'
      ? Promise.resolve({
          id: 'admin-1',
          name: 'Admin',
          email: 'admin@example.com',
          role: 'admin',
          status: 'active',
        })
      : new Promise(() => undefined),
  ),
  listGeneratorsForAdmin: vi.fn(async () => []),
  listUserProfilesForAdmin: vi.fn(async () => []),
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

beforeEach(() => {
  adminMocks.profileMode = 'pending'
  adminMocks.getGeneratorByCode.mockReset()
})

test('shows a neutral skeleton while the admin role is loading', async () => {
  renderWithProviders(<AdminPage />, { initialEntries: ['/admin/scan'] })

  expect(
    await screen.findByRole('status', { name: /admin-bereich wird geladen/i }),
  ).toBeInTheDocument()
  expect(screen.queryByText(/keine admin-rolle/i)).not.toBeInTheDocument()
})

test.each([
  {
    name: 'unlinked code',
    generator: null,
    expectsMeasurementDialog: false,
  },
  {
    name: 'linked code',
    generator: {
      id: 'generator-1',
      code: '00af',
      ownerUid: 'user-1',
      ownerName: 'Test',
      status: 'active',
    },
    expectsMeasurementDialog: true,
  },
])('keeps the scanner open after scanning a $name', async ({
  generator,
  expectsMeasurementDialog,
}) => {
  const user = userEvent.setup()
  adminMocks.profileMode = 'admin'
  adminMocks.getGeneratorByCode.mockResolvedValue(generator)

  renderWithProviders(<AdminPage />, { initialEntries: ['/admin/scan'] })

  await user.click(await screen.findByRole('button', { name: /scanner öffnen/i }))
  await user.click(screen.getByRole('button', { name: /code manuell eingeben/i }))
  await user.type(screen.getByPlaceholderText(/001c/i), '00AF')
  await user.click(screen.getByRole('button', { name: /übernehmen/i }))

  expect(await screen.findByText('Brennstoffzelle scannen')).toBeInTheDocument()

  if (expectsMeasurementDialog) {
    expect(await screen.findByRole('dialog', { name: /messwert eintragen/i })).toBeInTheDocument()
  } else {
    expect(screen.queryByRole('dialog', { name: /messwert eintragen/i })).not.toBeInTheDocument()
  }
})
