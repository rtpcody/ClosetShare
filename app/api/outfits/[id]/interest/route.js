import { NextResponse } from "next/server";
import { readDb, writeDb, areFriends, uid } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Toggle "I'm interested" on an item that isn't currently available.
// The owner sees who's waiting; interested friends get first dibs when
// it's back (notifications come with the production build).
export async function POST(_req, { params }) {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const outfit = db.outfits.find((o) => o.id === id);
  if (!outfit) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (outfit.ownerId === me.id) {
    return NextResponse.json({ error: "That's your own outfit." }, { status: 400 });
  }
  if (!areFriends(db, me.id, outfit.ownerId)) {
    return NextResponse.json({ error: "You need to follow each other first." }, { status: 403 });
  }

  const existing = db.interests.find((i) => i.outfitId === id && i.userId === me.id);
  if (existing) {
    db.interests = db.interests.filter((i) => i !== existing);
  } else {
    db.interests.push({ id: "i_" + uid(), outfitId: id, userId: me.id, createdAt: Date.now() });
  }
  writeDb(db);
  return NextResponse.json({ interested: !existing });
}
