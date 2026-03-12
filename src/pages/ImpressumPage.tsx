import { Card, CardContent, Stack, Typography } from '@mui/material'

export function ImpressumPage() {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={2}>
          <Typography variant="overline">Rechtliches</Typography>
          <Typography variant="h2">Impressum</Typography>
          <Typography color="text.secondary">
            Diese Seite ist ein Platzhalter für das Impressum des Projekts
            "Mikrobielle Brennstoffzellen erleben".
          </Typography>
          <Typography>
            Bitte ergänze hier die vollständigen Pflichtangaben, zum Beispiel
            verantwortliche Stelle, Anschrift, Kontaktmöglichkeiten und gegebenenfalls
            Vertretungsberechtigte.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
