import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState, type PointerEvent } from 'react'

export interface LineChartPoint {
  id: string
  value: number
  label: string
  shortLabel?: string
  xValue?: number
}

interface LineChartProps {
  data: LineChartPoint[]
  ariaLabel: string
  valueFormatter?: (value: number) => string
  detailLabelTitle?: string
  valueLabelTitle?: string
  showActiveSummary?: boolean
}

export function LineChart({
  data,
  ariaLabel,
  valueFormatter = (value) => String(value),
  detailLabelTitle = 'Punkt',
  valueLabelTitle = 'Wert',
  showActiveSummary = true,
}: LineChartProps) {
  const theme = useTheme()
  const chartColor = '#5F6B7A'
  const chartColorDark = '#2C3440'
  const isMobileViewport = useMediaQuery(theme.breakpoints.down('sm'))
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(
    isMobileViewport && data.length ? Math.max(0, data.length - 1) : null,
  )

  useEffect(() => {
    setActiveIndex((current) => {
      if (!data.length) {
        return null
      }

      if (isMobileViewport) {
        if (current === null) {
          return Math.max(0, data.length - 1)
        }

        return Math.min(Math.max(0, current), Math.max(0, data.length - 1))
      }

      return null
    })
  }, [data.length, isMobileViewport])

  const width = 640
  const height = isMobileViewport ? 248 : 292
  const basePadding = {
    top: 18,
    right: isMobileViewport ? 16 : 22,
    bottom: isMobileViewport ? 34 : 42,
    left: isMobileViewport ? 50 : 64,
  }
  const values = data.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const rawRange = maxValue - minValue
  const paddedRange = rawRange === 0 ? Math.max(Math.abs(maxValue) * 0.2, 1) : rawRange * 0.18
  const chartMin = minValue >= 0 ? 0 : minValue - paddedRange * 0.35
  const chartMax = maxValue <= 0 ? 0 : maxValue + paddedRange * 0.65
  const valueRange = chartMax - chartMin || 1
  const yTicks = Array.from({ length: 4 }, (_, index) => chartMax - (valueRange / 3) * index)
  const tickLabels = yTicks.map((tick) => valueFormatter(tick))
  const maxTickLabelLength = Math.max(...tickLabels.map((label) => label.length), 0)
  const padding = {
    ...basePadding,
    left: Math.max(
      basePadding.left,
      Math.round(maxTickLabelLength * (isMobileViewport ? 6.2 : 6.8) + 16),
    ),
  }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const hasCompleteXValues = data.every(
    (point) => typeof point.xValue === 'number' && Number.isFinite(point.xValue),
  )
  const rawXValues = hasCompleteXValues
    ? data.map((point) => point.xValue as number)
    : data.map((_point, index) => index)
  const minXValue = Math.min(...rawXValues)
  const maxXValue = Math.max(...rawXValues)
  const xRange = maxXValue - minXValue

  const points = data.map((point, index) => {
    const x =
      data.length === 1 || xRange === 0
        ? padding.left + plotWidth / 2
        : padding.left + ((rawXValues[index] - minXValue) / xRange) * plotWidth
    const y = padding.top + ((chartMax - point.value) / valueRange) * plotHeight

    return { x, y, point }
  })

  const activePoint = activeIndex === null ? null : points[activeIndex] ?? null
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPoints = [
    `${padding.left},${padding.top + plotHeight}`,
    ...points.map((point) => `${point.x},${point.y}`),
    `${padding.left + plotWidth},${padding.top + plotHeight}`,
  ].join(' ')
  const labelIndexes = isMobileViewport
    ? Array.from(new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])).filter(
        (index) => index >= 0,
      )
    : Array.from(
        new Set([0, Math.floor((data.length - 1) / 3), Math.floor(((data.length - 1) * 2) / 3), data.length - 1]),
      ).filter((index) => index >= 0)

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
      setActiveIndex((current) => (current === nextIndex ? current : nextIndex))
    }
  }

  function clearActiveIndex() {
    if (!isMobileViewport) {
      setActiveIndex((current) => (current === null ? current : null))
    }
  }

  const activeValueLabel = activePoint ? valueFormatter(activePoint.point.value) : ''
  const activeTooltipWidth = Math.max(
    isMobileViewport ? 112 : 128,
    Math.round(activeValueLabel.length * (isMobileViewport ? 6.4 : 6.9) + 26),
  )
  const activeTooltipHeight = 46
  const activeTooltipX = activePoint
    ? Math.min(
        Math.max(activePoint.x - activeTooltipWidth / 2, padding.left),
        padding.left + plotWidth - activeTooltipWidth,
      )
    : 0
  const activeTooltipY = activePoint
    ? Math.max(padding.top + 8, activePoint.y - activeTooltipHeight - 14)
    : 0

  return (
    <Stack spacing={1.5}>
      {showActiveSummary && activePoint ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1}
          sx={{
            border: `1px solid ${alpha('#796542', 0.16)}`,
            borderRadius: '18px',
            px: 1.75,
            py: 1.5,
            backgroundColor: alpha('#FFFFFF', 0.48),
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {detailLabelTitle}
            </Typography>
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere', fontWeight: 600 }}>
              {activePoint.point.label}
            </Typography>
          </Box>
          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="caption" color="text.secondary">
              {valueLabelTitle}
            </Typography>
            <Typography variant="h5" sx={{ lineHeight: 1.05, color: chartColorDark }}>
              {valueFormatter(activePoint.point.value)}
            </Typography>
          </Box>
        </Stack>
      ) : null}

      <Box
        sx={{
          border: `1px solid ${alpha('#796542', 0.16)}`,
          borderRadius: '22px',
          backgroundColor: alpha('#FFFFFF', 0.34),
          p: { xs: 1.25, sm: 1.75 },
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
          onPointerLeave={clearActiveIndex}
          onPointerCancel={clearActiveIndex}
        >
          <defs>
            <linearGradient id="chart-area-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={alpha(chartColor, 0.22)} />
              <stop offset="100%" stopColor={alpha(chartColor, 0.02)} />
            </linearGradient>
          </defs>

          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            rx="20"
            fill={alpha('#FFFFFF', 0.52)}
          />

          {yTicks.map((tick, index) => {
            const y = padding.top + ((chartMax - tick) / valueRange) * plotHeight

            return (
              <g key={`${tick}-${index}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke={alpha('#796542', index === yTicks.length - 1 ? 0.24 : 0.12)}
                  strokeDasharray={index === yTicks.length - 1 ? '0' : '5 6'}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill={alpha(chartColorDark, 0.78)}
                >
                  {valueFormatter(tick)}
                </text>
              </g>
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
                y={height - 12}
                textAnchor="middle"
                fontSize="12"
                fill={alpha(chartColorDark, 0.78)}
              >
                {point.point.shortLabel ?? point.point.label}
              </text>
            )
          })}

          {activePoint ? (
            <line
              x1={activePoint.x}
              y1={padding.top}
              x2={activePoint.x}
              y2={padding.top + plotHeight}
              stroke={alpha(chartColor, 0.32)}
              strokeDasharray="4 6"
            />
          ) : null}

          <polygon points={areaPoints} fill="url(#chart-area-fill)" />
          <polyline
            points={linePoints}
            fill="none"
            stroke={chartColor}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((point) => {
            const isActive = activePoint?.point.id === point.point.id

            return (
              <g key={point.point.id}>
                {isActive ? (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={12}
                    fill={alpha(chartColor, 0.16)}
                  />
                ) : null}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 6.5 : 4.75}
                  fill={isActive ? chartColor : '#FFFFFF'}
                  stroke={chartColorDark}
                  strokeWidth={isActive ? '2.5' : '2'}
                />
              </g>
            )
          })}

          {activePoint ? (
            <g>
              <rect
                x={activeTooltipX}
                y={activeTooltipY}
                width={activeTooltipWidth}
                height={activeTooltipHeight}
                rx="14"
                fill={alpha('#FFFFFF', 0.95)}
                stroke={alpha(chartColorDark, 0.25)}
              />
              <text
                x={activeTooltipX + activeTooltipWidth / 2}
                y={activeTooltipY + 18}
                textAnchor="middle"
                fontSize="11"
                fill={alpha(chartColorDark, 0.78)}
              >
                {activePoint.point.shortLabel ?? activePoint.point.label}
              </text>
              <text
                x={activeTooltipX + activeTooltipWidth / 2}
                y={activeTooltipY + 33}
                textAnchor="middle"
                fontSize="15"
                fontWeight="700"
                fill={chartColorDark}
              >
                {valueFormatter(activePoint.point.value)}
              </text>
            </g>
          ) : null}
        </Box>
      </Box>

      {isMobileViewport && data.length > 1 ? (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            border: `1px solid ${alpha('#796542', 0.16)}`,
            borderRadius: '999px',
            px: 0.5,
            py: 0.25,
            bgcolor: alpha('#FFFFFF', 0.5),
          }}
        >
          <IconButton
            size="small"
            aria-label="Vorherigen Messpunkt anzeigen"
            onClick={() =>
              setActiveIndex((current) => Math.max(0, (current ?? Math.max(0, data.length - 1)) - 1))
            }
            disabled={(activeIndex ?? 0) === 0}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {(activeIndex ?? 0) + 1} / {data.length}
          </Typography>
          <IconButton
            size="small"
            aria-label="Nächsten Messpunkt anzeigen"
            onClick={() =>
              setActiveIndex((current) =>
                Math.min(data.length - 1, (current ?? Math.max(0, data.length - 1)) + 1),
              )
            }
            disabled={(activeIndex ?? 0) === data.length - 1}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      ) : null}
    </Stack>
  )
}
