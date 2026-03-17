import CloseIcon from '@mui/icons-material/Close'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Badge,
  Box,
  Card,
  CardContent,
  IconButton,
  InputBase,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useRef, type MouseEvent } from 'react'
import type { Generator, UserProfile } from '../../data/domain'
import type { ModerationListEntry } from '../types'
import { ModerationList } from './ModerationList'

interface AdminModerationSectionProps {
  moderationStatus: string
  moderationError: string
  moderationLoading: boolean
  moderationSearch: string
  moderationSearchOpen: boolean
  moderationEntriesCount: number
  blockedModerationEntriesCount: number
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
  blockedModerationEntriesCount,
  trashedModerationEntriesCount,
  activeModerationEntries,
  onSetModerationSearch,
  onSetModerationSearchOpen,
  onOpenTrashMenu,
  onOpenActions,
  onOpenMeasurements,
}: AdminModerationSectionProps) {
  const searchAreaRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const secondaryEntriesCount = blockedModerationEntriesCount + trashedModerationEntriesCount

  useEffect(() => {
    if (!moderationSearchOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (!searchAreaRef.current?.contains(target)) {
        onSetModerationSearchOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [moderationSearchOpen, onSetModerationSearchOpen])

  useEffect(() => {
    if (!moderationSearchOpen) {
      return
    }

    searchInputRef.current?.focus()
  }, [moderationSearchOpen])

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

            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
              <Box
                ref={searchAreaRef}
                sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: 1 }}
              >
                <IconButton
                  aria-label={moderationSearchOpen ? 'Suche einklappen' : 'Suche aufklappen'}
                  onClick={() => onSetModerationSearchOpen((current) => !current)}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.25,
                    flexShrink: 0,
                    color: moderationSearchOpen ? '#6C5A39' : 'rgba(110,103,95,0.92)',
                    bgcolor: moderationSearchOpen ? 'rgba(121,101,66,0.12)' : 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(121,101,66,0.18)',
                    '&:hover': {
                      bgcolor: moderationSearchOpen ? 'rgba(121,101,66,0.18)' : 'rgba(255,255,255,0.96)',
                    },
                  }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: moderationSearchOpen ? 1 : '0 0 0px',
                    maxWidth: moderationSearchOpen ? '100%' : 0,
                    height: 44,
                    minWidth: 0,
                    border: moderationSearchOpen ? '1px solid rgba(121,101,66,0.2)' : '1px solid transparent',
                    borderRadius: 999,
                    bgcolor: moderationSearchOpen ? 'rgba(255,255,255,0.9)' : 'transparent',
                    px: moderationSearchOpen ? 0.75 : 0,
                    opacity: moderationSearchOpen ? 1 : 0,
                    boxShadow: moderationSearchOpen ? '0 6px 16px rgba(36,28,19,0.07)' : 'none',
                    overflow: 'hidden',
                    transition:
                      'max-width 220ms ease, opacity 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, padding 220ms ease',
                  }}
                >
                  <InputBase
                    inputRef={searchInputRef}
                    value={moderationSearch}
                    onChange={(event) => onSetModerationSearch(event.target.value)}
                    placeholder="Suche nach Name, E-Mail oder Code"
                    inputProps={{ 'aria-label': 'Suchen' }}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      color: 'rgba(60,48,33,0.96)',
                      fontSize: '1rem',
                      '& input::placeholder': {
                        color: 'rgba(110,103,95,0.88)',
                        opacity: 1,
                      },
                    }}
                  />
                  <IconButton
                    aria-label="Suche leeren"
                    size="small"
                    onClick={() => onSetModerationSearch('')}
                    sx={{
                      ml: 0.5,
                      color: 'rgba(110,103,95,0.9)',
                      opacity: moderationSearch ? 1 : 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(121,101,66,0.1)',
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <IconButton
                aria-label={`Weitere Aktionen${secondaryEntriesCount ? ` (${secondaryEntriesCount})` : ''}`}
                onClick={onOpenTrashMenu}
                sx={{
                  ml: 0.75,
                  width: 44,
                  height: 44,
                  borderRadius: 2.25,
                  flexShrink: 0,
                  color: 'rgba(110,103,95,0.92)',
                  border: '1px solid rgba(121,101,66,0.18)',
                  bgcolor: 'rgba(255,255,255,0.72)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.96)',
                  },
                }}
              >
                <Badge
                  badgeContent={secondaryEntriesCount > 0 ? secondaryEntriesCount : null}
                  color="warning"
                  max={99}
                >
                  <MoreVertIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Box>
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
