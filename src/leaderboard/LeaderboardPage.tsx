import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { Box, Card, CardContent, Chip, CircularProgress, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { subscribeToLeaderboard, subscribeToMeasurements } from '../data/firebaseData'
import type { LeaderboardEntry, Measurement } from '../data/domain'
import { LeaderboardPodium } from './LeaderboardPodium'
import { LeaderboardSectionList } from './LeaderboardSectionList'
import { LeaderboardTrendDialog } from './LeaderboardTrendDialog'
import { createLeaderboardColumns } from './leaderboardColumns'
import { buildLeaderboardSections } from './leaderboardSections'

export function LeaderboardPage() {
  const theme = useTheme()
  const isMobileViewport = useMediaQuery(theme.breakpoints.down('sm'))
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)
  const [selectedMeasurements, setSelectedMeasurements] = useState<Measurement[] | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | false>(false)

  useEffect(() => subscribeToLeaderboard(setLeaderboard), [])

  useEffect(() => {
    if (!selectedEntry) {
      return
    }

    return subscribeToMeasurements(selectedEntry.generatorId, setSelectedMeasurements)
  }, [selectedEntry])

  function handleOpenEntry(entry: LeaderboardEntry) {
    setSelectedEntry(entry)
    setSelectedMeasurements(null)
  }

  function handleCloseDialog() {
    setSelectedEntry(null)
    setSelectedMeasurements(null)
  }

  const visibleEntries = useMemo(() => leaderboard ?? [], [leaderboard])
  const remainingEntries = useMemo(() => visibleEntries.slice(3), [visibleEntries])
  const leaderboardColumns = useMemo(
    () => createLeaderboardColumns(visibleEntries, isMobileViewport),
    [visibleEntries, isMobileViewport],
  )
  const leaderboardSections = useMemo(
    () => buildLeaderboardSections(remainingEntries, 4),
    [remainingEntries],
  )

  if (!leaderboard) {
    return (
      <Stack sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
        <CircularProgress color="inherit" />
      </Stack>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Box>
              <Chip icon={<EmojiEventsIcon />} label="Leaderboard" color="warning" sx={{ mb: 2 }} />
              <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.9rem', sm: undefined } }}>
                Aktuelles Ranking
              </Typography>
              <Typography color="text.secondary">Noch keine Messwerte vorhanden.</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 3, md: 4 } }}>
        <Stack spacing={{ xs: 2.5, md: 3 }}>
          <Box>
            <Chip icon={<EmojiEventsIcon />} label="Leaderboard" color="warning" sx={{ mb: 2 }} />
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.9rem', sm: undefined } }}>
              Aktuelles Ranking
            </Typography>
          </Box>

          <LeaderboardPodium entries={visibleEntries} onOpenEntry={handleOpenEntry} />

          <LeaderboardSectionList
            sections={leaderboardSections}
            expandedSection={expandedSection}
            onExpandedSectionChange={setExpandedSection}
            columns={leaderboardColumns}
            onOpenEntry={handleOpenEntry}
          />
        </Stack>
      </CardContent>

      <LeaderboardTrendDialog
        open={Boolean(selectedEntry)}
        selectedEntry={selectedEntry}
        selectedMeasurements={selectedMeasurements}
        isMobileViewport={isMobileViewport}
        onClose={handleCloseDialog}
      />
    </Card>
  )
}
