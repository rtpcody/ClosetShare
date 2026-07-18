import { NextResponse } from "next/server";
import { readDb, findUserByUsername, publicUser } from "@/lib/db";
import { setSession } from "@/lib/auth";

export async function POST(req) {
  const { username } = await req.json();
  const db = readDb();
  const user = findUserByUsername(db, username || "");
  if (!user) {
    return NextResponse.json({ error: "No account with that username." }, { status: 404 });
  }
  await setSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
