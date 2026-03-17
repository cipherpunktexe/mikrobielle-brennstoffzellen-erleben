import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Box,
  Button,
  Card,
  Collapse,
  List,
  ListItemButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import type { SyntheticEvent } from 'react'
import { adminTabItems } from './adminTabs'
import type { AdminTabValue } from './types'

interface AdminNavigationProps {
  activeTab: AdminTabValue
  isMobileViewport: boolean
  mobileAdminNavOpen: boolean
  onToggleMobileNav: () => void
  onTabChange: (_event: SyntheticEvent, value: AdminTabValue) => void
  onNavigateToTab: (value: AdminTabValue) => void
}

export function AdminNavigation({
  activeTab,
  isMobileViewport,
  mobileAdminNavOpen,
  onToggleMobileNav,
  onTabChange,
  onNavigateToTab,
}: AdminNavigationProps) {
  const activeAdminTabItem = adminTabItems.find((item) => item.value === activeTab) ?? adminTabItems[0]

  return (
    <Card>
      {isMobileViewport ? (
        <Box sx={{ p: 1.25 }}>
          <Stack spacing={1}>
            <Button
              type="button"
              variant="outlined"
              color="primary"
              onClick={onToggleMobileNav}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: mobileAdminNavOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 180ms ease',
                  }}
                />
              }
              sx={{
                justifyContent: 'space-between',
                px: 1.5,
                py: 1.15,
                borderRadius: 999,
                borderColor: 'rgba(121,101,66,0.35)',
                bgcolor: mobileAdminNavOpen ? 'rgba(143,122,81,0.12)' : 'rgba(255,255,255,0.74)',
                color: 'text.primary',
                boxShadow: mobileAdminNavOpen ? '0 8px 20px rgba(36,28,19,0.1)' : 'none',
                '& .MuiButton-endIcon': {
                  color: 'rgba(77,67,49,0.9)',
                },
                '&:hover': {
                  borderColor: 'rgba(121,101,66,0.52)',
                  bgcolor: mobileAdminNavOpen ? 'rgba(143,122,81,0.18)' : 'rgba(255,255,255,0.92)',
                },
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                {activeAdminTabItem.icon}
                <Typography fontWeight={700} noWrap>
                  {activeAdminTabItem.label}
                </Typography>
              </Stack>
            </Button>
            <Collapse in={mobileAdminNavOpen}>
              <Box
                sx={{
                  borderRadius: 4,
                  border: '1px solid rgba(121,101,66,0.2)',
                  overflow: 'hidden',
                  bgcolor: 'rgba(249,246,239,0.9)',
                  boxShadow: '0 12px 28px rgba(36,28,19,0.1)',
                }}
              >
                <List disablePadding>
                  {adminTabItems.map((item, index) => (
                    <ListItemButton
                      key={item.value}
                      selected={item.value === activeTab}
                      onClick={() => onNavigateToTab(item.value)}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom:
                          index < adminTabItems.length - 1 ? '1px solid rgba(121,101,66,0.12)' : 'none',
                        color: 'text.primary',
                        '&:hover': {
                          bgcolor: 'rgba(143,122,81,0.1)',
                        },
                        '&.Mui-selected': {
                          bgcolor: 'rgba(143,122,81,0.17)',
                          boxShadow: 'inset 3px 0 0 #796542',
                        },
                        '&.Mui-selected:hover': {
                          bgcolor: 'rgba(143,122,81,0.22)',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                        {item.icon}
                        <Typography fontWeight={item.value === activeTab ? 700 : 600} noWrap>
                          {item.label}
                        </Typography>
                      </Stack>
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            </Collapse>
          </Stack>
        </Box>
      ) : (
        <Tabs
          value={activeTab}
          onChange={onTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: { xs: 1, sm: 2 }, pt: 1 }}
        >
          {adminTabItems.map((item) => (
            <Tab
              key={item.value}
              value={item.value}
              label={item.label}
              icon={item.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      )}
    </Card>
  )
}
