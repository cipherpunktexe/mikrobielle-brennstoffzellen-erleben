import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

const aboutSections = [
  {
    title: 'Worum es geht',
    text:
      'Das Projekt macht mikrobielle Brennstoffzellen als Experiment, Messobjekt und Lerninhalt direkt in einer Web-App erlebbar.',
  },
  {
    title: 'Wie die App hilft',
    text:
      'Nutzer koennen ihre Brennstoffzelle verknuepfen, Messwerte verfolgen und die Ergebnisse im Leaderboard mit anderen vergleichen.',
  },
  {
    title: 'Was im Mittelpunkt steht',
    text:
      'Im Fokus stehen ein klarer Zugang zum Projekt, ein einfacher Messworkflow und eine nachvollziehbare Darstellung der Ergebnisse.',
  },
]

export function AboutPage() {
  return (
    <Stack spacing={{ xs: 2.5, md: 3 }}>
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
          <Grid container spacing={{ xs: 2.5, md: 4 }} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={2}>
                <Typography variant="overline">Projekt</Typography>
                <Typography variant="h2" sx={{ fontSize: { xs: '1.9rem', sm: undefined } }}>
                  Ueber uns
                </Typography>
                <Typography color="text.secondary">
                  Mikrobielle Brennstoffzellen erleben verbindet Projektvorstellung,
                  Brennstoffzellen-Verknuepfung, Messwertdokumentation und Ranking in einer
                  gemeinsamen Anwendung.
                </Typography>
                <Typography color="text.secondary">
                  Die Seite ergaenzt die Projektansicht um eine kompakte Beschreibung des Ziels,
                  der Idee und des Einsatzes in der App.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    component={RouterLink}
                    to="/"
                    variant="outlined"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
                  >
                    Zum Projekt
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/leaderboard"
                    variant="contained"
                    sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
                  >
                    Zum Leaderboard
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  borderRadius: '24px',
                  border: '1px solid rgba(121,101,66,0.16)',
                  background:
                    'linear-gradient(135deg, rgba(248,242,231,0.88), rgba(226,214,192,0.72))',
                  minHeight: { xs: 240, md: 300 },
                  display: 'grid',
                  placeItems: 'center',
                  p: 3,
                }}
              >
                <Box
                  component="img"
                  src="/app-logo.png"
                  alt="Projektlogo"
                  sx={{
                    width: 'auto',
                    height: { xs: 180, md: 220 },
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {aboutSections.map((section) => (
          <Grid key={section.title} size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Typography variant="h5" gutterBottom>
                  {section.title}
                </Typography>
                <Typography color="text.secondary">{section.text}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}
