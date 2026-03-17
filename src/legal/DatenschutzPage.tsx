import { Box, Card, CardContent, Link, Stack, Typography } from '@mui/material'
import { uiColor } from '../app/uiColor'

type SectionProps = {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <Box
      sx={{
        border: (theme) => `1px solid ${uiColor.surface.border(theme)}`,
        borderRadius: 3,
        p: { xs: 2, sm: 3 },
        background: (theme) => uiColor.surface.subtle(theme),
      }}
    >
      <Typography variant="h5" sx={{ mb: 1.5, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
        {title}
      </Typography>
      <Stack spacing={1.5}>{children}</Stack>
    </Box>
  )
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 0.75, fontWeight: 700 }}>
        {title}
      </Typography>
      <Stack spacing={1}>{children}</Stack>
    </Box>
  )
}

type ServiceItem = {
  title: string
  description: string
  dataItems: string[]
  provider: string
  providerUrl: string
}

function ServiceCard({ title, description, dataItems, provider, providerUrl }: ServiceItem) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={1.25}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>
            {title}
          </Typography>
          <Typography color="text.secondary">{description}</Typography>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
              Verarbeitete Daten
            </Typography>
            <Stack component="ul" spacing={0.5} sx={{ pl: 2, m: 0 }}>
              {dataItems.map((item) => (
                <Typography component="li" key={item} variant="body2" color="text.secondary">
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>
          <Typography variant="body2">
            Anbieter:{' '}
            <Link href={providerUrl} target="_blank" rel="noreferrer">
              {provider}
            </Link>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

const serviceItems: ServiceItem[] = [
  {
    title: 'Firebase Authentication',
    description:
      'Wird für die Registrierung und Anmeldung mit E-Mail/Passwort sowie per Google-Login verwendet.',
    dataItems: [
      'E-Mail-Adresse',
      'Passwort-Login-Daten',
      'Google-Konto-Profildaten bei Google-Anmeldung',
      'technische Anmelde- und Verbindungsdaten',
    ],
    provider: 'Google / Firebase',
    providerUrl: 'https://firebase.google.com/support/privacy',
  },
  {
    title: 'Cloud Firestore',
    description: 'Wird zur Speicherung von Nutzerprofilen, Brennstoffzellen und Messwerten genutzt.',
    dataItems: [
      'Name',
      'E-Mail-Adresse',
      'Rolle',
      'Brennstoffzellen-Zuordnung',
      'Brennstoffzellen-Code',
      'Messwerte und Zeitstempel',
    ],
    provider: 'Google / Firebase',
    providerUrl: 'https://firebase.google.com/support/privacy',
  },
  {
    title: 'Firebase Hosting',
    description: 'Wird für die Bereitstellung der Web-App verwendet.',
    dataItems: [
      'IP-Adresse',
      'Zeitpunkt des Zugriffs',
      'aufgerufene Seiten und Dateien',
      'technische Request- und Logdaten',
    ],
    provider: 'Google / Firebase',
    providerUrl: 'https://firebase.google.com/support/privacy',
  },
]

export function DatenschutzPage() {
  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <Card>
        <CardContent sx={{ p: { xs: 2.25, sm: 3, md: 4 } }}>
          <Stack spacing={{ xs: 1.5, sm: 2 }}>
            <Typography
              variant="overline"
              sx={{ fontSize: { xs: '0.68rem', sm: undefined }, lineHeight: 1.2 }}
            >
              Rechtliches
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.9rem', sm: undefined } }}>
              Datenschutzerklärung
            </Typography>
            <Typography color="text.secondary">
              Diese Datenschutzerklärung ist als veröffentlichungsfähige Vorlage mit Platzhaltern angelegt.
              Ersetze die eckigen Klammern vor der Veröffentlichung durch die tatsächlichen Angaben zur
              verantwortlichen Stelle.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Section title="1. Verantwortliche Stelle">
        <Typography variant="body2">
          [Name der verantwortlichen Person oder Organisation]
          <br />
          [Straße und Hausnummer]
          <br />
          [PLZ Ort]
          <br />
          [Land]
        </Typography>
        <Typography variant="body2">
          E-Mail: [E-Mail-Adresse]
          <br />
          Telefon: [Telefonnummer]
        </Typography>
      </Section>

      <Section title="2. Datenschutz auf einen Blick">
        <Subsection title="Welche Daten werden verarbeitet?">
          <Typography variant="body2">
            Im Rahmen der Nutzung der App werden insbesondere Registrierungs-, Login-, Rollen-,
            Brennstoffzellen- und Messwertdaten verarbeitet. Zusätzlich fallen beim Aufruf der Web-App
            technische Zugriffsdaten an.
          </Typography>
        </Subsection>

        <Subsection title="Wofür werden die Daten genutzt?">
          <Typography variant="body2">
            Die Daten werden genutzt, um Nutzerkonten anzulegen, Anmeldungen zu ermöglichen,
            Brennstoffzellen Nutzern zuzuordnen, Messwerte zu speichern und das Leaderboard
            bereitzustellen.
          </Typography>
        </Subsection>

        <Subsection title="Wer erhält die Daten?">
          <Typography variant="body2">
            Empfänger sind im aktuellen Stand vor allem die eingesetzten Google-Firebase-Dienste für
            Authentifizierung, Datenbank und Hosting.
          </Typography>
        </Subsection>
      </Section>

      <Section title="3. Rechtsgrundlagen">
        <Typography variant="body2">
          Soweit die App für Registrierung, Anmeldung, Benutzerverwaltung und die Bereitstellung der
          Kernfunktionen genutzt wird, erfolgt die Verarbeitung in der Regel zur Durchführung der
          bereitgestellten Anwendung. Daneben können gesetzliche Verpflichtungen oder berechtigte
          Interessen als Rechtsgrundlage einschlägig sein. Die konkrete rechtliche Einordnung sollte vor
          Veröffentlichung abschließend geprüft werden.
        </Typography>
      </Section>

      <Section title="4. Speicherdauer">
        <Typography variant="body2">
          Personenbezogene Daten werden nur so lange gespeichert, wie sie für den Betrieb der
          Anwendung, die bereitgestellten Funktionen oder gesetzliche Aufbewahrungspflichten erforderlich
          sind. Nach Wegfall des jeweiligen Zwecks werden die Daten gelöscht, soweit keine gesetzlichen
          Pflichten entgegenstehen.
        </Typography>
      </Section>

      <Section title="5. Ihre Rechte">
        <Typography variant="body2">
          Betroffene Personen haben nach Maßgabe der gesetzlichen Vorschriften insbesondere das Recht auf
          Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie auf
          Beschwerde bei einer zuständigen Datenschutzaufsichtsbehörde.
        </Typography>
      </Section>

      <Section title="6. Eingesetzte Dienste">
        <Typography variant="body2" color="text.secondary">
          Aufgeführt sind nur Dienste, die im aktuellen Stand der App tatsächlich verwendet werden.
        </Typography>

        <Stack spacing={2}>
          {serviceItems.map((item) => (
            <ServiceCard key={item.title} {...item} />
          ))}
        </Stack>
      </Section>
    </Stack>
  )
}
