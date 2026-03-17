import { createTheme } from '@mui/material/styles'

interface AppThemeCustom {
  surface: {
    subtle: string
    muted: string
    hover: string
    strong: string
    strongHover: string
    elevated: string
  }
  border: {
    soft: string
    default: string
    strong: string
    interactive: string
    interactiveStrong: string
  }
  state: {
    brandSoft: string
    brandSelected: string
    brandSelectedHover: string
    focus: string
  }
  text: {
    muted: string
    mutedSecondary: string
    strong: string
  }
  shadow: {
    soft: string
    panel: string
  }
  chart: {
    line: string
    lineDark: string
    pointFill: string
  }
}

declare module '@mui/material/styles' {
  interface Theme {
    custom: AppThemeCustom
  }

  interface ThemeOptions {
    custom?: Partial<AppThemeCustom>
  }
}

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
  custom: {
    surface: {
      subtle: 'rgba(255,255,255,0.18)',
      muted: 'rgba(255,255,255,0.24)',
      hover: 'rgba(255,255,255,0.34)',
      strong: 'rgba(255,255,255,0.72)',
      strongHover: 'rgba(255,255,255,0.96)',
      elevated: 'rgba(255,255,255,0.9)',
    },
    border: {
      soft: 'rgba(121,101,66,0.1)',
      default: 'rgba(121,101,66,0.14)',
      strong: 'rgba(121,101,66,0.18)',
      interactive: 'rgba(121,101,66,0.28)',
      interactiveStrong: 'rgba(121,101,66,0.52)',
    },
    state: {
      brandSoft: 'rgba(143,122,81,0.1)',
      brandSelected: 'rgba(143,122,81,0.17)',
      brandSelectedHover: 'rgba(143,122,81,0.22)',
      focus: 'rgba(143,122,81,0.55)',
    },
    text: {
      muted: 'rgba(110,103,95,0.92)',
      mutedSecondary: 'rgba(110,103,95,0.88)',
      strong: 'rgba(60,48,33,0.96)',
    },
    shadow: {
      soft: '0 8px 20px rgba(36,28,19,0.1)',
      panel: '0 12px 28px rgba(36,28,19,0.1)',
    },
    chart: {
      line: '#5F6B7A',
      lineDark: '#2C3440',
      pointFill: '#FFFFFF',
    },
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
