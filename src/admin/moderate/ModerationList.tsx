import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Box, Chip, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material'
import type { MouseEvent } from 'react'
import { UnifiedList, type UnifiedListColumn } from '../../common/UnifiedList'
import type { Generator, UserProfile } from '../../data/domain'
import type { ModerationListEntry } from '../types'
import { getLifecycleStatusLabel } from '../utils'

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
  const theme = useTheme()
  const isMobileViewport = useMediaQuery(theme.breakpoints.down('sm'))

  const columns: UnifiedListColumn<ModerationListEntry>[] = [
    {
      key: 'user',
      header: 'Nutzer',
      mobileLabel: 'Nutzer',
      width: isMobileViewport
        ? showStatus
          ? 'minmax(90px, 1fr)'
          : 'minmax(102px, 1fr)'
        : showStatus
          ? 'minmax(0, 1.2fr)'
          : 'minmax(0, 1.4fr)',
      render: ({ user }) => (
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
          </Box>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      mobileLabel: 'Code',
      width: isMobileViewport ? '82px' : '124px',
      render: ({ generator }) => (
        <Typography
          variant="body2"
          sx={{
            fontFamily: '"Consolas", "Courier New", monospace',
            fontWeight: 700,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
            fontSize: { xs: '0.9rem', sm: '0.95rem' },
          }}
        >
          {generator ? generator.code.toUpperCase() : '-'}
        </Typography>
      ),
    },
    ...(showStatus
      ? [
          {
            key: 'status',
            header: 'Status',
            mobileLabel: 'Status',
            width: isMobileViewport ? '84px' : '112px',
            render: ({ status }: ModerationListEntry) =>
              status !== 'active' ? (
                <Chip
                  size="small"
                  label={getLifecycleStatusLabel(status)}
                  color={status === 'blocked' ? 'warning' : 'default'}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Aktiv
                </Typography>
              ),
          } satisfies UnifiedListColumn<ModerationListEntry>,
        ]
      : []),
  ]

  return (
    <UnifiedList
      items={entries}
      columns={columns}
      getItemKey={(entry) => entry.user.id}
      ariaLabel={ariaLabel}
      emptyPrimary={emptyPrimary}
      emptySecondary={emptySecondary}
      onItemClick={(entry) => {
        if (entry.generator) {
          onOpenMeasurements(entry.generator)
        }
      }}
      isItemDisabled={(entry) => !entry.generator}
      getItemAriaLabel={(entry) =>
        entry.generator
          ? `Messwerte von ${entry.user.name} mit Code ${entry.generator.code.toUpperCase()} öffnen`
          : `${entry.user.name} hat keine verknüpfte Brennstoffzelle`
      }
      renderItemAction={(entry) => (
        <IconButton
          edge="end"
          onClick={(event) => {
            event.stopPropagation()
            onOpenActions(event, entry.user, entry.generator)
          }}
          aria-label={`Aktionen für ${entry.user.name}`}
          sx={{
            width: 32,
            height: 32,
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
      )}
      minDesktopWidth={showStatus ? 300 : 248}
    />
  )
}
