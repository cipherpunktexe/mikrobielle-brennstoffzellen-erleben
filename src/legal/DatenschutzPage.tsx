import { Box, Card, CardContent, Link, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { ContactDetails } from './ContactDetails'
import { contactDetails, contactEmailHref } from './contactDetails'

interface SectionProps {
  title: string
  children: ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <Card variant="subtle">
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" sx={{ mb: 1.5, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
          {title}
        </Typography>
        <Stack spacing={1.5}>{children}</Stack>
      </CardContent>
    </Card>
  )
}

function Subsection({ title, children }: SectionProps) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 0.75, fontWeight: 700 }}>
        {title}
      </Typography>
      <Stack spacing={1}>{children}</Stack>
    </Box>
  )
}

function BulletList({ children }: { children: ReactNode }) {
  return (
    <Stack component="ul" spacing={0.75} sx={{ pl: 2.5, my: 0 }}>
      {children}
    </Stack>
  )
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <Typography component="li" variant="body2">
      {children}
    </Typography>
  )
}

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
              Informationen zur Verarbeitung personenbezogener Daten in der Web-App
              „{contactDetails.projectName}“.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Stand: 13. Juni 2026
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Section title="1. Name und Kontaktdaten des Verantwortlichen">
        <Typography variant="body2">
          Verantwortlich für die Verarbeitung personenbezogener Daten ist:
        </Typography>
        <ContactDetails showProjectName />
      </Section>

      <Section title="2. Datenschutzbeauftragter">
        <Typography variant="body2">
          Für dieses Projekt wurde kein Datenschutzbeauftragter benannt. Datenschutzanfragen
          können direkt an{' '}
          <Link href={contactEmailHref}>{contactDetails.email}</Link> gerichtet werden.
        </Typography>
      </Section>

      <Section title="3. Zwecke, Datenkategorien und Rechtsgrundlagen">
        <Subsection title="Bereitstellung der Web-App">
          <Typography variant="body2">
            Beim Aufruf der App verarbeitet Firebase Hosting technische Zugriffsdaten, insbesondere
            IP-Adresse, Zeitpunkt, angeforderte Datei, Referrer, Browser- und Geräteinformationen.
            Dies dient der sicheren und fehlerfreien Bereitstellung der App.
          </Typography>
          <Typography variant="body2">
            Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGVO. Das berechtigte Interesse liegt im
            sicheren, stabilen und wirtschaftlichen Betrieb der Web-App.
          </Typography>
        </Subsection>

        <Subsection title="Registrierung und Anmeldung">
          <Typography variant="body2">
            Für Registrierung und Anmeldung werden Name, E-Mail-Adresse, verschlüsselte
            Authentifizierungsdaten, Nutzer-ID und gegebenenfalls Profildaten des Google-Kontos
            verarbeitet. Bei einer Registrierung wird außerdem der Brennstoffzellen-Code erfasst.
          </Typography>
          <Typography variant="body2">
            Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe b DSGVO, soweit die Verarbeitung für die
            Bereitstellung des Nutzerkontos und der angeforderten App-Funktionen erforderlich ist.
          </Typography>
        </Subsection>

        <Subsection title="Nutzerprofil, Brennstoffzelle und Messwerte">
          <Typography variant="body2">
            In Cloud Firestore werden Nutzer-ID, Name, E-Mail-Adresse, Rolle, Kontostatus,
            Brennstoffzellen-Zuordnung, Brennstoffzellen-Code, Messwerte, Zeitstempel und bei
            administrativen Änderungen Bearbeitungsangaben gespeichert. Die Verarbeitung ermöglicht
            die Kontoverwaltung, Zuordnung der Brennstoffzelle und Darstellung der Messhistorie.
          </Typography>
          <Typography variant="body2">
            Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe b DSGVO. Sicherheits- und
            Missbrauchsschutzmaßnahmen beruhen zusätzlich auf Art. 6 Abs. 1 Buchstabe f DSGVO.
          </Typography>
        </Subsection>

        <Subsection title="Leaderboard">
          <Typography variant="body2">
            Für das öffentliche Leaderboard werden Anzeigename oder Brennstoffzellen-Code,
            Platzierung, Maximalwert und Zeitpunkt des Maximalwerts bereitgestellt. Die Rangfolge wird
            automatisiert aus den gespeicherten Messwerten berechnet.
          </Typography>
          <Typography variant="body2">
            Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe b DSGVO im Rahmen der angebotenen
            Projektfunktion sowie Art. 6 Abs. 1 Buchstabe f DSGVO. Das berechtigte Interesse liegt in
            der Durchführung und nachvollziehbaren Darstellung des Wettbewerbs.
          </Typography>
        </Subsection>

        <Subsection title="Lokale Speicherung">
          <Typography variant="body2">
            Firebase Authentication nutzt technisch notwendige Browser-Speichermechanismen, um den
            Anmeldestatus zu verwalten. Es werden keine Analyse- oder Marketingdienste eingesetzt.
          </Typography>
        </Subsection>
      </Section>

      <Section title="4. Quelle der Daten">
        <Typography variant="body2">
          Registrierungs-, Profil- und Anmeldedaten werden direkt bei den Nutzenden erhoben.
          Brennstoffzellen-Codes stammen aus den für das Projekt ausgegebenen QR-Codes. Messwerte und
          administrative Angaben werden durch berechtigte Administratoren der App eingetragen.
          Technische Zugriffsdaten entstehen automatisch bei der Nutzung der Web-App.
        </Typography>
      </Section>

      <Section title="5. Empfänger oder Kategorien von Empfängern">
        <Typography variant="body2">
          Zur technischen Bereitstellung werden Dienste der Google Ireland Limited, Gordon House,
          Barrow Street, Dublin 4, Irland, eingesetzt. Google verarbeitet Daten für Firebase-Dienste
          grundsätzlich als Auftragsverarbeiter.
        </Typography>
        <BulletList>
          <Bullet>Firebase Authentication für Registrierung und Anmeldung</Bullet>
          <Bullet>Cloud Firestore für Profile, Brennstoffzellen und Messwerte</Bullet>
          <Bullet>Firebase Hosting für die Auslieferung der Web-App</Bullet>
          <Bullet>Cloud Functions für die eingebettete Leaderboard-Schnittstelle</Bullet>
        </BulletList>
        <Typography variant="body2">
          Innerhalb des Projekts erhalten nur berechtigte Administratoren Zugriff auf
          Verwaltungsdaten. Öffentlich sichtbar sind ausschließlich die im Abschnitt „Leaderboard“
          genannten Angaben.
        </Typography>
        <Typography variant="body2">
          Weitere Informationen:{' '}
          <Link href="https://firebase.google.com/support/privacy" target="_blank" rel="noreferrer">
            Datenschutz und Sicherheit bei Firebase
          </Link>
          .
        </Typography>
      </Section>

      <Section title="6. Übermittlung in Drittländer">
        <Typography variant="body2">
          Bei der Nutzung von Google- und Firebase-Diensten kann eine Verarbeitung außerhalb des
          Europäischen Wirtschaftsraums, insbesondere in den USA, nicht ausgeschlossen werden. Eine
          Übermittlung erfolgt auf Grundlage eines Angemessenheitsbeschlusses, soweit der Empfänger
          darunter fällt, oder auf Grundlage geeigneter Garantien wie den
          EU-Standardvertragsklauseln.
        </Typography>
        <Typography variant="body2">
          Google stellt hierzu{' '}
          <Link
            href="https://firebase.google.com/terms/data-processing-terms"
            target="_blank"
            rel="noreferrer"
          >
            Datenverarbeitungs- und Sicherheitsbedingungen
          </Link>{' '}
          bereit.
        </Typography>
      </Section>

      <Section title="7. Speicherdauer">
        <BulletList>
          <Bullet>
            Konto- und Profildaten werden grundsätzlich bis zur Löschung des Kontos oder bis zum
            Wegfall des Projektzwecks gespeichert.
          </Bullet>
          <Bullet>
            Brennstoffzellen- und Messdaten werden für die Dauer des Projekts und der zugehörigen
            Auswertung gespeichert.
          </Bullet>
          <Bullet>
            Gesperrte oder zur Löschung markierte Datensätze werden nur so lange aufbewahrt, wie dies
            für Missbrauchsschutz, Wiederherstellung oder rechtliche Pflichten erforderlich ist.
          </Bullet>
          <Bullet>
            Technische Protokolldaten werden nach den für die eingesetzten Firebase-Dienste geltenden
            Fristen gelöscht oder anonymisiert.
          </Bullet>
        </BulletList>
        <Typography variant="body2">
          Gesetzliche Aufbewahrungspflichten können im Einzelfall eine längere Speicherung erfordern.
        </Typography>
      </Section>

      <Section title="8. Rechte betroffener Personen">
        <Typography variant="body2">Nach der DSGVO bestehen insbesondere folgende Rechte:</Typography>
        <BulletList>
          <Bullet>Auskunft über verarbeitete personenbezogene Daten nach Art. 15 DSGVO</Bullet>
          <Bullet>Berichtigung unrichtiger Daten nach Art. 16 DSGVO</Bullet>
          <Bullet>Löschung nach Art. 17 DSGVO</Bullet>
          <Bullet>Einschränkung der Verarbeitung nach Art. 18 DSGVO</Bullet>
          <Bullet>Datenübertragbarkeit nach Art. 20 DSGVO</Bullet>
          <Bullet>Widerspruch gegen Verarbeitungen nach Art. 21 DSGVO</Bullet>
        </BulletList>
        <Typography variant="body2">
          Anfragen können an <Link href={contactEmailHref}>{contactDetails.email}</Link> gerichtet
          werden. Außerdem besteht ein Beschwerderecht bei einer zuständigen
          Datenschutzaufsichtsbehörde. Eine Übersicht der deutschen Aufsichtsbehörden stellt die{' '}
          <Link
            href="https://www.bfdi.bund.de/DE/Service/Anschriften/anschriften_table.html"
            target="_blank"
            rel="noreferrer"
          >
            Bundesbeauftragte für den Datenschutz und die Informationsfreiheit
          </Link>{' '}
          bereit.
        </Typography>
      </Section>

      <Section title="9. Widerruf von Einwilligungen und Widerspruch">
        <Typography variant="body2">
          Soweit eine Verarbeitung auf einer Einwilligung beruht, kann diese jederzeit mit Wirkung
          für die Zukunft widerrufen werden. Die Rechtmäßigkeit der bis zum Widerruf erfolgten
          Verarbeitung bleibt unberührt. Gegen Verarbeitungen auf Grundlage berechtigter Interessen
          kann aus Gründen, die sich aus der besonderen Situation der betroffenen Person ergeben,
          Widerspruch eingelegt werden.
        </Typography>
      </Section>

      <Section title="10. Pflicht zur Bereitstellung">
        <Typography variant="body2">
          Die Nutzung der öffentlichen Seiten und des Leaderboards ist ohne Nutzerkonto möglich. Für
          Registrierung, Anmeldung, Zuordnung einer Brennstoffzelle und persönliche Messhistorie
          müssen die jeweils als erforderlich gekennzeichneten Daten bereitgestellt werden. Ohne diese
          Angaben können die entsprechenden Funktionen nicht angeboten werden.
        </Typography>
      </Section>

      <Section title="11. Automatisierte Entscheidungen und Profiling">
        <Typography variant="body2">
          Es findet keine automatisierte Entscheidungsfindung im Sinne von Art. 22 DSGVO und kein
          Profiling statt. Die automatische Berechnung der Rangfolge im Leaderboard entfaltet keine
          rechtliche Wirkung und beeinträchtigt Nutzende nicht in vergleichbar erheblicher Weise.
        </Typography>
      </Section>

      <Section title="12. Änderungen dieser Datenschutzerklärung">
        <Typography variant="body2">
          Diese Datenschutzerklärung wird angepasst, wenn sich Funktionen, eingesetzte Dienste oder
          rechtliche Anforderungen ändern. Es gilt die jeweils in der App veröffentlichte Fassung.
        </Typography>
      </Section>
    </Stack>
  )
}
