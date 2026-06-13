import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../app/renderWithProviders'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  test('shows only the project hero and presentation sections', () => {
    renderWithProviders(<LandingPage />)

    expect(
      screen.getByRole('heading', { name: /mikrobielle brennstoffzellen erleben/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('IdeenExpo-Projekt')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /projektpräsentation/i })).toBeInTheDocument()
    expect(
      screen.getByTitle(/projektpräsentation mikrobielle brennstoffzellen erleben/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /mikroskopieren/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Technischen Universität Braunschweig/)).not.toBeInTheDocument()
  })
})
