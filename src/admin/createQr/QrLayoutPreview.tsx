import { Alert, Box, Card, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { buildGeneratorQrValue, generateQrDataUrl, getQrBadgeLabel } from '../../common/qr/qr'
import type { QrPdfLayoutPreview } from '../../common/qr/qr'

interface QrLayoutPreviewProps {
  layout: QrPdfLayoutPreview | null
  totalCards: number
  digits: number
  startSequence: number | null
}

function formatPreviewCode(sequence: number, digits: number) {
  return sequence.toString(16).toUpperCase().padStart(Math.max(1, Math.floor(digits)), '0')
}

function createPreviewCards(count: number, digits: number, startSequence: number | null) {
  const baseSequence = startSequence && Number.isFinite(startSequence) && startSequence > 0 ? startSequence : 1

  return Array.from({ length: count }, (_, index) => {
    const code = formatPreviewCode(baseSequence + index, digits)

    return {
      code,
      scanValue: buildGeneratorQrValue(code),
    }
  })
}

export function QrLayoutPreview({
  layout,
  totalCards,
  digits,
  startSequence,
}: QrLayoutPreviewProps) {
  const [qrDataUrls, setQrDataUrls] = useState<string[]>([])
  const [error, setError] = useState('')

  const visibleCards = layout ? Math.min(layout.cardsPerPage, totalCards) : 0

  useEffect(() => {
    if (!layout || visibleCards < 1) {
      return
    }

    let active = true

    Promise.all(
      createPreviewCards(visibleCards, digits, startSequence).map((card) =>
        generateQrDataUrl(card.scanValue, getQrBadgeLabel(card.code)),
      ),
    )
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
  }, [digits, layout, startSequence, visibleCards])

  if (!layout) {
    return (
      <Alert severity="info">
        Bitte eine gültige Anzahl und QR-Größe eingeben, damit die Vorschau berechnet werden kann.
      </Alert>
    )
  }

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card
        variant="subtle"
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          borderRadius: 4,
          display: 'flex',
          flex: 1,
          minHeight: { xs: 240, sm: 360 },
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Card
            variant="panel"
            sx={{
              position: 'relative',
              height: '100%',
              width: 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
              aspectRatio: `${layout.pageWidthMm} / ${layout.pageHeightMm}`,
              borderRadius: 2,
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
          </Card>
        </Box>
      </Card>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
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
