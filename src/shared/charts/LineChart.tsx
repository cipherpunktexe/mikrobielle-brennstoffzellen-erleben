import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  Box,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useRef, useState, type PointerEvent } from 'react'

export interface LineChartPoint {
  id: string
  value: number
  label: string
  shortLabel?: string
}

interface LineChartProps {
  data: LineChartPoint[]
  ariaLabel: string
  valueFormatter?: (value: number) => string
  detailLabelTitle?: string
  valueLabelTitle?: string
}

export function LineChart({
  data,
  ariaLabel,
  valueFormatter = (value) => String(value),
  detailLabelTitle = 'Punkt',
  valueLabelTitle = 'Wert',
}: LineChartProps) {
  const theme = useTheme()
  const isMobileViewport = useMediaQuery(theme.breakpoints.down('sm'))
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(Math.max(0, data.length - 1))

  useEffect(() => {
    setActiveIndex((current) => Math.min(Math.max(0, current), Math.max(0, data.length - 1)))
  }, [data.length])

  const width = 640
  const height = isMobileViewport ? 220 : 260
  const padding = {
    top: 20,
    right: 16,
    bottom: isMobileViewport ? 34 : 44,
    left: isMobileViewport ? 44 : 58,
  }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const values = data.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1
  const yTicks = [maxValue, minValue + valueRange / 2, minValue]

  const points = data.map((point, index) => {
    const x =
      data.length === 1
        ? padding.left + plotWidth / 2
        : padding.left + (index / (data.length - 1)) * plotWidth
    const y = padding.top + ((maxValue - point.value) / valueRange) * plotHeight

    return { x, y, point }
  })

  const activePoint = points[activeIndex] ?? null
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPoints = [
    `${padding.left},${padding.top + plotHeight}`,
    ...points.map((point) => `${point.x},${point.y}`),
    `${padding.left + plotWidth},${padding.top + plotHeight}`,
  ].join(' ')
  const labelIndexes = isMobileViewport
    ? Array.from(new Set([0, data.length - 1]))
    : Array.from(new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]))

  function getNearestIndex(clientX: number) {
    const svg = svgRef.current

    if (!svg || points.length === 0) {
      return null
    }

    const rect = svg.getBoundingClientRect()
    const relativeX = ((clientX - rect.left) / rect.width) * width

    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    points.forEach((point, index) => {
      const distance = Math.abs(point.x - relativeX)

      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })

    return nearestIndex
  }

  function updateActiveIndex(clientX: number) {
    const nextIndex = getNearestIndex(clientX)

    if (nextIndex !== null) {
      setActiveIndex(nextIndex)
    }
  }

  return (
    <Stack spacing={1.25}>
      {activePoint ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1}
          sx={{
            border: '1px solid rgba(121,101,66,0.14)',
            borderRadius: '14px',
            px: 1.5,
            py: 1.25,
            bgcolor: 'rgba(248,242,231,0.36)',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {detailLabelTitle}
            </Typography>
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
              {activePoint.point.label}
            </Typography>
          </Box>
          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="caption" color="text.secondary">
              {valueLabelTitle}
            </Typography>
            <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
              {valueFormatter(activePoint.point.value)}
            </Typography>
          </Box>
        </Stack>
      ) : null}

      <Box
        sx={{
          border: '1px solid rgba(121,101,66,0.16)',
          borderRadius: '16px',
          bgcolor: 'rgba(248,242,231,0.42)',
          p: { xs: 1, sm: 1.5 },
          touchAction: 'none',
        }}
      >
        <Box
          component="svg"
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={ariaLabel}
          sx={{ width: '100%', height: 'auto', display: 'block' }}
          onPointerMove={(event: PointerEvent<SVGSVGElement>) => {
            updateActiveIndex(event.clientX)
          }}
          onPointerDown={(event: PointerEvent<SVGSVGElement>) => {
            updateActiveIndex(event.clientX)
          }}
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
                  {valueFormatter(tick)}
                </text>
              </g>
            )
          })}

          {activePoint ? (
            <line
              x1={activePoint.x}
              y1={padding.top}
              x2={activePoint.x}
              y2={padding.top + plotHeight}
              stroke="rgba(121,101,66,0.22)"
              strokeDasharray="5 5"
            />
          ) : null}

          <polygon points={areaPoints} fill="rgba(61,177,236,0.18)" />
          <polyline
            points={linePoints}
            fill="none"
            stroke="#3DB1EC"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((point) => {
            const isActive = activePoint?.point.id === point.point.id

            return (
              <circle
                key={point.point.id}
                cx={point.x}
                cy={point.y}
                r={isActive ? 7 : 5}
                fill={isActive ? '#F7C948' : '#7AD12C'}
                stroke="#241C13"
                strokeWidth="2"
              />
            )
          })}

          {labelIndexes.map((index) => {
            const point = points[index]

            if (!point) {
              return null
            }

            return (
              <text
                key={point.point.id}
                x={point.x}
                y={height - 14}
                textAnchor="middle"
                fontSize="12"
                fill="#6A5A41"
              >
                {point.point.shortLabel ?? point.point.label}
              </text>
            )
          })}
        </Box>
      </Box>

      {isMobileViewport && data.length > 1 ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <IconButton
            size="small"
            aria-label="Vorherigen Messpunkt anzeigen"
            onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}
            disabled={activeIndex === 0}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="caption" color="text.secondary">
            {activeIndex + 1} / {data.length}
          </Typography>
          <IconButton
            size="small"
            aria-label="Naechsten Messpunkt anzeigen"
            onClick={() => setActiveIndex((current) => Math.min(data.length - 1, current + 1))}
            disabled={activeIndex === data.length - 1}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      ) : null}
    </Stack>
  )
}
