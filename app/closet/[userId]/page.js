"use client";
import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import { KINDS, COLORS, kindLabel } from "@/lib/taxonomy";

// Instagram-style closet: profile header (photo, stats, bio), then two tabs —
// a quick-scroll square grid, and a filtered view with dropdowns. Entering
// still plays the signature two-door closet animation.

function statusDot(status) {
  if (status === "available") return null;
  return <span className={`grid-dot ${status}`} title={status} />;
}

function GridCell({ o }) {
  return (
    <Link className="ig-cell" href={`/outfit/${o.id}`}>
      <img className={o.status !== "available" ? "dim" : ""} src={o.image} alt={o.title} />
      {statusDot(o.status)}
    </Link>
  );
}

function EditProfileModal({ me, onClose, onSaved }) {
  const [bio, setBio] = useState(me.bio || "");
  const [location, setLocation] = useState(me.location || "");
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [busy, setBusy] = useState(false);

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result);
    reader.readAsDataURL(f);
  }

  async function save() {
    setBusy(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, location, photoDataUrl: photoDataUrl || undefined }),
    });
    onSaved();
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit profile</h2>
        <div className="row mb">
          {photoDataUrl ? (
            <img className="avatar lg" src={photoDataUrl} alt="New profile" style={{ objectFit: "cover" }} />
          ) : (
            <Avatar user={me} size="lg" />
          )}
          <div style={{ flex: 1 }}>
            <label>Profile photo</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} />
          </div>
        </div>
        <label>Bio</label>
        <textarea rows={2} maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A line about your closet…" />
        <label>City</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Austin, TX" />
        <div className="btn-row">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy} onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Closet({ params }) {
  const { userId } = use(params);
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [doors, setDoors] = useState(true);
  const [tab, setTab] = useState("grid"); // grid | filter
  const [editing, setEditing] = useState(false);
  const [fKind, setFKind] = useState("");
  const [fColor, setFColor] = useState("");
  const [fSize, setFSize] = useState("");
  const [fEvent, setFEvent] = useState("");
  const [fDate, setFDate] = useState("");

  function load() {
    fetch(`/api/outfits?ownerId=${userId}`)
      .then((r) => r.json())
      .then(setData);
  }
  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.user));
    load();
    const t = setTimeout(() => setDoors(false), 1250);
    return () => clearTimeout(t);
  }, [userId]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const owner = data?.owner;
  const isMe = me && owner && me.id === owner.id;
  const outfits = data?.outfits || [];

  // Dropdown options compiled from what's actually in this closet.
  const sizeOptions = useMemo(
    () => [...new Set(outfits.map((o) => o.size).filter(Boolean))],
    [outfits]
  );
  const eventOptions = useMemo(
    () => [...new Set(outfits.flatMap((o) => o.tags || []))],
    [outfits]
  );
  const kindOptions = useMemo(
    () => KINDS.filter((k) => outfits.some((o) => o.kind === k.value)),
    [outfits]
  );
  const colorOptions = useMemo(
    () => Object.keys(COLORS).filter((c) => outfits.some((o) => (o.colors || []).includes(c))),
    [outfits]
  );

  const filtered = outfits.filter(
    (o) =>
      (!fKind || o.kind === fKind) &&
      (!fColor || (o.colors || []).includes(fColor)) &&
      (!fSize || o.size === fSize) &&
      (!fEvent || (o.tags || []).includes(fEvent)) &&
      (!fDate ||
        o.status === "available" ||
        (o.expectedBack && o.expectedBack < fDate))
  );
  const shown = tab === "filter" ? filtered : outfits;
  const filtersActive = fKind || fColor || fSize || fEvent || fDate;

  return (
    <>
      {doors && (
        <div className="doors opening" aria-hidden="true">
          <div className="door left" />
          <div className="door right" />
        </div>
      )}
      <div className="topbar">
        <Link href="/" style={{ textDecoration: "none", fontSize: 15 }}>← Feed</Link>
        {isMe && <button className="tag" onClick={logout}>Sign out</button>}
      </div>
      <div className="screen" style={{ paddingLeft: 0, paddingRight: 0 }}>
        {!data ? null : data.locked ? (
          <div className="empty">
            <div className="big">🔒</div>
            <h2>{data.owner?.name}&rsquo;s closet is private</h2>
            <p className="muted mt">You need to follow each other to open these doors.</p>
            <Link className="btn mt" href="/people">Send a follow request</Link>
          </div>
        ) : (
          <>
            {/* profile header */}
            <div className="ig-head">
              <Avatar user={owner} size="xl" />
              <div className="ig-stats">
                <div><strong>{data.stats?.outfits ?? outfits.length}</strong><span>outfits</span></div>
                <div><strong>{data.stats?.friends ?? 0}</strong><span>friends</span></div>
                <div><strong>{data.stats?.loans ?? 0}</strong><span>loans</span></div>
              </div>
            </div>
            <div className="ig-bio">
              <strong>{owner.name}</strong>
              <span className="muted small"> @{owner.username}{owner.location ? ` · ${owner.location}` : ""}</span>
              {owner.bio && <p>{owner.bio}</p>}
              {isMe && (
                <button className="btn subtle block mt" onClick={() => setEditing(true)}>
                  Edit profile
                </button>
              )}
            </div>

            {/* tabs */}
            <div className="ig-tabs">
              <button className={tab === "grid" ? "on" : ""} onClick={() => setTab("grid")} title="All outfits">
                ▦ Closet
              </button>
              <button className={tab === "filter" ? "on" : ""} onClick={() => setTab("filter")} title="Filter & sort">
                ⚲ Filter
              </button>
            </div>

            {tab === "filter" && (
              <div className="filter-panel">
                <div className="filter-row">
                  <select value={fKind} onChange={(e) => setFKind(e.target.value)}>
                    <option value="">Type: all</option>
                    {kindOptions.map((k) => (
                      <option key={k.value} value={k.value}>{k.label}</option>
                    ))}
                  </select>
                  <select value={fColor} onChange={(e) => setFColor(e.target.value)}>
                    <option value="">Color: all</option>
                    {colorOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-row">
                  <select value={fSize} onChange={(e) => setFSize(e.target.value)}>
                    <option value="">Size: all</option>
                    {sizeOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select value={fEvent} onChange={(e) => setFEvent(e.target.value)}>
                    <option value="">Event: all</option>
                    {eventOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-row">
                  <input
                    type="date"
                    value={fDate}
                    onChange={(e) => setFDate(e.target.value)}
                    title="Only show what's free (or back) by this date"
                  />
                  {filtersActive ? (
                    <button
                      className="btn subtle"
                      onClick={() => {
                        setFKind(""); setFColor(""); setFSize(""); setFEvent(""); setFDate("");
                      }}
                    >
                      Clear
                    </button>
                  ) : (
                    <span className="muted small" style={{ alignSelf: "center" }}>Need-by date</span>
                  )}
                </div>
                <p className="muted small center" style={{ padding: "2px 0 8px" }}>
                  {filtered.length} of {outfits.length} item{outfits.length === 1 ? "" : "s"}
                </p>
              </div>
            )}

            {shown.length === 0 ? (
              <div className="empty">
                <div className="big">🧥</div>
                <p>{tab === "filter" && outfits.length > 0 ? "Nothing matches those filters." : "Nothing hanging here yet."}</p>
                {isMe && outfits.length === 0 && (
                  <Link className="btn mt" href="/upload">Add your first outfit</Link>
                )}
              </div>
            ) : (
              <div className="ig-grid">
                {shown.map((o) => (
                  <GridCell key={o.id} o={o} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {editing && me && (
        <EditProfileModal
          me={me}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
            fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.user));
          }}
        />
      )}
      <Nav />
    </>
  );
}
