"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Onboarding step 3: designate the Lending album ClosetShare watches.
// Simulated here — the native app links a real album via PhotoKit (iOS) /
// MediaStore (Android), and only ever reads that one album.
export default function FolderStep() {
  const router = useRouter();
  const [linked, setLinked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "album" }),
    });
    router.push("/onboarding/sizes");
  }

  return (
    <div className="screen" style={{ paddingTop: 32 }}>
      <p className="muted small center mb">Step 3 of 4</p>
      <h1 className="center mb">Set up your closet folder</h1>
      <p className="muted center mb">
        ClosetShare only ever looks at one album you choose — never your whole camera roll.
      </p>

      <div className="card">
        <h2>📁 1. Create a &ldquo;Lending&rdquo; album</h2>
        <p className="muted small">
          In your phone&rsquo;s photo app, make an album for outfits you&rsquo;re open to
          lending. Drop in photos of you wearing them — full-outfit shots work best.
        </p>
      </div>
      <div className="card">
        <h2>✨ 2. Tip: let Google Photos find outfits</h2>
        <p className="muted small">
          Google Photos can search your library for &ldquo;dress&rdquo;, &ldquo;suit&rdquo;, or
          &ldquo;formal wear&rdquo; — a fast way to fill your Lending album with looks you
          forgot you had.
        </p>
      </div>
      <div className="card">
        <h2>🔗 3. Link it to ClosetShare</h2>
        <p className="muted small mb">
          Each time you open the app, we check that album for new photos and offer to add
          them to your closet.
        </p>
        <button
          className={`btn block ${linked ? "sage" : ""}`}
          onClick={() => setLinked(true)}
          disabled={linked}
        >
          {linked ? "✓ Lending album linked (simulated)" : "Link my Lending album"}
        </button>
      </div>

      <button className="btn block" disabled={!linked || busy} onClick={finish}>
        Continue
      </button>
      <button
        className="btn ghost block mt"
        disabled={busy}
        onClick={() => router.push("/onboarding/sizes")}
        style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
      >
        Skip for now
      </button>
    </div>
  );
}
