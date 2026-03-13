import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import LogoutIcon from '@mui/icons-material/Logout'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import ScienceIcon from '@mui/icons-material/Science'
import SpaIcon from '@mui/icons-material/Spa'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useState, type MouseEvent } from 'react'
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import { getUserProfile, logout, subscribeToAuth } from '../services/firebaseData'
import type { UserProfile } from '../types/domain'

const navigationItems = [
  { label: 'Landingpage', to: '/', icon: <SpaIcon fontSize="small" /> },
  { label: 'Deine Brennstoffzelle', to: '/user', icon: <QrCode2Icon fontSize="small" /> },
  { label: 'Leaderboard', to: '/leaderboard', icon: <EmojiEventsIcon fontSize="small" /> },
]

export function AppShell() {
  const location = useLocation()
  const theme = useTheme()
  const isMobileViewport = useMediaQuery(theme.breakpoints.down('sm'))
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [authUserId, setAuthUserId] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    return subscribeToAuth((user) => {
      setAuthUserId(user?.uid ?? '')
      setAuthEmail(user?.email ?? '')
      if (!user) {
        setProfile(null)
      }
    })
  }, [])

  useEffect(() => {
    let active = true

    if (!authUserId) {
      return
    }

    void getUserProfile(authUserId).then((nextProfile) => {
      if (active) {
        setProfile(nextProfile)
      }
    })

    return () => {
      active = false
    }
  }, [authUserId])

  const menuOpen = Boolean(menuAnchor)
  const accountName = profile?.name || authEmail || 'Gast'
  const accountEmail = profile?.email || authEmail || 'Nicht angemeldet'
  const accountRole = profile?.role === 'admin' ? 'Admin' : profile?.role === 'user' ? 'User' : 'Kein Konto'
  const avatarLabel = accountName.charAt(0).toUpperCase() || 'G'
  const visibleNavigationItems =
    profile?.role === 'admin'
      ? [...navigationItems, { label: 'Admin', to: '/admin', icon: <ScienceIcon fontSize="small" /> }]
      : navigationItems

  function handleOpenMenu(event: MouseEvent<HTMLElement>) {
    setMenuAnchor(event.currentTarget)
  }

  function handleCloseMenu() {
    setMenuAnchor(null)
  }

  async function handleLogout() {
    handleCloseMenu()
    await logout()
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky">
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: { xs: 88, sm: 96 }, gap: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: { xs: 64, sm: 76 },
                  height: { xs: 64, sm: 76 },
                  borderRadius: { xs: '16px', sm: '20px' },
                  overflow: 'hidden',
                  background: 'rgba(249,246,239,0.14)',
                  border: '1px solid rgba(255,248,231,0.22)',
                  flexShrink: 0,
                }}
              >
                <Box
                  component="img"
                  src="/app-logo.png"
                  alt="App-Logo"
                  sx={{
                    width: { xs: 52, sm: 60 },
                    height: { xs: 52, sm: 60 },
                    objectFit: 'contain',
                    display: 'block',
                    mx: 'auto',
                    my: { xs: 0.75, sm: 1 },
                  }}
                />
              </Box>
              <Box component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'primary.contrastText',
                    lineHeight: 1,
                    fontWeight: 700,
                    fontSize: isMobileViewport ? '1rem' : undefined,
                  }}
                >
                  Mikrobielle Brennstoffzellen erleben!
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {visibleNavigationItems.map((item) => {
                const active =
                  item.to === '/'
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to)

                return (
                  <Button
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    color="inherit"
                    startIcon={item.icon}
                    sx={{
                      color: 'primary.contrastText',
                      backgroundColor: active ? 'rgba(249,246,239,0.16)' : 'transparent',
                    }}
                  >
                    {item.label}
                  </Button>
                )
              })}
            </Stack>

            <IconButton
              aria-label="Account-Menü öffnen"
              color="inherit"
              onClick={handleOpenMenu}
              sx={{ ml: { xs: 0, md: 1 } }}
            >
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: 'rgba(249,246,239,0.18)',
                  color: 'primary.contrastText',
                  border: '1px solid rgba(249,246,239,0.22)',
                  fontWeight: 700,
                }}
              >
                {avatarLabel}
              </Avatar>
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 260,
              borderRadius: '16px',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {accountName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {accountEmail}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {accountRole}
          </Typography>
        </Box>
        <Divider />
        {isMobileViewport
          ? visibleNavigationItems.map((item) => (
              <MenuItem
                key={item.to}
                component={RouterLink}
                to={item.to}
                onClick={handleCloseMenu}
                selected={
                  item.to === '/'
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to)
                }
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  {item.icon}
                  <span>{item.label}</span>
                </Stack>
              </MenuItem>
            ))
          : null}
        {isMobileViewport ? <Divider /> : null}
        <MenuItem component={RouterLink} to="/user" onClick={handleCloseMenu}>
          Account-Info
        </MenuItem>
        <MenuItem onClick={() => void handleLogout()} disabled={!authUserId}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <LogoutIcon fontSize="small" />
            <span>Logout</span>
          </Stack>
        </MenuItem>
      </Menu>

      <Box sx={{ flexGrow: 1 }}>
        <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 6, md: 8 } }}>
          <Outlet />
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          mt: 'auto',
          borderTop: '1px solid rgba(121,101,66,0.22)',
          background: 'rgba(249, 246, 239, 0.42)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 3 } }}>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: { xs: '0.68rem', sm: undefined },
                }}
              >
                Rechtliches
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={{ xs: 1, sm: 1 }}
              sx={{ ml: 'auto' }}
              divider={
                <Divider
                  flexItem
                  orientation="vertical"
                  sx={{ display: { xs: 'block', sm: 'block' } }}
                />
              }
            >
              <Button
                component={RouterLink}
                to="/impressum"
                color="inherit"
                variant="text"
                size={isMobileViewport ? 'small' : 'medium'}
                fullWidth={false}
                sx={{
                  justifyContent: 'center',
                  minHeight: { xs: 30, sm: 36 },
                  px: { xs: 0, sm: 2 },
                  py: { xs: 0.25, sm: 0.5 },
                  minWidth: 0,
                  fontSize: { xs: '0.82rem', sm: undefined },
                }}
              >
                Impressum
              </Button>
              <Button
                component={RouterLink}
                to="/datenschutz"
                color="inherit"
                variant="text"
                size={isMobileViewport ? 'small' : 'medium'}
                fullWidth={false}
                sx={{
                  justifyContent: 'center',
                  minHeight: { xs: 30, sm: 36 },
                  px: { xs: 0, sm: 2 },
                  py: { xs: 0.25, sm: 0.5 },
                  minWidth: 0,
                  fontSize: { xs: '0.82rem', sm: undefined },
                }}
              >
                Datenschutz
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
