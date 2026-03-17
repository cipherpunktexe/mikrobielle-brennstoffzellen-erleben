import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

interface MeasurementMetricsCardProps {
  currentValue: string
  maxValue: string
}

export function MeasurementMetricsCard({ currentValue, maxValue }: MeasurementMetricsCardProps) {
  const metricCards = [
    {
      label: 'Aktueller Messwert',
      value: currentValue,
    },
    {
      label: 'Maximalwert',
      value: maxValue,
    },
  ]

  return (
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
  )
}
