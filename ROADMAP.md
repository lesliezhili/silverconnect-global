# Roadmap

A directional view, not a commitment. Priorities shift with user feedback and operational signal.

## Now (Q2 2026)

- Stabilize MVP across AU, CN, CA.
- Wire centralized error monitoring (Sentry).
- Rate limits on `/api/ai/*` and auth endpoints.
- Provider verification automation (police check API).
- A11y audit + WCAG 2.1 AA fixes.

## Next (Q3 2026)

- Native mobile (React Native) — customer first, then provider.
- Push & SMS notifications (booking reminders, status changes).
- Provider availability heatmap and intelligent slot suggestions.
- French (CA-Quebec) localization.
- Real-time provider ETA on day-of-service.

## Later (Q4 2026 +)

- Video consultation booking (telehealth-adjacent flows).
- Insurance / NDIS direct billing integration.
- Additional countries (USA, NZ, UK).
- AI service recommendations (personalized cross-sell).
- Family-account model (caregiver books on behalf of senior).
- Webhooks for partner integrations.

## Tech debt / hygiene (continuous)

- Consolidate duplicate root docs into `docs/`.
- Replace remaining ad-hoc SQL with parameterized helpers in `lib/`.
- Index review against production query plans (see [DATABASE.md](docs/DATABASE.md)).
- Migrate logs to structured JSON; ship to a single store.
- Add Renovate / Dependabot.

## How we decide

We weight: customer safety > regulatory compliance > revenue impact > developer velocity.
Cross-country features must work in all 3 markets or be cleanly gated by country.
