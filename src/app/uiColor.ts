import { alpha, type Theme } from '@mui/material/styles'

export const uiColor = {
  shadow: {
    soft: (theme: Theme) => `0 14px 28px ${alpha(theme.palette.common.black, 0.14)}`,
    panel: (theme: Theme) => `0 18px 34px ${alpha(theme.palette.common.black, 0.12)}`,
    menu: (theme: Theme) => `0 16px 30px ${alpha(theme.palette.common.black, 0.16)}`,
  },
  surface: {
    soft: (theme: Theme) => alpha(theme.palette.common.white, 0.72),
    softHover: (theme: Theme) => alpha(theme.palette.common.white, 0.96),
    muted: (theme: Theme) => alpha(theme.palette.common.white, 0.44),
    subtle: (theme: Theme) => alpha(theme.palette.text.primary, 0.06),
    border: (theme: Theme) => alpha(theme.palette.secondary.main, 0.18),
    borderStrong: (theme: Theme) => alpha(theme.palette.secondary.main, 0.22),
  },
  leaderboard: {
    sectionBorder: (theme: Theme) => alpha(theme.palette.secondary.main, 0.18),
    sectionBackground: (theme: Theme) => alpha(theme.palette.background.paper, 0.8),
    rankChipTop3: (theme: Theme) => alpha(theme.palette.primary.main, 0.24),
    rankChipDefault: (theme: Theme) => alpha(theme.palette.common.white, 0.54),
  },
}
