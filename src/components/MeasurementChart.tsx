import { Box, Stack, Typography } from '@mui/material'
import { formatMeasurement, formatTimestamp } from '../lib/format'
import type { Measurement } from '../types/domain'

interface MeasurementChartProps {
  measurements: Measurement[]
  latestLabel?: string
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
  const width = 640
  const height = 260
  const padding = { top: 24, right: 20, bottom: 44, left: 58 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const values = orderedMeasurements.map((measurement) => measurement.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1
  const yTicks = [maxValue, minValue + valueRange / 2, minValue]

  const points = orderedMeasurements.map((measurement, index) => {
    const x =
      orderedMeasurements.length === 1
        ? padding.left + plotWidth / 2
        : padding.left + (index / (orderedMeasurements.length - 1)) * plotWidth
    const y = padding.top + ((maxValue - measurement.value) / valueRange) * plotHeight

    return { x, y, measurement }
  })

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPoints = [
    `${padding.left},${padding.top + plotHeight}`,
    ...points.map((point) => `${point.x},${point.y}`),
    `${padding.left + plotWidth},${padding.top + plotHeight}`,
  ].join(' ')
  const labelIndexes = Array.from(
    new Set([0, Math.floor((orderedMeasurements.length - 1) / 2), orderedMeasurements.length - 1]),
  )

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          border: '1px solid rgba(121,101,66,0.16)',
          borderRadius: '16px',
          bgcolor: 'rgba(248,242,231,0.42)',
          p: { xs: 1, sm: 1.5 },
        }}
      >
        <Box
          component="svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Diagramm der Messwerthistorie"
          sx={{ width: '100%', height: 'auto', display: 'block' }}
        >
          {yTicks.map((tick) => {
            const y = padding.top + ((maxValue - tick) / valueRange) * plotHeight

            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke="rgba(121,101,66,0.16)"
                  strokeDasharray="6 6"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6A5A41"
                >
                  {formatMeasurement(tick)}
                </text>
              </g>
            )
          })}

          <polygon points={areaPoints} fill="rgba(61,177,236,0.18)" />
          <polyline
            points={linePoints}
            fill="none"
            stroke="#3DB1EC"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((point) => (
            <circle
              key={point.measurement.id}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#7AD12C"
              stroke="#241C13"
              strokeWidth="2"
            />
          ))}

          {labelIndexes.map((index) => {
            const point = points[index]

            if (!point) {
              return null
            }

            return (
              <text
                key={point.measurement.id}
                x={point.x}
                y={height - 14}
                textAnchor="middle"
                fontSize="12"
                fill="#6A5A41"
              >
                {formatTimestamp(point.measurement.createdAt)}
              </text>
            )
          })}
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {latestLabel}: {formatMeasurement(orderedMeasurements.at(-1)?.value)}
      </Typography>
    </Stack>
  )
}
