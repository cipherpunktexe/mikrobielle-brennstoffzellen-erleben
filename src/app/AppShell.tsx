import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined'
import ElectricBoltOutlinedIcon from '@mui/icons-material/ElectricBoltOutlined'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import LogoutIcon from '@mui/icons-material/Logout'
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
import { getUserProfile, logout, subscribeToAuth } from '../data/firebaseData'
import type { UserProfile } from '../data/domain'

const navigationItems = [
  { label: 'Projekt', to: '/', icon: <BiotechOutlinedIcon fontSize="small" /> },
  { label: 'Deine Brennstoffzelle', to: '/user', icon: <ElectricBoltOutlinedIcon fontSize="small" /> },
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
  const accountRole =
    profile?.status === 'blocked'
      ? 'Gesperrt'
      : profile?.status === 'deleted'
        ? 'Gelöscht'
        : profile?.role === 'admin'
          ? 'Admin'
          : profile?.role === 'user'
            ? 'User'
            : 'Kein Konto'
  const avatarLabel = accountName.charAt(0).toUpperCase() || 'G'
  const visibleNavigationItems =
    profile?.role === 'admin' && profile?.status !== 'blocked' && profile?.status !== 'deleted'
      ? [...navigationItems, { label: 'Admin', to: '/admin', icon: <AdminPanelSettingsOutlinedIcon fontSize="small" /> }]
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
                      backgroundColor: active ? (theme) => theme.custom.state.brandSoft : 'transparent',
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
                  bgcolor: (theme) => theme.custom.surface.subtle,
                  color: 'primary.contrastText',
                  border: (theme) => `1px solid ${theme.custom.border.default}`,
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
          borderTop: (theme) => `1px solid ${theme.custom.border.strong}`,
          background: (theme) => theme.custom.surface.hover,
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
                to="/ueber-uns"
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
                Über uns
              </Button>
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
