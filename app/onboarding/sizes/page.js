"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EMPTY_SIZES } from "@/lib/sizeMatch";

// Onboarding step 4 (optional): set your sizes once so closets can filter
// to what actually fits you. Skippable — you can always add or change
// them later in profile settings, and without them you just browse
// everything and sort yourself.
export default function SizesStep() {
  const router = useRouter();
  const [sizes, setSizes] = useState(EMPTY_SIZES);
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setSizes((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setBusy(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sizes }),
    });
    router.push("/");
  }

  return (
    <div className="screen" style={{ paddingTop: 32 }}>
      <p className="muted small center mb">Step 4 of 4 · optional</p>
      <h1 className="center mb">What fits you?</h1>
      <p className="muted center mb">
        Set your sizes once and friends&rsquo; closets can filter to what actually fits.
        Skip it and you&rsquo;ll simply browse everything.
      </p>

      <div className="card">
        <label>Dress size</label>
        <input value={sizes.dress} onChange={(e) => set("dress", e.target.value)} placeholder="e.g. 6 or S" maxLength={12} />
        <label>Top size</label>
        <input value={sizes.top} onChange={(e) => set("top", e.target.value)} placeholder="e.g. S" maxLength={12} />
        <label>Bottoms size</label>
        <input value={sizes.bottom} onChange={(e) => set("bottom", e.target.value)} placeholder="e.g. 28 or M" maxLength={12} />
        <label>Shoe size range</label>
        <div className="row mb">
          <input style={{ marginBottom: 0 }} value={sizes.shoeMin} onChange={(e) => set("shoeMin", e.target.value)} placeholder="7.5" maxLength={12} />
          <span className="muted">to</span>
          <input style={{ marginBottom: 0 }} value={sizes.shoeMax} onChange={(e) => set("shoeMax", e.target.value)} placeholder="8" maxLength={12} />
        </div>
        <p className="muted small">
          You can change these any time from Edit profile on your closet.
        </p>
      </div>

      <button className="btn block" disabled={busy} onClick={save}>
        Save sizes &amp; open my feed
      </button>
      <button
        className="btn ghost block mt"
        disabled={busy}
        onClick={() => router.push("/")}
        style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
      >
        Skip for now
      </button>
    </div>
  );
}
