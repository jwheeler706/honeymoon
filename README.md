# Rarotonga Honeymoon Itinerary

A relaxed, mobile-forward itinerary app for the October 9-17, 2026 Rarotonga honeymoon.

The app renders the trip from `app/data/itinerary.json`, keeps day-by-day plans easy to scan, separates each day into morning / afternoon / evening, and includes reservations, flexible recommendations, notes, save/done state, and an interactive island map.

## Run Locally

```bash
npm install
npm run dev
```

## Check The Build

```bash
npm run build
```

## Update The Itinerary

Edit `app/data/itinerary.json`. The app is intentionally structured so trip details can be updated there without digging through the UI code.

Useful fields:

- `days`: the primary morning / afternoon / evening itinerary surface
- `reservations`: the quick reservation summary
- `trip.hikeOptions`: flexible hiking notes
- `trip.transportPlan`: arrival, driver, and rental-car guidance

The map currently uses curated itinerary locations in `app/page.tsx`. When exact booking details are finalized, those pins can be updated with precise places, dates, and notes.

## GitLab Pages

GitLab Pages is a good deployment route for this project if you want the app tied to a repo you control and updated through normal commits. This app does not require a server for the MVP experience, so it is a natural fit for a static-style deployment.

Before publishing to GitLab Pages, confirm the final build output path for the chosen build adapter. If you want, the next deployment pass can convert this to a plain Vite static app or add a Pages-specific pipeline once the target GitLab repo is created.

## Later Photo Attachments

Photo attachments are intentionally out of the MVP. The current app keeps activity-level notes and saved state local; a later version can add uploads with durable storage and attach photos to specific day events.
