# Mikrobielle Brennstoffzellen erlernen


## Aktueller Stand

- SPA mit React 19, Vite 8, TypeScript und MUI 7.
- Authentifizierung über Firebase Authentication (E-Mail/Passwort und Google).
- Datenhaltung in Cloud Firestore (`users`, `generators`, `measurements`, `adminState`).

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
