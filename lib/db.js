// Lightweight JSON-file data store for the ClosetShare prototype.
// Swap for a real database (Postgres/Supabase) before anything beyond demo use.
import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export function uid() {
  return crypto.randomBytes(8).toString("hex");
}

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function uploadsDir() {
  ensureDirs();
  return UPLOADS_DIR;
}

export function readDb() {
  ensureDirs();
  if (!fs.existsSync(DB_PATH)) {
    const db = seed();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return db;
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  return normalize(db);
}

// Backfill fields added after a db.json was first written.
function normalize(db) {
  db.interests ||= [];
  for (const o of db.outfits) {
    if (o.kind === undefined) o.kind = "outfit";
    if (o.colors === undefined) o.colors = [];
    if (o.size === undefined) o.size = "";
  }
  for (const u of db.users) {
    if (u.waiverAccepted === undefined) u.waiverAccepted = true;
    if (u.albumLinked === undefined) u.albumLinked = true;
    if (u.sizes === undefined) u.sizes = {};
  }
  return db;
}

export function writeDb(db) {
  ensureDirs();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ---------- helpers used by API routes ----------

export function findUser(db, id) {
  return db.users.find((u) => u.id === id) || null;
}

export function findUserByUsername(db, username) {
  return (
    db.users.find(
      (u) => u.username.toLowerCase() === String(username).toLowerCase()
    ) || null
  );
}

// A friendship row is mutual once accepted. requestedBy sent it.
export function friendshipBetween(db, a, b) {
  return (
    db.friendships.find(
      (f) =>
        (f.aId === a && f.bId === b) || (f.aId === b && f.bId === a)
    ) || null
  );
}

export function areFriends(db, a, b) {
  if (a === b) return true;
  const f = friendshipBetween(db, a, b);
  return !!f && f.status === "accepted";
}

export function friendIdsOf(db, userId) {
  return db.friendships
    .filter((f) => f.status === "accepted" && (f.aId === userId || f.bId === userId))
    .map((f) => (f.aId === userId ? f.bId : f.aId));
}

// Annotate an outfit with loan info friends can see: when it's expected back
// (from the active loan's return-by date) and how many friends are waiting.
export function withLoanInfo(db, outfit) {
  const active = db.requests.find(
    (r) => r.outfitId === outfit.id && r.status === "approved"
  );
  return {
    ...outfit,
    expectedBack: active?.returnBy || null,
    interestCount: db.interests.filter((i) => i.outfitId === outfit.id).length,
  };
}

export function publicUser(u) {
  if (!u) return null;
  const { id, username, name, avatarColor, avatarEmoji, bio, location, photo } = u;
  return { id, username, name, avatarColor, avatarEmoji, bio, location, photo: photo || null };
}

// ---------- seed data ----------

function outfitSvg({ from, to, emoji, label }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="750" fill="url(#g)"/>
  <circle cx="300" cy="330" r="170" fill="rgba(255,255,255,0.18)"/>
  <text x="300" y="395" font-size="190" text-anchor="middle">${emoji}</text>
  <text x="300" y="640" font-size="34" text-anchor="middle" fill="rgba(255,255,255,0.92)" font-family="Georgia, serif" font-style="italic">${label}</text>
</svg>`;
}

function writeSeedImage(name, svg) {
  ensureDirs();
  fs.writeFileSync(path.join(UPLOADS_DIR, name), svg);
}

function profileSvg({ from, to, emoji }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
  <circle cx="200" cy="200" r="130" fill="rgba(255,255,255,0.2)"/>
  <text x="200" y="265" font-size="170" text-anchor="middle">${emoji}</text>
</svg>`;
}

function seed() {
  const now = Date.now();
  const day = 86400000;

  const users = [
    {
      id: "u_sarah",
      username: "sarah",
      sizes: { dress: "4", top: "S", bottom: "S", shoeMin: "7", shoeMax: "7.5" },
      photo: "/api/images/seed_profile_sarah.svg",
      name: "Sarah Nguyen",
      avatarColor: "#c084fc",
      avatarEmoji: "🌸",
      bio: "Bridesmaid x6 and counting. Borrow away.",
      location: "Austin, TX",
      waiverAccepted: true,
      albumLinked: true,
      createdAt: now - 40 * day,
    },
    {
      id: "u_maya",
      username: "maya",
      sizes: { dress: "M", top: "M", bottom: "M", shoeMin: "8", shoeMax: "8.5" },
      photo: "/api/images/seed_profile_maya.svg",
      name: "Maya Patel",
      avatarColor: "#f472b6",
      avatarEmoji: "✨",
      bio: "If I wore it once, you can wear it next.",
      location: "Denver, CO",
      waiverAccepted: true,
      albumLinked: true,
      createdAt: now - 38 * day,
    },
    {
      id: "u_jess",
      username: "jess",
      sizes: { dress: "6", top: "S", bottom: "M", shoeMin: "7.5", shoeMax: "8" },
      photo: "/api/images/seed_profile_jess.svg",
      name: "Jess Rivera",
      avatarColor: "#60a5fa",
      avatarEmoji: "🪩",
      bio: "Wedding-guest wardrobe, fully stocked.",
      location: "Austin, TX",
      waiverAccepted: true,
      albumLinked: true,
      createdAt: now - 30 * day,
    },
    {
      id: "u_tom",
      username: "tom",
      sizes: { dress: "", top: "L", bottom: "32", shoeMin: "10", shoeMax: "10.5" },
      photo: "/api/images/seed_profile_tom.svg",
      name: "Tom Okafor",
      avatarColor: "#34d399",
      avatarEmoji: "🎷",
      bio: "Two tuxes, three suits, zero reasons to buy another.",
      location: "Chicago, IL",
      waiverAccepted: true,
      albumLinked: true,
      createdAt: now - 25 * day,
    },
  ];

  const seedOutfits = [
    {
      id: "o_1",
      ownerId: "u_sarah",
      file: "seed_sage_bridesmaid.svg",
      svg: { from: "#8aa88a", to: "#3e5641", emoji: "👗", label: "Sage bridesmaid, floor length" },
      title: "Sage bridesmaid dress",
      tags: ["bridesmaid", "wedding", "formal"],
      kind: "dress",
      size: "6",
      colors: ["green"],
      note: "Floor length, size 6, worn once at my sister's wedding. Travels well.",
      status: "available",
      createdAt: now - 9 * day,
    },
    {
      id: "o_2",
      ownerId: "u_sarah",
      file: "seed_black_tie.svg",
      svg: { from: "#312e42", to: "#0f0e17", emoji: "💃", label: "Black-tie gala gown" },
      title: "Black-tie gala gown",
      tags: ["black-tie", "formal", "gala"],
      kind: "dress",
      size: "S",
      colors: ["black"],
      title2: null,
      note: "Velvet, dramatic, photographs beautifully.",
      status: "available",
      createdAt: now - 6 * day,
    },
    {
      id: "o_3",
      ownerId: "u_maya",
      file: "seed_cocktail.svg",
      svg: { from: "#d4667f", to: "#7c2946", emoji: "🍸", label: "Cocktail wedding-guest" },
      title: "Cocktail wedding-guest dress",
      tags: ["wedding", "cocktail", "date night"],
      kind: "dress",
      size: "M",
      colors: ["pink"],
      note: "Wrap style, forgiving fit, size M.",
      status: "available",
      createdAt: now - 4 * day,
    },
    {
      id: "o_4",
      ownerId: "u_jess",
      file: "seed_rehearsal.svg",
      svg: { from: "#e9c46a", to: "#b0722c", emoji: "🌾", label: "Rehearsal-dinner set" },
      title: "Rehearsal dinner two-piece",
      tags: ["wedding", "rehearsal", "casual"],
      kind: "outfit",
      size: "M",
      colors: ["yellow", "brown"],
      note: "Linen set, great for outdoor venues.",
      status: "available",
      createdAt: now - 3 * day,
    },
    {
      id: "o_5",
      ownerId: "u_tom",
      file: "seed_tux.svg",
      svg: { from: "#3a506b", to: "#1c2541", emoji: "🤵", label: "Classic black tux, 40R" },
      title: "Classic black tuxedo",
      tags: ["black-tie", "formal", "wedding"],
      kind: "suit",
      size: "40R",
      colors: ["blue", "black"],
      note: "40R jacket, 32x32 trousers. Comes with the bow tie.",
      status: "available",
      createdAt: now - 2 * day,
    },
    {
      id: "o_6",
      ownerId: "u_maya",
      file: "seed_datenight.svg",
      svg: { from: "#9d4edd", to: "#3c096c", emoji: "🌙", label: "Date-night slip dress" },
      title: "Date night slip dress",
      tags: ["date night", "cocktail"],
      kind: "dress",
      size: "S",
      colors: ["purple"],
      note: "Silky, midnight purple.",
      status: "available",
      createdAt: now - 1 * day,
    },
  ];

  for (const o of seedOutfits) writeSeedImage(o.file, outfitSvg(o.svg));

  // Simulated "Lending album" photos not yet added to a closet — these power
  // the folder-sync prompt for whichever demo user you sign in as.
  const albumSeeds = [
    {
      id: "a_1",
      file: "seed_album_garden.svg",
      svg: { from: "#84a59d", to: "#52796f", emoji: "🌿", label: "From your Lending album" },
      suggestedTitle: "Garden party midi",
    },
    {
      id: "a_2",
      file: "seed_album_nye.svg",
      svg: { from: "#bc9ec1", to: "#4a3b57", emoji: "🥂", label: "From your Lending album" },
      suggestedTitle: "NYE sequin number",
    },
  ];
  for (const a of albumSeeds) writeSeedImage(a.file, outfitSvg(a.svg));

  writeSeedImage("seed_profile_sarah.svg", profileSvg({ from: "#c084fc", to: "#7c3aed", emoji: "💁‍♀️" }));
  writeSeedImage("seed_profile_maya.svg", profileSvg({ from: "#f472b6", to: "#be185d", emoji: "🙋‍♀️" }));
  writeSeedImage("seed_profile_jess.svg", profileSvg({ from: "#60a5fa", to: "#1d4ed8", emoji: "🤳" }));
  writeSeedImage("seed_profile_tom.svg", profileSvg({ from: "#34d399", to: "#047857", emoji: "🕺" }));

  return {
    users,
    friendships: [
      { id: "f_1", aId: "u_sarah", bId: "u_maya", requestedBy: "u_sarah", status: "accepted", createdAt: now - 30 * day },
      { id: "f_2", aId: "u_sarah", bId: "u_jess", requestedBy: "u_jess", status: "accepted", createdAt: now - 28 * day },
      { id: "f_3", aId: "u_maya", bId: "u_tom", requestedBy: "u_tom", status: "accepted", createdAt: now - 20 * day },
      { id: "f_4", aId: "u_jess", bId: "u_maya", requestedBy: "u_jess", status: "accepted", createdAt: now - 15 * day },
    ],
    outfits: seedOutfits.map(({ svg, file, title2, ...o }) => ({
      ...o,
      image: `/api/images/${file}`,
    })),
    requests: [
      {
        id: "r_1",
        outfitId: "o_3",
        requesterId: "u_jess",
        ownerId: "u_maya",
        status: "pending",
        note: "Beach wedding on the 26th — could I grab this?",
        ownerNote: null,
        handoff: null,
        shipping: null,
        waiverAccepted: true,
        createdAt: now - 0.5 * day,
      },
    ],
    interests: [],
    // per-user simulated photo album; keyed lazily as users sign in
    albumPhotos: albumSeeds.map((a) => ({
      id: a.id,
      image: `/api/images/${a.file}`,
      suggestedTitle: a.suggestedTitle,
      addedBy: [], // user ids who already imported or dismissed it
    })),
  };
}
