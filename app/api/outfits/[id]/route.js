import { NextResponse } from "next/server";
import { readDb, writeDb, publicUser, findUser, areFriends, withLoanInfo } from "@/lib/db";
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
  const interests = db.interests.filter((i) => i.outfitId === id);
  const isOwner = outfit.ownerId === me.id;
  return NextResponse.json({
    outfit: {
      ...withLoanInfo(db, outfit),
      owner: publicUser(findUser(db, outfit.ownerId)),
    },
    myRequest,
    myInterest: interests.some((i) => i.userId === me.id),
    // Owners see who's waiting so they can prioritize when it comes back.
    interestedUsers: isOwner
      ? interests.map((i) => publicUser(findUser(db, i.userId))).filter(Boolean)
      : null,
  });
}

// Owner controls from the item's own settings: toggle Available <-> Reserved.
// Items out on loan are driven by the borrow flow (and later by shipping
// tracking events once the white-label carrier integration exists).
export async function PATCH(req, { params }) {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const { action, note, size, title } = await req.json();
  const outfit = db.outfits.find((o) => o.id === id);
  if (!outfit) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (outfit.ownerId !== me.id) {
    return NextResponse.json({ error: "Only the owner can change this." }, { status: 403 });
  }
  // "edit" updates the description/size/title — e.g. filling in details on an
  // item that was auto-added from the synced Lending album.
  if (action === "edit") {
    if (note !== undefined) outfit.note = String(note).trim().slice(0, 600);
    if (size !== undefined) outfit.size = String(size).trim().slice(0, 12);
    if (title !== undefined && String(title).trim()) outfit.title = String(title).trim();
    writeDb(db);
    return NextResponse.json({ outfit });
  }
  if (action !== "toggle-status") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  if (outfit.status === "on-loan") {
    return NextResponse.json(
      { error: "This item is out on loan — mark the borrow returned first." },
      { status: 409 }
    );
  }
  const hasApproved = db.requests.some(
    (r) => r.outfitId === id && r.status === "approved"
  );
  if (outfit.status === "reserved" && hasApproved) {
    return NextResponse.json(
      { error: "Reserved by an approved borrow — manage it from the Borrows tab." },
      { status: 409 }
    );
  }
  outfit.status = outfit.status === "available" ? "reserved" : "available";
  writeDb(db);
  return NextResponse.json({ outfit });
}
