import SensorsIcon from '@mui/icons-material/Sensors'
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
import { LineChart } from '../common/LineChart'
import type { ExperimentMeasurement } from '../data/domain'
import { subscribeToExperimentMeasurements } from '../data/firebaseData.experiment'

function formatExperimentTimestamp(measurement?: ExperimentMeasurement | null) {
  const date = measurement?.measuredAt?.toDate()

  if (!date) {
    return 'Noch kein Zeitstempel'
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date)
}

function formatShortExperimentTimestamp(measurement: ExperimentMeasurement) {
  const date = measurement.measuredAt?.toDate()

  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatVoltage(valueMv?: number | null) {
  if (valueMv === undefined || valueMv === null) {
    return 'Noch kein Messwert'
  }

  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valueMv) + ' mV'
}

export function ExperimentLiveChart() {
  const [measurements, setMeasurements] = useState<ExperimentMeasurement[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToExperimentMeasurements((nextMeasurements) => {
      setMeasurements(nextMeasurements)
      setLoaded(true)
    })

    return unsubscribe
  }, [])

  const latestMeasurement = measurements.at(-1)
  const maxValue = useMemo(
    () =>
      measurements.length > 0
        ? Math.max(...measurements.map((measurement) => measurement.valueMv))
        : undefined,
    [measurements],
  )

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="overline">Live-Versuch</Typography>
              <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.85rem', sm: undefined } }}>
                Live-Spannung
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                alignSelf: { xs: 'stretch', sm: 'flex-start' },
                border: (theme) => `1px solid ${alpha(theme.palette.primary.dark, 0.16)}`,
                borderRadius: '18px',
                px: 1.75,
                py: 1.5,
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.48),
              }}
            >
              <SensorsIcon color="primary" aria-hidden="true" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Jetzt
                </Typography>
                <Typography variant="h5" sx={{ lineHeight: 1.05 }}>
                  {formatVoltage(latestMeasurement?.valueMv)}
                </Typography>
              </Box>
            </Stack>
          </Stack>

          {!loaded ? (
            <Box
              role="status"
              aria-label="Live-Messwerte werden geladen"
              sx={{
                border: (theme) => `1px solid ${alpha(theme.palette.primary.dark, 0.16)}`,
                borderRadius: '22px',
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.34),
                p: { xs: 1.25, sm: 1.75 },
              }}
            >
              <Stack spacing={1.25}>
                <Skeleton variant="rounded" height={34} sx={{ maxWidth: 180 }} />
                <Skeleton variant="rounded" height={220} />
                <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                  <Skeleton variant="text" width={72} />
                  <Skeleton variant="text" width={72} />
                  <Skeleton variant="text" width={72} />
                </Stack>
              </Stack>
            </Box>
          ) : measurements.length === 0 ? (
            <Box
              sx={{
                border: (theme) => `1px solid ${alpha(theme.palette.primary.dark, 0.16)}`,
                borderRadius: '22px',
                px: { xs: 2, sm: 3 },
                py: { xs: 4, sm: 5 },
                textAlign: 'center',
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.34),
              }}
            >
              <Typography variant="h6">Noch keine Messwerte</Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              <LineChart
                data={measurements.map((measurement) => ({
                  id: measurement.id,
                  value: measurement.valueMv,
                  label: formatExperimentTimestamp(measurement),
                  shortLabel: formatShortExperimentTimestamp(measurement),
                }))}
                ariaLabel="Live-Diagramm der Spannung am großen Versuchsaufbau"
                detailLabelTitle="Messzeitpunkt"
                valueLabelTitle="Spannung"
                valueFormatter={formatVoltage}
              />
              <Typography variant="body2" color="text.secondary">
                Zuletzt: {formatExperimentTimestamp(latestMeasurement)} · Max: {formatVoltage(maxValue)}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
