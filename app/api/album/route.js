import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Simulates the designated "Lending album" folder sync that a native app
// would do via PhotoKit (iOS) / MediaStore (Android) on app open.
export async function GET() {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const photos = db.albumPhotos
    .filter((p) => !p.addedBy.includes(me.id))
    .map(({ addedBy, ...p }) => p);
  return NextResponse.json({ photos });
}

// Mark a simulated album photo as handled (imported to closet or dismissed).
export async function POST(req) {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { photoId } = await req.json();
  const photo = db.albumPhotos.find((p) => p.id === photoId);
  if (!photo) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!photo.addedBy.includes(me.id)) photo.addedBy.push(me.id);
  writeDb(db);
  return NextResponse.json({ ok: true });
}
