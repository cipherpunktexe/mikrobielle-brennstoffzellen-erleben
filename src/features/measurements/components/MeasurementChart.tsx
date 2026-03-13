import { Stack, Typography } from '@mui/material'
import { LineChart } from '../../../shared/charts/LineChart'
import { formatMeasurement, formatTimestamp } from '../../../shared/utils/format'
import type { Measurement } from '../../../shared/types/domain'

interface MeasurementChartProps {
  measurements: Measurement[]
  latestLabel?: string
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

export function MeasurementChart({
  measurements,
  latestLabel = 'Neuester Messwert',
}: MeasurementChartProps) {
  const orderedMeasurements = [...measurements].sort((left, right) => {
    const leftMs = left.createdAt?.toMillis() ?? 0
    const rightMs = right.createdAt?.toMillis() ?? 0
    return leftMs - rightMs
  })

  return (
    <Stack spacing={1.5}>
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
      />
      <Typography variant="body2" color="text.secondary">
        {latestLabel}: {formatMeasurement(orderedMeasurements.at(-1)?.value)}
      </Typography>
    </Stack>
  )
}
