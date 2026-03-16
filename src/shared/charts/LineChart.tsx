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
  const padding = {
    top: 18,
    right: isMobileViewport ? 16 : 22,
    bottom: isMobileViewport ? 34 : 42,
    left: isMobileViewport ? 50 : 64,
  }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const values = data.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const rawRange = maxValue - minValue
  const paddedRange = rawRange === 0 ? Math.max(Math.abs(maxValue) * 0.2, 1) : rawRange * 0.18
  const chartMin = minValue - paddedRange * 0.35
  const chartMax = maxValue + paddedRange * 0.65
  const valueRange = chartMax - chartMin || 1
  const yTicks = Array.from({ length: 4 }, (_, index) => chartMax - (valueRange / 3) * index)

  const points = data.map((point, index) => {
    const x =
      data.length === 1
        ? padding.left + plotWidth / 2
        : padding.left + (index / (data.length - 1)) * plotWidth
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
      setActiveIndex(nextIndex)
    }
  }

  function clearActiveIndex() {
    if (!isMobileViewport) {
      setActiveIndex(null)
    }
  }

  const activeTooltipWidth = isMobileViewport ? 112 : 128
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
      {activePoint ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1}
          sx={{
            border: `1px solid ${alpha('#796542', 0.16)}`,
            borderRadius: '18px',
            px: 1.75,
            py: 1.5,
            background: `linear-gradient(135deg, ${alpha('#F8F2E7', 0.88)}, ${alpha('#EFE6D4', 0.68)})`,
            boxShadow: `inset 0 1px 0 ${alpha('#FFFFFF', 0.65)}`,
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
            <Typography variant="h5" sx={{ lineHeight: 1.05, color: '#241C13' }}>
              {valueFormatter(activePoint.point.value)}
            </Typography>
          </Box>
        </Stack>
      ) : null}

      <Box
        sx={{
          border: `1px solid ${alpha('#796542', 0.16)}`,
          borderRadius: '22px',
          background: `linear-gradient(180deg, ${alpha('#FFF9EF', 0.96)}, ${alpha('#F3E9D6', 0.72)})`,
          p: { xs: 1.25, sm: 1.75 },
          touchAction: 'none',
          boxShadow: `inset 0 1px 0 ${alpha('#FFFFFF', 0.7)}`,
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
              <stop offset="0%" stopColor={alpha('#3DB1EC', 0.36)} />
              <stop offset="100%" stopColor={alpha('#3DB1EC', 0.02)} />
            </linearGradient>
            <linearGradient id="chart-line-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1F7A8C" />
              <stop offset="50%" stopColor="#3DB1EC" />
              <stop offset="100%" stopColor="#7AD12C" />
            </linearGradient>
          </defs>

          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            rx="20"
            fill={alpha('#FFFCF6', 0.8)}
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
                  fill="#6A5A41"
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
                fill="#6A5A41"
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
              stroke={alpha('#1F7A8C', 0.32)}
              strokeDasharray="4 6"
            />
          ) : null}

          <polygon points={areaPoints} fill="url(#chart-area-fill)" />
          <polyline
            points={linePoints}
            fill="none"
            stroke="url(#chart-line-stroke)"
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
                    fill={alpha('#3DB1EC', 0.16)}
                  />
                ) : null}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 6.5 : 4.75}
                  fill={isActive ? '#F7C948' : '#7AD12C'}
                  stroke="#241C13"
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
                fill={alpha('#241C13', 0.94)}
              />
              <text
                x={activeTooltipX + activeTooltipWidth / 2}
                y={activeTooltipY + 18}
                textAnchor="middle"
                fontSize="11"
                fill="#F8F2E7"
              >
                {activePoint.point.shortLabel ?? activePoint.point.label}
              </text>
              <text
                x={activeTooltipX + activeTooltipWidth / 2}
                y={activeTooltipY + 33}
                textAnchor="middle"
                fontSize="15"
                fontWeight="700"
                fill="#F7C948"
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
            bgcolor: alpha('#F8F2E7', 0.6),
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
