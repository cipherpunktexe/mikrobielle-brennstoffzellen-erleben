import { Card, CardContent, Stack, Typography } from '@mui/material'
import { ContactDetails } from './ContactDetails'
import { contactDetails } from './contactDetails'

export function ImpressumPage() {
  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
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
              Angaben zum Verantwortlichen dieser Web-App.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="subtle">
        <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
          <Stack spacing={1.5}>
            <Typography variant="h5">Anbieter und Kontakt</Typography>
            <ContactDetails showProjectName />
          </Stack>
        </CardContent>
      </Card>

      <Card variant="subtle">
        <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
          <Stack spacing={1.5}>
            <Typography variant="h5">Verantwortlich für den Inhalt</Typography>
            <Typography variant="body2">
              {contactDetails.responsiblePerson}, Anschrift wie oben.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
