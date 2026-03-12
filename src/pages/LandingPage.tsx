import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import ScienceIcon from '@mui/icons-material/Science'
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
import { Link as RouterLink } from 'react-router-dom'

const canvaEditUrl =
  'https://www.canva.com/design/DAG07O2FJRM/I5SCR0qqx1-stjzMK3V_Qg/edit?utm_content=DAG07O2FJRM&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
const canvaEmbedUrl =
  'https://www.canva.com/design/DAG07O2FJRM/I5SCR0qqx1-stjzMK3V_Qg/view?embed'

export function LandingPage() {
  const featureCardSx = {
    borderRadius: '28px',
    p: 2.5,
    background: 'rgba(143,122,81,0.14)',
    border: '1px solid rgba(121,101,66,0.16)',
    minHeight: 220,
  }

  return (
    <Stack spacing={4}>
      <Card
        sx={{
          overflow: 'hidden',
          background:
            'linear-gradient(135deg, rgba(36,28,19,0.78), rgba(121,101,66,0.76)), radial-gradient(circle at top, rgba(255,248,231,0.22), transparent 42%)',
          color: 'primary.contrastText',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3}>
                <Chip
                  label="Lorem Ipsum"
                  color="secondary"
                  sx={{ alignSelf: 'flex-start', color: 'primary.contrastText' }}
                />
                <Typography variant="h1">Lorem ipsum dolor sit amet.</Typography>
                <Typography sx={{ maxWidth: 680, color: 'rgba(249,246,239,0.82)' }}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere
                  erat a ante venenatis dapibus posuere velit aliquet. Donec sed odio dui.
                  Cras mattis consectetur purus sit amet fermentum.
                </Typography>
                <Typography sx={{ maxWidth: 680, color: 'rgba(249,246,239,0.72)' }}>
                  Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis
                  vestibulum. Maecenas faucibus mollis interdum. Nulla vitae elit libero,
                  a pharetra augue.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/leaderboard"
                  variant="outlined"
                  color="inherit"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Zum Leaderboard
                </Button>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  minHeight: 320,
                  borderRadius: '32px',
                  background:
                    'linear-gradient(180deg, rgba(248,242,231,0.92), rgba(196,192,185,0.84))',
                  color: 'text.primary',
                  p: 3,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 2,
                }}
              >
                <Stack sx={featureCardSx}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '14px',
                      display: 'grid',
                      placeItems: 'center',
                      mb: 1.5,
                      background: 'rgba(249,246,239,0.65)',
                      color: 'primary.main',
                    }}
                  >
                    <QrCode2Icon />
                  </Box>
                  <Typography variant="h6">Lorem</Typography>
                  <Typography color="text.secondary">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed posuere
                    consectetur est at lobortis.
                  </Typography>
                </Stack>

                <Stack sx={featureCardSx}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '14px',
                      display: 'grid',
                      placeItems: 'center',
                      mb: 1.5,
                      background: 'rgba(249,246,239,0.65)',
                      color: 'primary.main',
                    }}
                  >
                    <ScienceIcon />
                  </Box>
                  <Typography variant="h6">Ipsum</Typography>
                  <Typography color="text.secondary">
                    Aenean lacinia bibendum nulla sed consectetur. Vestibulum id ligula
                    porta felis euismod semper.
                  </Typography>
                </Stack>

                <Stack
                  sx={{
                    gridColumn: '1 / -1',
                    borderRadius: '28px',
                    p: 2.5,
                    background: 'rgba(36,28,19,0.08)',
                    border: '1px dashed rgba(121,101,66,0.3)',
                  }}
                >
                  <Typography variant="overline">Dolor Sit</Typography>
                  <Typography variant="body2">
                    Praesent commodo cursus magna, vel scelerisque nisl consectetur et.
                    Curabitur blandit tempus porttitor.
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {[
          {
            title: 'Lorem',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.',
          },
          {
            title: 'Ipsum',
            text: 'Donec id elit non mi porta gravida at eget metus. Curabitur blandit tempus porttitor. Aenean eu leo quam.',
          },
          {
            title: 'Dolor',
            text: 'Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Maecenas faucibus mollis interdum.',
          },
        ].map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {item.title}
                </Typography>
                <Typography color="text.secondary">{item.text}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2.5}>
            <div>
              <Typography variant="overline">Präsentation</Typography>
              <Typography variant="h2" gutterBottom>
                Projektpräsentation
              </Typography>
              <Typography color="text.secondary">
                Hier ist die eingebettete Canva-Präsentation zum Projekt
                "Mikrobielle Brennstoffzellen erleben" zu sehen.
              </Typography>
            </div>

            <Box
              sx={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                borderRadius: '24px',
                border: '1px solid rgba(121,101,66,0.18)',
                background: 'rgba(248,242,231,0.74)',
                pt: '56.25%',
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
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                component="a"
                href={canvaEditUrl}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                endIcon={<OpenInNewIcon />}
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
