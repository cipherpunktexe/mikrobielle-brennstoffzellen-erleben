import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { LandingPage } from './LandingPage'
import { renderWithProviders } from '../app/renderWithProviders'

describe('LandingPage', () => {
  test('shows a direct link to the leaderboard', () => {
    renderWithProviders(<LandingPage />)

    expect(
      screen.getByRole('link', {
        name: /zum leaderboard/i,
      }),
    ).toHaveAttribute('href', '/leaderboard')
  })
})
