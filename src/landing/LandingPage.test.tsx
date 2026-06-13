import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../app/renderWithProviders'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  test('presents the actual project content without placeholders', () => {
    renderWithProviders(<LandingPage />)

    expect(
      screen.getByRole('heading', { name: /mikrobielle brennstoffzellen erleben/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Mikroorganismen/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /mikroskopieren/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /eigene brennstoffzelle bauen/i })).toBeInTheDocument()
    expect(screen.getByText(/Technischen Universität Braunschweig/)).toBeInTheDocument()
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument()
  })
})
