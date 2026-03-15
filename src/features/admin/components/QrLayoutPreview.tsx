import { Alert, Box, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { generateQrDataUrl } from '../../../shared/utils/qr'
import type { QrPdfLayoutPreview } from '../../../shared/utils/qr'

interface QrLayoutPreviewProps {
  layout: QrPdfLayoutPreview | null
  totalCards: number
}

const PREVIEW_REFERENCE_MM = 297

function createPreviewValues(count: number) {
  return Array.from(
    { length: count },
    (_, index) => `https://preview.local/register/dummy-${String(index + 1).padStart(3, '0')}`,
  )
}

export function QrLayoutPreview({ layout, totalCards }: QrLayoutPreviewProps) {
  const [qrDataUrls, setQrDataUrls] = useState<string[]>([])
  const [error, setError] = useState('')

  const visibleCards = layout ? Math.min(layout.cardsPerPage, totalCards) : 0

  useEffect(() => {
    if (!layout || visibleCards < 1) {
      return
    }

    let active = true

    Promise.all(createPreviewValues(visibleCards).map((value) => generateQrDataUrl(value)))
      .then((nextDataUrls) => {
        if (!active) {
          return
        }

        setQrDataUrls(nextDataUrls)
        setError('')
      })
      .catch(() => {
        if (!active) {
          return
        }

        setQrDataUrls([])
        setError('Die Dummy-QR-Codes für die Vorschau konnten nicht erzeugt werden.')
      })

    return () => {
      active = false
    }
  }, [layout, visibleCards])

  if (!layout) {
    return (
      <Alert severity="info">
        Bitte eine gültige Anzahl und QR-Größe eingeben, damit die Vorschau berechnet werden kann.
      </Alert>
    )
  }

  const previewWidthPercent = Math.min((layout.pageWidthMm / PREVIEW_REFERENCE_MM) * 100, 100)

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          borderRadius: 4,
          bgcolor: 'rgba(36,28,19,0.06)',
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            width: '100%',
            minHeight: { xs: 220, sm: 320 },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: `${previewWidthPercent}%`,
              maxWidth: '100%',
              aspectRatio: `${layout.pageWidthMm} / ${layout.pageHeightMm}`,
              bgcolor: '#fffdf8',
              borderRadius: 2,
              border: '1px solid rgba(36,28,19,0.14)',
              boxShadow: '0 12px 24px rgba(36,28,19,0.08)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {qrDataUrls.map((dataUrl, index) => {
              const row = Math.floor(index / layout.columns)
              const column = index % layout.columns
              const xMm = layout.startXmm + column * (layout.cardWidthMm + layout.gapXmm)
              const yMm = layout.startYmm + row * (layout.cardHeightMm + layout.gapYmm)

              return (
                <Box
                  key={`preview-card-${index + 1}`}
                  sx={{
                    position: 'absolute',
                    left: `${(xMm / layout.pageWidthMm) * 100}%`,
                    top: `${(yMm / layout.pageHeightMm) * 100}%`,
                    width: `${(layout.cardWidthMm / layout.pageWidthMm) * 100}%`,
                    height: `${(layout.cardHeightMm / layout.pageHeightMm) * 100}%`,
                    display: 'grid',
                  }}
                >
                  <Box
                    component="img"
                    src={dataUrl}
                    alt=""
                    sx={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      display: 'block',
                    }}
                  />
                </Box>
              )
            })}
          </Box>
        </Box>
      </Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="body2" color="text.secondary">
          Seite 1 / {layout.pageCount}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {visibleCards} von {totalCards} QR-Codes auf dieser Seite
        </Typography>
      </Stack>
    </Stack>
  )
}
