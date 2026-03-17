import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import CloseIcon from '@mui/icons-material/Close'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  Typography,
} from '@mui/material'
import { useEffect, useState, type KeyboardEvent } from 'react'
import { MeasurementChart } from '../common/MeasurementChart'
import { UnifiedList, type UnifiedListColumn } from '../common/UnifiedList'
import { formatMeasurement } from '../common/format'
import {
  subscribeToLeaderboard,
  subscribeToMeasurements,
} from '../data/firebaseData'
import type { LeaderboardEntry, Measurement } from '../data/domain'

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

  function handleRowKeyDown(event: KeyboardEvent, entry: LeaderboardEntry) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleOpenEntry(entry)
    }
  }

  const rankSource = leaderboard ?? []
  const leaderboardColumns: UnifiedListColumn<LeaderboardEntry>[] = [
    {
      key: 'rank',
      header: 'Platz',
      mobileLabel: 'Platz',
      width: '90px',
      render: (entry) => {
        const rank = rankSource.findIndex((item) => item.generatorId === entry.generatorId) + 1

        return (
          <Chip
            label={`#${rank}`}
            size="small"
            sx={{
              minWidth: 52,
              fontWeight: 700,
              color: 'text.primary',
              bgcolor: rank <= 3 ? 'rgba(121,101,66,0.08)' : 'rgba(121,101,66,0.06)',
            }}
          />
        )
      },
    },
    {
      key: 'name',
      header: 'Nutzer',
      mobileLabel: 'Nutzer',
      width: 'minmax(0, 1fr)',
      render: (entry) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography sx={{ fontWeight: 600 }}>{entry.displayName}</Typography>
          <KeyboardArrowRightIcon
            fontSize="small"
            sx={{ color: 'text.secondary', opacity: 0.8 }}
          />
        </Stack>
      ),
    },
    {
      key: 'value',
      header: 'Maximalwert',
      mobileLabel: 'Maximalwert',
      width: '130px',
      align: 'right',
      render: (entry) => (
        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
          {formatMeasurement(entry.maxValue)}
        </Typography>
      ),
    },
  ]

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
              <Typography color="text.secondary">
                Noch keine Messwerte vorhanden.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  const visibleEntries = leaderboard
  const featuredEntries = visibleEntries.slice(0, 3)
  const remainingEntries = visibleEntries.slice(3)
  const leaderboardSections = buildLeaderboardSections(remainingEntries, 4)
  const podiumEntries = [
    featuredEntries[1] ? { entry: featuredEntries[1], rank: 2, height: { xs: 160, sm: 190, md: 220 } } : null,
    featuredEntries[0] ? { entry: featuredEntries[0], rank: 1, height: { xs: 210, sm: 240, md: 290 } } : null,
    featuredEntries[2] ? { entry: featuredEntries[2], rank: 3, height: { xs: 145, sm: 165, md: 195 } } : null,
  ].filter((item): item is { entry: LeaderboardEntry; rank: number; height: { xs: number; sm: number; md: number } } => Boolean(item))

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Stack spacing={{ xs: 2.5, md: 3 }}>
          <Box>
            <Chip icon={<EmojiEventsIcon />} label="Leaderboard" color="warning" sx={{ mb: 2 }} />
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.9rem', sm: undefined } }}>
              Aktuelles Ranking
            </Typography>
          </Box>

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

              <Stack sx={{ position: 'relative', mb: { xs: 1.5, md: 2.5 }, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
                  Top 3
                </Typography>
              </Stack>

              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  gap: { xs: 0.75, sm: 1.5, md: 2 },
                  minHeight: { xs: 170, sm: 300, md: 380 },
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
                        order: rank === 2 ? 1 : rank === 1 ? 2 : 3,
                        width: '100%',
                        maxWidth: { xs: 140, sm: 180, md: 240 },
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
                          mb: { xs: 0.9, sm: 1.25 },
                          px: { xs: 0.5, sm: 1 },
                          textAlign: 'center',
                          fontWeight: 700,
                          minHeight: { xs: rank === 1 ? 34 : 30, sm: 40 },
                          fontSize: { xs: rank === 1 ? '0.98rem' : '0.88rem', sm: rank === 1 ? '1rem' : '0.92rem', md: rank === 1 ? '1.22rem' : '1rem' },
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
                          px: { xs: 0.75, sm: 1, md: 1.5 },
                          pt: { xs: 1, sm: 1.25, md: 1.5 },
                          pb: { xs: 1.1, sm: 1.5, md: 1.75 },
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
                              width: { xs: rank === 1 ? 62 : 54, sm: rank === 1 ? 72 : 62, md: rank === 1 ? 86 : 72 },
                              height: { xs: rank === 1 ? 62 : 54, sm: rank === 1 ? 72 : 62, md: rank === 1 ? 86 : 72 },
                              borderRadius: '50%',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 900,
                              fontSize: { xs: rank === 1 ? '1.7rem' : '1.45rem', sm: rank === 1 ? '2rem' : '1.65rem', md: rank === 1 ? '2.4rem' : '2rem' },
                              color: rank === 2 ? '#50545D' : 'rgba(255,248,236,0.98)',
                              background: rankStyle.medalBg,
                              border: { xs: '3px solid rgba(249,246,239,0.35)', sm: '4px solid rgba(249,246,239,0.35)' },
                              boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.35)',
                              textShadow: '0 1px 0 rgba(0,0,0,0.18)',
                            }}
                          >
                            {rank}
                          </Box>

                          <Box sx={{ mt: 'auto' }}>
                            <Typography
                              sx={{
                                fontWeight: 900,
                                lineHeight: 1,
                                fontSize: { xs: rank === 1 ? '1.32rem' : '1.12rem', sm: rank === 1 ? '1.55rem' : '1.25rem', md: rank === 1 ? '1.95rem' : '1.45rem' },
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
              <Accordion
                key={section.title}
                expanded={expandedSection === section.title}
                onChange={(_, isExpanded) => {
                  setExpandedSection(isExpanded ? section.title : false)
                }}
                disableGutters
                slotProps={{ transition: { unmountOnExit: true } }}
                sx={{
                  mx: { xs: -0.5, sm: 0 },
                  border: '1px solid rgba(121,101,66,0.12)',
                  borderRadius: '18px',
                  bgcolor: 'rgba(248,242,231,0.34)',
                  boxShadow: 'none',
                  '&::before': {
                    display: 'none',
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    minHeight: 0,
                    px: { xs: 1.5, sm: 2 },
                    py: 0.25,
                    '& .MuiAccordionSummary-content': {
                      my: 1.2,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                    sx={{ width: '100%', minWidth: 0 }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.98rem', sm: '1.02rem' } }}>
                      {section.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      Plätze {section.startRank}-{section.endRank}
                    </Typography>
                  </Stack>
                </AccordionSummary>

                <AccordionDetails sx={{ px: 0, pb: 0 }}>
                  <UnifiedList
                    items={section.entries}
                    columns={leaderboardColumns}
                    getItemKey={(entry) => entry.generatorId}
                    ariaLabel={`${section.title} Liste`}
                    emptyPrimary="Keine Einträge"
                    onItemClick={(entry) => handleOpenEntry(entry)}
                    getItemAriaLabel={(entry) => `Messverlauf von ${entry.displayName} öffnen`}
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Stack>
      </CardContent>

      <Dialog open={Boolean(selectedEntry)} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle sx={{ pr: 6 }}>
          {selectedEntry ? `Messverlauf: ${selectedEntry.displayName}` : 'Messverlauf'}
          <IconButton
            aria-label="Dialog schließen"
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
            <MeasurementChart measurements={selectedMeasurements} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Schliessen</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
