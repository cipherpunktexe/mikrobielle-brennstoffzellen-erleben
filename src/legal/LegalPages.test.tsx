import '@testing-library/jest-dom/vitest'
import { ThemeProvider } from '@mui/material'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach } from 'vitest'
import { theme } from '../app/theme'
import { AboutPage } from './AboutPage'
import { DatenschutzPage } from './DatenschutzPage'
import { ImpressumPage } from './ImpressumPage'
import { contactDetails } from './contactDetails'

afterEach(cleanup)

function renderLegalPage(page: React.ReactNode) {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>{page}</MemoryRouter>
    </ThemeProvider>,
  )
}

describe('legal pages', () => {
  test.each([
    ['Über uns', <AboutPage />],
    ['Impressum', <ImpressumPage />],
    ['Datenschutz', <DatenschutzPage />],
  ])('%s uses the central contact details', (_name, page) => {
    const { container } = renderLegalPage(page)

    expect(container).toHaveTextContent(contactDetails.responsiblePerson)
    expect(container).toHaveTextContent(contactDetails.streetAddress)
    expect(screen.getAllByText(contactDetails.email).length).toBeGreaterThan(0)
  })
})
