import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Chip, Stack, Typography } from '@mui/material'
import { uiColor } from '../app/uiColor'
import { type UnifiedListColumn } from '../common/UnifiedList'
import { formatMeasurement } from '../common/format'
import type { LeaderboardEntry } from '../data/domain'

export function createLeaderboardColumns(
  rankSource: LeaderboardEntry[],
  isMobileViewport: boolean,
): UnifiedListColumn<LeaderboardEntry>[] {
  return [
    {
      key: 'rank',
      header: 'Platz',
      mobileLabel: 'Platz',
      width: '74px',
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
              bgcolor: (theme) =>
                rank <= 3
                  ? uiColor.leaderboard.rankChipTop3(theme)
                  : uiColor.leaderboard.rankChipDefault(theme),
            }}
          />
        )
      },
    },
    {
      key: 'name',
      header: 'Nutzer',
      mobileLabel: 'Nutzer',
      width: isMobileViewport ? '74px' : 'minmax(92px, 1fr)',
      render: (entry) => (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {entry.displayName}
          </Typography>
          {!isMobileViewport ? (
            <KeyboardArrowRightIcon
              fontSize="small"
              sx={{ color: 'text.secondary', opacity: 0.8 }}
            />
          ) : null}
        </Stack>
      ),
    },
    {
      key: 'value',
      header: 'Wert',
      mobileLabel: 'Wert',
      width: '84px',
      align: 'right',
      render: (entry) => (
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: '0.95rem', sm: '1.05rem' },
            whiteSpace: 'nowrap',
          }}
        >
          {formatMeasurement(entry.maxValue)}
        </Typography>
      ),
    },
  ]
}
