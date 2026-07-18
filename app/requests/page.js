"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import { downloadReturnIcs } from "@/lib/ics";

function ShippingLabel({ shipping }) {
  return (
    <div className="label-card">
      <div className="spread">
        <strong>ClosetShare Shipping</strong>
        <span>${shipping.cost.toFixed(2)}</span>
      </div>
      <div className="small">{shipping.service}</div>
      <div className="barcode" />
      <div className="small">Label {shipping.labelId}</div>
      <div className="small">Tracking: {shipping.tracking}</div>
      <hr className="divider" />
      <div className="small">✅ {shipping.outbound}</div>
      <div className="small">✅ {shipping.inbound} (prepaid)</div>
      <p className="small" style={{ marginTop: 8, fontFamily: "var(--sans)", color: "var(--ink-soft)" }}>
        Mock label — a real carrier/aggregator integration (e.g. USPS Ground Advantage via
        Shippo/EasyPost) replaces this. Tracking scans will then drive item status
        automatically: picked up → on loan, return-dropped → in transit back.
      </p>
    </div>
  );
}

function DeclineForm({ onDecline, onCancel }) {
  const [note, setNote] = useState("");
  return (
    <div className="mt">
      <textarea
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={`Optional note, e.g. "I need it for my own event that weekend"`}
      />
      <div className="btn-row">
        <button className="btn ghost" onClick={onCancel}>Back</button>
        <button className="btn danger-ghost" onClick={() => onDecline(note)}>Decline request</button>
      </div>
    </div>
  );
}

function RequestCard({ r, role, onAction }) {
  const [declining, setDeclining] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [returnBy, setReturnBy] = useState("");
  const other = role === "incoming" ? r.requester : r.owner;
  const sameCity =
    r.requester?.location &&
    r.owner?.location &&
    r.requester.location.toLowerCase() === r.owner.location.toLowerCase();

  return (
    <div className="card">
      <div className="req-row">
        {r.outfit && (
          <Link href={`/outfit/${r.outfit.id}`}>
            <img className="req-thumb" src={r.outfit.image} alt={r.outfit.title} />
          </Link>
        )}
        <div style={{ flex: 1 }}>
          <div className="spread">
            <strong style={{ fontSize: 14.5 }}>{r.outfit?.title || "Outfit"}</strong>
            <StatusBadge status={r.status} />
          </div>
          <div className="row mt" style={{ gap: 7 }}>
            <Avatar user={other} size="sm" />
            <span className="muted small">
              {role === "incoming" ? `${other?.name} wants to borrow` : `from ${other?.name}`}
              {other?.location ? ` · ${other.location}` : ""}
            </span>
          </div>
          {r.note && <p className="muted small mt">“{r.note}”</p>}
          {r.ownerNote && (
            <p className="muted small mt">Owner&rsquo;s note: “{r.ownerNote}”</p>
          )}
          {r.returnBy && (
            <p className="muted small mt">📅 Return by {r.returnBy}</p>
          )}
        </div>
      </div>

      {/* Owner actions */}
      {role === "incoming" && r.status === "pending" && !declining && (
        <div className="btn-row mt">
          <button className="btn sage" onClick={() => onAction(r.id, "approve")}>Approve</button>
          <button className="btn ghost" onClick={() => setDeclining(true)}>Decline…</button>
        </div>
      )}
      {role === "incoming" && declining && (
        <DeclineForm
          onCancel={() => setDeclining(false)}
          onDecline={(note) => {
            setDeclining(false);
            onAction(r.id, "decline", note);
          }}
        />
      )}
      {role === "incoming" && r.status === "approved" && (
        <>
          {r.handoff === "shipping" && r.shipping && (
            <p className="muted small mt">
              📦 Shipping to {r.requester?.name} — label {r.shipping.labelId}.
            </p>
          )}
          {r.handoff === "meetup" && (
            <p className="muted small mt">🤝 Meeting up locally for the handoff.</p>
          )}
          {!r.handoff && (
            <p className="muted small mt">
              Reserved — waiting for {r.requester?.name.split(" ")[0]} to pick a handoff.
            </p>
          )}
          <button className="btn subtle block mt" onClick={() => onAction(r.id, "returned")}>
            Mark returned &amp; make available again
          </button>
        </>
      )}

      {/* Borrower actions */}
      {role === "outgoing" && r.status === "approved" && !r.handoff && (
        <>
          <p className="muted small mt">
            Approved! How do you want to get it?
            {sameCity
              ? " You're in the same city — a public meetup is easiest."
              : " You're in different cities — shipping is the way."}
          </p>
          <label className="mt" style={{ display: "block" }}>
            When will you send it back?
          </label>
          <input
            type="date"
            value={returnBy}
            onChange={(e) => setReturnBy(e.target.value)}
          />
          <div className="btn-row">
            <button className="btn ghost" onClick={() => onAction(r.id, "meetup", null, returnBy)}>
              🤝 Local meetup
            </button>
            <button className="btn" onClick={() => onAction(r.id, "ship", null, returnBy)}>
              📦 Ship it (~$9 round trip)
            </button>
          </div>
        </>
      )}
      {role === "outgoing" && r.status === "approved" && r.returnBy && (
        <button
          className="btn subtle block mt"
          onClick={() => downloadReturnIcs(r.outfit?.title || "outfit", r.owner?.name || "owner", r.returnBy)}
        >
          📅 Add return date to my calendar
        </button>
      )}
      {role === "outgoing" && r.handoff === "meetup" && r.status === "approved" && (
        <p className="muted small mt">
          🤝 You chose a local meetup — arrange a public spot with {r.owner?.name.split(" ")[0]}.
          Return it the same way after your event.
        </p>
      )}
      {r.handoff === "shipping" && r.shipping && (role === "outgoing" || r.status === "approved") && (
        <>
          <button className="btn subtle block mt" onClick={() => setShowLabel(!showLabel)}>
            {showLabel ? "Hide" : "View"} prepaid shipping label
          </button>
          {showLabel && <ShippingLabel shipping={r.shipping} />}
        </>
      )}
    </div>
  );
}

export default function Requests() {
  const [tab, setTab] = useState("incoming");
  const [data, setData] = useState({ incoming: [], outgoing: [] });

  function load() {
    fetch("/api/requests")
      .then((r) => (r.ok ? r.json() : { incoming: [], outgoing: [] }))
      .then(setData);
  }
  useEffect(load, []);

  async function act(id, action, ownerNote, returnBy) {
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ownerNote, returnBy }),
    });
    load();
  }

  const list = data[tab] || [];

  return (
    <>
      <div className="screen">
        <h1 className="mb">Borrows</h1>
        <div className="seg">
          <button className={tab === "incoming" ? "on" : ""} onClick={() => setTab("incoming")}>
            Requests for my stuff ({data.incoming.length})
          </button>
          <button className={tab === "outgoing" ? "on" : ""} onClick={() => setTab("outgoing")}>
            My requests ({data.outgoing.length})
          </button>
        </div>
        {list.length === 0 ? (
          <div className="empty">
            <div className="big">🔁</div>
            <p>
              {tab === "incoming"
                ? "No borrow requests on your outfits yet."
                : "You haven't asked to borrow anything yet. Go window-shop your friends' closets!"}
            </p>
          </div>
        ) : (
          list.map((r) => <RequestCard key={r.id} r={r} role={tab} onAction={act} />)
        )}
      </div>
      <Nav />
    </>
  );
}
