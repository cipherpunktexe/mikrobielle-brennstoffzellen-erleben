import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: {
      main: '#8F7A51',
      dark: '#796542',
      contrastText: '#F9F6EF',
    },
    secondary: {
      main: '#796542',
      contrastText: '#F9F6EF',
    },
    background: {
      default: '#A1947C',
      paper: '#C4C0B9',
    },
    text: {
      primary: '#241C13',
      secondary: '#4D4331',
    },
    divider: 'rgba(121,101,66,0.18)',
    action: {
      hover: 'rgba(143,122,81,0.10)',
      selected: 'rgba(143,122,81,0.17)',
      focus: 'rgba(143,122,81,0.22)',
    },
    success: {
      main: '#53734D',
    },
    warning: {
      main: '#A06E2A',
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
            'radial-gradient(circle at top, rgba(255,248,231,0.38), transparent 38%), linear-gradient(180deg, #B1A48D 0%, #A1947C 30%, #94846A 100%)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(121, 101, 66, 0.72)',
          backdropFilter: 'blur(18px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(249, 246, 239, 0.12)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(196, 192, 185, 0.88)',
          boxShadow: '0 26px 50px rgba(49, 39, 24, 0.12)',
          border: '1px solid rgba(121, 101, 66, 0.18)',
        },
      },
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
