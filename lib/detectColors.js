"use client";

// Auto-compile color tags from the photo: rasterize it small on a canvas,
// bucket every pixel into a named color, keep the dominant ones. Runs in
// the browser at upload time — no server round trip.

function nameForPixel(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (l < 0.14) return "black";
  if (l > 0.88 && s < 0.2) return "white";
  if (s < 0.13) return "gray";

  let h = 0;
  const rf = r / 255, gf = g / 255, bf = b / 255;
  if (max === rf) h = ((gf - bf) / d) % 6;
  else if (max === gf) h = (bf - rf) / d + 2;
  else h = (rf - gf) / d + 4;
  h = (h * 60 + 360) % 360;

  if (h < 15 || h >= 340) return l < 0.35 ? "brown" : "red";
  if (h < 42) return l < 0.55 ? "brown" : "orange";
  if (h < 70) return "yellow";
  if (h < 170) return "green";
  if (h < 255) return "blue";
  if (h < 295) return "purple";
  return "pink";
}

export async function detectColors(src) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
  const S = 48;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, S, S);
  const { data } = ctx.getImageData(0, 0, S, S);

  const counts = {};
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const name = nameForPixel(data[i], data[i + 1], data[i + 2]);
    counts[name] = (counts[name] || 0) + 1;
    total++;
  }
  if (!total) return [];
  return Object.entries(counts)
    .filter(([, n]) => n / total >= 0.12)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);
}
