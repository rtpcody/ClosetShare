import { NextResponse } from "next/server";
import { readDb, publicUser } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ user: null });

  const pendingFriendRequests = db.friendships.filter(
    (f) => f.status === "pending" && (f.aId === me.id || f.bId === me.id) && f.requestedBy !== me.id
  ).length;
  const pendingBorrowRequests = db.requests.filter(
    (r) => r.ownerId === me.id && r.status === "pending"
  ).length;
  const newAlbumPhotos = db.albumPhotos.filter(
    (p) => !p.addedBy.includes(me.id)
  ).length;

  return NextResponse.json({
    user: publicUser(me),
    onboarding: {
      waiverAccepted: !!me.waiverAccepted,
      albumLinked: !!me.albumLinked,
    },
    badges: { pendingFriendRequests, pendingBorrowRequests, newAlbumPhotos },
  });
}
