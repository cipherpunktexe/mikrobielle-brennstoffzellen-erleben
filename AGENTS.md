# AGENTS.md

## Ziel
- Dieses Repository ist die Web-App "Mikrobielle Brennstoffzellen erlernen".
- Fokus: stabile, mobile-taugliche UI 

## Tech-Stack
- Frontend: React 19, Vite 8, TypeScript 5, MUI 7.
- Daten/Auth: Firebase Auth + Firestore.
- Backend: Firebase Cloud Functions (`functions/`, Node 20).
- Hosting: Firebase Hosting (SPA, `dist` als Public-Verzeichnis).

## Projektstruktur (aktuell)
- `src/app/`: App-Shell, Router, Theme, globale Styles.
- `src/landing/`: Startseite.
- `src/user/`: Registrierung und User-Dashboard.
- `src/admin/`: Admin-Bereiche (`createQr`, `scan`, `moderate`).
- `src/leaderboard/`: Leaderboard-UI und Dialoge.
- `src/common/`: gemeinsame Komponenten/Utilities (z. B. `UnifiedList`, Charts, Suchfeld, QR-Scanner).
- `src/data/`: Firebase-Zugriff, Domain-Modelle, Firestore-Operationen.
- `src/legal/`: Impressum, Datenschutz, Über-uns.
- `functions/`: Cloud Functions (u. a. API für eingebettetes Leaderboard).

## Routen
- `/` Landing
- `/register/:code` Nutzer-Registrierung per Generator-Code
- `/user` Nutzer-Dashboard
- `/admin`, `/admin/:tab`, `/admin/:tab/generator/:code` Admin
- `/leaderboard` Leaderboard
- `/ueber-uns`, `/impressum`, `/datenschutz` statische Seiten


## Sprache und Texte
- UI-Texte auf Deutsch.
- **Keine Transliterationen** in sichtbaren Texten: `ä`, `ö`, `ü`, `ß` direkt verwenden.
- Schreibweisen wie `ae`, `oe`, `ue` nur bei technischen Constraints (Identifier, Slugs, externe Schnittstellen ohne Unicode).

## Accessibility
- Interaktive Elemente müssen per Tastatur erreichbar sein.
- Verwende semantische Controls wie `Button`, `IconButton`, `TextField` und andere MUI-Komponenten statt klickbarer `div`-Container.
- Jeder interaktive Trigger braucht einen zugänglichen Namen.
- Tabellen, Formulare und Statusmeldungen müssen mit sinnvollen Labels und sichtbarer Struktur aufgebaut sein.

## Qualitätssicherung
- Vor Abschluss immer:
  - `npx tsc -b --noEmit`
  - `npm run spellcheck`
  - `npm run build`


## Git-Workflow
- Kleine, logisch getrennte Commits.
- Nach jeder Änderung ein Commit erstellen und Commit-Nachricht angeben.
- Commit-Message im Imperativ und mit klarem Scope (z. B. `fix(leaderboard): avoid clipped value column on mobile`).
- Wenn der Auftrag explizit `build deploy push` enthält:
  1. Build/Lint ausführen,
  2. Commit erstellen,
  3. Deploy ausführen,
  4. nach Remote pushen,
  5. Commit-Hash und Message dokumentieren.
- Keine fremden, nicht angefragten Änderungen zurücksetzen.
