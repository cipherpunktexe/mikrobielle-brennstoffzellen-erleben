import {Card, CardContent, Stack, Typography } from '@mui/material'



export function ImpressumPage() {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.25, sm: 3, md: 4 } }}>
        <Stack spacing={{ xs: 1.75, sm: 2.25 }}>
          <Typography
            variant="overline"
            sx={{ fontSize: { xs: '0.68rem', sm: undefined }, lineHeight: 1.2 }}
          >
            Rechtliches
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.9rem', sm: undefined } }}>
            Impressum
          </Typography>
          <Typography color="text.secondary">
            Platzhalter
          </Typography>

         
        </Stack>
      </CardContent>
    </Card>
  )
}
