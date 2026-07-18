import { NextResponse } from "next/server";
import { readDb, publicUser, findUser, friendIdsOf, withLoanInfo } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Strava-style activity feed: newest outfit posts from you + accepted friends.
export async function GET() {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const visible = new Set([me.id, ...friendIdsOf(db, me.id)]);
  const posts = db.outfits
    .filter((o) => visible.has(o.ownerId))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((o) => ({ ...withLoanInfo(db, o), owner: publicUser(findUser(db, o.ownerId)) }));

  return NextResponse.json({ posts });
}
