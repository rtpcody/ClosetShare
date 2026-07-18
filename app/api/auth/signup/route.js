import { NextResponse } from "next/server";
import { readDb, writeDb, findUserByUsername, publicUser, uid } from "@/lib/db";
import { setSession } from "@/lib/auth";

const EMOJIS = ["🧥", "👗", "👠", "🕶️", "🎩", "🧣", "👔", "🥻"];
const COLORS = ["#f59e0b", "#10b981", "#6366f1", "#ec4899", "#14b8a6", "#f97316"];

export async function POST(req) {
  const { username, name, location } = await req.json();
  if (!username || !/^[a-z0-9_]{2,20}$/i.test(username)) {
    return NextResponse.json(
      { error: "Username must be 2–20 letters, numbers, or underscores." },
      { status: 400 }
    );
  }
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  const db = readDb();
  if (findUserByUsername(db, username)) {
    return NextResponse.json({ error: "That username is taken." }, { status: 409 });
  }
  const user = {
    id: "u_" + uid(),
    username: username.toLowerCase(),
    name: name.trim(),
    avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    avatarEmoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    bio: "",
    location: (location || "").trim(),
    waiverAccepted: false,
    albumLinked: false,
    createdAt: Date.now(),
  };
  db.users.push(user);
  writeDb(db);
  await setSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
