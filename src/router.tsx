/* eslint-disable react-refresh/only-export-components */
import { Box, CircularProgress } from '@mui/material'
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell'

const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })),
)
const UserRegistrationPage = lazy(() =>
  import('./pages/UserRegistrationPage').then((module) => ({
    default: module.UserRegistrationPage,
  })),
)
const UserDashboardPage = lazy(() =>
  import('./pages/UserDashboardPage').then((module) => ({
    default: module.UserDashboardPage,
  })),
)
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })),
)
const LeaderboardPage = lazy(() =>
  import('./pages/LeaderboardPage').then((module) => ({
    default: module.LeaderboardPage,
  })),
)
const ImpressumPage = lazy(() =>
  import('./pages/ImpressumPage').then((module) => ({ default: module.ImpressumPage })),
)
const DatenschutzPage = lazy(() =>
  import('./pages/DatenschutzPage').then((module) => ({
    default: module.DatenschutzPage,
  })),
)

function RouteFallback() {
  return (
    <Box sx={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
      <CircularProgress color="inherit" />
    </Box>
  )
}

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: withSuspense(<LandingPage />) },
      {
        path: 'register/:code',
        element: withSuspense(<UserRegistrationPage />),
      },
      { path: 'user', element: withSuspense(<UserDashboardPage />) },
      { path: 'admin', element: withSuspense(<AdminPage />) },
      { path: 'admin/generator/:code', element: withSuspense(<AdminPage />) },
      { path: 'leaderboard', element: withSuspense(<LeaderboardPage />) },
      { path: 'impressum', element: withSuspense(<ImpressumPage />) },
      { path: 'datenschutz', element: withSuspense(<DatenschutzPage />) },
    ],
  },
])
