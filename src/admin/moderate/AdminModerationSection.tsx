import CloseIcon from '@mui/icons-material/Close'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import { Alert, Box, Card, CardContent, IconButton, InputBase, Stack, Typography } from '@mui/material'
import type { MouseEvent } from 'react'
import type { ModerationListEntry } from '../types'
import { ModerationList } from './ModerationList'
import type { Generator, UserProfile } from '../../app/domain'

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

          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flex: moderationSearchOpen ? 1 : '0 0 58px',
                width: moderationSearchOpen ? 'auto' : 58,
                height: 54,
                minWidth: 0,
                border: '1px solid',
                borderColor: moderationSearchOpen ? 'rgba(11,110,105,0.46)' : 'rgba(121,101,66,0.18)',
                borderRadius: 999,
                bgcolor: 'rgba(255,255,255,0.92)',
                overflow: 'hidden',
                boxShadow: moderationSearchOpen ? '0 10px 24px rgba(36,28,19,0.08)' : '0 2px 8px rgba(36,28,19,0.04)',
                transition:
                  'flex-basis 240ms ease, width 240ms ease, border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
              }}
            >
              <IconButton
                aria-label={moderationSearchOpen ? 'Suche einklappen' : 'Suche ausklappen'}
                onClick={() => onSetModerationSearchOpen((current) => !current)}
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: 999,
                  ml: 0.25,
                  color: moderationSearchOpen ? '#0B6E69' : 'rgba(110,103,95,0.92)',
                  flexShrink: 0,
                  transition: 'color 180ms ease, background-color 180ms ease',
                  '&:hover': {
                    bgcolor: 'rgba(11,110,105,0.08)',
                  },
                }}
              >
                <SearchIcon sx={{ fontSize: 30 }} />
              </IconButton>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  opacity: moderationSearchOpen ? 1 : 0,
                  maxWidth: moderationSearchOpen ? '100%' : 0,
                  transform: moderationSearchOpen ? 'translateX(0)' : 'translateX(-10px)',
                  transition: 'max-width 240ms ease, opacity 180ms ease, transform 220ms ease',
                  pointerEvents: moderationSearchOpen ? 'auto' : 'none',
                  overflow: 'hidden',
                }}
              >
                <InputBase
                  value={moderationSearch}
                  onChange={(event) => onSetModerationSearch(event.target.value)}
                  placeholder="Suche"
                  inputProps={{ 'aria-label': 'Suchen' }}
                  sx={{
                    width: '100%',
                    color: 'rgba(60,48,33,0.96)',
                    fontSize: '1.05rem',
                    px: 0.5,
                    py: 1.2,
                    '& input::placeholder': {
                      color: 'rgba(110,103,95,0.9)',
                      opacity: 1,
                    },
                  }}
                />
              </Box>
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
              <MoreVertIcon fontSize="small" />
            </IconButton>
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
