import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import {
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { formatMeasurement, formatTimestamp } from '../lib/format'
import { subscribeToLeaderboard } from '../services/firebaseData'
import type { LeaderboardEntry } from '../types/domain'

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)

  useEffect(() => subscribeToLeaderboard(setLeaderboard), [])

  if (!leaderboard) {
    return (
      <Stack sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
        <CircularProgress color="inherit" />
      </Stack>
    )
  }

  return (
    <Card>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <div>
            <Chip
              icon={<EmojiEventsIcon />}
              label="Leaderboard"
              color="warning"
              sx={{ mb: 2 }}
            />
            <Typography variant="h2" gutterBottom>
              Aktuelles Ranking
            </Typography>
            <Typography color="text.secondary">
              Hier werden die zuletzt gespeicherten Messwerte aller Generatoren
              verglichen. Die höchste aktuelle Spannung steht oben.
            </Typography>
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Platz</TableCell>
                <TableCell>Generator</TableCell>
                <TableCell align="right">Messwert</TableCell>
                <TableCell>Zeitpunkt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>Noch keine Messwerte vorhanden.</TableCell>
                </TableRow>
              ) : (
                leaderboard.map((entry, index) => (
                  <TableRow key={entry.generatorId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{entry.code}</TableCell>
                    <TableCell align="right">{formatMeasurement(entry.latestValue)}</TableCell>
                    <TableCell>{formatTimestamp(entry.measuredAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Stack>
      </CardContent>
    </Card>
  )
}
