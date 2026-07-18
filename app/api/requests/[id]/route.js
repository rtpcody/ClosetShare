import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Borrow request lifecycle:
//   pending   --owner approve-->  approved (outfit: reserved)
//   pending   --owner decline-->  declined (with optional note)
//   approved  --requester picks handoff (meetup | ship)--> outfit: on-loan
//             ("ship" generates the white-labeled prepaid round-trip label — mocked)
//   approved  --owner marks returned--> completed (outfit: available)
export async function PATCH(req, { params }) {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const { action, ownerNote, returnBy } = await req.json();
  const r = db.requests.find((x) => x.id === id);
  if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const outfit = db.outfits.find((o) => o.id === r.outfitId);
  const isOwner = r.ownerId === me.id;
  const isRequester = r.requesterId === me.id;
  if (!isOwner && !isRequester) {
    return NextResponse.json({ error: "Not your request." }, { status: 403 });
  }

  if (action === "approve") {
    if (!isOwner || r.status !== "pending") {
      return NextResponse.json({ error: "Can't approve this request." }, { status: 403 });
    }
    r.status = "approved";
    r.ownerNote = (ownerNote || "").trim() || null;
    if (outfit) outfit.status = "reserved";
    // Any other pending requests on this outfit stay pending; the owner can
    // still decline them individually with a note.
  } else if (action === "decline") {
    if (!isOwner || r.status !== "pending") {
      return NextResponse.json({ error: "Can't decline this request." }, { status: 403 });
    }
    r.status = "declined";
    r.ownerNote = (ownerNote || "").trim() || null;
  } else if (action === "meetup" || action === "ship") {
    if (!isRequester || r.status !== "approved" || r.handoff) {
      return NextResponse.json({ error: "Can't set a handoff for this request." }, { status: 403 });
    }
    r.handoff = action === "meetup" ? "meetup" : "shipping";
    // Optional return-by date agreed when the loan starts; feeds the
    // return reminder and the "expected back" hint on the listing.
    if (returnBy && /^\d{4}-\d{2}-\d{2}$/.test(returnBy)) r.returnBy = returnBy;
    if (action === "ship") {
      // Mocked white-labeled prepaid label; a real integration (Shippo /
      // EasyPost / USPS Ground Advantage) replaces this later.
      r.shipping = {
        labelId: "CS-" + uid().slice(0, 10).toUpperCase(),
        tracking: "9400 1000 " + String(Math.floor(1e9 + Math.random() * 9e9)).replace(/(\d{4})(?=\d)/g, "$1 "),
        service: "ClosetShare Shipping · economy round-trip",
        cost: 9.0,
        outbound: "Label A — to borrower",
        inbound: "Label B — return to owner",
        createdAt: Date.now(),
      };
    }
    if (outfit) outfit.status = "on-loan";
  } else if (action === "returned") {
    if (!isOwner || r.status !== "approved") {
      return NextResponse.json({ error: "Can't complete this request." }, { status: 403 });
    }
    r.status = "completed";
    r.returnedAt = Date.now();
    if (outfit) outfit.status = "available";
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  writeDb(db);
  return NextResponse.json({ request: r, outfit });
}
