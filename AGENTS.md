# AGENTS.md

## Project overview
- React 19 + Vite single-page app with TypeScript and ESM.
- UI built with MUI v7 and Emotion.
- Firebase Auth + Cloud Firestore power user registration, admin login, generator linking, measurements, and leaderboard updates.
- QR codes route users into either registration or the admin measurement flow. QR codes themselves are not stored in Firestore.

## Repository layout
- `src/main.tsx` bootstraps MUI theme, global CSS, routing, and Firebase analytics startup.
- `src/router.tsx` defines the app routes for landing page, user flow, and admin flow.
- `src/theme.ts` contains the MUI color system and component overrides.
- `src/firebase.ts` configures Firebase app, Auth, Firestore, and Analytics support detection.
- `src/pages/` contains route-level screens:
  - `LandingPage.tsx`
  - `UserRegistrationPage.tsx`
  - `UserDashboardPage.tsx`
  - `AdminPage.tsx`
- `src/components/` holds reusable UI building blocks.
- `src/services/firebaseData.ts` contains Firebase Auth and Firestore reads/writes/listeners.
- `src/lib/` contains formatting and QR export helpers.
- `src/types/domain.ts` contains shared domain types for users, generators, measurements, and leaderboard entries.
- `public/` contains static assets served by Vite/Firebase Hosting.

## Local dev
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Deploy
- Firebase Hosting is configured in `firebase.json` as a SPA rewrite to `/index.html`.
- Prefer `cmd /c "firebase deploy --only hosting"` because PowerShell may block `firebase.ps1`.
- If Hosting config changes, verify `firebase.json` rewrites still point all routes to `index.html`.

## Coding conventions
- Use TypeScript and TSX by default.
- Prefer MUI components and `sx` styling over ad-hoc CSS.
- Keep route screens in `src/pages/` and shared UI in `src/components/`.
- Keep all user-facing copy in German.
- Reuse helpers in `src/lib/` and `src/services/` instead of duplicating formatting, QR, or Firebase logic.
- Normalize scanned or entered station codes with `formatCode()` before persisting or querying.
- Prefer small focused components over growing page files further.

## Accessibility
- Interaktive Elemente müssen per Tastatur erreichbar sein.
- Verwende semantische Controls wie `Button`, `IconButton`, `TextField` und andere MUI-Komponenten statt klickbarer `div`-Container.
- Jeder interaktive Trigger braucht einen zugänglichen Namen.
- Tabellen, Formulare und Statusmeldungen müssen mit sinnvollen Labels und sichtbarer Struktur aufgebaut sein.

## Firebase patterns
- Use Firebase Authentication for login and registration flows.
- Firestore collections are `users`, `generators`, and `measurements`.
- Use `serverTimestamp()` for `createdAt` and `updatedAt`.
- Keep realtime listeners cleaned up in `useEffect` return functions.
- Store generator ownership and links through Firestore document IDs, not embedded QR metadata.
- Admin authorization is driven by `users/{uid}.role === "admin"`.

## QR flow rules
- User QR routes should use `/register/:code`.
- Admin scan links should use `/admin/scan/generator/:code`.
- A generator can be created during user registration or when a logged-in user links a previously unknown code.
- Admin QR exports generate card URLs on demand; QR definitions are not persisted in Firestore (only the export counter state is stored).

## Testing
- Before finishing work, run:
  - `npm run lint`
  - `npm run build`
- If a change affects routing, also verify the direct routes `/register/:code`, `/user`, `/admin`, and `/admin/scan/generator/:code`.
- If a change affects Firebase data flow, verify that user registration, generator creation, measurement entry, and leaderboard updates still match the Firestore schema.

## Git workflow
- Keep commits focused and aligned with one logical change.
- Nach jeder Änderung ein Commit erstellen und Commit-Nachricht angeben.

## Language rule
- In user-facing German text, do not transliterate umlauts (`ae`, `oe`, `ue`). Use proper characters (`ä`, `ö`, `ü`, `ß`).
- Exception: transliteration is allowed only when technically required (for example in URLs, slugs, identifiers, or external interface constraints).
