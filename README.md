# Mikrobielle Brennstoffzellen erleben

Web-App für ein Projekt rund um mikrobielle Brennstoffzellen. Die Anwendung kombiniert eine informative Landingpage mit einem User- und Admin-Bereich, QR-gesteuerten Abläufen sowie Firebase für Authentifizierung, Datenspeicherung und Bereitstellung.

## Überblick

Die App besteht aus drei Bereichen:

- `Landingpage`
  - allgemeine Projektinformationen
  - eingebettete Canva-Präsentation
  - Footer mit Impressum und Datenschutz
- `User`
  - Registrierung über QR-Link
  - Login per E-Mail/Passwort oder Google
  - automatisches Anlegen und Verknüpfen eines Generators bei der Registrierung
  - Anzeige von aktuellem Messwert, Verlauf und Leaderboard
- `Admin`
  - Login per E-Mail/Passwort oder Google
  - druckfertiger Export von QR-Karten
  - Aufruf eines Generators über QR-Link oder Stationscode
  - Eintragen neuer Messwerte

## Tech-Stack

- React 19
- Vite 8
- TypeScript
- MUI 7 + Emotion
- React Router
- Firebase Authentication
- Cloud Firestore
- Firebase Analytics
- Firebase Hosting
- `qrcode` für QR-Code-Erzeugung

## Routing

Die wichtigsten Routen:

- `/`
  - Landingpage
- `/register/:code`
  - Registrierung für einen QR-/Stationscode
- `/user`
  - Nutzerbereich
- `/admin`
  - Admin-Bereich
- `/admin/generator/:code`
  - Admin-Maske für einen konkreten Generatorcode
- `/impressum`
  - Impressum
- `/datenschutz`
  - Datenschutz

## QR-Konzept

Die QR-Codes werden nicht in Firestore gespeichert. Stattdessen enthalten sie direkt die Ziel-URL.

- User-QR:
  - `/register/:code`
- Admin-QR:
  - `/admin/generator/:code`

Logik:

1. Ein Admin erzeugt QR-Codes als URL-basierte Karten.
2. Ein Nutzer scannt einen User-QR-Code.
3. Erst bei der Registrierung wird ein neuer Generator in Firestore angelegt.
4. Der Generator wird automatisch mit dem neuen Nutzerkonto verknüpft.
5. Ein Admin scannt denselben bzw. passenden Code und trägt Messwerte ein.
6. Das Leaderboard aktualisiert sich aus den gespeicherten Messwerten.

## Datenmodell

Verwendete Firestore-Collections:

### `users`

```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "role": "user",
  "generatorId": "gen_abc123",
  "createdAt": "timestamp"
}
```

### `generators`

```json
{
  "ownerUid": "user_123",
  "code": "station-017",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### `measurements`

```json
{
  "generatorId": "gen_abc123",
  "value": 1.42,
  "enteredBy": "admin_001",
  "createdAt": "timestamp"
}
```

## Authentifizierung

Die App unterstützt:

- E-Mail/Passwort-Login
- Google-Login per Popup

Wichtig:

- Neue Google-Logins bekommen automatisch ein minimales Firestore-Profil in `users/{uid}`.
- Der Admin-Bereich ist nicht allein an den Login gekoppelt.
- Ein Konto ist nur Admin, wenn in Firestore `users/{uid}.role === "admin"` gesetzt ist.

## Projektstruktur

```text
src/
  assets/
  components/
  lib/
  pages/
  services/
  types/
  App.tsx
  firebase.ts
  main.tsx
  router.tsx
  theme.ts
```

Wichtige Dateien:

- `src/main.tsx`
  - Einstiegspunkt, ThemeProvider, CssBaseline, Analytics-Start
- `src/router.tsx`
  - Routing und lazy geladene Seiten
- `src/theme.ts`
  - MUI-Farbschema und globale Komponenten-Anpassungen
- `src/firebase.ts`
  - Firebase-Konfiguration für App, Auth, Firestore und Analytics
- `src/services/firebaseData.ts`
  - Login, Registrierung, Firestore-Zugriffe und Listener
- `src/pages/LandingPage.tsx`
  - Landingpage mit Platzhaltertext und Canva-Einbettung

## Lokale Entwicklung

Installation:

```bash
npm install
```

Entwicklungsserver:

```bash
npm run dev
```

Produktions-Build:

```bash
npm run build
```

Vorschau des Builds:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

## Firebase-Konfiguration

Die App verwendet bereits eine feste Firebase-Konfiguration in `src/firebase.ts`.

Aktuell eingebundene Firebase-Dienste:

- Authentication
- Firestore
- Analytics

Standardprojekt laut `.firebaserc`:

- `mikrobielle-brennstoffzellen`

## Deployment

Firebase Hosting ist in `firebase.json` als SPA mit Rewrite auf `index.html` vorbereitet und zeigt auf den Vite-Buildordner `dist`.

Aktuelle Konfiguration:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Deployment aus PowerShell kann an `firebase.ps1` scheitern. In dem Fall:

```bash
cmd /c "firebase deploy --only hosting"
```

## Rechtliches

Es gibt bereits Seiten für:

- `Impressum`
- `Datenschutz`

Die Texte sind aktuell Vorlagen und müssen vor Veröffentlichung inhaltlich und rechtlich vervollständigt werden.

## Hinweise zum aktuellen Stand

- Die Landingpage verwendet bewusst Platzhaltertext.
- Die Canva-Präsentation ist eingebettet.
- Das Header-Logo ist aktuell ein SVG-Platzhalter auf Basis einer Referenzgrafik.
- Der User-Flow für Google-Login legt kein Generator-Objekt an. Ein Generator wird weiterhin nur über die Registrierung via `/register/:code` erstellt.

## Qualitätssicherung

Vor Abschluss von Änderungen mindestens ausführen:

```bash
npm run lint
npm run build
```
