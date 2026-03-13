import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import InsightsIcon from '@mui/icons-material/Insights'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import CloseIcon from '@mui/icons-material/Close'
import { Timestamp } from 'firebase/firestore'
import {
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
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState, type KeyboardEvent } from 'react'
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
    {
      id: 'demo-001-a',
      generatorId: 'demo-brennstoffzelle-001',
      value: 1.31,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-08T09:00:00.000Z')),
    },
    {
      id: 'demo-001-b',
      generatorId: 'demo-brennstoffzelle-001',
      value: 1.48,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-09T09:00:00.000Z')),
    },
    {
      id: 'demo-001-c',
      generatorId: 'demo-brennstoffzelle-001',
      value: 1.62,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-10T09:00:00.000Z')),
    },
    {
      id: 'demo-001-d',
      generatorId: 'demo-brennstoffzelle-001',
      value: 1.82,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-11T09:00:00.000Z')),
    },
  ],
  'demo-brennstoffzelle-002': [
    {
      id: 'demo-002-a',
      generatorId: 'demo-brennstoffzelle-002',
      value: 1.22,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-08T09:00:00.000Z')),
    },
    {
      id: 'demo-002-b',
      generatorId: 'demo-brennstoffzelle-002',
      value: 1.35,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-09T09:00:00.000Z')),
    },
    {
      id: 'demo-002-c',
      generatorId: 'demo-brennstoffzelle-002',
      value: 1.51,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-10T09:00:00.000Z')),
    },
    {
      id: 'demo-002-d',
      generatorId: 'demo-brennstoffzelle-002',
      value: 1.67,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-11T09:00:00.000Z')),
    },
  ],
  'demo-brennstoffzelle-003': [
    {
      id: 'demo-003-a',
      generatorId: 'demo-brennstoffzelle-003',
      value: 1.06,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-08T09:00:00.000Z')),
    },
    {
      id: 'demo-003-b',
      generatorId: 'demo-brennstoffzelle-003',
      value: 1.18,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-09T09:00:00.000Z')),
    },
    {
      id: 'demo-003-c',
      generatorId: 'demo-brennstoffzelle-003',
      value: 1.33,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-10T09:00:00.000Z')),
    },
    {
      id: 'demo-003-d',
      generatorId: 'demo-brennstoffzelle-003',
      value: 1.49,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-11T09:00:00.000Z')),
    },
  ],
}

const rankStyles = [
  {
    background: 'rgba(248,242,231,0.88)',
    border: '1px solid rgba(196,151,67,0.24)',
    badgeBg: 'rgba(179,130,37,0.12)',
    badgeColor: '#8F6410',
  },
  {
    background: 'rgba(248,242,231,0.88)',
    border: '1px solid rgba(140,147,161,0.24)',
    badgeBg: 'rgba(112,119,134,0.12)',
    badgeColor: '#5E6676',
  },
  {
    background: 'rgba(248,242,231,0.88)',
    border: '1px solid rgba(160,101,73,0.22)',
    badgeBg: 'rgba(136,84,59,0.1)',
    badgeColor: '#8B553C',
  },
]

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

  function handleRowKeyDown(event: KeyboardEvent, entry: LeaderboardEntry) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleOpenEntry(entry)
    }
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
  const featuredEntries = visibleEntries.slice(0, 3)

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Stack spacing={{ xs: 2.5, md: 3 }}>
          <Box>
            <Chip icon={<EmojiEventsIcon />} label="Leaderboard" color="warning" sx={{ mb: 2 }} />
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.9rem', sm: undefined } }}>
              Aktuelles Ranking
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
              Hier werden die zuletzt gespeicherten Messwerte aller Brennstoffzellen verglichen.
              Die hoechste aktuelle Spannung steht oben.
            </Typography>
          </Box>

          {showingSampleEntries ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: { xs: 1.5, sm: 2 },
                py: 1.25,
                borderRadius: '16px',
                background: 'rgba(61,177,236,0.08)',
                border: '1px solid rgba(61,177,236,0.16)',
              }}
            >
              <Chip label="Demo" color="info" size="small" />
              <Typography variant="body2" color="text.secondary">
                Aktuell werden Beispiel-Brennstoffzellen angezeigt, bis echte Messwerte vorhanden sind.
              </Typography>
            </Box>
          ) : null}

          <Grid container spacing={{ xs: 1.5, md: 2 }}>
            {featuredEntries.map((entry, index) => {
              const rankStyle = rankStyles[index] ?? rankStyles[2]

              return (
                <Grid key={entry.generatorId} size={{ xs: 12, md: 4 }}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      borderRadius: '18px',
                      background: rankStyle.background,
                      border: rankStyle.border,
                      boxShadow: '0 8px 18px rgba(36,28,19,0.05)',
                      cursor: 'pointer',
                      transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
                      '&:hover': {
                        background: 'rgba(248,242,231,0.96)',
                        boxShadow: '0 12px 22px rgba(36,28,19,0.07)',
                        borderColor: 'rgba(121,101,66,0.28)',
                      },
                    }}
                    onClick={() => handleOpenEntry(entry)}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 2.25 } }}>
                      <Stack spacing={1.5}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '10px',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 800,
                              color: rankStyle.badgeColor,
                              background: rankStyle.badgeBg,
                            }}
                          >
                            #{index + 1}
                          </Box>
                          <InsightsIcon sx={{ color: rankStyle.badgeColor }} />
                        </Stack>

                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                            Brennstoffzelle
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ overflowWrap: 'anywhere', mb: 1, fontSize: { xs: '1.2rem', sm: '1.3rem' } }}
                          >
                            {entry.code}
                          </Typography>
                          <Typography
                            variant="h3"
                            sx={{ fontSize: { xs: '1.8rem', sm: '2rem' }, lineHeight: 1, letterSpacing: '-0.02em' }}
                          >
                            {formatMeasurement(entry.latestValue)}
                          </Typography>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.85 }}>
                          Messverlauf oeffnen
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>

          <Box
            sx={{
              overflowX: 'auto',
              mx: { xs: -0.5, sm: 0 },
              border: '1px solid rgba(121,101,66,0.12)',
              borderRadius: '18px',
              bgcolor: 'rgba(248,242,231,0.34)',
            }}
          >
            <Table sx={{ minWidth: 520 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Platz</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Brennstoffzelle</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    Messwert
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleEntries.map((entry, index) => (
                  <TableRow
                    key={entry.generatorId}
                    hover
                    onClick={() => handleOpenEntry(entry)}
                    tabIndex={0}
                    onKeyDown={(event) => handleRowKeyDown(event, entry)}
                    sx={{
                      cursor: 'pointer',
                      transition: 'background-color 160ms ease',
                      '&:hover': {
                        bgcolor: 'rgba(121,101,66,0.05)',
                      },
                      '&:focus-visible': {
                        outline: '2px solid rgba(61,177,236,0.6)',
                        outlineOffset: '-2px',
                        bgcolor: 'rgba(61,177,236,0.08)',
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        sx={{
                          minWidth: 52,
                          fontWeight: 700,
                          color: 'text.primary',
                          bgcolor:
                            index < 3 ? 'rgba(121,101,66,0.08)' : 'rgba(121,101,66,0.06)',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography sx={{ fontWeight: 600 }}>{entry.code}</Typography>
                        <KeyboardArrowRightIcon
                          fontSize="small"
                          sx={{ color: 'text.secondary', opacity: 0.8 }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
                        {formatMeasurement(entry.latestValue)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Typography variant="body2" color="text.secondary">
            Tipp: Klicke auf eine Brennstoffzelle, um den Messverlauf im Diagramm zu oeffnen.
          </Typography>
        </Stack>
      </CardContent>

      <Dialog open={Boolean(selectedEntry)} onClose={handleCloseDialog} fullWidth maxWidth="md">
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
