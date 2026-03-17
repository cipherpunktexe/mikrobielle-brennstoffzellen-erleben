import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import './index.css'
import App from './App'
import { theme } from './theme'
import { AppSnackbarProvider } from '../common/AppSnackbarProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppSnackbarProvider>
        <App />
      </AppSnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
)
