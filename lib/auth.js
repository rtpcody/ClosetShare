import { cookies } from "next/headers";
import { readDb, findUser } from "./db";

const COOKIE = "cs_uid";

export async function currentUser(db) {
  const store = await cookies();
  const uid = store.get(COOKIE)?.value;
  if (!uid) return null;
  return findUser(db ?? readDb(), uid);
}

export async function setSession(userId) {
  const store = await cookies();
  store.set(COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
