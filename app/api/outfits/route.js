import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import {
  readDb,
  writeDb,
  publicUser,
  findUser,
  areFriends,
  friendIdsOf,
  withLoanInfo,
  uploadsDir,
  uid,
} from "@/lib/db";
import { currentUser } from "@/lib/auth";

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const EXT_FOR = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

// GET /api/outfits?ownerId=X   -> a friend's closet (or your own)
// GET /api/outfits?tag=X       -> tag search across your friends' closets
export async function GET(req) {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId");
  const tag = url.searchParams.get("tag");

  if (ownerId) {
    const owner = findUser(db, ownerId);
    if (!owner) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (!areFriends(db, me.id, ownerId)) {
      return NextResponse.json(
        { error: "You need to follow each other to see this closet.", locked: true, owner: publicUser(owner) },
        { status: 403 }
      );
    }
    const outfits = db.outfits
      .filter((o) => o.ownerId === ownerId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((o) => withLoanInfo(db, o));
    return NextResponse.json({ owner: publicUser(owner), outfits });
  }

  const visible = new Set([me.id, ...friendIdsOf(db, me.id)]);
  let outfits = db.outfits.filter((o) => visible.has(o.ownerId));
  if (tag) {
    const t = tag.toLowerCase();
    outfits = outfits.filter((o) =>
      o.tags.some((x) => x.toLowerCase().includes(t))
    );
  }
  outfits = outfits
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((o) => ({ ...withLoanInfo(db, o), owner: publicUser(findUser(db, o.ownerId)) }));
  return NextResponse.json({ outfits });
}

// POST: create an outfit post. Accepts either a data-URL upload or a
// reference to an image already in the simulated Lending album.
export async function POST(req) {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { title, tags, note, imageDataUrl, existingImage } = await req.json();
  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Give the outfit a name." }, { status: 400 });
  }
  const cleanTags = (Array.isArray(tags) ? tags : [])
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
  if (cleanTags.length === 0) {
    return NextResponse.json({ error: "Add at least one tag so friends can find it." }, { status: 400 });
  }

  let image = null;
  if (existingImage && String(existingImage).startsWith("/api/images/")) {
    image = existingImage;
  } else if (imageDataUrl) {
    const m = /^data:(image\/(?:png|jpeg|webp|gif|svg\+xml));base64,(.+)$/.exec(imageDataUrl);
    if (!m) return NextResponse.json({ error: "Unsupported image format." }, { status: 400 });
    const buf = Buffer.from(m[2], "base64");
    if (buf.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large (6 MB max)." }, { status: 400 });
    }
    const name = uid() + EXT_FOR[m[1]];
    fs.writeFileSync(path.join(uploadsDir(), name), buf);
    image = `/api/images/${name}`;
  } else {
    return NextResponse.json({ error: "A photo is required." }, { status: 400 });
  }

  const outfit = {
    id: "o_" + uid(),
    ownerId: me.id,
    image,
    title: title.trim(),
    tags: cleanTags,
    note: (note || "").trim(),
    status: "available",
    createdAt: Date.now(),
  };
  db.outfits.push(outfit);
  writeDb(db);
  return NextResponse.json({ outfit });
}
