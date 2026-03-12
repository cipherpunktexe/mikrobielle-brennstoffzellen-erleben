import { Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface DashboardCardProps {
  eyebrow: string
  title: string
  value: string
  helper: string
  icon?: ReactNode
  accent?: 'primary' | 'secondary' | 'success' | 'warning'
}

export function DashboardCard({
  eyebrow,
  title,
  value,
  helper,
  icon,
  accent = 'primary',
}: DashboardCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Chip
              label={eyebrow}
              color={accent}
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            />
            {icon}
          </Stack>
          <div>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ lineHeight: 1, mb: 1 }}>
              {value}
            </Typography>
            <Typography color="text.secondary">{helper}</Typography>
          </div>
        </Stack>
      </CardContent>
    </Card>
  )
}
