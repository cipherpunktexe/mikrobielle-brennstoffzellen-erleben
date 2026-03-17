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
                borderColor: (theme) => theme.custom.border.strong,
                bgcolor: (theme) =>
                  mobileAdminNavOpen ? theme.custom.state.brandSoft : theme.custom.surface.strong,
                color: 'text.primary',
                boxShadow: mobileAdminNavOpen ? (theme) => theme.custom.shadow.soft : 'none',
                '& .MuiButton-endIcon': {
                  color: 'text.secondary',
                },
                '&:hover': {
                  borderColor: (theme) => theme.custom.border.interactiveStrong,
                  bgcolor: (theme) =>
                    mobileAdminNavOpen ? theme.custom.state.brandSelected : theme.custom.surface.elevated,
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
                  borderRadius: 2,
                  border: (theme) => `1px solid ${theme.custom.border.strong}`,
                  overflow: 'hidden',
                  bgcolor: (theme) => theme.custom.surface.elevated,
                  boxShadow: (theme) => theme.custom.shadow.panel,
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
                          index < adminTabItems.length - 1
                            ? (theme) => `1px solid ${theme.custom.border.soft}`
                            : 'none',
                        color: 'text.primary',
                        '&:hover': {
                          bgcolor: (theme) => theme.custom.state.brandSoft,
                        },
                        '&.Mui-selected': {
                          bgcolor: (theme) => theme.custom.state.brandSelected,
                          boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.secondary.main}`,
                        },
                        '&.Mui-selected:hover': {
                          bgcolor: (theme) => theme.custom.state.brandSelectedHover,
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
