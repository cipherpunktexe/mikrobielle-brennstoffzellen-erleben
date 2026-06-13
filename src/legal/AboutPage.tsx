import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { ContactDetails } from './ContactDetails'
import { contactDetails } from './contactDetails'

export function AboutPage() {
  return (
    <Stack spacing={{ xs: 2.5, md: 3 }}>
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
          <Grid container spacing={{ xs: 2.5, md: 4 }} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={2}>
                <Typography
                  variant="overline"
                  sx={{ fontSize: { xs: '0.68rem', sm: undefined }, lineHeight: 1.2 }}
                >
                  Projekt
                </Typography>
                <Typography variant="h2" sx={{ fontSize: { xs: '1.9rem', sm: undefined } }}>
                  Über uns
                </Typography>
                <Typography color="text.secondary">
                  „{contactDetails.projectName}“ ist eine Lern- und Projekt-App rund um mikrobielle
                  Brennstoffzellen. Sie verbindet Nutzerkonten mit realen Brennstoffzellen, macht
                  Messwerte nachvollziehbar und stellt Ergebnisse in einem Leaderboard gegenüber.
                </Typography>
                <Typography color="text.secondary">
                  Entwickelt und verantwortet wird die Web-App von {contactDetails.responsiblePerson}.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/"
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
                >
                  Zum Projekt
                </Button>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card variant="subtle">
                <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h5">Kontakt</Typography>
                    <ContactDetails />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  )
}
