import { NextResponse } from "next/server";
import { readDb, writeDb, publicUser, findUser, areFriends, uid } from "@/lib/db";
import { currentUser } from "@/lib/auth";

function expand(db, r) {
  return {
    ...r,
    outfit: db.outfits.find((o) => o.id === r.outfitId) || null,
    requester: publicUser(findUser(db, r.requesterId)),
    owner: publicUser(findUser(db, r.ownerId)),
  };
}

// GET: your borrow activity — incoming (you're the owner) and outgoing.
export async function GET() {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const bySort = (a, b) => b.createdAt - a.createdAt;
  const incoming = db.requests.filter((r) => r.ownerId === me.id).sort(bySort).map((r) => expand(db, r));
  const outgoing = db.requests.filter((r) => r.requesterId === me.id).sort(bySort).map((r) => expand(db, r));
  return NextResponse.json({ incoming, outgoing });
}

// POST: send a borrow request on a friend's outfit.
export async function POST(req) {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { outfitId, note, waiverAccepted } = await req.json();
  const outfit = db.outfits.find((o) => o.id === outfitId);
  if (!outfit) return NextResponse.json({ error: "Outfit not found." }, { status: 404 });
  if (outfit.ownerId === me.id) {
    return NextResponse.json({ error: "That's your own outfit." }, { status: 400 });
  }
  if (!areFriends(db, me.id, outfit.ownerId)) {
    return NextResponse.json({ error: "You need to follow each other first." }, { status: 403 });
  }
  if (outfit.status !== "available") {
    return NextResponse.json({ error: "This outfit isn't available right now." }, { status: 409 });
  }
  if (!waiverAccepted) {
    return NextResponse.json(
      { error: "You must accept the borrower agreement to send a request." },
      { status: 400 }
    );
  }
  const dupe = db.requests.find(
    (r) =>
      r.outfitId === outfitId &&
      r.requesterId === me.id &&
      ["pending", "approved"].includes(r.status)
  );
  if (dupe) {
    return NextResponse.json({ error: "You already have an open request for this outfit." }, { status: 409 });
  }
  const request = {
    id: "r_" + uid(),
    outfitId,
    requesterId: me.id,
    ownerId: outfit.ownerId,
    status: "pending",
    note: (note || "").trim(),
    ownerNote: null,
    handoff: null,
    shipping: null,
    waiverAccepted: true,
    createdAt: Date.now(),
  };
  db.requests.push(request);
  writeDb(db);
  return NextResponse.json({ request: expand(db, request) });
}
