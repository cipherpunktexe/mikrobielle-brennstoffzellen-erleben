/* eslint-disable react-refresh/only-export-components */
import { Box, CircularProgress } from '@mui/material'
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './AppShell'

const LandingPage = lazy(() =>
  import('../landing/LandingPage').then((module) => ({
    default: module.LandingPage,
  })),
)
const UserRegistrationPage = lazy(() =>
  import('../user/UserRegistrationPage').then((module) => ({
    default: module.UserRegistrationPage,
  })),
)
const UserDashboardPage = lazy(() =>
  import('../user/UserDashboardPage').then((module) => ({
    default: module.UserDashboardPage,
  })),
)
const AdminPage = lazy(() =>
  import('../admin/AdminPage').then((module) => ({ default: module.AdminPage })),
)
const LeaderboardPage = lazy(() =>
  import('../leaderboard/LeaderboardPage').then((module) => ({
    default: module.LeaderboardPage,
  })),
)
const ImpressumPage = lazy(() =>
  import('../legal/ImpressumPage').then((module) => ({
    default: module.ImpressumPage,
  })),
)
const AboutPage = lazy(() =>
  import('../legal/AboutPage').then((module) => ({ default: module.AboutPage })),
)
const DatenschutzPage = lazy(() =>
  import('../legal/DatenschutzPage').then((module) => ({
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
      { path: 'admin/:tab', element: withSuspense(<AdminPage />) },
      { path: 'admin/generator/:code', element: withSuspense(<AdminPage />) },
      { path: 'admin/:tab/generator/:code', element: withSuspense(<AdminPage />) },
      { path: 'leaderboard', element: withSuspense(<LeaderboardPage />) },
      { path: 'ueber-uns', element: withSuspense(<AboutPage />) },
      { path: 'impressum', element: withSuspense(<ImpressumPage />) },
      { path: 'datenschutz', element: withSuspense(<DatenschutzPage />) },
    ],
  },
])
