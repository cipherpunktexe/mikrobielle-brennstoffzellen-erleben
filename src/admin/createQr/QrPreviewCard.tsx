import QrCode2Icon from '@mui/icons-material/QrCode2'
import { Alert, Card, CardContent, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { generateQrDataUrl } from '../../app/qr'

interface QrPreviewCardProps {
  title: string
  value: string
  helper: string
}

export function QrPreviewCard({ title, value, helper }: QrPreviewCardProps) {
  const [dataUrl, setDataUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    generateQrDataUrl(value)
      .then((nextDataUrl) => {
        if (active) {
          setError('')
          setDataUrl(nextDataUrl)
        }
      })
      .catch(() => {
        if (active) {
          setDataUrl('')
          setError('QR-Code konnte nicht erzeugt werden.')
        }
      })

    return () => {
      active = false
    }
  }, [value])

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="center">
          <QrCode2Icon />
          <div>
            <Typography variant="h6" textAlign="center">
              {title}
            </Typography>
            <Typography color="text.secondary" textAlign="center">
              {helper}
            </Typography>
          </div>
          {error ? (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          ) : (
            <img
              src={dataUrl}
              alt={`QR-Code für ${title}`}
              style={{ width: '100%', maxWidth: 240, borderRadius: 20 }}
            />
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ wordBreak: 'break-all', textAlign: 'center' }}
          >
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
