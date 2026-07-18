import { NextResponse } from "next/server";
import { readDb, writeDb, findUser, friendshipBetween, uid } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Send a follow (friend) request. Mutual-follow model: once accepted,
// both users see each other's closets and feeds.
export async function POST(req) {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { userId } = await req.json();
  const other = findUser(db, userId);
  if (!other || other.id === me.id) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }
  const existing = friendshipBetween(db, me.id, other.id);
  if (existing) {
    return NextResponse.json({ error: "Request already exists.", friendship: existing }, { status: 409 });
  }
  const friendship = {
    id: "f_" + uid(),
    aId: me.id,
    bId: other.id,
    requestedBy: me.id,
    status: "pending",
    createdAt: Date.now(),
  };
  db.friendships.push(friendship);
  writeDb(db);
  return NextResponse.json({ friendship });
}
