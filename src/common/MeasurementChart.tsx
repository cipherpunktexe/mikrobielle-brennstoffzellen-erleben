import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { LineChart } from './LineChart'
import { createContextMeasurementFormatter, formatTimestamp } from './format'
import type { Measurement } from '../data/domain'

interface MeasurementChartProps {
  measurements: Measurement[]
}

function formatShortTimestamp(measurement: Measurement) {
  const date = measurement.createdAt?.toDate()

  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(',', '')
}

export function MeasurementChart({ measurements }: MeasurementChartProps) {
  const orderedMeasurements = [...measurements].sort((left, right) => {
    const leftMs = left.createdAt?.toMillis() ?? 0
    const rightMs = right.createdAt?.toMillis() ?? 0
    return leftMs - rightMs
  })
  const latestMeasurement = orderedMeasurements.at(-1)
  const values = orderedMeasurements.map((measurement) => measurement.value)
  const formatMeasurementInContext = createContextMeasurementFormatter(values)
  const maxValue = values.length > 0 ? Math.max(...values) : undefined

  const metricCards = [
    {
      label: 'Aktueller Messwert',
      value: formatMeasurementInContext(latestMeasurement?.value),
    },
    {
      label: 'Maximalwert',
      value: formatMeasurementInContext(maxValue),
    },
  ]

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          borderRadius: '18px',
          border: `1px solid ${alpha('#796542', 0.16)}`,
          backgroundColor: alpha('#FFFFFF', 0.42),
          px: { xs: 1.75, sm: 1.5 },
          py: { xs: 1.6, sm: 1.35 },
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          divider={
            <Box
              sx={{
                width: '1px',
                alignSelf: 'stretch',
                bgcolor: 'rgba(121,101,66,0.14)',
              }}
            />
          }
        >
          {metricCards.map((card) => (
            <Box key={card.label} sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                {card.label}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mt: 0.35,
                  lineHeight: 1.15,
                  fontSize: { xs: '2rem', sm: undefined },
                }}
              >
                {card.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

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
        valueFormatter={(value) => formatMeasurementInContext(value)}
        showActiveSummary={false}
        showMobileNavigation={false}
      />
    </Stack>
  )
}
