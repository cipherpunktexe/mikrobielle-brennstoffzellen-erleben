import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { LineChart } from './LineChart'
import { formatMeasurement, formatTimestamp } from './format'
import type { Measurement } from '../data/domain'

interface MeasurementChartProps {
  measurements: Measurement[]
  latestLabel?: string
  summaryVariant?: 'default' | 'compact'
}

function formatShortTimestamp(measurement: Measurement) {
  const date = measurement.createdAt?.toDate()

  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

function getTrendLabel(currentValue: number, previousValue?: number) {
  if (previousValue === undefined) {
    return 'Startwert'
  }

  const delta = currentValue - previousValue

  if (Math.abs(delta) < 0.0001) {
    return 'Unverändert'
  }

  return delta > 0 ? 'Steigend' : 'Fallend'
}

export function MeasurementChart({
  measurements,
  latestLabel = 'Neuester Messwert',
  summaryVariant = 'default',
}: MeasurementChartProps) {
  const orderedMeasurements = [...measurements].sort((left, right) => {
    const leftMs = left.createdAt?.toMillis() ?? 0
    const rightMs = right.createdAt?.toMillis() ?? 0
    return leftMs - rightMs
  })
  const latestMeasurement = orderedMeasurements.at(-1)
  const previousMeasurement = orderedMeasurements.at(-2)
  const values = orderedMeasurements.map((measurement) => measurement.value)
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)

  const metricCards =
    summaryVariant === 'compact'
      ? [
          {
            label: latestLabel,
            value: formatMeasurement(latestMeasurement?.value),
            tone: '#3DB1EC',
          },
          {
            label: 'Maximalwert',
            value: formatMeasurement(maxValue),
            tone: '#7AD12C',
          },
        ]
      : [
          {
            label: latestLabel,
            value: formatMeasurement(latestMeasurement?.value),
            tone: '#3DB1EC',
          },
          {
            label: 'Maximalwert',
            value: formatMeasurement(maxValue),
            tone: '#7AD12C',
          },
          {
            label: 'Trend',
            value: getTrendLabel(latestMeasurement?.value ?? 0, previousMeasurement?.value),
            tone: '#F7C948',
          },
          {
            label: 'Spannweite',
            value: `${formatMeasurement(minValue)} bis ${formatMeasurement(maxValue)}`,
            tone: '#796542',
          },
        ]

  return (
    <Stack spacing={2}>
      {summaryVariant === 'compact' ? (
        <Box
          sx={{
            borderRadius: '18px',
            border: `1px solid ${alpha('#796542', 0.16)}`,
            background: `linear-gradient(180deg, ${alpha('#FFF9EF', 0.96)}, ${alpha('#EFE6D4', 0.72)})`,
            px: 1.5,
            py: 1.35,
          }}
        >
          <Stack direction="row" spacing={1.5} divider={<Box sx={{ width: 1, bgcolor: 'rgba(121,101,66,0.14)' }} />}>
            {metricCards.map((card) => (
              <Box key={card.label} sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h6" sx={{ mt: 0.35, lineHeight: 1.15 }}>
                  {card.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          useFlexGap
          flexWrap="wrap"
        >
          {metricCards.map((card) => (
            <Box
              key={card.label}
              sx={{
                flex: '1 1 150px',
                minWidth: 0,
                borderRadius: '18px',
                border: `1px solid ${alpha(card.tone, 0.2)}`,
                background: `linear-gradient(180deg, ${alpha('#FFF9EF', 0.96)}, ${alpha(card.tone, 0.08)})`,
                px: 1.5,
                py: 1.35,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.35, lineHeight: 1.15 }}>
                {card.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}

      <LineChart
        data={orderedMeasurements.map((measurement) => ({
          id: measurement.id,
          value: measurement.value,
          label: formatTimestamp(measurement.createdAt),
          shortLabel: formatShortTimestamp(measurement),
        }))}
        ariaLabel="Diagramm der Messwerthistorie"
        detailLabelTitle="Zeitpunkt"
        valueLabelTitle="Wert"
        valueFormatter={formatMeasurement}
        showActiveSummary={summaryVariant !== 'compact'}
      />

      {summaryVariant === 'default' ? (
        <Stack spacing={0.4}>
          <Typography variant="body2" color="text.secondary">
            {latestLabel}: {formatMeasurement(latestMeasurement?.value)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Letzter Zeitpunkt: {formatTimestamp(latestMeasurement?.createdAt)}
          </Typography>
        </Stack>
      ) : null}
    </Stack>
  )
}
