import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Accept or decline a follow request you received.
export async function PATCH(req, { params }) {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();
  const f = db.friendships.find((x) => x.id === id);
  if (!f) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const involvesMe = f.aId === me.id || f.bId === me.id;
  if (!involvesMe || f.requestedBy === me.id || f.status !== "pending") {
    return NextResponse.json({ error: "You can't act on this request." }, { status: 403 });
  }
  if (action === "accept") {
    f.status = "accepted";
  } else if (action === "decline") {
    db.friendships = db.friendships.filter((x) => x.id !== id);
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  writeDb(db);
  return NextResponse.json({ ok: true });
}
