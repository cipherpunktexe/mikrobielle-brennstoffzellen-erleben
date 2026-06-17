import { Box, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

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
  showActiveSummary?: boolean
}

export function getSampledChartIndexes(length: number, maxCount: number) {
  if (length <= 0 || maxCount <= 0) {
    return []
  }

  if (length <= maxCount) {
    return Array.from({ length }, (_, index) => index)
  }

  if (maxCount === 1) {
    return [length - 1]
  }

  const step = (length - 1) / (maxCount - 1)

  return Array.from(
    new Set(
      Array.from({ length: maxCount }, (_, index) =>
        Math.round(index * step),
      ),
    ),
  )
}

export function LineChart({
  data,
  ariaLabel,
  valueFormatter = (value) => String(value),
  detailLabelTitle = 'Punkt',
  valueLabelTitle = 'Wert',
  showActiveSummary = false,
}: LineChartProps) {
  const theme = useTheme()
  const chartColor = theme.palette.grey[600]
  const chartColorDark = theme.palette.text.primary
  const isMobileViewport = useMediaQuery(theme.breakpoints.down('sm'))
  const interactiveAreaRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => {
    setActiveIndex((current) => {
      if (!data.length) {
        return null
      }

      if (current !== null) {
        return Math.min(Math.max(0, current), Math.max(0, data.length - 1))
      }

      return null
    })
  }, [data.length])

  useEffect(() => {
    if (activeIndex === null) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (!interactiveAreaRef.current?.contains(target)) {
        setActiveIndex(null)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [activeIndex])

  const width = isMobileViewport ? 390 : 640
  const height = isMobileViewport ? 300 : 292
  const basePadding = {
    top: isMobileViewport ? 14 : 18,
    right: isMobileViewport ? 16 : 22,
    bottom: isMobileViewport ? 50 : 42,
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
  const yTickCount = isMobileViewport ? 3 : 4
  const yTicks = Array.from(
    { length: yTickCount },
    (_, index) => chartMax - (valueRange / Math.max(1, yTickCount - 1)) * index,
  )
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
  const points = data.map((point, index) => {
    const x =
      data.length === 1
        ? padding.left + plotWidth / 2
        : padding.left + (index / Math.max(1, data.length - 1)) * plotWidth
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
  const labelIndexes = getSampledChartIndexes(data.length, isMobileViewport ? 2 : 4)
  const visiblePointIndexes = new Set(labelIndexes)

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
    setActiveIndex((current) => (current === null ? current : null))
  }

  const activeValueLabel = activePoint ? valueFormatter(activePoint.point.value) : ''
  const activeShortLabel = activePoint ? (activePoint.point.shortLabel ?? activePoint.point.label) : ''
  const computedTooltipWidth = Math.max(
    isMobileViewport ? 146 : 128,
    Math.round(
      Math.max(
        activeValueLabel.length * (isMobileViewport ? 7.1 : 6.9),
        activeShortLabel.length * (isMobileViewport ? 5.5 : 5.1),
      ) + 26,
    ),
  )
  const activeTooltipWidth = Math.min(computedTooltipWidth, Math.max(112, plotWidth - 8))
  const activeTooltipHeight = isMobileViewport ? 54 : 46
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
            border: `1px solid ${alpha(theme.palette.primary.dark, 0.16)}`,
            borderRadius: '18px',
            px: 1.75,
            py: 1.5,
            backgroundColor: alpha(theme.palette.common.white, 0.48),
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
        ref={interactiveAreaRef}
        sx={{
          border: `1px solid ${alpha(theme.palette.primary.dark, 0.16)}`,
          borderRadius: '22px',
          backgroundColor: alpha(theme.palette.common.white, 0.34),
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
          onPointerMove={(event: ReactPointerEvent<SVGSVGElement>) => {
            updateActiveIndex(event.clientX)
          }}
          onPointerDown={(event: ReactPointerEvent<SVGSVGElement>) => {
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
            fill={alpha(theme.palette.common.white, 0.52)}
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
                  stroke={alpha(theme.palette.primary.dark, index === yTicks.length - 1 ? 0.24 : 0.12)}
                  strokeDasharray={index === yTicks.length - 1 ? '0' : '5 6'}
                />
                <text
                  x={padding.left - 10}
                  y={y + 5}
                  textAnchor="end"
                  fontSize={isMobileViewport ? '13' : '12'}
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

            const isFirstLabel = index === 0
            const isLastLabel = index === data.length - 1
            const labelPadding = 4
            const labelX = isFirstLabel
              ? Math.max(point.x, padding.left + labelPadding)
              : isLastLabel
                ? Math.min(point.x, padding.left + plotWidth - labelPadding)
                : point.x
            const labelAnchor = isFirstLabel ? 'start' : isLastLabel ? 'end' : 'middle'

            return (
              <text
                key={point.point.id}
                x={labelX}
                y={height - (isMobileViewport ? 8 : 12)}
                textAnchor={labelAnchor}
                fontSize={isMobileViewport ? '13' : '12'}
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

          {points.map((point, index) => {
            const isActive = activePoint?.point.id === point.point.id
            const isVisiblePoint = visiblePointIndexes.has(index) || isActive

            if (!isVisiblePoint) {
              return null
            }

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
                  r={isActive ? 6.5 : 3.5}
                  fill={isActive ? chartColor : theme.palette.common.white}
                  stroke={chartColorDark}
                  strokeWidth={isActive ? '2.5' : '1.75'}
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
                fill={alpha(theme.palette.common.white, 0.95)}
                stroke={alpha(chartColorDark, 0.25)}
              />
              <text
                x={activeTooltipX + activeTooltipWidth / 2}
                y={activeTooltipY + (isMobileViewport ? 20 : 18)}
                textAnchor="middle"
                fontSize={isMobileViewport ? '12' : '11'}
                fill={alpha(chartColorDark, 0.78)}
              >
                {activePoint.point.shortLabel ?? activePoint.point.label}
              </text>
              <text
                x={activeTooltipX + activeTooltipWidth / 2}
                y={activeTooltipY + (isMobileViewport ? 39 : 33)}
                textAnchor="middle"
                fontSize={isMobileViewport ? '17' : '15'}
                fontWeight="700"
                fill={chartColorDark}
              >
                {valueFormatter(activePoint.point.value)}
              </text>
            </g>
          ) : null}
        </Box>
      </Box>
    </Stack>
  )
}
