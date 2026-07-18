import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { readDb, writeDb, publicUser, uploadsDir, uid } from "@/lib/db";
import { currentUser } from "@/lib/auth";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const EXT_FOR = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

// Edit your own profile: photo, bio, location.
export async function PATCH(req) {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { bio, location, photoDataUrl } = await req.json();
  if (bio !== undefined) me.bio = String(bio).trim().slice(0, 160);
  if (location !== undefined) me.location = String(location).trim().slice(0, 60);
  if (photoDataUrl) {
    const m = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(photoDataUrl);
    if (!m) return NextResponse.json({ error: "Unsupported photo format." }, { status: 400 });
    const buf = Buffer.from(m[2], "base64");
    if (buf.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Photo too large (4 MB max)." }, { status: 400 });
    }
    const name = "pf_" + uid() + EXT_FOR[m[1]];
    fs.writeFileSync(path.join(uploadsDir(), name), buf);
    me.photo = `/api/images/${name}`;
  }
  writeDb(db);
  return NextResponse.json({ user: publicUser(me) });
}
