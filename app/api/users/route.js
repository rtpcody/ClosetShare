import { NextResponse } from "next/server";
import { readDb, publicUser, friendshipBetween } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Everyone on the platform, annotated with your friendship state with each.
export async function GET() {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const users = db.users
    .filter((u) => u.id !== me.id)
    .map((u) => {
      const f = friendshipBetween(db, me.id, u.id);
      return {
        ...publicUser(u),
        outfitCount: db.outfits.filter((o) => o.ownerId === u.id).length,
        friendship: f
          ? { id: f.id, status: f.status, requestedByMe: f.requestedBy === me.id }
          : null,
      };
    });
  return NextResponse.json({ users });
}
