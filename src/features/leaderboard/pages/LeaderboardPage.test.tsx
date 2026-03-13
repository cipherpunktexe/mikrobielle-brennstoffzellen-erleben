import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { LeaderboardPage } from './LeaderboardPage'
import { renderWithProviders } from '../../../shared/testing/renderWithProviders'

const { subscribeToLeaderboardMock, subscribeToMeasurementsMock } = vi.hoisted(() => ({
  subscribeToLeaderboardMock: vi.fn(),
  subscribeToMeasurementsMock: vi.fn(),
}))

vi.mock('../../../shared/data/firebaseData', () => ({
  subscribeToLeaderboard: subscribeToLeaderboardMock,
  subscribeToMeasurements: subscribeToMeasurementsMock,
}))

describe('LeaderboardPage', () => {
  test('renders leaderboard entries from the realtime subscription', async () => {
    subscribeToMeasurementsMock.mockImplementation(() => vi.fn())
    subscribeToLeaderboardMock.mockImplementation((callback: (entries: unknown[]) => void) => {
      callback([
        {
          generatorId: 'gen-1',
          code: 'station-017',
          displayName: 'Julia',
          maxValue: 1.42,
          maxMeasuredAt: {
            toDate: () => new Date('2026-03-12T21:15:00.000Z'),
          },
        },
      ])

      return vi.fn()
    })

    renderWithProviders(<LeaderboardPage />)

    expect((await screen.findAllByText('Julia')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('1.42 V')).length).toBeGreaterThan(0)
  })

  test('renders an empty state when no leaderboard entries exist yet', async () => {
    subscribeToMeasurementsMock.mockImplementation(() => vi.fn())
    subscribeToLeaderboardMock.mockImplementation((callback: (entries: unknown[]) => void) => {
      callback([])
      return vi.fn()
    })

    renderWithProviders(<LeaderboardPage />)

    expect(await screen.findByText('Noch keine Messwerte vorhanden.')).toBeInTheDocument()
    expect(screen.queryByText('Top 5')).not.toBeInTheDocument()
  })

  test('splits larger rankings into progressive leaderboard sections', async () => {
    subscribeToMeasurementsMock.mockImplementation(() => vi.fn())
    subscribeToLeaderboardMock.mockImplementation((callback: (entries: unknown[]) => void) => {
      callback(
        Array.from({ length: 12 }, (_, index) => ({
          generatorId: `gen-${index + 1}`,
          code: `station-${String(index + 1).padStart(3, '0')}`,
          displayName: `Nutzer ${index + 1}`,
          maxValue: 2 - index * 0.05,
          maxMeasuredAt: null,
        })),
      )

      return vi.fn()
    })

    renderWithProviders(<LeaderboardPage />)

    expect(await screen.findByText('Top 5')).toBeInTheDocument()
    expect(screen.getByText('Plätze 4-5')).toBeInTheDocument()
    expect(screen.getByText('Top 10')).toBeInTheDocument()
    expect(screen.getByText('Plätze 6-10')).toBeInTheDocument()
    expect(screen.getByText('Top 12')).toBeInTheDocument()
    expect(screen.getByText('Plätze 11-12')).toBeInTheDocument()
  })

  test('opens a chart dialog when a leaderboard entry is clicked', async () => {
    const user = userEvent.setup()

    subscribeToMeasurementsMock.mockImplementation((generatorId: string, callback: (entries: unknown[]) => void) => {
      callback([
        {
          id: 'measurement-1',
          generatorId,
          value: 1.15,
          enteredBy: 'admin@example.com',
          createdAt: {
            toDate: () => new Date('2026-03-10T21:15:00.000Z'),
            toMillis: () => new Date('2026-03-10T21:15:00.000Z').getTime(),
          },
        },
        {
          id: 'measurement-2',
          generatorId,
          value: 1.42,
          enteredBy: 'admin@example.com',
          createdAt: {
            toDate: () => new Date('2026-03-12T21:15:00.000Z'),
            toMillis: () => new Date('2026-03-12T21:15:00.000Z').getTime(),
          },
        },
      ])

      return vi.fn()
    })

    subscribeToLeaderboardMock.mockImplementation((callback: (entries: unknown[]) => void) => {
      callback([
        {
          generatorId: 'gen-1',
          code: 'station-017',
          displayName: 'Julia',
          maxValue: 1.42,
          maxMeasuredAt: {
            toDate: () => new Date('2026-03-12T21:15:00.000Z'),
          },
        },
      ])

      return vi.fn()
    })

    renderWithProviders(<LeaderboardPage />)

    await user.click((await screen.findAllByText('Julia'))[0])

    expect(await screen.findByText('Messverlauf: Julia')).toBeInTheDocument()
    expect(screen.getByLabelText('Diagramm der Messwerthistorie')).toBeInTheDocument()
    expect(screen.getByText('Aktueller Messwert: 1.42 V')).toBeInTheDocument()
  })
})
