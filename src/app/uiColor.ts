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
  landing: {
    heroGradient: (theme: Theme) =>
      `linear-gradient(135deg, ${alpha(theme.palette.text.primary, 0.78)}, ${alpha(theme.palette.secondary.main, 0.76)}), radial-gradient(circle at top, ${alpha(theme.palette.primary.contrastText, 0.22)}, transparent 42%)`,
    heroBody: (theme: Theme) => alpha(theme.palette.primary.contrastText, 0.82),
    panelBackground: (theme: Theme) => alpha(theme.palette.background.paper, 0.74),
    panelBorder: (theme: Theme) => alpha(theme.palette.secondary.main, 0.18),
    panelShadow: (theme: Theme) => `0 20px 42px ${alpha(theme.palette.common.black, 0.18)}`,
  },
  scanner: {
    backdrop: (theme: Theme) => alpha(theme.palette.text.primary, 0.92),
    frameBorder: (theme: Theme) => alpha(theme.palette.common.white, 0.72),
    frameMaskShadow: (theme: Theme) => `0 0 0 9999px ${alpha(theme.palette.common.black, 0.14)}`,
  },
  preview: {
    background: (theme: Theme) => alpha(theme.palette.text.primary, 0.06),
    pageBackground: (theme: Theme) => alpha(theme.palette.common.white, 0.9),
    pageBorder: (theme: Theme) => alpha(theme.palette.text.primary, 0.14),
    pageShadow: (theme: Theme) => `0 12px 24px ${alpha(theme.palette.text.primary, 0.08)}`,
  },
  qr: {
    finder: (theme: Theme) => theme.palette.success.main,
    module: (theme: Theme) => theme.palette.text.primary,
    canvasBackground: (theme: Theme) => theme.palette.background.paper,
    badgeFill: (theme: Theme) => theme.palette.common.white,
    badgeStroke: (theme: Theme) => theme.palette.secondary.main,
    badgeText: (theme: Theme) => theme.palette.text.primary,
  },
  leaderboard: {
    sectionBorder: (theme: Theme) => alpha(theme.palette.secondary.main, 0.18),
    sectionBackground: (theme: Theme) => alpha(theme.palette.background.paper, 0.8),
    rankChipTop3: (theme: Theme) => alpha(theme.palette.primary.main, 0.24),
    rankChipDefault: (theme: Theme) => alpha(theme.palette.common.white, 0.54),
    podiumContainerBorder: (theme: Theme) => alpha(theme.palette.secondary.main, 0.14),
    podiumContainerBackground: (theme: Theme) =>
      `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.26)}, ${alpha(theme.palette.secondary.main, 0.18)}), ${alpha(theme.palette.background.paper, 0.72)}`,
    podiumContainerInset: (theme: Theme) => `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.36)}`,
    podiumTexture: (theme: Theme) =>
      `radial-gradient(circle at 50% 42%, ${alpha(theme.palette.primary.contrastText, 0.5)}, transparent 18%), repeating-conic-gradient(from 0deg at 50% 42%, ${alpha(theme.palette.primary.contrastText, 0.22)} 0deg 11deg, ${alpha(theme.palette.secondary.main, 0.02)} 11deg 22deg)`,
    focusOutline: (theme: Theme) => alpha(theme.palette.info.main, 0.75),
    podiumText: (theme: Theme) => alpha(theme.palette.primary.contrastText, 0.96),
    podiumShadowStrong: (theme: Theme) => `0 16px 28px ${alpha(theme.palette.common.black, 0.2)}`,
    podiumShadowDefault: (theme: Theme) => `0 12px 22px ${alpha(theme.palette.common.black, 0.12)}`,
    podiumShadowHover: (theme: Theme) => `0 18px 30px ${alpha(theme.palette.common.black, 0.18)}`,
    medalBorder: (theme: Theme) => alpha(theme.palette.primary.contrastText, 0.35),
    medalInset: (theme: Theme) => `inset 0 2px 0 ${alpha(theme.palette.common.white, 0.35)}`,
    medalTextShadow: (theme: Theme) => `0 1px 0 ${alpha(theme.palette.common.black, 0.18)}`,
  },
}
