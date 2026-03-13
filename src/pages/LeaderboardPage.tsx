import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
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
    displayName: 'Lina',
    maxValue: 1.82,
    maxMeasuredAt: null,
  },
  {
    generatorId: 'demo-brennstoffzelle-002',
    code: 'beispiel-002',
    displayName: 'Noah',
    maxValue: 1.67,
    maxMeasuredAt: null,
  },
  {
    generatorId: 'demo-brennstoffzelle-003',
    code: 'beispiel-003',
    displayName: 'Mila',
    maxValue: 1.49,
    maxMeasuredAt: null,
  },
  {
    generatorId: 'demo-brennstoffzelle-004',
    code: 'beispiel-004',
    displayName: 'Ben',
    maxValue: 1.38,
    maxMeasuredAt: null,
  },
  {
    generatorId: 'demo-brennstoffzelle-005',
    code: 'beispiel-005',
    displayName: 'Emma',
    maxValue: 1.21,
    maxMeasuredAt: null,
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
  'demo-brennstoffzelle-004': [
    {
      id: 'demo-004-a',
      generatorId: 'demo-brennstoffzelle-004',
      value: 1.02,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-08T09:00:00.000Z')),
    },
    {
      id: 'demo-004-b',
      generatorId: 'demo-brennstoffzelle-004',
      value: 1.16,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-09T09:00:00.000Z')),
    },
    {
      id: 'demo-004-c',
      generatorId: 'demo-brennstoffzelle-004',
      value: 1.27,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-10T09:00:00.000Z')),
    },
    {
      id: 'demo-004-d',
      generatorId: 'demo-brennstoffzelle-004',
      value: 1.38,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-11T09:00:00.000Z')),
    },
  ],
  'demo-brennstoffzelle-005': [
    {
      id: 'demo-005-a',
      generatorId: 'demo-brennstoffzelle-005',
      value: 0.88,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-08T09:00:00.000Z')),
    },
    {
      id: 'demo-005-b',
      generatorId: 'demo-brennstoffzelle-005',
      value: 0.97,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-09T09:00:00.000Z')),
    },
    {
      id: 'demo-005-c',
      generatorId: 'demo-brennstoffzelle-005',
      value: 1.11,
      enteredBy: 'demo',
      createdAt: Timestamp.fromDate(new Date('2026-03-10T09:00:00.000Z')),
    },
    {
      id: 'demo-005-d',
      generatorId: 'demo-brennstoffzelle-005',
      value: 1.21,
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
    medalBg: 'linear-gradient(180deg, #f6d774, #d5a11d)',
    podiumBg: 'linear-gradient(180deg, rgba(140,105,36,0.96), rgba(108,79,24,0.96))',
  },
  {
    background: 'rgba(248,242,231,0.88)',
    border: '1px solid rgba(140,147,161,0.24)',
    badgeBg: 'rgba(112,119,134,0.12)',
    badgeColor: '#5E6676',
    medalBg: 'linear-gradient(180deg, #d7d9de, #9ba1ab)',
    podiumBg: 'linear-gradient(180deg, rgba(126,114,95,0.94), rgba(92,82,68,0.94))',
  },
  {
    background: 'rgba(248,242,231,0.88)',
    border: '1px solid rgba(160,101,73,0.22)',
    badgeBg: 'rgba(136,84,59,0.1)',
    badgeColor: '#8B553C',
    medalBg: 'linear-gradient(180deg, #df9b63, #b56a35)',
    podiumBg: 'linear-gradient(180deg, rgba(138,93,62,0.94), rgba(108,70,45,0.94))',
  },
]

interface LeaderboardSection {
  title: string
  startRank: number
  endRank: number
  entries: LeaderboardEntry[]
}

function buildLeaderboardSections(entries: LeaderboardEntry[], startingRank = 1): LeaderboardSection[] {
  if (entries.length === 0) {
    return []
  }

  const totalCount = entries.length + startingRank - 1
  const thresholds = [5, 10, 25, 50, 100].filter(
    (threshold) => threshold >= startingRank && threshold < totalCount,
  )
  const sectionLimits = [...thresholds, totalCount]
  let previousEnd = startingRank - 1

  return sectionLimits.map((limit) => {
    const startRank = previousEnd + 1
    const endRank = limit
    const sectionEntries = entries.slice(startRank - startingRank, endRank - startingRank + 1)
    previousEnd = limit

    return {
      title: `Top ${limit}`,
      startRank,
      endRank,
      entries: sectionEntries,
    }
  })
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
  const remainingEntries = visibleEntries.slice(3)
  const leaderboardSections = buildLeaderboardSections(remainingEntries, 4)
  const podiumEntries = [
    featuredEntries[1] ? { entry: featuredEntries[1], rank: 2, height: { xs: 190, md: 220 } } : null,
    featuredEntries[0] ? { entry: featuredEntries[0], rank: 1, height: { xs: 240, md: 290 } } : null,
    featuredEntries[2] ? { entry: featuredEntries[2], rank: 3, height: { xs: 165, md: 195 } } : null,
  ].filter((item): item is { entry: LeaderboardEntry; rank: number; height: { xs: number; md: number } } => Boolean(item))

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
              Hier werden die maximal gemessenen Werte aller Brennstoffzellen verglichen. Der
              hoechste Messwert steht oben.
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

          {podiumEntries.length > 0 ? (
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '26px',
                px: { xs: 1.5, sm: 2.25, md: 3 },
                pt: { xs: 2, md: 2.5 },
                pb: { xs: 1.5, md: 2 },
                border: '1px solid rgba(121,101,66,0.14)',
                background:
                  'linear-gradient(180deg, rgba(186,162,120,0.26), rgba(141,120,85,0.18)), rgba(248,242,231,0.72)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.36)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.55,
                  background:
                    'radial-gradient(circle at 50% 42%, rgba(249,246,239,0.5), transparent 18%), repeating-conic-gradient(from 0deg at 50% 42%, rgba(249,246,239,0.22) 0deg 11deg, rgba(121,101,66,0.02) 11deg 22deg)',
                  pointerEvents: 'none',
                }}
              />

              <Stack spacing={0.5} sx={{ position: 'relative', mb: { xs: 1.5, md: 2.5 }, textAlign: 'center' }}>
                <Typography variant="overline" color="text.secondary">
                  Podium
                </Typography>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
                  Top 3 Brennstoffzellen
                </Typography>
              </Stack>

              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  gap: { xs: 1, sm: 1.5, md: 2 },
                  minHeight: { xs: 300, md: 380 },
                }}
              >
                {podiumEntries.map(({ entry, rank, height }) => {
                  const rankStyle = rankStyles[rank - 1] ?? rankStyles[2]

                  return (
                    <Box
                      component="button"
                      type="button"
                      key={entry.generatorId}
                      onClick={() => handleOpenEntry(entry)}
                      onKeyDown={(event) => handleRowKeyDown(event, entry)}
                      sx={{
                        flex: 1,
                        maxWidth: { xs: 180, md: 240 },
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        p: 0,
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'inherit',
                        cursor: 'pointer',
                        zIndex: rank === 1 ? 2 : 1,
                        '&:focus-visible': {
                          outline: '2px solid rgba(61,177,236,0.75)',
                          outlineOffset: '4px',
                          borderRadius: '18px',
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          mb: 1.25,
                          px: 1,
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: { xs: rank === 1 ? '1rem' : '0.92rem', md: rank === 1 ? '1.22rem' : '1rem' },
                          lineHeight: 1.15,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {entry.displayName}
                      </Typography>

                      <Box
                        sx={{
                          width: '100%',
                          height,
                          px: { xs: 1, md: 1.5 },
                          pt: { xs: 1.25, md: 1.5 },
                          pb: { xs: 1.5, md: 1.75 },
                          borderRadius: '18px 18px 0 0',
                          background: rankStyle.podiumBg,
                          color: 'rgba(249,246,239,0.96)',
                          boxShadow:
                            rank === 1
                              ? '0 16px 28px rgba(72,48,16,0.2)'
                              : '0 12px 22px rgba(72,48,16,0.12)',
                          transition: 'transform 180ms ease, box-shadow 180ms ease, filter 180ms ease',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            filter: 'brightness(1.03)',
                            boxShadow: '0 18px 30px rgba(72,48,16,0.18)',
                          },
                        }}
                      >
                        <Stack
                          spacing={1.1}
                          alignItems="center"
                          justifyContent="flex-start"
                          sx={{ height: '100%' }}
                        >
                          <Box
                            sx={{
                              width: { xs: rank === 1 ? 72 : 62, md: rank === 1 ? 86 : 72 },
                              height: { xs: rank === 1 ? 72 : 62, md: rank === 1 ? 86 : 72 },
                              borderRadius: '50%',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 900,
                              fontSize: { xs: rank === 1 ? '2rem' : '1.65rem', md: rank === 1 ? '2.4rem' : '2rem' },
                              color: rank === 2 ? '#50545D' : 'rgba(255,248,236,0.98)',
                              background: rankStyle.medalBg,
                              border: '4px solid rgba(249,246,239,0.35)',
                              boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.35)',
                              textShadow: '0 1px 0 rgba(0,0,0,0.18)',
                            }}
                          >
                            {rank}
                          </Box>

                          <Box sx={{ mt: 'auto' }}>
                            <Typography
                              variant="body2"
                              sx={{ opacity: 0.82, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                            >
                              Maximalwert
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.25,
                                fontWeight: 900,
                                lineHeight: 1,
                                fontSize: { xs: rank === 1 ? '1.55rem' : '1.25rem', md: rank === 1 ? '1.95rem' : '1.45rem' },
                              }}
                            >
                              {formatMeasurement(entry.maxValue)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          ) : null}

          <Stack spacing={1.5}>
            {leaderboardSections.map((section) => (
              <Box
                key={section.title}
                sx={{
                  overflowX: 'auto',
                  mx: { xs: -0.5, sm: 0 },
                  border: '1px solid rgba(121,101,66,0.12)',
                  borderRadius: '18px',
                  bgcolor: 'rgba(248,242,231,0.34)',
                }}
              >
                <Stack spacing={0.5} sx={{ px: { xs: 1.5, sm: 2 }, pt: 1.75, pb: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.08rem' } }}>
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Plaetze {section.startRank}-{section.endRank}
                  </Typography>
                </Stack>

                <Table sx={{ minWidth: 520 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Platz</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Brennstoffzelle</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                        Maximalwert
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {section.entries.map((entry, entryIndex) => {
                      const rank = section.startRank + entryIndex

                      return (
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
                              label={`#${rank}`}
                              size="small"
                              sx={{
                                minWidth: 52,
                                fontWeight: 700,
                                color: 'text.primary',
                                bgcolor:
                                  rank <= 3 ? 'rgba(121,101,66,0.08)' : 'rgba(121,101,66,0.06)',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography sx={{ fontWeight: 600 }}>{entry.code}</Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: { xs: 'none', sm: 'block' } }}
                              >
                                {entry.code}
                              </Typography>
                              <KeyboardArrowRightIcon
                                fontSize="small"
                                sx={{ color: 'text.secondary', opacity: 0.8 }}
                              />
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
                              {formatMeasurement(entry.maxValue)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Box>
            ))}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Tipp: Klicke auf eine Brennstoffzelle, um den Messverlauf im Diagramm zu oeffnen.
          </Typography>
        </Stack>
      </CardContent>

      <Dialog open={Boolean(selectedEntry)} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle sx={{ pr: 6 }}>
          {selectedEntry ? `Messverlauf fuer ${selectedEntry.displayName}` : 'Messverlauf'}
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
