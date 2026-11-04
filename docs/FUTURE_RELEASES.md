# Future releases (reference)

Release 1 ships only home cleaning, garden care and no-licence handyman jobs ([RELEASE_1.md](RELEASE_1.md)). Everything below is **built and kept in the codebase** as reference. Public routes are redirected to `/coming-soon` by `proxy.ts` using `FUTURE_ROUTES` in `lib/release.ts`. To bring one back, remove its prefix from `FUTURE_ROUTES` and re-check it against the Release 1 quality and trust rules.

| Area | Routes / code | Notes for a later release |
| --- | --- | --- |
| More service categories | `personalCare`, `companion`, `transport`, `itSupport`, `mealDelivery`, music/art/digital-literacy classes (`lib/db/schema/enums.ts`) | Personal care and transport need certificates/licences — re-enable `/provider/licenses` and certificate checks first |
| Licensed trades | Electrical, plumbing, gas, tree felling, gutter/roof work | Need licence verification (VIC: ESV, VBA; BC: Technical Safety BC) |
| Government funding | NDIS, DVA, TAC, WorkSafe, My Aged Care, HCP (`/profile/funding`, `govt-funding-access`) | Allow-listed only today |
| Faith & care programmes | `/christian`, `/devotional`, `/book-faith`, provider faith/prayer pages | Opt-in ministry features |
| 和润心语者 emotional care | `/xinyuzhe/*` | Planned for the China platform |
| Digital autobiography | `/biography` | |
| Day-care centres | `/register/day-care-centre`, `/register/certification` | Facility onboarding |
| Family accounts | `/family/*` | Children booking for parents (high value for Chinese families; good next candidate) |
| Recurring bookings | `/bookings/recurring` | Should reuse the Release 1 price model and approved quotes |
| Rewards & referrals | `/profile/coins`, `/profile/referrals`, `/customer/membership` | |
| Marketplace / misc | `/products`, `/donate`, `/nearby`, `/country-services` | |
| Provider extras | `/provider/guaranteed-wage`, `leaderboard`, `achievements`, `goals`, `team-chat`, `smart-pricing`, `seniors`, `training` | Guaranteed wage is gated on ABN trial performance |
| Other countries | CN (九鼎银联, separate mainland stack: `docs/CHINA_DEPLOYMENT.md`), US, TW, SG, HK, MY, NZ | Country switcher offers AU + CA only |
| Legacy booking flows | `/book`, `/book-service`, `POST /api/bookings/charged` | Superseded by `/bookings/new` → `/pay/[id]` |
