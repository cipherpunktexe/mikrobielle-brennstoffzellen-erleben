import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { LeaderboardPage } from './LeaderboardPage'
import { renderWithProviders } from '../test/renderWithProviders'

const { subscribeToLeaderboardMock, subscribeToMeasurementsMock } = vi.hoisted(() => ({
  subscribeToLeaderboardMock: vi.fn(),
  subscribeToMeasurementsMock: vi.fn(),
}))

vi.mock('../services/firebaseData', () => ({
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
          latestValue: 1.42,
          measuredAt: {
            toDate: () => new Date('2026-03-12T21:15:00.000Z'),
          },
        },
      ])

      return vi.fn()
    })

    renderWithProviders(<LeaderboardPage />)

    expect((await screen.findAllByText('station-017')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('1.42 V')).length).toBeGreaterThan(0)
  })

  test('renders sample fuel cells when no leaderboard entries exist yet', async () => {
    subscribeToMeasurementsMock.mockImplementation(() => vi.fn())
    subscribeToLeaderboardMock.mockImplementation((callback: (entries: unknown[]) => void) => {
      callback([])
      return vi.fn()
    })

    renderWithProviders(<LeaderboardPage />)

    expect(
      await screen.findByText(
        'Aktuell werden Beispiel-Brennstoffzellen angezeigt, bis echte Messwerte vorhanden sind.',
      ),
    ).toBeInTheDocument()
    expect((await screen.findAllByText('beispiel-001')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('1.82 V')).length).toBeGreaterThan(0)
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
          latestValue: 1.42,
          measuredAt: {
            toDate: () => new Date('2026-03-12T21:15:00.000Z'),
          },
        },
      ])

      return vi.fn()
    })

    renderWithProviders(<LeaderboardPage />)

    await user.click((await screen.findAllByText('station-017'))[0])

    expect(await screen.findByText('Messverlauf fuer station-017')).toBeInTheDocument()
    expect(screen.getByLabelText('Diagramm der Messwerthistorie')).toBeInTheDocument()
    expect(screen.getByText('Aktueller Messwert: 1.42 V')).toBeInTheDocument()
  })
})
