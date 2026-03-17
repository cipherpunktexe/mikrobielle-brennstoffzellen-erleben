import MoreVertIcon from '@mui/icons-material/MoreVert'
import {
  Badge,
  Box,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import type { MouseEvent } from 'react'
import { CollapsibleSearchField } from '../../common/CollapsibleSearchField'
import type { Generator, UserProfile } from '../../data/domain'
import type { ModerationListEntry } from '../types'
import { ModerationList } from './ModerationList'

interface AdminModerationSectionProps {
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
  const secondaryEntriesCount = blockedModerationEntriesCount + trashedModerationEntriesCount

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
        <Stack spacing={2}>

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
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <CollapsibleSearchField
                  value={moderationSearch}
                  open={moderationSearchOpen}
                  onChange={onSetModerationSearch}
                  onOpenChange={onSetModerationSearchOpen}
                  placeholder="Suche nach Name, E-Mail oder Code"
                  ariaLabel="Suchen"
                />
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
                  color: (theme) => theme.custom.text.muted,
                  border: (theme) => `1px solid ${theme.custom.border.strong}`,
                  bgcolor: (theme) => theme.custom.surface.strong,
                  '&:hover': {
                    bgcolor: (theme) => theme.custom.surface.strongHover,
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
