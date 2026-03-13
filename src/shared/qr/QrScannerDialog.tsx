import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import jsQR from 'jsqr'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

interface DetectedBarcode {
  rawValue?: string
}

interface BarcodeDetectorInstance {
  detect(source: ImageBitmapSource | HTMLVideoElement | HTMLCanvasElement): Promise<DetectedBarcode[]>
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance
  getSupportedFormats?: () => Promise<string[]>
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor
  }
}

interface QrScannerDialogProps {
  open: boolean
  onClose: () => void
  onDetected: (value: string) => Promise<void> | void
}

function getScannerErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Der Kamerazugriff wurde blockiert. Bitte erlaube den Zugriff und öffne den Scanner erneut.'
    }

    if (error.name === 'NotFoundError') {
      return 'Es wurde keine Kamera gefunden.'
    }
  }

  return error instanceof Error
    ? error.message
    : 'Der QR-Scanner konnte nicht gestartet werden.'
}

export function QrScannerDialog({ open, onClose, onDetected }: QrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [error, setError] = useState('')
  const [initializing, setInitializing] = useState(false)
  const handleDetected = useEffectEvent(onDetected)

  useEffect(() => {
    if (!open) {
      setError('')
      setInitializing(false)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Dieser Browser unterstützt keinen Kamerazugriff.')
      return
    }

    const BarcodeDetectorApi = window.BarcodeDetector
    let active = true
    let frameId = 0
    let stream: MediaStream | null = null
    let detectionLocked = false
    const scannerVideoElement = videoRef.current
    const fallbackCanvas = document.createElement('canvas')
    const fallbackContext = fallbackCanvas.getContext('2d', { willReadFrequently: true })

    const startScanner = async () => {
      setInitializing(true)
      setError('')

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
          },
        })

        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        if (!scannerVideoElement) {
          throw new Error('Die Kamera konnte nicht vorbereitet werden.')
        }

        scannerVideoElement.srcObject = stream
        scannerVideoElement.setAttribute('playsinline', 'true')
        await scannerVideoElement.play()

        let detector: BarcodeDetectorInstance | null = null

        if (BarcodeDetectorApi) {
          const supportedFormats = BarcodeDetectorApi.getSupportedFormats
            ? await BarcodeDetectorApi.getSupportedFormats()
            : ['qr_code']

          if (supportedFormats.includes('qr_code')) {
            detector = new BarcodeDetectorApi({ formats: ['qr_code'] })
          }
        }

        const scanFrame = async () => {
          if (!active || detectionLocked) {
            return
          }

          try {
            if (
              !scannerVideoElement ||
              scannerVideoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
            ) {
              frameId = window.requestAnimationFrame(() => void scanFrame())
              return
            }

            let rawValue = ''

            if (detector) {
              const detectedCodes = await detector.detect(scannerVideoElement)
              rawValue = detectedCodes.find((item) => item.rawValue?.trim())?.rawValue?.trim() ?? ''
            } else {
              if (!fallbackContext) {
                throw new Error('Die Kamera konnte nicht vorbereitet werden.')
              }

              const width = scannerVideoElement.videoWidth
              const height = scannerVideoElement.videoHeight

              if (!width || !height) {
                frameId = window.requestAnimationFrame(() => void scanFrame())
                return
              }

              if (fallbackCanvas.width !== width || fallbackCanvas.height !== height) {
                fallbackCanvas.width = width
                fallbackCanvas.height = height
              }

              fallbackContext.drawImage(scannerVideoElement, 0, 0, width, height)
              const imageData = fallbackContext.getImageData(0, 0, width, height)
              const decodedCode = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
              })
              rawValue = decodedCode?.data?.trim() ?? ''
            }

            if (rawValue) {
              detectionLocked = true
              await handleDetected(rawValue)
              return
            }
          } catch (scanError) {
            setError(getScannerErrorMessage(scanError))
            return
          }

          frameId = window.requestAnimationFrame(() => void scanFrame())
        }

        frameId = window.requestAnimationFrame(() => void scanFrame())
      } catch (startError) {
        setError(getScannerErrorMessage(startError))
      } finally {
        if (active) {
          setInitializing(false)
        }
      }
    }

    void startScanner()

    return () => {
      active = false
      window.cancelAnimationFrame(frameId)

      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      if (scannerVideoElement) {
        scannerVideoElement.pause()
        scannerVideoElement.srcObject = null
      }
    }
  }, [open])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>QR-Code scannen</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Richte die Kamera auf den QR-Code deiner Brennstoffzelle. Nach dem Scan startet die Verknüpfung automatisch.
          </Typography>

          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 3,
              minHeight: 280,
              bgcolor: 'rgba(36,28,19,0.92)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Box
              component="video"
              ref={videoRef}
              autoPlay
              muted
              playsInline
              sx={{
                width: '100%',
                minHeight: 280,
                objectFit: 'cover',
                display: error ? 'none' : 'block',
              }}
            />
            {initializing ? (
              <Stack
                spacing={1}
                alignItems="center"
                sx={{ position: 'absolute', inset: 0, justifyContent: 'center' }}
              >
                <CircularProgress color="inherit" />
                <Typography variant="body2" color="common.white">
                  Kamera wird gestartet...
                </Typography>
              </Stack>
            ) : null}
            {!initializing && !error ? (
              <Stack
                spacing={1}
                alignItems="center"
                sx={{
                  position: 'absolute',
                  insetInline: 0,
                  bottom: 16,
                  pointerEvents: 'none',
                }}
              >
                <QrCodeScannerIcon sx={{ color: 'common.white' }} />
                <Typography variant="body2" color="common.white">
                  QR-Code im Rahmen platzieren
                </Typography>
              </Stack>
            ) : null}
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  )
}
