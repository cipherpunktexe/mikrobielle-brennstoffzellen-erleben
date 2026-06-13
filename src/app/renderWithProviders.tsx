/* eslint-disable react-refresh/only-export-components */
import { CssBaseline, ThemeProvider } from '@mui/material'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'
import { theme } from './theme'
import { AppSnackbarProvider } from '../common/AppSnackbarProvider'
import { LoginDialogProvider } from '../common/LoginDialogProvider'

interface WrapperProps {
  children: ReactNode
  initialEntries?: string[]
}

function Providers({ children, initialEntries }: WrapperProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppSnackbarProvider>
        <LoginDialogProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </LoginDialogProvider>
      </AppSnackbarProvider>
    </ThemeProvider>
  )
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
}

export function renderWithProviders(ui: ReactElement, options?: RenderWithProvidersOptions) {
  const { initialEntries, ...renderOptions } = options ?? {}

  return render(ui, {
    wrapper: ({ children }) => <Providers initialEntries={initialEntries}>{children}</Providers>,
    ...renderOptions,
  })
}
