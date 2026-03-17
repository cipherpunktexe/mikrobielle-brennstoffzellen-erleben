import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import ReplayIcon from '@mui/icons-material/Replay'
import { BrowserQRCodeReader } from '@zxing/browser'
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

interface QrScannerDialogProps {
  open: boolean
  onClose: () => void
  onDetected: (value: string) => Promise<void> | void
  mode?: 'link' | 'admin'
}

type CameraState = 'idle' | 'starting' | 'ready' | 'processing'

const SCAN_INTERVAL_MS = 180
const DUPLICATE_DETECTION_COOLDOWN_MS = 1200
const CAMERA_START_TIMEOUT_MS = 10000
const VIDEO_READY_TIMEOUT_MS = 2500
const ZXING_MAX_FRAME_EDGE = 1280

function playScanSound() {
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioCtx) {
      return
    }

    const audioContext = new AudioCtx()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    const now = audioContext.currentTime

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(980, now)
    oscillator.frequency.exponentialRampToValueAtTime(1240, now + 0.08)

    gainNode.gain.setValueAtTime(0.0001, now)
    gainNode.gain.exponentialRampToValueAtTime(0.07, now + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.1)

    oscillator.onended = () => {
      void audioContext.close()
    }
  } catch {
    // Audio feedback is optional and should never break scanning.
  }
}
function summarizeRawValue(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  if (trimmed.length <= 64) {
    return trimmed
  }

  return `${trimmed.slice(0, 61)}...`
}

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

function detectWithZxing(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  reader: BrowserQRCodeReader | null,
) {
  if (!reader) {
    return ''
  }

  const sourceWidth = video.videoWidth
  const sourceHeight = video.videoHeight

  if (!sourceWidth || !sourceHeight) {
    return ''
  }

  const scale = Math.min(1, ZXING_MAX_FRAME_EDGE / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  context.drawImage(video, 0, 0, width, height)

  try {
    return reader.decodeFromCanvas(canvas).getText()?.trim() ?? ''
  } catch {
    return ''
  }
}

export function QrScannerDialog({
  open,
  onClose,
  onDetected,
  mode = 'link',
}: QrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const zxingReaderRef = useRef<BrowserQRCodeReader | null>(null)
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
  const [lastRejectedValue, setLastRejectedValue] = useState('')
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
    zxingReaderRef.current = null
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
      setLastRejectedValue(summarizeRawValue(trimmedValue))
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
      setLastRejectedValue('')
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
    setLastRejectedValue('')
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

        zxingReaderRef.current = new BrowserQRCodeReader()

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

          if (canvasRef.current && contextRef.current) {
            try {
              rawValue = detectWithZxing(
                scanVideo,
                canvasRef.current,
                contextRef.current,
                zxingReaderRef.current,
              )
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
          setLastRejectedValue('')
          playScanSound()
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
              setLastRejectedValue(summarizeRawValue(rawValue))
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
  const scannerDescription =
    mode === 'admin'
      ? 'Richte die Kamera auf den QR-Code der Brennstoffzelle. Nach dem Scan wird der Code direkt für die Messwerterfassung übernommen.'
      : 'Richte die Kamera auf den QR-Code deiner Brennstoffzelle. Nach dem Scan startet die Verknüpfung automatisch.'

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>QR-Code scannen</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography color="text.secondary">
            {scannerDescription}
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
                    setLastRejectedValue('')
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
          {lastRejectedValue ? (
            <Alert severity="warning">
              Letzter erkannter Inhalt konnte nicht verarbeitet werden: <strong>{lastRejectedValue}</strong>
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
                  Übernehmen
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

