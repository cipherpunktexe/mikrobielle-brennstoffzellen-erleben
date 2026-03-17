import { Box, Stack, Typography } from '@mui/material'
import { type KeyboardEvent } from 'react'
import { formatMeasurement } from '../common/format'
import type { LeaderboardEntry } from '../data/domain'

const rankStyles = [
  {
    medalBg: 'linear-gradient(180deg, #f6d774, #d5a11d)',
    podiumBg: 'linear-gradient(180deg, rgba(140,105,36,0.96), rgba(108,79,24,0.96))',
  },
  {
    medalBg: 'linear-gradient(180deg, #d7d9de, #9ba1ab)',
    podiumBg: 'linear-gradient(180deg, rgba(126,114,95,0.94), rgba(92,82,68,0.94))',
  },
  {
    medalBg: 'linear-gradient(180deg, #df9b63, #b56a35)',
    podiumBg: 'linear-gradient(180deg, rgba(138,93,62,0.94), rgba(108,70,45,0.94))',
  },
]

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[]
  onOpenEntry: (entry: LeaderboardEntry) => void
}

export function LeaderboardPodium({ entries, onOpenEntry }: LeaderboardPodiumProps) {
  const featuredEntries = entries.slice(0, 3)
  const podiumEntries = [
    featuredEntries[1]
      ? { entry: featuredEntries[1], rank: 2, height: { xs: 160, sm: 190, md: 220 } }
      : null,
    featuredEntries[0]
      ? { entry: featuredEntries[0], rank: 1, height: { xs: 210, sm: 240, md: 290 } }
      : null,
    featuredEntries[2]
      ? { entry: featuredEntries[2], rank: 3, height: { xs: 145, sm: 165, md: 195 } }
      : null,
  ].filter(
    (
      item,
    ): item is {
      entry: LeaderboardEntry
      rank: number
      height: { xs: number; sm: number; md: number }
    } => Boolean(item),
  )

  if (podiumEntries.length === 0) {
    return null
  }

  function handleRowKeyDown(event: KeyboardEvent, entry: LeaderboardEntry) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpenEntry(entry)
    }
  }

  return (
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
              onClick={() => onOpenEntry(entry)}
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
                  fontSize: {
                    xs: rank === 1 ? '0.98rem' : '0.88rem',
                    sm: rank === 1 ? '1rem' : '0.92rem',
                    md: rank === 1 ? '1.22rem' : '1rem',
                  },
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
                <Stack spacing={1.1} alignItems="center" justifyContent="flex-start" sx={{ height: '100%' }}>
                  <Box
                    sx={{
                      width: {
                        xs: rank === 1 ? 62 : 54,
                        sm: rank === 1 ? 72 : 62,
                        md: rank === 1 ? 86 : 72,
                      },
                      height: {
                        xs: rank === 1 ? 62 : 54,
                        sm: rank === 1 ? 72 : 62,
                        md: rank === 1 ? 86 : 72,
                      },
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 900,
                      fontSize: {
                        xs: rank === 1 ? '1.7rem' : '1.45rem',
                        sm: rank === 1 ? '2rem' : '1.65rem',
                        md: rank === 1 ? '2.4rem' : '2rem',
                      },
                      color: rank === 2 ? '#50545D' : 'rgba(255,248,236,0.98)',
                      background: rankStyle.medalBg,
                      border: {
                        xs: '3px solid rgba(249,246,239,0.35)',
                        sm: '4px solid rgba(249,246,239,0.35)',
                      },
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
                        fontSize: {
                          xs: rank === 1 ? '1.32rem' : '1.12rem',
                          sm: rank === 1 ? '1.55rem' : '1.25rem',
                          md: rank === 1 ? '1.95rem' : '1.45rem',
                        },
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
  )
}
