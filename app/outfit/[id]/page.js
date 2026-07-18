"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";

const WAIVER = `Borrower agreement (prototype placeholder — real waiver needs legal review before launch):

ClosetShare connects friends who lend clothing to each other. By sending a borrow request you agree that: (1) lending is a private arrangement between you and the owner; (2) ClosetShare is not responsible for damage, loss, late returns, or the condition of any item; (3) you will return the item promptly after your event in the condition you received it, via the same handoff method; (4) any disputes are resolved between you and the owner directly.`;

export default function OutfitDetail({ params }) {
  const { id } = use(params);
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [modal, setModal] = useState(false);
  const [note, setNote] = useState("");
  const [agree, setAgree] = useState(false);
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
      body: JSON.stringify({ outfitId: id, note, waiverAccepted: agree }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) return setError(d.error || "Couldn't send the request.");
    setModal(false);
    setSent(true);
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
          </div>
        </div>

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
          <p className="muted center">
            This is your outfit. Borrow requests from friends will show up in{" "}
            <Link href="/requests">Borrows</Link>.
          </p>
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
          <p className="muted center">
            This outfit is {o.status === "reserved" ? "reserved" : "out on loan"} right now — check
            back after it&rsquo;s returned.
          </p>
        )}
      </div>

      {modal && (
        <div className="modal-back" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Borrow &ldquo;{o.title}&rdquo;</h2>
            {error && <div className="error">{error}</div>}
            <label>Add a note (optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`e.g. "Wedding on the 26th — I'd take great care of it!"`}
            />
            <label>Borrower agreement</label>
            <div className="waiver">{WAIVER}</div>
            <label className="check-row">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>I agree to the borrower agreement.</span>
            </label>
            <div className="btn-row">
              <button className="btn ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn" disabled={!agree || busy} onClick={sendRequest}>
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
