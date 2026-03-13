import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import CloseIcon from '@mui/icons-material/Close'
import { Timestamp } from 'firebase/firestore'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { MeasurementChart } from '../components/MeasurementChart'
import { formatMeasurement } from '../lib/format'
import { subscribeToLeaderboard, subscribeToMeasurements } from '../services/firebaseData'
import type { LeaderboardEntry, Measurement } from '../types/domain'

const sampleLeaderboardEntries: LeaderboardEntry[] = [
  {
    generatorId: 'demo-brennstoffzelle-001',
    code: 'beispiel-001',
    latestValue: 1.82,
    measuredAt: null,
  },
  {
    generatorId: 'demo-brennstoffzelle-002',
    code: 'beispiel-002',
    latestValue: 1.67,
    measuredAt: null,
  },
  {
    generatorId: 'demo-brennstoffzelle-003',
    code: 'beispiel-003',
    latestValue: 1.49,
    measuredAt: null,
  },
]

const sampleMeasurementsByGeneratorId: Record<string, Measurement[]> = {
  'demo-brennstoffzelle-001': [
    { id: 'demo-001-a', generatorId: 'demo-brennstoffzelle-001', value: 1.31, enteredBy: 'demo', createdAt: Timestamp.fromDate(new Date('2026-03-08T09:00:00.000Z')) },
    { id: 'demo-001-b', generatorId: 'demo-brennstoffzelle-001', value: 1.48, enteredBy: 'demo', createdAt: Timestamp.fromDate(new Date('2026-03-09T09:00:00.000Z')) },
    { id: 'demo-001-c', generatorId: 'demo-brennstoffzelle-001', value: 1.62, enteredBy: 'demo', createdAt: Timestamp.fromDate(new Date('2026-03-10T09:00:00.000Z')) },
    { id: 'demo-001-d', generatorId: 'demo-brennstoffzelle-001', value: 1.82, enteredBy: 'demo', createdAt: Timestamp.fromDate(new Date('2026-03-11T09:00:00.000Z')) },
  ],
  'demo-brennstoffzelle-002': [
    { id: 'demo-002-a', generatorId: 'demo-brennstoffzelle-002', value: 1.22, enteredBy: 'demo', createdAt: Timestamp.fromDate(new Date('2026-03-08T09:00:00.000Z')) },
    { id: 'demo-002-b', generatorId: 'demo-brennstoffzelle-002', value: 1.35, enteredBy: 'demo', createdAt: Timestamp.fromDate(new Date('2026-03-09T09:00:00.000Z')) },
    { id: 'demo-002-c', generatorId: 'demo-brennstoffzelle-002', value: 1.51, enteredBy: 'demo', createdAt: Timestamp.fromDate(new Date('2026-03-10T09:00:00.000Z')) },
    { id: 'demo-002-d', generatorId: 'demo-brennstoffzelle-002', value: 1.67, enteredBy: 'demo', createdAt: Timestamp.fromDate(new Date('2026-03-11T09:00:00.000Z')) },
  ],
  'demo-brennstoffzelle-003': [
    { id: 'demo-003-a', generatorId: 'demo-brennstoffzelle-003', value: 1.06, enteredBy: 'demo', createdAt: Timestamp.fromDate(new Date('2026-03-08T09:00:00.000Z')) },
    { id: 'demo-003-b', generatorId: 'demo-brennstoffzelle-003', value: 1.18, enteredBy: 'demo', createdAt: Timestamp.fromDate(new Date('2026-03-09T09:00:00.000Z')) },
    { id: 'demo-003-c', generatorId: 'demo-brennstoffzelle-003', value: 1.33, enteredBy: 'demo', createdAt: Timestamp.fromDate(new Date('2026-03-10T09:00:00.000Z')) },
    { id: 'demo-003-d', generatorId: 'demo-brennstoffzelle-003', value: 1.49, enteredBy: 'demo', createdAt: Timestamp.fromDate(new Date('2026-03-11T09:00:00.000Z')) },
  ],
}

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)
  const [selectedMeasurements, setSelectedMeasurements] = useState<Measurement[] | null>(null)

  useEffect(() => subscribeToLeaderboard(setLeaderboard), [])

  useEffect(() => {
    if (!selectedEntry || sampleMeasurementsByGeneratorId[selectedEntry.generatorId]) {
      return
    }
    return subscribeToMeasurements(selectedEntry.generatorId, setSelectedMeasurements)
  }, [selectedEntry])

  function handleOpenEntry(entry: LeaderboardEntry) {
    setSelectedEntry(entry)
    setSelectedMeasurements(sampleMeasurementsByGeneratorId[entry.generatorId] ?? null)
  }

  function handleCloseDialog() {
    setSelectedEntry(null)
    setSelectedMeasurements(null)
  }

  if (!leaderboard) {
    return (
      <Stack sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
        <CircularProgress color="inherit" />
      </Stack>
    )
  }

  const showingSampleEntries = leaderboard.length === 0
  const visibleEntries = showingSampleEntries ? sampleLeaderboardEntries : leaderboard

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Stack spacing={3}>
          <div>
            <Chip icon={<EmojiEventsIcon />} label="Leaderboard" color="warning" sx={{ mb: 2 }} />
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.9rem', sm: undefined } }}>
              Aktuelles Ranking
            </Typography>
            <Typography color="text.secondary">
              Hier werden die zuletzt gespeicherten Messwerte aller Brennstoffzellen verglichen.
              Die höchste aktuelle Spannung steht oben.
            </Typography>
          </div>

          {showingSampleEntries ? (
            <Alert severity="info">
              Aktuell werden Beispiel-Brennstoffzellen angezeigt, bis echte Messwerte vorhanden sind.
            </Alert>
          ) : null}

          <Box sx={{ overflowX: 'auto', mx: { xs: -0.5, sm: 0 } }}>
            <Table sx={{ minWidth: 520 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Platz</TableCell>
                  <TableCell>Brennstoffzelle</TableCell>
                  <TableCell align="right">Messwert</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleEntries.map((entry, index) => (
                  <TableRow
                    key={entry.generatorId}
                    hover
                    onClick={() => handleOpenEntry(entry)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{entry.code}</TableCell>
                    <TableCell align="right">{formatMeasurement(entry.latestValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Stack>
      </CardContent>

      <Dialog
        open={Boolean(selectedEntry)}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pr: 6 }}>
          {selectedEntry ? `Messverlauf fuer ${selectedEntry.code}` : 'Messverlauf'}
          <IconButton
            aria-label="Dialog schliessen"
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {!selectedMeasurements ? (
            <Stack sx={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
              <CircularProgress color="inherit" />
            </Stack>
          ) : selectedMeasurements.length === 0 ? (
            <Typography color="text.secondary">
              Fuer diese Brennstoffzelle liegen noch keine Messwerte vor.
            </Typography>
          ) : (
            <MeasurementChart
              measurements={selectedMeasurements}
              latestLabel="Aktueller Messwert"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Schliessen</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
