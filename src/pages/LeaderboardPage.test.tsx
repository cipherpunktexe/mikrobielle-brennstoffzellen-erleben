import { screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { LeaderboardPage } from './LeaderboardPage'
import { renderWithProviders } from '../test/renderWithProviders'

const { subscribeToLeaderboardMock } = vi.hoisted(() => ({
  subscribeToLeaderboardMock: vi.fn(),
}))

vi.mock('../services/firebaseData', () => ({
  subscribeToLeaderboard: subscribeToLeaderboardMock,
}))

describe('LeaderboardPage', () => {
  test('renders leaderboard entries from the realtime subscription', async () => {
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

    expect(await screen.findByText('station-017')).toBeInTheDocument()
    expect(screen.getByText('1.42 V')).toBeInTheDocument()
  })
})
