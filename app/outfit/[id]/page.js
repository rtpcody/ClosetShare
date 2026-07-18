"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import { WAIVER_TEXT } from "@/lib/waiver";

export default function OutfitDetail({ params }) {
  const { id } = use(params);
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [modal, setModal] = useState(false);
  const [note, setNote] = useState("");
  const [showWaiver, setShowWaiver] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  function load() {
    fetch(`/api/outfits/${id}`)
      .then((r) => r.json())
      .then(setData);
  }
  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.user));
    load();
  }, [id]);

  async function sendRequest() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outfitId: id, note }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) return setError(d.error || "Couldn't send the request.");
    setModal(false);
    setSent(true);
    load();
  }

  async function toggleInterest() {
    setBusy(true);
    await fetch(`/api/outfits/${id}/interest`, { method: "POST" });
    setBusy(false);
    load();
  }

  async function toggleStatus() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/outfits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-status" }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) setError(d.error || "Couldn't update the item.");
    load();
  }

  if (!data || !data.outfit) {
    return (
      <>
        <div className="screen">
          <p className="muted">{data?.error || "Loading…"}</p>
        </div>
        <Nav />
      </>
    );
  }

  const o = data.outfit;
  const isMine = me && o.ownerId === me.id;
  const open = data.myRequest;

  return (
    <>
      <div className="topbar">
        <Link href={`/closet/${o.ownerId}`} style={{ textDecoration: "none", fontSize: 15 }}>
          ← {o.owner.name.split(" ")[0]}&rsquo;s closet
        </Link>
        <StatusBadge status={o.status} />
      </div>
      <div className="screen">
        <div className="card post">
          {/* Full color even when unavailable — the fade lives in listings only. */}
          <img className="post-img" src={o.image} alt={o.title} />
          <div className="post-body">
            <h1 style={{ fontSize: 22, marginBottom: 6 }}>{o.title}</h1>
            <div className="row mb">
              <Avatar user={o.owner} size="sm" />
              <span className="muted">
                {o.owner.name}
                {o.owner.location ? ` · ${o.owner.location}` : ""}
              </span>
            </div>
            <div className="tags mb">
              {o.tags.map((t) => (
                <Link className="tag" key={t} href={`/search?tag=${encodeURIComponent(t)}`}>
                  {t}
                </Link>
              ))}
            </div>
            {o.note && <p className="muted">{o.note}</p>}
            {o.status !== "available" && o.expectedBack && (
              <p className="muted mt">📦 Expected back {o.expectedBack}</p>
            )}
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        {sent && (
          <div className="banner">
            <h3>Request sent 🎉</h3>
            <p className="muted small">
              {o.owner.name.split(" ")[0]} will approve or decline it. Track it in{" "}
              <Link href="/requests">Borrows</Link>.
            </p>
          </div>
        )}

        {isMine ? (
          <div className="card">
            <h2>Item settings</h2>
            {o.status === "on-loan" ? (
              <p className="muted small">
                Out on loan — manage the return from <Link href="/requests">Borrows</Link>.
                Once real shipping lands, carrier tracking will flip this automatically at
                pickup and return drop-off.
              </p>
            ) : (
              <>
                <p className="muted small mb">
                  Need it for your own event? Take it off the shelf without waiting for a
                  request.
                </p>
                <button className="btn subtle block" disabled={busy} onClick={toggleStatus}>
                  {o.status === "available" ? "Mark as reserved" : "Mark as available"}
                </button>
              </>
            )}
            {data.interestedUsers && data.interestedUsers.length > 0 && (
              <>
                <hr className="divider" />
                <p className="muted small mb">Waiting for this item:</p>
                {data.interestedUsers.map((u) => (
                  <div className="row mb" key={u.id}>
                    <Avatar user={u} size="sm" />
                    <span className="small">{u.name}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : open ? (
          <div className="card">
            <div className="spread">
              <strong>Your request</strong>
              <StatusBadge status={open.status} />
            </div>
            <p className="muted small mt">
              Manage it from the <Link href="/requests">Borrows</Link> tab.
            </p>
          </div>
        ) : o.status === "available" ? (
          <button className="btn block" onClick={() => setModal(true)}>
            Request to borrow
          </button>
        ) : (
          <div className="card">
            <p className="muted mb">
              This outfit is {o.status === "reserved" ? "reserved" : "out on loan"} right now.
              {o.interestCount > 0 && ` ${o.interestCount} waiting.`}
            </p>
            <button className="btn subtle block" disabled={busy} onClick={toggleInterest}>
              {data.myInterest
                ? "✓ You're on the list — tap to remove"
                : "I'm interested — tell me when it's back"}
            </button>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-back" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Borrow &ldquo;{o.title}&rdquo;</h2>
            <label>Add a note (optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`e.g. "Wedding on the 26th — I'd take great care of it!"`}
            />
            <p className="muted small mb">
              Covered by the Borrower &amp; Lender Agreement you signed at sign-up.{" "}
              <button className="tag" onClick={() => setShowWaiver(!showWaiver)}>
                {showWaiver ? "hide" : "view"}
              </button>
            </p>
            {showWaiver && <div className="waiver">{WAIVER_TEXT}</div>}
            <div className="btn-row">
              <button className="btn ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn" disabled={busy} onClick={sendRequest}>
                Send request
              </button>
            </div>
          </div>
        </div>
      )}
      <Nav />
    </>
  );
}
