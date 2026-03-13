import { Box, Card, CardContent, Stack, Typography } from '@mui/material'

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography color="text.secondary">{children}</Typography>
    </Box>
  )
}

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
            Dieses Impressum ist als veröffentlichungsfähige Vorlage mit Platzhaltern angelegt.
            Ersetze die eckigen Klammern vor der Veröffentlichung durch die tatsächlichen Angaben.
          </Typography>

          <InfoBlock label="Angaben gemäß § 5 TMG">
            [Name der verantwortlichen Person oder Organisation]
            <br />
            [Straße und Hausnummer]
            <br />
            [PLZ Ort]
            <br />
            [Land]
          </InfoBlock>

          <InfoBlock label="Vertreten durch">
            [Vor- und Nachname der vertretungsberechtigten Person]
          </InfoBlock>

          <InfoBlock label="Kontakt">
            Telefon: [Telefonnummer]
            <br />
            E-Mail: [E-Mail-Adresse]
          </InfoBlock>

          <InfoBlock label="Inhaltlich verantwortlich gemäß § 18 Abs. 2 MStV">
            [Vor- und Nachname]
            <br />
            [Straße und Hausnummer]
            <br />
            [PLZ Ort]
          </InfoBlock>

          <Typography variant="body2" color="text.secondary">
            Falls für das Projekt weitere Pflichtangaben erforderlich sind, zum Beispiel Vereins-,
            Register-, Umsatzsteuer- oder Aufsichtsangaben, sollten diese hier ergänzt werden.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
