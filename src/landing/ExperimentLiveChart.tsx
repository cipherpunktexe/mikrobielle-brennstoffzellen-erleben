import CloseIcon from '@mui/icons-material/Close'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import SensorsIcon from '@mui/icons-material/Sensors'
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
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

type ExperimentVoltageUnit = 'µV' | 'mV' | 'V'

function getExperimentVoltageUnit(valuesMv: number[]): ExperimentVoltageUnit {
  const maxAbsValueMv = Math.max(
    0,
    ...valuesMv
      .filter((valueMv) => Number.isFinite(valueMv))
      .map((valueMv) => Math.abs(valueMv)),
  )

  if (maxAbsValueMv >= 1000) {
    return 'V'
  }

  if (maxAbsValueMv > 0 && maxAbsValueMv < 1) {
    return 'µV'
  }

  return 'mV'
}

function formatExperimentVoltage(valueMv: number | undefined | null, unit: ExperimentVoltageUnit) {
  if (valueMv === undefined || valueMv === null) {
    return 'Noch kein Messwert'
  }

  const scaledValue =
    unit === 'V'
      ? valueMv / 1000
      : unit === 'µV'
        ? valueMv * 1000
        : valueMv
  const maximumFractionDigits = unit === 'V' ? 3 : unit === 'mV' ? 2 : 0

  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(scaledValue) + ` ${unit}`
}

export function createExperimentVoltageFormatter(valuesMv: number[]) {
  const unit = getExperimentVoltageUnit(valuesMv)

  return (valueMv?: number | null) => formatExperimentVoltage(valueMv, unit)
}

interface LiveChartMetricProps {
  label: string
  value: string
  icon?: boolean
}

function LiveChartMetric({ label, value, icon = false }: LiveChartMetricProps) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{
        minWidth: 0,
        flexGrow: { xs: 1, sm: 0 },
        border: (theme) => `1px solid ${alpha(theme.palette.primary.dark, 0.16)}`,
        borderRadius: '18px',
        px: 1.75,
        py: 1.5,
        bgcolor: (theme) => alpha(theme.palette.common.white, 0.48),
      }}
    >
      {icon ? <SensorsIcon color="primary" aria-hidden="true" /> : null}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ lineHeight: 1.05, overflowWrap: 'anywhere' }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  )
}

export function ExperimentLiveChart() {
  const [measurements, setMeasurements] = useState<ExperimentMeasurement[]>([])
  const [loaded, setLoaded] = useState(false)
  const [chartDialogOpen, setChartDialogOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToExperimentMeasurements((nextMeasurements) => {
      setMeasurements(nextMeasurements)
      setLoaded(true)
    })

    return unsubscribe
  }, [])

  const latestMeasurement = measurements.at(-1)
  const valuesMv = useMemo(
    () => measurements.map((measurement) => measurement.valueMv),
    [measurements],
  )
  const formatVoltage = useMemo(
    () => createExperimentVoltageFormatter(valuesMv),
    [valuesMv],
  )
  const chartData = useMemo(
    () =>
      measurements.map((measurement) => ({
        id: measurement.id,
        value: measurement.valueMv,
        label: formatExperimentTimestamp(measurement),
        shortLabel: formatShortExperimentTimestamp(measurement),
      })),
    [measurements],
  )
  const maxValue = useMemo(
    () =>
      valuesMv.length > 0
        ? Math.max(...valuesMv)
        : undefined,
    [valuesMv],
  )

  return (
    <>
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'flex-start' }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="overline">Live-Versuch</Typography>
                <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.85rem', sm: undefined } }}>
                  Live-Spannung
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  alignSelf: { xs: 'stretch', sm: 'flex-start' },
                  justifyContent: 'space-between',
                }}
              >
                <LiveChartMetric label="Letzter" value={formatVoltage(latestMeasurement?.valueMv)} icon />

                <Tooltip title="Diagramm im Vollbild öffnen">
                  <span>
                    <IconButton
                      aria-label="Diagramm im Vollbild öffnen"
                      onClick={() => setChartDialogOpen(true)}
                      disabled={!loaded || measurements.length === 0}
                    >
                      <OpenInFullIcon />
                    </IconButton>
                  </span>
                </Tooltip>
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
                  data={chartData}
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

      <Dialog
        open={chartDialogOpen}
        onClose={() => setChartDialogOpen(false)}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
          },
        }}
      >
        <DialogTitle
          sx={{
            pr: 6,
            py: { xs: 1.5, sm: 2 },
            fontSize: { xs: '1.75rem', sm: undefined },
          }}
        >
          Live-Spannung
          <IconButton
            aria-label="Vollbild schließen"
            onClick={() => setChartDialogOpen(false)}
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            px: { xs: 1.25, sm: 3, md: 5 },
            py: { xs: 1.5, sm: 3 },
          }}
        >
          <Stack spacing={{ xs: 2, sm: 3 }} sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems="stretch"
              justifyContent="flex-end"
            >
              <LiveChartMetric label="Letzter" value={formatVoltage(latestMeasurement?.valueMv)} icon />
            </Stack>
            <Stack spacing={1.5}>
              <LineChart
                data={chartData}
                ariaLabel="Live-Diagramm der Spannung am großen Versuchsaufbau im Vollbild"
                detailLabelTitle="Messzeitpunkt"
                valueLabelTitle="Spannung"
                valueFormatter={formatVoltage}
              />
              <Typography variant="body2" color="text.secondary">
                Zuletzt: {formatExperimentTimestamp(latestMeasurement)} · Max: {formatVoltage(maxValue)}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.25, sm: 1.5 } }}>
          <Button onClick={() => setChartDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
