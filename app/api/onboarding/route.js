import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Records onboarding milestones: signing the borrower agreement and linking
// the designated Lending album (simulated here; PhotoKit/MediaStore in native).
export async function POST(req) {
  const db = readDb();
  const me = await currentUser(db);
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { step } = await req.json();
  if (step === "waiver") {
    me.waiverAccepted = true;
    me.waiverAcceptedAt = Date.now();
  } else if (step === "album") {
    me.albumLinked = true;
  } else {
    return NextResponse.json({ error: "Unknown step." }, { status: 400 });
  }
  writeDb(db);
  return NextResponse.json({ ok: true });
}
