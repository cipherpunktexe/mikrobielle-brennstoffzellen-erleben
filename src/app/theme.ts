import { alpha, createTheme } from '@mui/material/styles'

const paletteColor = {
  primary: '#8F7A51',
  secondary: '#796542',
  backgroundDefault: '#A1947C',
  backgroundPaper: '#C4C0B9',
  textPrimary: '#241C13',
  textSecondary: '#4D4331',
  contrastText: '#F9F6EF',
  success: '#53734D',
  warning: '#A06E2A',
}

const surfaceBorder = `1px solid ${alpha(paletteColor.secondary, 0.18)}`
const shadowSoft = `0 14px 28px ${alpha('#000000', 0.14)}`
const shadowPanel = `0 18px 34px ${alpha('#000000', 0.12)}`
const shadowMenu = `0 16px 30px ${alpha('#000000', 0.16)}`

export const theme = createTheme({
  palette: {
    primary: {
      main: paletteColor.primary,
      dark: paletteColor.secondary,
      contrastText: paletteColor.contrastText,
    },
    secondary: {
      main: paletteColor.secondary,
      contrastText: paletteColor.contrastText,
    },
    background: {
      default: paletteColor.backgroundDefault,
      paper: paletteColor.backgroundPaper,
    },
    text: {
      primary: paletteColor.textPrimary,
      secondary: paletteColor.textSecondary,
    },
    divider: alpha(paletteColor.secondary, 0.18),
    action: {
      hover: alpha(paletteColor.primary, 0.1),
      selected: alpha(paletteColor.primary, 0.17),
      focus: alpha(paletteColor.primary, 0.22),
    },
    success: {
      main: paletteColor.success,
    },
    warning: {
      main: paletteColor.warning,
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Trebuchet MS", "Verdana", sans-serif',
    h1: {
      fontFamily: '"Palatino Linotype", "Book Antiqua", serif',
      fontSize: 'clamp(2.8rem, 5vw, 4.8rem)',
      fontWeight: 700,
      letterSpacing: '-0.04em',
      lineHeight: 0.98,
    },
    h2: {
      fontFamily: '"Palatino Linotype", "Book Antiqua", serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Palatino Linotype", "Book Antiqua", serif',
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            `radial-gradient(circle at top, ${alpha(paletteColor.contrastText, 0.38)}, transparent 38%), linear-gradient(180deg, #B1A48D 0%, ${paletteColor.backgroundDefault} 30%, #94846A 100%)`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: alpha(paletteColor.secondary, 0.72),
          backdropFilter: 'blur(18px)',
          boxShadow: 'none',
          borderBottom: `1px solid ${alpha(paletteColor.contrastText, 0.12)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: alpha(paletteColor.backgroundPaper, 0.88),
          boxShadow: `0 26px 50px ${alpha(paletteColor.textPrimary, 0.12)}`,
          border: surfaceBorder,
        },
      },
      variants: [
        {
          props: { variant: 'soft' },
          style: {
            background: alpha('#FFFFFF', 0.72),
            border: surfaceBorder,
            boxShadow: shadowSoft,
          },
        },
        {
          props: { variant: 'subtle' },
          style: {
            background: alpha(paletteColor.textPrimary, 0.06),
            border: surfaceBorder,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'panel' },
          style: {
            background: alpha(paletteColor.backgroundPaper, 0.74),
            border: surfaceBorder,
            boxShadow: shadowPanel,
          },
        },
      ],
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&::before': {
            display: 'none',
          },
        },
      },
      variants: [
        {
          props: { variant: 'soft' },
          style: {
            border: surfaceBorder,
            background: alpha(paletteColor.backgroundPaper, 0.8),
            borderRadius: 18,
          },
        },
      ],
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 14,
          paddingInline: 18,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: surfaceBorder,
          boxShadow: shadowMenu,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: alpha(paletteColor.primary, 0.1),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(paletteColor.primary, 0.17),
          },
          '&.Mui-selected:hover': {
            backgroundColor: alpha(paletteColor.primary, 0.24),
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
        },
      },
    },
  },
})
