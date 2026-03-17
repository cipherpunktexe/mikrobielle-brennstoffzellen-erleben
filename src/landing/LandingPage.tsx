import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'

const canvaEditUrl =
  'https://www.canva.com/design/DAG07O2FJRM/I5SCR0qqx1-stjzMK3V_Qg/edit?utm_content=DAG07O2FJRM&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
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
                  label="Lorem Ipsum"
                  color="secondary"
                  sx={{ alignSelf: 'flex-start', color: 'primary.contrastText' }}
                />
                <Typography variant="h1" sx={{ fontSize: { xs: '2.35rem', sm: undefined } }}>
                  Lorem ipsum dolor sit amet.
                </Typography>
                <Typography sx={{ maxWidth: 680, color: (theme) => alpha(theme.palette.primary.contrastText, 0.82) }}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Donec sed odio dui. Cras mattis consectetur purus sit amet fermentum.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/leaderboard"
                  variant="outlined"
                  color="inherit"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
                >
                  Zum Leaderboard
                </Button>
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
                href={canvaEditUrl}
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
