"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";

// The signature moment: entering a friend's closet swings open two wooden
// doors before revealing their outfits.
export default function Closet({ params }) {
  const { userId } = use(params);
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [doors, setDoors] = useState(true);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.user));
    fetch(`/api/outfits?ownerId=${userId}`)
      .then((r) => r.json())
      .then(setData);
    const t = setTimeout(() => setDoors(false), 1250);
    return () => clearTimeout(t);
  }, [userId]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const owner = data?.owner;
  const isMe = me && owner && me.id === owner.id;

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
        {isMe && (
          <button className="tag" onClick={logout}>Sign out</button>
        )}
      </div>
      <div className="screen">
        {!data ? null : data.locked ? (
          <div className="empty">
            <div className="big">🔒</div>
            <h2>{data.owner?.name}&rsquo;s closet is private</h2>
            <p className="muted mt">You need to follow each other to open these doors.</p>
            <Link className="btn mt" href="/people">Send a follow request</Link>
          </div>
        ) : (
          <>
            <div className="closet-head">
              <Avatar user={owner} size="lg" />
              <h1>{isMe ? "My Closet" : `${owner.name.split(" ")[0]}'s Closet`}</h1>
              <p className="muted">
                @{owner.username}
                {owner.location ? ` · ${owner.location}` : ""}
              </p>
              {owner.bio && <p className="muted mt">{owner.bio}</p>}
            </div>
            <div className="closet-rail" />
            {data.outfits.length === 0 ? (
              <div className="empty">
                <div className="big">🧥</div>
                <p>Nothing hanging here yet.</p>
                {isMe && <Link className="btn mt" href="/upload">Add your first outfit</Link>}
              </div>
            ) : (
              <div className="closet-grid">
                {data.outfits.map((o) => (
                  <Link className="closet-item" key={o.id} href={`/outfit/${o.id}`}>
                    <StatusBadge status={o.status} />
                    <img src={o.image} alt={o.title} />
                    <div className="ci-body">
                      <div className="ci-title">{o.title}</div>
                      <div className="muted small">{o.tags.join(" · ")}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <Nav />
    </>
  );
}
