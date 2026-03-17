import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import ReplayIcon from '@mui/icons-material/Replay'
import jsQR from 'jsqr'
import {
  Alert,
  Box,
  Button,
  Collapse,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'

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

type CameraState = 'idle' | 'starting' | 'ready' | 'processing'

const SCAN_INTERVAL_MS = 180
const DUPLICATE_DETECTION_COOLDOWN_MS = 1200
const CAMERA_START_TIMEOUT_MS = 10000
const VIDEO_READY_TIMEOUT_MS = 2500
const BARCODE_FORMATS_TIMEOUT_MS = 900
const JSQR_MAX_FRAME_EDGE = 960
const JSQR_CENTER_CROP_RATIO = 0.72

function getScannerErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Der Kamerazugriff ist blockiert. Bitte Zugriff erlauben und erneut versuchen.'
    }

    if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
      return 'Es wurde keine passende Kamera gefunden.'
    }

    if (error.name === 'NotReadableError') {
      return 'Die Kamera ist bereits in Benutzung oder konnte nicht gelesen werden.'
    }

    if (error.name === 'AbortError') {
      return 'Der Kamerastart wurde unterbrochen. Bitte erneut versuchen.'
    }
  }

  return error instanceof Error ? error.message : 'Der QR-Scanner konnte nicht gestartet werden.'
}

function stopStream(stream: MediaStream | null) {
  if (!stream) {
    return
  }

  stream.getTracks().forEach((track) => track.stop())
}

async function waitForVideoReady(video: HTMLVideoElement, timeoutMs: number) {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup()
      reject(new Error('Die Kamera liefert keine Videodaten.'))
    }, timeoutMs)

    const handleLoaded = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        cleanup()
        resolve()
      }
    }

    const cleanup = () => {
      window.clearTimeout(timeoutId)
      video.removeEventListener('loadedmetadata', handleLoaded)
      video.removeEventListener('loadeddata', handleLoaded)
    }

    video.addEventListener('loadedmetadata', handleLoaded)
    video.addEventListener('loadeddata', handleLoaded)
  })
}

async function getUserMediaWithTimeout(constraints: MediaStreamConstraints, timeoutMs: number) {
  const mediaRequest = navigator.mediaDevices.getUserMedia(constraints)
  let timeoutId = 0

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error('Der Kamerastart hat zu lange gedauert.'))
    }, timeoutMs)
  })

  try {
    return await Promise.race([mediaRequest, timeoutPromise])
  } catch (error) {
    mediaRequest
      .then((lateStream) => stopStream(lateStream))
      .catch(() => undefined)
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function startCameraStream() {
  const cameraConstraints: MediaStreamConstraints[] = [
    {
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    },
    {
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
      },
    },
    {
      audio: false,
      video: {
        facingMode: 'environment',
      },
    },
    {
      audio: false,
      video: true,
    },
  ]

  let lastError: unknown = null

  for (const constraints of cameraConstraints) {
    try {
      return await getUserMediaWithTimeout(constraints, CAMERA_START_TIMEOUT_MS)
    } catch (cameraError) {
      lastError = cameraError
    }
  }

  throw lastError ?? new Error('Die Kamera konnte nicht gestartet werden.')
}

async function createQrDetector(BarcodeDetectorApi?: BarcodeDetectorConstructor) {
  if (!BarcodeDetectorApi) {
    return null
  }

  try {
    if (BarcodeDetectorApi.getSupportedFormats) {
      const supportedFormats = await Promise.race([
        BarcodeDetectorApi.getSupportedFormats(),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('timeout')), BARCODE_FORMATS_TIMEOUT_MS)
        }),
      ])

      if (!supportedFormats.includes('qr_code')) {
        return null
      }
    }

    return new BarcodeDetectorApi({ formats: ['qr_code'] })
  } catch {
    return null
  }
}

function detectWithJsQr(video: HTMLVideoElement, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  const sourceWidth = video.videoWidth
  const sourceHeight = video.videoHeight

  if (!sourceWidth || !sourceHeight) {
    return ''
  }

  const scale = Math.min(1, JSQR_MAX_FRAME_EDGE / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  context.drawImage(video, 0, 0, width, height)
  const fullFrame = context.getImageData(0, 0, width, height)
  const decodedFromFullFrame = jsQR(fullFrame.data, fullFrame.width, fullFrame.height, {
    inversionAttempts: 'attemptBoth',
  })

  if (decodedFromFullFrame?.data?.trim()) {
    return decodedFromFullFrame.data.trim()
  }

  // Extra pass for small/centered QR codes that can get lost in full-frame noise.
  const cropSize = Math.max(80, Math.floor(Math.min(width, height) * JSQR_CENTER_CROP_RATIO))
  const cropLeft = Math.max(0, Math.floor((width - cropSize) / 2))
  const cropTop = Math.max(0, Math.floor((height - cropSize) / 2))
  const centerCrop = context.getImageData(cropLeft, cropTop, cropSize, cropSize)
  const decodedFromCenterCrop = jsQR(centerCrop.data, centerCrop.width, centerCrop.height, {
    inversionAttempts: 'attemptBoth',
  })

  return decodedFromCenterCrop?.data?.trim() ?? ''
}

export function QrScannerDialog({ open, onClose, onDetected }: QrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const frameRef = useRef(0)
  const sessionRef = useRef(0)
  const processingRef = useRef(false)
  const lastScanAtRef = useRef(0)
  const lastDetectedRef = useRef<{ value: string; timestamp: number }>({ value: '', timestamp: 0 })
  const detectedHandlerRef = useRef(onDetected)
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [error, setError] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [restartCounter, setRestartCounter] = useState(0)

  useEffect(() => {
    detectedHandlerRef.current = onDetected
  }, [onDetected])

  function resetScannerRuntime() {
    window.cancelAnimationFrame(frameRef.current)
    frameRef.current = 0
    detectorRef.current = null
    processingRef.current = false
    lastScanAtRef.current = 0
    lastDetectedRef.current = { value: '', timestamp: 0 }
    stopStream(streamRef.current)
    streamRef.current = null

    const video = videoRef.current

    if (video) {
      video.pause()
      video.srcObject = null
    }
  }

  function scheduleNextScan(scanFn: (timestamp: number) => Promise<void>) {
    frameRef.current = window.requestAnimationFrame((timestamp) => {
      void scanFn(timestamp)
    })
  }

  async function handleManualSubmit() {
    const trimmedValue = manualValue.trim()

    if (!trimmedValue) {
      setError('Bitte gib einen Code oder eine URL ein.')
      return
    }

    setManualSubmitting(true)
    setError('')

    try {
      await detectedHandlerRef.current(trimmedValue)
    } catch (detectError) {
      setError(getScannerErrorMessage(detectError))
    } finally {
      setManualSubmitting(false)
    }
  }

  useEffect(() => {
    if (!open) {
      sessionRef.current += 1
      resetScannerRuntime()
      setCameraState('idle')
      setError('')
      setManualOpen(false)
      setManualValue('')
      setManualSubmitting(false)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('idle')
      setError('Dieser Browser unterstützt keinen Kamerazugriff.')
      return
    }

    const sessionId = sessionRef.current + 1
    sessionRef.current = sessionId
    setCameraState('starting')
    setError('')
    processingRef.current = false
    lastDetectedRef.current = { value: '', timestamp: 0 }

    const startScanner = async () => {
      try {
        const stream = await startCameraStream()

        if (sessionRef.current !== sessionId) {
          stopStream(stream)
          return
        }

        const video = videoRef.current

        if (!video) {
          throw new Error('Die Kamera konnte nicht vorbereitet werden.')
        }

        streamRef.current = stream
        video.autoplay = true
        video.muted = true
        video.playsInline = true
        video.setAttribute('playsinline', 'true')
        video.setAttribute('muted', 'true')
        video.srcObject = stream

        await waitForVideoReady(video, VIDEO_READY_TIMEOUT_MS)

        try {
          await video.play()
        } catch {
          // Safari can reject play() while video frames are still available.
        }

        if (sessionRef.current !== sessionId) {
          return
        }

        detectorRef.current = await createQrDetector(window.BarcodeDetector)

        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas')
          contextRef.current = canvasRef.current.getContext('2d', { willReadFrequently: true })
        }

        setCameraState('ready')

        const scanFrame = async (timestamp: number) => {
          if (sessionRef.current !== sessionId) {
            return
          }

          if (timestamp - lastScanAtRef.current < SCAN_INTERVAL_MS) {
            scheduleNextScan(scanFrame)
            return
          }

          lastScanAtRef.current = timestamp

          const scanVideo = videoRef.current

          if (!scanVideo || scanVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            scheduleNextScan(scanFrame)
            return
          }

          if (processingRef.current) {
            scheduleNextScan(scanFrame)
            return
          }

          let rawValue = ''

          if (detectorRef.current) {
            try {
              const detectedCodes = await detectorRef.current.detect(scanVideo)
              rawValue = detectedCodes.find((item) => item.rawValue?.trim())?.rawValue?.trim() ?? ''
            } catch {
              detectorRef.current = null
            }
          }

          if (!rawValue && canvasRef.current && contextRef.current) {
            try {
              rawValue = detectWithJsQr(scanVideo, canvasRef.current, contextRef.current)
            } catch {
              // Ignore one-off frame read errors and continue scanning.
            }
          }

          if (!rawValue) {
            scheduleNextScan(scanFrame)
            return
          }

          const now = Date.now()
          const lastDetected = lastDetectedRef.current

          if (
            rawValue === lastDetected.value &&
            now - lastDetected.timestamp < DUPLICATE_DETECTION_COOLDOWN_MS
          ) {
            scheduleNextScan(scanFrame)
            return
          }

          lastDetectedRef.current = { value: rawValue, timestamp: now }
          processingRef.current = true
          setCameraState('processing')

          try {
            await detectedHandlerRef.current(rawValue)

            if (sessionRef.current === sessionId) {
              processingRef.current = false
              setCameraState('ready')
              scheduleNextScan(scanFrame)
            }
          } catch (detectError) {
            if (sessionRef.current === sessionId) {
              setError(getScannerErrorMessage(detectError))
              processingRef.current = false
              setCameraState('ready')
              scheduleNextScan(scanFrame)
            }
            return
          }
        }

        scheduleNextScan(scanFrame)
      } catch (startError) {
        if (sessionRef.current !== sessionId) {
          return
        }

        setError(getScannerErrorMessage(startError))
        setCameraState('idle')
      }
    }

    void startScanner()

    return () => {
      sessionRef.current += 1
      resetScannerRuntime()
    }
  }, [open, restartCounter])

  const cameraReady = cameraState === 'ready' || cameraState === 'processing'
  const initializing = cameraState === 'starting'
  const processing = cameraState === 'processing'

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
              minHeight: { xs: 300, sm: 320 },
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
                minHeight: { xs: 300, sm: 320 },
                objectFit: 'cover',
                display: 'block',
              }}
            />

            <Box
              sx={{
                pointerEvents: 'none',
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: { xs: 190, sm: 220 },
                height: { xs: 190, sm: 220 },
                transform: 'translate(-50%, -50%)',
                border: '2px solid rgba(255,255,255,0.72)',
                borderRadius: 3,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.14)',
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

            {processing ? (
              <Stack
                spacing={1}
                alignItems="center"
                sx={{ position: 'absolute', inset: 0, justifyContent: 'center' }}
              >
                <CircularProgress color="inherit" />
                <Typography variant="body2" color="common.white">
                  Code wird verarbeitet...
                </Typography>
              </Stack>
            ) : null}

            {!initializing && cameraReady && !processing ? (
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

          {error ? (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<ReplayIcon />}
                  onClick={() => {
                    setError('')
                    setRestartCounter((current) => current + 1)
                  }}
                >
                  Neustart
                </Button>
              }
            >
              {error}
            </Alert>
          ) : null}

          <Stack spacing={1}>
            <Button
              variant="text"
              color="inherit"
              startIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: manualOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 160ms ease',
                  }}
                />
              }
              onClick={() => setManualOpen((current) => !current)}
              sx={{ justifyContent: 'flex-start', width: 'fit-content', px: 0.5 }}
            >
              Manuell eingeben
            </Button>
            <Collapse in={manualOpen} timeout={180}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  value={manualValue}
                  onChange={(event) => setManualValue(event.target.value)}
                  placeholder="z. B. 001C oder https://.../register/001c"
                  size="small"
                  fullWidth
                  disabled={manualSubmitting}
                />
                <Button
                  variant="outlined"
                  onClick={() => void handleManualSubmit()}
                  disabled={manualSubmitting}
                >
                  Uebernehmen
                </Button>
              </Stack>
            </Collapse>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  )
}
