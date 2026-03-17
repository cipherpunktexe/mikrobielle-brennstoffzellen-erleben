import '@mui/material/Paper'

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    soft: true
    subtle: true
    panel: true
  }
}
