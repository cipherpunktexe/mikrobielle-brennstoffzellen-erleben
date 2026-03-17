import CloseIcon from '@mui/icons-material/Close'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import { Alert, Badge, Box, Card, CardContent, IconButton, InputBase, Stack, Typography } from '@mui/material'
import type { MouseEvent } from 'react'
import type { ModerationListEntry } from '../types'
import { ModerationList } from './ModerationList'
import type { Generator, UserProfile } from '../../data/domain'

interface AdminModerationSectionProps {
  moderationStatus: string
  moderationError: string
  moderationLoading: boolean
  moderationSearch: string
  moderationSearchOpen: boolean
  moderationEntriesCount: number
  trashedModerationEntriesCount: number
  activeModerationEntries: ModerationListEntry[]
  onSetModerationSearch: (value: string) => void
  onSetModerationSearchOpen: (value: boolean | ((current: boolean) => boolean)) => void
  onOpenTrashMenu: (event: MouseEvent<HTMLElement>) => void
  onOpenActions: (
    event: MouseEvent<HTMLElement>,
    user: UserProfile,
    generator: Generator | null,
  ) => void
  onOpenMeasurements: (generator: Generator) => void
}

export function AdminModerationSection({
  moderationStatus,
  moderationError,
  moderationLoading,
  moderationSearch,
  moderationSearchOpen,
  moderationEntriesCount,
  trashedModerationEntriesCount,
  activeModerationEntries,
  onSetModerationSearch,
  onSetModerationSearchOpen,
  onOpenTrashMenu,
  onOpenActions,
  onOpenMeasurements,
}: AdminModerationSectionProps) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
        <Stack spacing={2}>
          {moderationStatus ? <Alert severity="success">{moderationStatus}</Alert> : null}
          {moderationError ? <Alert severity="error">{moderationError}</Alert> : null}

          {moderationLoading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
              <Typography color="text.secondary">Einträge werden geladen...</Typography>
            </Stack>
          ) : null}

          <Stack spacing={1.25}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
              <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                Moderieren
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {activeModerationEntries.length} aktiv
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                width: '100%',
                height: 54,
                minWidth: 0,
                border: '1px solid',
                borderColor: moderationSearchOpen || moderationSearch ? 'rgba(11,110,105,0.46)' : 'rgba(121,101,66,0.18)',
                borderRadius: 999,
                bgcolor: 'rgba(255,255,255,0.92)',
                px: 0.75,
                boxShadow: moderationSearchOpen || moderationSearch ? '0 10px 24px rgba(36,28,19,0.08)' : '0 2px 8px rgba(36,28,19,0.04)',
                transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
              }}
            >
              <SearchIcon
                sx={{
                  fontSize: 24,
                  color: moderationSearchOpen || moderationSearch ? '#0B6E69' : 'rgba(110,103,95,0.92)',
                  ml: 0.5,
                  mr: 0.75,
                }}
              />
              <InputBase
                value={moderationSearch}
                onChange={(event) => {
                  if (!moderationSearchOpen) {
                    onSetModerationSearchOpen(true)
                  }
                  onSetModerationSearch(event.target.value)
                }}
                onFocus={() => onSetModerationSearchOpen(true)}
                placeholder="Suche nach Name, E-Mail oder Code"
                inputProps={{ 'aria-label': 'Suchen' }}
                sx={{
                  flex: 1,
                  color: 'rgba(60,48,33,0.96)',
                  fontSize: '1.02rem',
                  '& input::placeholder': {
                    color: 'rgba(110,103,95,0.9)',
                    opacity: 1,
                  },
                }}
              />
              <IconButton
                aria-label={moderationSearch ? 'Suche leeren' : 'Suche einklappen'}
                size="small"
                onClick={() => {
                  if (moderationSearch) {
                    onSetModerationSearch('')
                    return
                  }

                  onSetModerationSearchOpen(false)
                }}
                sx={{
                  mr: 0.75,
                  color: 'rgba(110,103,95,0.9)',
                  opacity: moderationSearchOpen ? 1 : 0,
                  pointerEvents: moderationSearchOpen ? 'auto' : 'none',
                  transition: 'opacity 180ms ease, color 180ms ease',
                  '&:hover': {
                    bgcolor: 'rgba(121,101,66,0.08)',
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <IconButton
              aria-label={`Weitere Aktionen${trashedModerationEntriesCount ? ` (${trashedModerationEntriesCount})` : ''}`}
              onClick={onOpenTrashMenu}
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.25,
                flexShrink: 0,
                color: 'rgba(110,103,95,0.92)',
                '&:hover': {
                  bgcolor: 'rgba(121,101,66,0.08)',
                },
              }}
            >
              <Badge
                badgeContent={trashedModerationEntriesCount > 0 ? trashedModerationEntriesCount : null}
                color="warning"
                max={99}
              >
                <MoreVertIcon fontSize="small" />
              </Badge>
            </IconButton>
            </Stack>
          </Stack>

          <ModerationList
            entries={activeModerationEntries}
            ariaLabel="Moderationsliste"
            emptyPrimary={moderationEntriesCount ? 'Keine Treffer' : 'Noch keine Einträge'}
            emptySecondary={
              moderationEntriesCount
                ? 'Passe den Suchbegriff an, um weitere Einträge zu sehen.'
                : 'Registrierte Konten erscheinen hier automatisch.'
            }
            onOpenActions={onOpenActions}
            onOpenMeasurements={onOpenMeasurements}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}
