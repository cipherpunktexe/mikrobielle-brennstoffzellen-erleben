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
      <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
            <Chip
              label={eyebrow}
              color={accent}
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            />
            <Typography component="span" sx={{ color: `${accent}.main`, lineHeight: 1 }}>
              {icon}
            </Typography>
          </Stack>
          <div>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                lineHeight: 1,
                mb: 1,
                fontSize: { xs: '1.85rem', sm: '2.4rem' },
                overflowWrap: 'anywhere',
              }}
            >
              {value}
            </Typography>
            <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
              {helper}
            </Typography>
          </div>
        </Stack>
      </CardContent>
    </Card>
  )
}
