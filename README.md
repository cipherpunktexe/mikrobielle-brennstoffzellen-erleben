# Mikrobielle Brennstoffzellen erlernen


## Aktueller Stand

- SPA mit React 19, Vite 8, TypeScript und MUI 7.
- Authentifizierung über Firebase Authentication (E-Mail/Passwort und Google).
- Datenhaltung in Cloud Firestore (`users`, `generators`, `measurements`, `experimentMeasurements`, `adminState`).

## Hauptfunktionen

### Landing und oeffentliche Seiten

- Projekt-Landingpage mit Hero-Bereich, Logo, Praesentation und Info-Karten.
- Leaderboard mit Top-3-Podest, Abschnittstabellen (Top 5/10/25/...) und Detaildialog je Brennstoffzelle.
- Rechtliche Seiten: `Ueber uns`, `Impressum`, `Datenschutz`.

### User-Flow

- Registrierung über QR-Link: `/user?register=<code>`.
- Login mit E-Mail/Passwort oder Google.
- Verknuepfung einer Brennstoffzelle über den QR-Scanner im User-Dashboard.
- Anzeige von:
  - eigenem Brennstoffzellen-Code
  - Platzierung im Leaderboard (nach Maximalwert)
  - Messhistorie (Diagramm oder Liste)

### Admin-Workflow

- Admin-Bereich mit Tabs:
  - `scan`: QR scannen oder manuell Messwert erfassen
  - `qr`: QR-Codes als PDF exportieren
  - `moderation`: Nutzer/Brennstoffzellen einsehen und moderieren
- QR-Export reserviert fortlaufende Codes (hexadezimal) über `adminState/qr-export-counter`.
- Moderation unterstuetzt u. a. Rollenpflege, Statuswechsel (`active`, `blocked`, `deleted`) und Messwertbearbeitung.

## Routing

- `/` -> Landingpage
- `/user` -> User-Dashboard; mit `?register=<code>` öffnet sich der Dialog zur Registrierung
- `/admin` -> Admin-Bereich (Standardtab)
- `/admin/:tab` -> Admin-Bereich mit aktivem Tab (`scan`, `qr`, `moderation`)
- `/admin/:tab/generator/:code` -> Admin-Scan/Messung fuer konkreten Code
- `/leaderboard` -> Leaderboard
- `/ueber-uns` -> Über uns
- `/impressum` -> Impressum
- `/datenschutz` -> Datenschutz
- `/api/leaderboard` -> oeffentliche JSON-API fuer eingebettete Leaderboards
- `/api/experiment-measurement` -> geschuetzte Import-API fuer den Live-Versuch

## Externe Leaderboard API

Die API ist fuer externe Webseiten gedacht (CORS: `*`).

- Endpoint: `GET /api/leaderboard`
- Optionaler Query-Parameter: `limit` (1-500, default 100)

Beispiel:

```bash
curl "https://mikrobielle-brennstoffzellen.web.app/api/leaderboard?limit=10"
```

Antwort:

```json
{
  "generatedAt": "2026-03-17T14:40:00.000Z",
  "count": 10,
  "entries": [
    {
      "rank": 1,
      "generatorId": "abc123",
      "code": "00AF",
      "displayName": "Team A",
      "maxValue": 2.1,
      "maxMeasuredAt": "2026-03-17T12:00:00.000Z"
    }
  ]
}
```

## Live-Versuch API

Die Live-Versuch API ist fuer Messgeraete oder Import-Skripte gedacht, die
Spannungswerte des grossen Versuchsaufbaus an die App senden. Die Werte werden
in `experimentMeasurements` gespeichert und auf der Startseite im Live-Diagramm
angezeigt.

Ausfuehrliche Schnittstellen-Dokumentation mit allen Feldern, Bedingungen,
Fehlercodes und Python-Beispiel: [docs/experiment-measurement-api.md](docs/experiment-measurement-api.md).

- Endpoint: `POST /api/experiment-measurement`
- Produktiv-URL: `https://mikrobielle-brennstoffzellen.web.app/api/experiment-measurement`
- Content-Type: `application/json`
- Authentifizierung: Bearer-Token oder Header `X-Experiment-Import-Token`
- Einheit: `valueMv` wird in Millivolt gesendet
- Idempotenz: gleicher `deviceId` + gleicher `measuredAt` schreibt dasselbe Dokument

### Authentifizierung

Der Token muss dem Firebase Secret `EXPERIMENT_IMPORT_TOKEN` entsprechen. Fuer
neue Installationen wird das Secret vor dem Deploy gesetzt:

```bash
firebase functions:secrets:set EXPERIMENT_IMPORT_TOKEN
```

Empfohlen ist der Standard-Header:

```text
Authorization: Bearer <EXPERIMENT_IMPORT_TOKEN>
```

Alternativ akzeptiert die API:

```text
X-Experiment-Import-Token: <EXPERIMENT_IMPORT_TOKEN>
```

### Request

```json
{
  "valueMv": 742,
  "measuredAt": "2026-06-17T12:30:00.000Z",
  "deviceId": "hauptversuch",
  "measurementId": "hauptversuch-2026-06-17T12:30:00.000Z",
  "dryRun": false
}
```

Felder:

- `valueMv` ist erforderlich und muss eine endliche Zahl sein.
- `measuredAt` ist erforderlich.
- `deviceId` ist optional. Wenn der Wert fehlt, verwendet die API `hauptversuch`.
- `measurementId` ist optional. Die API akzeptiert fast alle stabilen Strings.
  Firestore-ungeeignete IDs werden intern deterministisch in eine sichere Dokument-ID
  umgewandelt. Ungueltig sind nur leere IDs sowie `.` und `..`.
- `dryRun` ist optional. Mit `true` prueft die API Authentifizierung und Payload,
  schreibt aber keinen Messwert.

Wenn keine `measurementId` gesendet wird, erzeugt die API eine stabile Dokument-ID
aus `deviceId` und `measuredAt`. Wiederholt ein Script denselben Request nach
einem Timeout, entsteht dadurch kein doppelter Messwert.

### Erfolgreiche Antwort

Status: `201 Created` bei neuem Messwert, `200 OK` bei wiederholtem identischem
Request.

```json
{
  "id": "measurement-abc123",
  "valueMv": 742,
  "measuredAt": "2026-06-17T12:30:00.000Z",
  "deviceId": "hauptversuch",
  "status": "created"
}
```

Bei `dryRun: true` ist der Status `dry_run`.

### Fehlerantworten

```json
{
  "code": "unauthorized",
  "error": "Unauthorized."
}
```

Typische Statuscodes:

- `400`: ungueltiger Messwert, ungueltiger Zeitstempel, ungueltige `deviceId`
  oder ungueltige `measurementId`
- `401`: fehlender oder falscher Token
- `409`: Dokument-ID existiert bereits mit anderen Messdaten
- `405`: falsche HTTP-Methode
- `500`: Messwert konnte nicht gespeichert werden

Stabile Fehlercodes:

- `invalid_value`
- `invalid_timestamp`
- `invalid_device_id`
- `invalid_measurement_id`
- `missing_measured_at`
- `unauthorized`
- `measurement_conflict`
- `method_not_allowed`
- `server_error`

### cURL-Beispiel

```bash
curl -X POST "https://mikrobielle-brennstoffzellen.web.app/api/experiment-measurement" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EXPERIMENT_IMPORT_TOKEN" \
  -d '{
    "valueMv": 742,
    "measuredAt": "2026-06-17T12:30:00.000Z",
    "deviceId": "hauptversuch",
    "measurementId": "hauptversuch-2026-06-17T12:30:00.000Z",
    "dryRun": true
  }'
```

### Testaufruf per npm

```bash
EXPERIMENT_IMPORT_TOKEN="<EXPERIMENT_IMPORT_TOKEN>" npm run test:api:experiment
```

Standardmaessig sendet das Skript `dryRun: true` an die Produktiv-URL und schreibt
nichts in Firestore. Fuer einen echten Schreibtest:

```bash
EXPERIMENT_IMPORT_TOKEN="<EXPERIMENT_IMPORT_TOKEN>" \
EXPERIMENT_TEST_DRY_RUN=false \
npm run test:api:experiment
```

Optionale Variablen:

- `EXPERIMENT_API_URL`
- `EXPERIMENT_TEST_VALUE_MV`
- `EXPERIMENT_TEST_DEVICE_ID`
- `EXPERIMENT_TEST_MEASURED_AT`

### Python-Beispiel

```python
from datetime import datetime, timezone

import requests

url = "https://mikrobielle-brennstoffzellen.web.app/api/experiment-measurement"
token = "<EXPERIMENT_IMPORT_TOKEN>"

payload = {
    "valueMv": 742,
    "deviceId": "hauptversuch",
}
payload["measuredAt"] = datetime.now(timezone.utc).isoformat()
payload["measurementId"] = f'{payload["deviceId"]}-{payload["measuredAt"]}'

response = requests.post(
    url,
    json=payload,
    headers={"Authorization": f"Bearer {token}"},
    timeout=10,
)
response.raise_for_status()
print(response.json())
```

## QR- und Code-Flow

- Generierte QR-Werte sind URL-basiert und zeigen auf `/user?register=<code>`.
- Die Basis-URL kommt aus `VITE_PUBLIC_APP_URL` (falls gesetzt), sonst aus
  `https://mikrobielle-brennstoffzellen.web.app`.
- Der QR-Parser akzeptiert ausschließlich die vollständige URL der aktiven App im Format
  `https://mikrobielle-brennstoffzellen.web.app/user?register=<code>`.
- Andere Domains, Pfade, Query-Parameter und reine Codes werden abgelehnt.
- Ein `generator`-Dokument entsteht:
  - bei Registrierung mit QR-Code
  - oder beim spaeteren Verknuepfen eines bisher unbekannten Codes durch einen eingeloggten User

## Datenmodell (Firestore)

### `users/{uid}`

```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "role": "user",
  "status": "active",
  "generatorId": "abc123",
  "createdAt": "timestamp",
  "archivedAt": "timestamp|null",
  "archivedBy": "uid|null"
}
```

### `generators/{id}`

```json
{
  "ownerUid": "uid",
  "ownerName": "Max Mustermann",
  "code": "00AF",
  "status": "active",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "archivedAt": "timestamp|null",
  "archivedBy": "uid|null"
}
```

### `measurements/{id}`

```json
{
  "generatorId": "abc123",
  "value": 1.42,
  "enteredBy": "admin@example.com",
  "createdAt": "timestamp"
}
```

### `experimentMeasurements/{id}`

```json
{
  "valueMv": 742,
  "deviceId": "hauptversuch",
  "source": "arduino",
  "measuredAt": "timestamp",
  "createdAt": "timestamp"
}
```

### `adminState/qr-export-counter`

```json
{
  "nextSequence": 123,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Auth und Rollen

- Login-Methoden:
  - E-Mail/Passwort
  - Google Popup
- Bei erstem Google-Login wird automatisch ein Userprofil in `users/{uid}` angelegt.
- Admin-Rechte werden ausschliesslich ueber `users/{uid}.role === "admin"` gesteuert.

## Firestore Security Rules

Die Regeln liegen in `firestore.rules`. Kerngedanken:

- `users`: lesen nur selbst oder Admin; Rolle/Status bei Self-Updates eingeschraenkt.
- `generators`: lesbar fuer alle; erstellen nur angemeldeter Owner; weitgehende Updates nur fuer Admin.
- `measurements`: lesbar fuer alle; schreiben/aendern nur Admin.
- `adminState`: lesen/schreiben nur Admin.

## Tech-Stack

- React 19
- Vite 8
- TypeScript
- MUI 7 + Emotion
- React Router 7
- Firebase Authentication + Firestore
- jsPDF + qrcode + jsQR
- Vitest + Testing Library
- ESLint + cspell

## Projektstruktur

```text
src/
  admin/          # Admin-UI, Tabs (scan/qr/moderation)
  app/            # App-Shell, Router, Theme, Entry
  common/         # gemeinsame Komponenten/Formatter/QR-Utilities
  data/           # Firebase-Zugriffe, Domain-Typen, Helper
  landing/        # Landingpage
  leaderboard/    # Leaderboard-Seite
  legal/          # Impressum / Datenschutz / Ueber uns
  user/           # Registrierung und User-Dashboard
public/
  app-logo.png
```

## Lokale Entwicklung

### Voraussetzungen

- Node.js 22
- npm

Mit nvm kann die passende Node-Version direkt aus `.nvmrc` geladen werden:

```bash
nvm install
nvm use
```

### Installation

```bash
npm install
npm install --prefix functions
```

### Starten

```bash
npm run dev
```

Unter Linux kann alternativ das ausführbare Startskript verwendet werden:

```bash
./scripts/dev.sh
```

Für den Zugriff von anderen Geräten im lokalen Netzwerk:

```bash
npm run dev:network
```

## Skripte

- `npm run dev` -> Vite Dev-Server
- `npm run dev:network` -> Vite Dev-Server im lokalen Netzwerk
- `npm run build` -> TypeScript Build + Vite Production Build
- `npm run deploy` -> Build und vollständiger Firebase-Deploy
- `npm run deploy:hosting` -> Build und Deploy nur des Hostings
- `npm run deploy:functions` -> Deploy nur der Cloud Functions
- `npm run seed:experiment` -> Beispielwerte fuer den Live-Versuch in Firestore schreiben
- `npm run test:api:experiment` -> Import-API mit `dryRun` testweise aufrufen
- `npm run preview` -> lokale Vorschau auf den Build
- `npm run lint` -> ESLint
- `npm run spellcheck` -> cspell
- `npm run test` -> Vitest (einmalig)
- `npm run test:watch` -> Vitest Watch-Modus

## Deployment (Firebase Hosting)

Hosting-Konfiguration (`firebase.json`):

- Deploy-Target `app`: `mikrobielle-brennstoffzellen-erleben`
- `public: "dist"`
- SPA-Rewrite aller Routen auf `/index.html`

Deploy:

```bash
npm run deploy
```

Alternativ steht unter Linux ein ausführbares Skript bereit:

```bash
./scripts/deploy.sh
./scripts/deploy.sh hosting
./scripts/deploy.sh functions
```

Die Firebase CLI wird lokal über die Projektabhängigkeiten ausgeführt. Eine globale
Installation ist nicht erforderlich. Vor dem ersten Deploy ist gegebenenfalls
`npx firebase login` nötig.

## Seed-Daten

Beispielwerte fuer den Live-Versuch koennen mit dem Seed-Skript geschrieben werden:

```bash
npm run seed:experiment
```

Das Skript schreibt deterministische Dokumente fuer `deviceId: "seed-hauptversuch"`
in `experimentMeasurements`. Fuer die echte Firestore-Instanz muss
`GOOGLE_APPLICATION_CREDENTIALS` auf eine Firebase-Service-Account-JSON-Datei zeigen.
Mit gesetztem `FIRESTORE_EMULATOR_HOST` schreibt das Skript stattdessen in den Emulator.

## QA-Checkliste

Vor dem Abschluss von Aenderungen:

```bash
npm run lint
npm run test
npm run build
```

Bei Routing-Aenderungen zusaetzlich manuell pruefen:

- `/user`
- `/user?register=<code>`
- `/admin`
- `/admin/scan/generator/:code`
