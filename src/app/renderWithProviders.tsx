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
}

function Providers({ children }: WrapperProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppSnackbarProvider>
        <LoginDialogProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </LoginDialogProvider>
      </AppSnackbarProvider>
    </ThemeProvider>
  )
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: Providers,
    ...options,
  })
}
