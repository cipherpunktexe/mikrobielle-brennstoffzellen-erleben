import { Stack } from '@mui/material'
import { LineChart } from './LineChart'
import { createContextMeasurementFormatter, formatTimestamp } from './format'
import { MeasurementMetricsCard } from './MeasurementMetricsCard'
import type { Measurement } from '../data/domain'

interface MeasurementChartProps {
  measurements: Measurement[]
  showMetricsCard?: boolean
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

export function MeasurementChart({ measurements, showMetricsCard = true }: MeasurementChartProps) {
  const orderedMeasurements = [...measurements].sort((left, right) => {
    const leftMs = left.createdAt?.toMillis() ?? 0
    const rightMs = right.createdAt?.toMillis() ?? 0
    return leftMs - rightMs
  })
  const latestMeasurement = orderedMeasurements.at(-1)
  const values = orderedMeasurements.map((measurement) => measurement.value)
  const formatMeasurementInContext = createContextMeasurementFormatter(values)
  const maxValue = values.length > 0 ? Math.max(...values) : undefined

  const currentValue = formatMeasurementInContext(latestMeasurement?.value)
  const maxValueLabel = formatMeasurementInContext(maxValue)

  return (
    <Stack spacing={2}>
      {showMetricsCard ? <MeasurementMetricsCard currentValue={currentValue} maxValue={maxValueLabel} /> : null}

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
