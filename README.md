# ClosetShare 🚪

**"Strava for clothing."** Friends follow each other's closets, see a feed of outfits, and
borrow items directly from friends — with white-labeled shipping when they're not local.
Launch wedge: wedding and special-event wear.

This repo is the **v1 prototype**: a mobile-first web app that demos the entire core loop
end-to-end with a mocked backend. The production app targets native iOS/Android (PhotoKit /
MediaStore album sync, EventKit calendar nudges), but every product flow is real here.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it seeds four demo users (Sarah, Maya, Jess, Tom) with
outfits, friendships, and a pending borrow request. Sign in as any of them with one tap,
or create your own account.

## What's implemented (maps to the spec's prototype slice)

1. **Accounts + mutual follow** — follow requests must be accepted; only mutual friends can
   see each other's closets, feeds, and send borrow requests.
2. **Outfit posts with tags** — photo upload (or pick from the simulated "Lending album"),
   name, tags (wedding, bridesmaid, black-tie, …), borrower notes. Folder sync is simulated:
   the feed shows a "N new photos in your Lending album" prompt on open.
3. **Feed** — Strava-style activity feed of friends' new outfit posts, with status badges.
4. **Closet view** — tapping into a profile plays the signature **two-door closet opening
   animation** (CSS 3D), then reveals the outfit grid on a wooden rail.
5. **Borrow flow** — request (with liability-waiver checkbox and optional note) → owner
   approves/declines (with optional note) → **Reserved** → borrower picks handoff:
   local meetup (same-city hint from profile locations) or **mocked white-labeled prepaid
   round-trip shipping label** (~$9) → **On loan** → owner marks returned → **Available**.
6. **Tag search** across friends' closets ("I need something for a wedding").
7. **Engagement mocks** — calendar pre-event nudge card ("Emma's wedding is in 12 days"),
   clearly labeled as the opt-in mock.

## Architecture

- **Next.js (App Router)**, plain JS, no CSS framework — all styling in `app/globals.css`.
- **Data**: JSON-file store at `data/db.json` (gitignored; auto-seeded on first run) via
  `lib/db.js`. Uploaded photos land in `data/uploads/`, served by `/api/images/[name]`.
  Swap for Postgres/Supabase + object storage before real use.
- **Auth**: cookie session, no passwords (prototype only).
- **API routes** under `app/api/`: auth, users/friends, feed, outfits, album (folder-sync
  simulation), requests (the borrow state machine lives in `app/api/requests/[id]/route.js`).

To reset demo data: delete `data/db.json` and restart.

## Deliberately out of scope (per spec)

Garment-level cataloging, availability windows, ratings/reviews, insurance (waiver only),
rental fees, resale, full camera-roll scanning, real carrier integration, real auth,
push notifications.
