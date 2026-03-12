import { Card, CardContent, Divider, Grid, Stack, Typography } from '@mui/material'

const providerItems = [
  {
    title: 'Firebase Authentication',
    text: 'Wird für Nutzer- und Admin-Login verwendet. Dabei werden insbesondere E-Mail-Adresse, Passwort-Login-Daten und technische Verbindungsdaten verarbeitet.',
  },
  {
    title: 'Cloud Firestore',
    text: 'Wird zur Speicherung von Nutzerprofilen, Generatoren und Messwerten verwendet. In diesem Projekt betrifft das insbesondere Name, E-Mail-Adresse, Rollen, Generatorzuordnungen und Messwerte.',
  },
  {
    title: 'Firebase Hosting',
    text: 'Wird für die Bereitstellung der Web-Anwendung verwendet. Dabei können technische Zugriffsdaten wie IP-Adresse, Zeitstempel und aufgerufene Ressourcen verarbeitet werden.',
  },
  {
    title: 'Google Analytics for Firebase',
    text: 'Ist im Frontend vorbereitet und kann zur Analyse der Nutzung eingesetzt werden. Wenn Analytics aktiv genutzt wird, sind die Hinweise zu Analyse- und Nutzungsdaten entsprechend zu ergänzen.',
  },
]

export function DatenschutzPage() {
  return (
    <Stack spacing={3}>
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Typography variant="overline">Rechtliches</Typography>
            <Typography variant="h2">Datenschutz</Typography>
            <Typography color="text.secondary">
              Diese Seite ist eine projektbezogene Vorlage für die Datenschutzhinweise
              von "Mikrobielle Brennstoffzellen erleben". Sie sollte vor der
              Veröffentlichung rechtlich geprüft und mit den tatsächlichen Angaben zur
              verantwortlichen Stelle ergänzt werden.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Typography variant="h4">Verantwortliche Stelle</Typography>
            <Typography>
              Bitte ergänze hier Name, Anschrift, E-Mail-Adresse und gegebenenfalls
              weitere Kontaktdaten der verantwortlichen Stelle.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={3}>
            <div>
              <Typography variant="h4" gutterBottom>
                Eingesetzte Anbieter
              </Typography>
              <Typography color="text.secondary">
                Im aktuellen Projektstand werden zentral Dienste von Google Firebase
                eingesetzt. Aus den offiziellen Firebase-Unterlagen ergibt sich für
                EWR-/EMEA-Kunden in der Regel Google Ireland Limited als
                Vertragsanbieter; technisch können Daten je nach Dienst auch über
                Google LLC verarbeitet werden.
              </Typography>
            </div>

            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h6">Google Firebase / Google</Typography>
                  <Typography>
                    Anbieterzuordnung für Europa nach den Firebase-Unterlagen in der
                    Regel: Google Ireland Limited, Gordon House, Barrow Street, Dublin
                    4, Irland.
                  </Typography>
                  <Typography color="text.secondary">
                    Mögliche technische Mitverarbeitung innerhalb des Google-Konzerns:
                    Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043,
                    USA.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Grid container spacing={2}>
              {providerItems.map((item) => (
                <Grid key={item.title} size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography color="text.secondary">{item.text}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Typography variant="h4">Hinweise zur Datenverarbeitung</Typography>
            <Typography>
              Im Rahmen der Nutzung dieser Anwendung können insbesondere Registrierungs-,
              Login-, Rollen-, Generator- und Messwertdaten verarbeitet werden. Welche
              Daten im Einzelfall betroffen sind, hängt davon ab, ob du die App als
              Nutzer oder als Admin verwendest.
            </Typography>
            <Divider />
            <Typography>
              Nach den Firebase-Datenschutzhinweisen wird Firebase Authentication aus
              US-Rechenzentren betrieben. Andere hier eingesetzte Firebase-Dienste wie
              Cloud Firestore oder Firebase Hosting können über globale Google-
              Infrastruktur verarbeitet werden.
            </Typography>
            <Typography>
              Wenn Google Analytics for Firebase tatsächlich für Auswertungen verwendet
              wird, sollten Zweck, Rechtsgrundlage, Speicherdauer, Opt-out- bzw.
              Einwilligungsmechanismus und die konkret erhobenen Analyseinformationen
              noch genauer ergänzt werden.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
