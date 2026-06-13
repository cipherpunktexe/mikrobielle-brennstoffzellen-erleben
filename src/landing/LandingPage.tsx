import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'

const canvaViewUrl =
  'https://www.canva.com/design/DAG07O2FJRM/I5SCR0qqx1-stjzMK3V_Qg/view'
const canvaEmbedUrl = 'https://www.canva.com/design/DAG07O2FJRM/I5SCR0qqx1-stjzMK3V_Qg/view?embed'

const learningStations = [
  {
    icon: <ScienceOutlinedIcon />,
    title: 'Mikroskopieren',
    text: 'Biofilme und die beteiligten Mikroorganismen werden unter dem Mikroskop sichtbar und verständlich.',
  },
  {
    icon: <BuildOutlinedIcon />,
    title: 'Eigene Brennstoffzelle bauen',
    text: 'Besucherinnen und Besucher bauen selbst eine kleine mikrobielle Brennstoffzelle und erleben den Versuchsaufbau praktisch.',
  },
  {
    icon: <BoltOutlinedIcon />,
    title: 'Energie nutzbar machen',
    text: 'An einer größeren Brennstoffzelle wird gezeigt, wie die erzeugte elektrische Energie gemessen und genutzt werden kann.',
  },
  {
    icon: <HubOutlinedIcon />,
    title: 'Zukünftige Anwendungen',
    text: 'Die Station lädt dazu ein, Einsatzmöglichkeiten der Technologie zu entdecken und eigene Ideen weiterzuentwickeln.',
  },
]

const cellSteps = [
  {
    title: '1. Anode',
    text: 'Anaerobe Bakterien bauen organische Stoffe ab. Dabei entstehen Elektronen und Protonen.',
  },
  {
    title: '2. Stromkreis',
    text: 'Die Elektronen fließen über einen äußeren Stromkreis von der Anode zur Kathode. Dieser Fluss ist als elektrischer Strom nutzbar.',
  },
  {
    title: '3. Kathode',
    text: 'An der Kathode reagieren Elektronen und Protonen mit Sauerstoff. Dabei entsteht unter anderem Wasser.',
  },
]

export function LandingPage() {
  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <Card
        sx={{
          overflow: 'hidden',
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.text.primary, 0.78)}, ${alpha(theme.palette.secondary.main, 0.76)}), radial-gradient(circle at top, ${alpha(theme.palette.primary.contrastText, 0.22)}, transparent 42%)`,
          color: 'primary.contrastText',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 5 } }}>
          <Grid container spacing={{ xs: 2.5, md: 4 }} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={{ xs: 2, sm: 3 }}>
                <Chip
                  label="IdeenExpo-Projekt"
                  color="secondary"
                  sx={{ alignSelf: 'flex-start', color: 'primary.contrastText' }}
                />
                <Typography variant="h1" sx={{ fontSize: { xs: '2.35rem', sm: undefined } }}>
                  Mikrobielle Brennstoffzellen erleben
                </Typography>
                <Typography
                  sx={{
                    maxWidth: 680,
                    color: (theme) => alpha(theme.palette.primary.contrastText, 0.88),
                  }}
                >
                  Wie können Mikroorganismen elektrische Energie erzeugen? Unser Projekt macht
                  das Prinzip mikrobieller Brennstoffzellen mit Experimenten, Messwerten und
                  interaktiven Stationen greifbar.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    component={RouterLink}
                    to="/user"
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Deine Brennstoffzelle
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/leaderboard"
                    variant="outlined"
                    color="inherit"
                  >
                    Messwerte vergleichen
                  </Button>
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                variant="panel"
                sx={{
                  borderRadius: { xs: '22px', sm: '28px' },
                }}
              >
                <CardContent
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: { xs: 320, sm: 360, md: 420 },
                  }}
                >
                  <Box
                    component="img"
                    src="/app-logo.png"
                    alt="Projektlogo"
                    sx={{
                      width: 'auto',
                      height: { xs: 280, sm: 320, md: 380 },
                      maxWidth: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
          <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={1.5}>
                <Typography variant="overline">Erneuerbare Energie</Typography>
                <Typography variant="h2" sx={{ fontSize: { xs: '1.85rem', sm: undefined } }}>
                  Strom aus der Arbeit von Mikroorganismen
                </Typography>
                <Typography color="text.secondary">
                  Mikrobielle Brennstoffzellen verbinden Biologie und Technik. Bakterien setzen
                  beim Abbau organischer Stoffe Elektronen frei. Ein geeigneter Aufbau macht
                  diesen Elektronenfluss als elektrische Energie messbar.
                </Typography>
                <Typography color="text.secondary">
                  Das Projekt zeigt nicht nur das Ergebnis, sondern den gesamten Weg von den
                  Mikroorganismen über den Versuchsaufbau bis zur möglichen Anwendung.
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Grid container spacing={1.5}>
                {cellSteps.map((step) => (
                  <Grid key={step.title} size={{ xs: 12, sm: 4 }}>
                    <Card variant="subtle" sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 2.25 }}>
                        <Typography variant="h6" gutterBottom>
                          {step.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {step.text}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        <Box>
          <Typography variant="overline">Interaktiv lernen</Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.85rem', sm: undefined } }}>
            Das erwartet dich an den Stationen
          </Typography>
        </Box>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {learningStations.map((station) => (
            <Grid key={station.title} size={{ xs: 12, sm: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        color: 'primary.contrastText',
                        bgcolor: 'secondary.main',
                      }}
                    >
                      {station.icon}
                    </Box>
                    <Box>
                      <Typography variant="h5" gutterBottom>
                        {station.title}
                      </Typography>
                      <Typography color="text.secondary">{station.text}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
          <Stack spacing={2.5}>
            <div>
              <Typography variant="overline">Präsentation</Typography>
              <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.85rem', sm: undefined } }}>
                Projektpräsentation
              </Typography>
            </div>

            <Card
              variant="panel"
              sx={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                borderRadius: { xs: '18px', sm: '24px' },
                pt: { xs: '70%', sm: '56.25%' },
              }}
            >
              <Box
                component="iframe"
                src={canvaEmbedUrl}
                title="Projektpräsentation Mikrobielle Brennstoffzellen erleben"
                allowFullScreen
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
              />
            </Card>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                component="a"
                href={canvaViewUrl}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                endIcon={<OpenInNewIcon />}
                fullWidth
              >
                Präsentation öffnen
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {[
          {
            title: 'Für verschiedene Altersgruppen',
            text: 'Praktische und interaktive Angebote werden mit den theoretischen Grundlagen verbunden. So entstehen unterschiedliche Zugänge zum Thema.',
          },
          {
            title: 'Materialien und Kooperation',
            text: 'Genutzt werden Materialien der Schule sowie Materialien für die einmalige Nutzung durch Besucher. Eine Kooperation mit der Technischen Universität Braunschweig ist vorgesehen.',
          },
          {
            title: 'Technologieoffen in die Zukunft',
            text: 'Mikrobielle Brennstoffzellen werden nicht als Ersatz für alle bestehenden Lösungen betrachtet, sondern als spannende Bereicherung für Forschung, Bildung und neue Anwendungen.',
          },
        ].map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
                <Typography variant="h5" gutterBottom>
                  {item.title}
                </Typography>
                <Typography color="text.secondary">{item.text}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}
