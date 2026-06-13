import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
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

    </Stack>
  )
}
