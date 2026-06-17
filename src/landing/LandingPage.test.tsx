import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { vi } from 'vitest'
import { renderWithProviders } from '../app/renderWithProviders'
import { LandingPage } from './LandingPage'

vi.mock('../data/firebaseData.experiment', () => ({
  subscribeToExperimentMeasurements: vi.fn((callback) => {
    callback([])
    return vi.fn()
  }),
}))

describe('LandingPage', () => {
  test('shows the project hero, live experiment and presentation sections', () => {
    renderWithProviders(<LandingPage />)

    expect(
      screen.getByRole('heading', { name: /mikrobielle brennstoffzellen erleben/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('IdeenExpo-Projekt')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /spannung am großen versuchsaufbau/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /projektpräsentation/i })).toBeInTheDocument()
    expect(
      screen.getByTitle(/projektpräsentation mikrobielle brennstoffzellen erleben/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /mikroskopieren/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Technischen Universität Braunschweig/)).not.toBeInTheDocument()
  })
})
