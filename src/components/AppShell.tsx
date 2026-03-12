import CompostIcon from '@mui/icons-material/Compost'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import ScienceIcon from '@mui/icons-material/Science'
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
} from '@mui/material'
import { useEffect, useState, type MouseEvent } from 'react'
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import { getUserProfile, logout, subscribeToAuth } from '../services/firebaseData'
import type { UserProfile } from '../types/domain'

const navigationItems = [
  { label: 'Landingpage', to: '/', icon: <CompostIcon fontSize="small" /> },
  { label: 'Deine Brennstoffzelle', to: '/user', icon: <QrCode2Icon fontSize="small" /> },
  { label: 'Leaderboard', to: '/leaderboard', icon: <EmojiEventsIcon fontSize="small" /> },
]

export function AppShell() {
  const location = useLocation()
  const [showMobileNav, setShowMobileNav] = useState(false)
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
          <Toolbar disableGutters sx={{ minHeight: 80, gap: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '14px',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(249,246,239,0.14)',
                  border: '1px solid rgba(255,248,231,0.22)',
                }}
              >
                <CompostIcon sx={{ color: 'primary.contrastText' }} />
              </Box>
              <Box component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography
                  variant="h6"
                  sx={{ color: 'primary.contrastText', lineHeight: 1, fontWeight: 700 }}
                >
                  Mikrobielle Brennstoffzellen erleben!
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
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
              color="inherit"
              onClick={() => setShowMobileNav((value) => !value)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

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

          {showMobileNav ? (
            <Stack direction="column" spacing={1} sx={{ pb: 2, display: { md: 'none' } }}>
              {visibleNavigationItems.map((item) => (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => setShowMobileNav(false)}
                  sx={{ justifyContent: 'flex-start', color: 'primary.contrastText' }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          ) : null}
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
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                Rechtliches
              </Typography>
              <Typography variant="body1">Mikrobielle Brennstoffzellen erleben</Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              divider={<Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', sm: 'block' } }} />}
            >
              <Button component={RouterLink} to="/impressum" color="inherit">
                Impressum
              </Button>
              <Button component={RouterLink} to="/datenschutz" color="inherit">
                Datenschutz
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
