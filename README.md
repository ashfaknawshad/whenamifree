# WAIF - Smart Schedule Lite

WAIF is a mobile-first, offline-first PWA for tracking busy blocks, computing free time from 6:00 AM to 9:00 PM, and exporting availability for students or private tutoring.

## Features

- Weekly and daily view toggle
- Busy slot creation with optional labels
- Recurrence support for one-time, daily, weekly, and custom day patterns
- Local-only persistence with `localStorage`
- Free-time calculation and export to text or SVG
- Installable PWA with offline support
- Dark mode toggle

## File Structure

```text
public/
  icon.svg
  manifest.webmanifest
  sw.js
src/
  components/
  hooks/
  lib/
  App.tsx
  main.tsx
  styles.css
  types.ts
index.html
tailwind.config.ts
postcss.config.cjs
vite.config.ts
```

## Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
```

## Deploy to Vercel

1. Push the project to a Git repository.
2. Import the repo into Vercel.
3. Use these build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy.

The app does not require any environment variables, backend services, or database setup.