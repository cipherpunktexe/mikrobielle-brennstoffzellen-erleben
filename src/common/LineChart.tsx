import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
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
  showMobileNavigation?: boolean
}

export function LineChart({
  data,
  ariaLabel,
  valueFormatter = (value) => String(value),
  detailLabelTitle = 'Punkt',
  valueLabelTitle = 'Wert',
  showActiveSummary = true,
  showMobileNavigation = true,
}: LineChartProps) {
  const theme = useTheme()
  const chartColor = '#5F6B7A'
  const chartColorDark = '#2C3440'
  const isMobileViewport = useMediaQuery(theme.breakpoints.down('sm'))
  const interactiveAreaRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(
    isMobileViewport && showMobileNavigation && data.length ? Math.max(0, data.length - 1) : null,
  )

  useEffect(() => {
    setActiveIndex((current) => {
      if (!data.length) {
        return null
      }

      if (isMobileViewport) {
        if (current === null) {
          return showMobileNavigation ? Math.max(0, data.length - 1) : null
        }

        return Math.min(Math.max(0, current), Math.max(0, data.length - 1))
      }

      return null
    })
  }, [data.length, isMobileViewport, showMobileNavigation])

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
  const labelIndexes = isMobileViewport
    ? Array.from(new Set([0, data.length - 1])).filter((index) => index >= 0)
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
        ref={interactiveAreaRef}
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

      {isMobileViewport && showMobileNavigation && data.length > 1 ? (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            border: `1px solid ${alpha('#796542', 0.16)}`,
            borderRadius: '999px',
            px: 0.75,
            py: 0.4,
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
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
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
