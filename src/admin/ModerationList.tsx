import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import type { MouseEvent } from 'react'
import { getLifecycleStatusLabel } from './utils'
import type { ModerationListEntry } from './types'
import type { Generator, UserProfile } from '../common/domain'

interface ModerationListProps {
  entries: ModerationListEntry[]
  ariaLabel: string
  emptyPrimary: string
  emptySecondary?: string
  showStatus?: boolean
  onOpenActions: (
    event: MouseEvent<HTMLElement>,
    user: UserProfile,
    generator: Generator | null,
  ) => void
  onOpenMeasurements: (generator: Generator) => void
}

export function ModerationList({
  entries,
  ariaLabel,
  emptyPrimary,
  emptySecondary,
  showStatus = false,
  onOpenActions,
  onOpenMeasurements,
}: ModerationListProps) {
  return (
    <Box
      sx={{
        borderRadius: 2.5,
        overflow: 'hidden',
        border: '1px solid rgba(121,101,66,0.14)',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', sm: 'grid' },
          gridTemplateColumns: showStatus ? 'minmax(0, 1.2fr) 124px 112px' : 'minmax(0, 1.4fr) 124px',
          gap: 1.5,
          px: 2,
          py: 1,
          pr: 6,
          borderBottom: entries.length ? '1px solid rgba(121,101,66,0.1)' : 'none',
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em' }}>
          Nutzer
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em' }}>
          Code
        </Typography>
        {showStatus ? (
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em' }}>
            Status
          </Typography>
        ) : null}
      </Box>
      <List disablePadding aria-label={ariaLabel}>
        {entries.length ? (
          entries.map(({ user, generator, status }, index) => (
            <ListItem
              key={user.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={(event) => onOpenActions(event, user, generator)}
                  aria-label={`Aktionen für ${user.name}`}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.75,
                    color: 'rgba(110,103,95,0.92)',
                    '&:hover': {
                      bgcolor: 'rgba(121,101,66,0.08)',
                    },
                    '&:focus-visible': {
                      outline: '2px solid rgba(143,122,81,0.55)',
                      outlineOffset: 2,
                    },
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              }
              sx={{
                borderBottom: index < entries.length - 1 ? '1px solid rgba(121,101,66,0.1)' : 'none',
              }}
            >
              <ListItemButton
                disabled={!generator}
                aria-label={
                  generator
                    ? `Messwerte von ${user.name} mit Code ${generator.code.toUpperCase()} öffnen`
                    : `${user.name} hat keine verknüpfte Brennstoffzelle`
                }
                onClick={() => {
                  if (generator) {
                    onOpenMeasurements(generator)
                  }
                }}
                sx={{
                  px: { xs: 1.5, sm: 1.75 },
                  py: 1.3,
                  pr: 6,
                  alignItems: 'center',
                  borderRadius: 0,
                  '&.Mui-disabled': {
                    opacity: 1,
                    cursor: 'default',
                  },
                  '&:hover': {
                    bgcolor: generator ? 'rgba(255,255,255,0.34)' : 'transparent',
                  },
                  '&:focus-visible': {
                    outline: '2px solid rgba(143,122,81,0.55)',
                    outlineOffset: -2,
                    bgcolor: 'rgba(255,255,255,0.34)',
                  },
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box
                    sx={{
                      width: '100%',
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: showStatus ? 'minmax(0, 1.2fr) 124px 112px' : 'minmax(0, 1.4fr) 124px',
                      },
                      gap: { xs: 1, sm: 1.5 },
                      alignItems: 'center',
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {user.name}
                        </Typography>
                        {user.role === 'admin' ? (
                          <Box
                            component="span"
                            aria-label="Admin"
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#8F6410',
                              flexShrink: 0,
                            }}
                          >
                            <AdminPanelSettingsOutlinedIcon fontSize="small" />
                          </Box>
                        ) : null}
                        {showStatus && status !== 'active' ? (
                          <Chip
                            size="small"
                            label={getLifecycleStatusLabel(status)}
                            color={status === 'blocked' ? 'warning' : 'default'}
                            sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                          />
                        ) : null}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                    <Box sx={{ minWidth: 0, justifySelf: 'start', width: '100%' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: '"Consolas", "Courier New", monospace',
                          fontWeight: 700,
                          letterSpacing: '0.03em',
                          whiteSpace: 'nowrap',
                          textAlign: 'left',
                        }}
                      >
                        {generator ? generator.code.toUpperCase() : '-'}
                      </Typography>
                    </Box>
                    {showStatus ? (
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {status !== 'active' ? (
                          <Chip
                            size="small"
                            label={getLifecycleStatusLabel(status)}
                            color={status === 'blocked' ? 'warning' : 'default'}
                          />
                        ) : null}
                      </Box>
                    ) : null}
                  </Box>
                </Box>
              </ListItemButton>
            </ListItem>
          ))
        ) : (
          <ListItem sx={{ px: 1, py: 1 }}>
            <ListItemText primary={emptyPrimary} secondary={emptySecondary} />
          </ListItem>
        )}
      </List>
    </Box>
  )
}
