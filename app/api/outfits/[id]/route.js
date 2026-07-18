import { NextResponse } from "next/server";
import { readDb, publicUser, findUser, areFriends } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET(_req, { params }) {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const outfit = db.outfits.find((o) => o.id === id);
  if (!outfit) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!areFriends(db, me.id, outfit.ownerId)) {
    return NextResponse.json({ error: "Not visible to you." }, { status: 403 });
  }
  const myRequest =
    db.requests.find(
      (r) =>
        r.outfitId === id &&
        r.requesterId === me.id &&
        ["pending", "approved"].includes(r.status)
    ) || null;
  return NextResponse.json({
    outfit: { ...outfit, owner: publicUser(findUser(db, outfit.ownerId)) },
    myRequest,
  });
}
