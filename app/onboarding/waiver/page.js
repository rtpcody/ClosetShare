"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { WAIVER_TEXT } from "@/lib/waiver";

// Onboarding step 2 (after account creation): sign the agreement once,
// so borrow requests later are one tap.
export default function WaiverStep() {
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "waiver" }),
    });
    router.push("/onboarding/folder");
  }

  return (
    <div className="screen" style={{ paddingTop: 32 }}>
      <p className="muted small center mb">Step 2 of 4</p>
      <h1 className="center mb">One agreement, signed once</h1>
      <p className="muted center mb">
        So borrowing between friends stays simple — and everyone knows the deal.
      </p>
      <div className="card">
        <div className="waiver" style={{ maxHeight: 300 }}>{WAIVER_TEXT}</div>
        <label className="check-row">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>I've read and agree to the Borrower &amp; Lender Agreement.</span>
        </label>
        <button className="btn block" disabled={!agree || busy} onClick={accept}>
          Agree &amp; continue
        </button>
      </div>
    </div>
  );
}
