import fs from "fs";
import path from "path";
import { uploadsDir } from "@/lib/db";

const TYPES = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(_req, { params }) {
  const { name } = await params;
  const safe = path.basename(name);
  const file = path.join(uploadsDir(), safe);
  if (!fs.existsSync(file)) {
    return new Response("Not found", { status: 404 });
  }
  const ext = path.extname(safe).toLowerCase();
  return new Response(fs.readFileSync(file), {
    headers: {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
