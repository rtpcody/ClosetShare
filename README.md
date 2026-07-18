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

0. **Onboarding** — create account (SSO placeholders for Google/Facebook) → sign the
   Borrower & Lender Agreement once → set up the designated "Lending" album (simulated;
   includes the Google Photos outfit-search tip) → optionally set **your sizes** (dress,
   top, bottoms, and a shoe range like 7.5–8). Sizes power an "only show my sizes" filter
   in closets and search; skip it and you just browse everything. Editable later from
   Edit profile.
1. **Accounts + mutual follow** — follow requests must be accepted; only mutual friends can
   see each other's closets, feeds, and send borrow requests.
2. **Outfit posts with structured tags** — photo upload (or pick from the simulated
   "Lending album"), name, **clothing type** (dress, suit/tux, shoes, …), **event style**
   tags (wedding, bridesmaid, black-tie, …), borrower notes, and **auto-detected colors**
   compiled from the photo's pixels at upload time (adjustable before posting). Folder sync
   is simulated: the feed shows a "N new photos in your Lending album" prompt on open.
3. **Feed** — Strava-style activity feed of friends' new outfit posts, with status badges.
4. **Closet view** — tapping into a profile plays the signature **two-door closet opening
   animation** (CSS 3D), then reveals a profile: large centered photo, name/username,
   a contained stats bar (outfits / friends / loans), a self-description, and two tabs —
   a quick-scroll 3-column square grid, and a **Filter tab** with dropdowns (type, color,
   size, event, need-by date, "only my sizes") compiled from what's actually in that
   closet. Users edit their profile (photo, bio, city, sizes) from their own closet, and
   every item has a **description area** ("wore this to a summer wedding, fits a little
   large…") the owner can add or edit any time — including on items that arrived via the
   album sync with no details yet.
5. **Borrow flow** — one-tap request (waiver already signed at onboarding) → owner
   approves/declines (with optional note) → **Reserved** → borrower picks handoff and a
   **return-by date**: local meetup (same-city hint from profile locations) or **mocked
   white-labeled prepaid round-trip shipping label** (~$9) → **On loan** → owner marks
   returned → **Available**. Once real carrier integration lands, tracking scans will
   drive status automatically (picked up → on loan, return drop-off → in transit back).
6. **Unavailable items stay browsable** — reserved/on-loan items are faded in the feed,
   closets, and search, but open in full color; friends can register **interest** and the
   owner sees who's waiting. Owners can also manually toggle Available ↔ Reserved from
   the item's settings.
7. **Date-aware browsing** — a "I need it for a date…" filter in closets shows what's free
   (or expected back) in time, using loan return-by dates.
8. **Faceted search** across friends' closets: event style + clothing type + color combine
   ("a green dress for a wedding").
9. **Calendar, minimally** — no calendar reading: the app offers an "Add return date to my
   calendar" (.ics) download and shows a return reminder banner in the feed.

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
