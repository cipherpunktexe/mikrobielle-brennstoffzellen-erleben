import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import {  Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'


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
            Rechtliches
          </Typography>
                <Typography variant="h2" sx={{ fontSize: { xs: '1.9rem', sm: undefined } }}>
                  Über uns
                </Typography>
                <Typography color="text.secondary">
                  Platzhalter
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
                  
                </Stack>
              </Stack>
            </Grid>

            
          </Grid>
        </CardContent>
      </Card>

      
    </Stack>
  )
}
