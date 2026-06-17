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
  FormControl,
  IconButton,
  MenuItem,
  Select,
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
type ExperimentTimeRange = '1h' | '6h' | '24h' | '7d' | 'all'

const experimentTimeRangeOptions: { value: ExperimentTimeRange; label: string }[] = [
  { value: '1h', label: '1 h' },
  { value: '6h', label: '6 h' },
  { value: '24h', label: '24 h' },
  { value: '7d', label: '7 Tage' },
  { value: 'all', label: 'Alle' },
]

function getExperimentTimeRangeStartMs(range: ExperimentTimeRange, nowMs: number) {
  switch (range) {
    case '1h':
      return nowMs - 60 * 60 * 1000
    case '6h':
      return nowMs - 6 * 60 * 60 * 1000
    case '24h':
      return nowMs - 24 * 60 * 60 * 1000
    case '7d':
      return nowMs - 7 * 24 * 60 * 60 * 1000
    case 'all':
      return Number.NEGATIVE_INFINITY
  }
}

export function filterExperimentMeasurementsByTimeRange<T extends { measuredAt?: { toMillis: () => number } | null }>(
  measurements: T[],
  range: ExperimentTimeRange,
  nowMs: number,
) {
  if (range === 'all') {
    return measurements
  }

  const startMs = getExperimentTimeRangeStartMs(range, nowMs)

  return measurements.filter((measurement) => {
    const measuredAtMs = measurement.measuredAt?.toMillis()

    return measuredAtMs !== undefined && measuredAtMs >= startMs
  })
}

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

interface LiveChartFooterProps {
  latestMeasurement?: ExperimentMeasurement | null
  maxValue?: number
  selectedTimeRange: ExperimentTimeRange
  formatVoltage: (value?: number | null) => string
  onTimeRangeChange: (range: ExperimentTimeRange) => void
}

function LiveChartFooter({
  latestMeasurement,
  maxValue,
  selectedTimeRange,
  formatVoltage,
  onTimeRangeChange,
}: LiveChartFooterProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.25}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
    >
      <Typography variant="body2" color="text.secondary">
        Zuletzt: {formatExperimentTimestamp(latestMeasurement)} · Max: {formatVoltage(maxValue)}
      </Typography>
      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 132 } }}>
        <Select
          value={selectedTimeRange}
          onChange={(event) => onTimeRangeChange(event.target.value as ExperimentTimeRange)}
          inputProps={{ 'aria-label': 'Angezeigten Zeitraum auswählen' }}
          sx={{
            borderRadius: '999px',
            bgcolor: (theme) => alpha(theme.palette.common.white, 0.42),
            fontSize: '0.875rem',
          }}
        >
          {experimentTimeRangeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  )
}

export function ExperimentLiveChart() {
  const [measurements, setMeasurements] = useState<ExperimentMeasurement[]>([])
  const [loaded, setLoaded] = useState(false)
  const [chartDialogOpen, setChartDialogOpen] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState<ExperimentTimeRange>('6h')
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now())

  useEffect(() => {
    const unsubscribe = subscribeToExperimentMeasurements((nextMeasurements) => {
      setMeasurements(nextMeasurements)
      setLoaded(true)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTimeMs(Date.now())
    }, 60_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const latestMeasurement = measurements.at(-1)
  const valuesMv = useMemo(
    () => measurements.map((measurement) => measurement.valueMv),
    [measurements],
  )
  const formatLatestVoltage = useMemo(
    () => createExperimentVoltageFormatter(valuesMv),
    [valuesMv],
  )
  const visibleMeasurements = useMemo(
    () => filterExperimentMeasurementsByTimeRange(measurements, selectedTimeRange, currentTimeMs),
    [currentTimeMs, measurements, selectedTimeRange],
  )
  const visibleValuesMv = useMemo(
    () => visibleMeasurements.map((measurement) => measurement.valueMv),
    [visibleMeasurements],
  )
  const visibleLatestMeasurement = visibleMeasurements.at(-1)
  const formatVisibleVoltage = useMemo(
    () => createExperimentVoltageFormatter(visibleValuesMv),
    [visibleValuesMv],
  )
  const chartData = useMemo(
    () =>
      visibleMeasurements.map((measurement) => ({
        id: measurement.id,
        value: measurement.valueMv,
        label: formatExperimentTimestamp(measurement),
        shortLabel: formatShortExperimentTimestamp(measurement),
      })),
    [visibleMeasurements],
  )
  const visibleMaxValue = useMemo(
    () =>
      visibleValuesMv.length > 0
        ? Math.max(...visibleValuesMv)
        : undefined,
    [visibleValuesMv],
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
                <LiveChartMetric label="Letzter" value={formatLatestVoltage(latestMeasurement?.valueMv)} icon />

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
            ) : visibleMeasurements.length === 0 ? (
              <Stack spacing={1.5}>
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
                  <Typography variant="h6">Keine Messwerte im gewählten Zeitraum</Typography>
                </Box>
                <LiveChartFooter
                  latestMeasurement={visibleLatestMeasurement}
                  maxValue={visibleMaxValue}
                  selectedTimeRange={selectedTimeRange}
                  formatVoltage={formatVisibleVoltage}
                  onTimeRangeChange={setSelectedTimeRange}
                />
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <LineChart
                  data={chartData}
                  ariaLabel="Live-Diagramm der Spannung am großen Versuchsaufbau"
                  detailLabelTitle="Messzeitpunkt"
                  valueLabelTitle="Spannung"
                  valueFormatter={formatVisibleVoltage}
                />
                <LiveChartFooter
                  latestMeasurement={visibleLatestMeasurement}
                  maxValue={visibleMaxValue}
                  selectedTimeRange={selectedTimeRange}
                  formatVoltage={formatVisibleVoltage}
                  onTimeRangeChange={setSelectedTimeRange}
                />
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
              <LiveChartMetric label="Letzter" value={formatLatestVoltage(latestMeasurement?.valueMv)} icon />
            </Stack>
            {visibleMeasurements.length === 0 ? (
              <Stack spacing={1.5}>
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
                  <Typography variant="h6">Keine Messwerte im gewählten Zeitraum</Typography>
                </Box>
                <LiveChartFooter
                  latestMeasurement={visibleLatestMeasurement}
                  maxValue={visibleMaxValue}
                  selectedTimeRange={selectedTimeRange}
                  formatVoltage={formatVisibleVoltage}
                  onTimeRangeChange={setSelectedTimeRange}
                />
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <LineChart
                  data={chartData}
                  ariaLabel="Live-Diagramm der Spannung am großen Versuchsaufbau im Vollbild"
                  detailLabelTitle="Messzeitpunkt"
                  valueLabelTitle="Spannung"
                  valueFormatter={formatVisibleVoltage}
                />
                <LiveChartFooter
                  latestMeasurement={visibleLatestMeasurement}
                  maxValue={visibleMaxValue}
                  selectedTimeRange={selectedTimeRange}
                  formatVoltage={formatVisibleVoltage}
                  onTimeRangeChange={setSelectedTimeRange}
                />
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.25, sm: 1.5 } }}>
          <Button onClick={() => setChartDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
