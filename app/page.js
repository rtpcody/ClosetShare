"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import { downloadReturnIcs } from "@/lib/ics";

function timeAgo(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Feed() {
  const router = useRouter();
  const [me, setMe] = useState(undefined);
  const [posts, setPosts] = useState([]);
  const [album, setAlbum] = useState([]);
  const [returnDue, setReturnDue] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) return router.replace("/login");
        if (!d.onboarding?.waiverAccepted) return router.replace("/onboarding/waiver");
        setMe(d.user);
      });
    fetch("/api/feed")
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((d) => setPosts(d.posts || []));
    fetch("/api/album")
      .then((r) => (r.ok ? r.json() : { photos: [] }))
      .then((d) => setAlbum(d.photos || []));
    // Return reminder: soonest return-by date among items I've borrowed.
    fetch("/api/requests")
      .then((r) => (r.ok ? r.json() : { outgoing: [] }))
      .then((d) => {
        const due = (d.outgoing || [])
          .filter((r) => r.status === "approved" && r.returnBy)
          .sort((a, b) => a.returnBy.localeCompare(b.returnBy))[0];
        setReturnDue(due || null);
      });
  }, [router]);

  if (me === undefined) return <div className="screen" />;

  return (
    <>
      <div className="topbar">
        <div className="brand">
          Closet<span>Share</span>
        </div>
        <Link href={`/closet/${me.id}`} title="My closet">
          <Avatar user={me} />
        </Link>
      </div>
      <div className="screen">
        {album.length > 0 && (
          <div className="banner">
            <h3>📸 {album.length} new photo{album.length > 1 ? "s" : ""} in your Lending album</h3>
            <p className="muted small mb">
              Simulated folder sync — on a phone this checks your designated album on app open.
            </p>
            <Link className="btn subtle block" href={`/upload?album=${album[0].id}`}>
              Add to my closet
            </Link>
          </div>
        )}

        {returnDue && returnDue.outfit && (
          <div className="banner calendar">
            <h3>📅 Return &ldquo;{returnDue.outfit.title}&rdquo; by {returnDue.returnBy}</h3>
            <p className="muted small mb">
              Send it back to {returnDue.owner?.name} the way it arrived —{" "}
              {returnDue.handoff === "shipping" ? "prepaid return label" : "your meetup"}.
            </p>
            <button
              className="btn subtle block"
              onClick={() =>
                downloadReturnIcs(returnDue.outfit.title, returnDue.owner?.name || "owner", returnDue.returnBy)
              }
            >
              Add return date to my calendar
            </button>
          </div>
        )}

        {posts.length === 0 && (
          <div className="empty">
            <div className="big">🧺</div>
            <p>Your feed is empty. Follow some friends to see their closets come alive.</p>
            <Link className="btn mt" href="/people">Find friends</Link>
          </div>
        )}

        {posts.map((p) => (
          <article className="card post" key={p.id}>
            <div className="post-head">
              <Link href={`/closet/${p.owner.id}`}>
                <Avatar user={p.owner} />
              </Link>
              <div style={{ flex: 1 }}>
                <Link href={`/closet/${p.owner.id}`}>
                  <div className="name">{p.owner.name}</div>
                </Link>
                <div className="muted small">
                  added to their closet · {timeAgo(p.createdAt)}
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <Link href={`/outfit/${p.id}`}>
              <img
                className={`post-img ${p.status !== "available" ? "dim" : ""}`}
                src={p.image}
                alt={p.title}
              />
            </Link>
            <div className="post-body">
              <div className="post-title">{p.title}</div>
              {p.status !== "available" && p.expectedBack && (
                <p className="muted small mb">Expected back {p.expectedBack}</p>
              )}
              <div className="tags">
                {p.tags.map((t) => (
                  <Link className="tag" key={t} href={`/search?tag=${encodeURIComponent(t)}`}>
                    {t}
                  </Link>
                ))}
              </div>
              {p.note && <p className="muted mt">{p.note}</p>}
            </div>
          </article>
        ))}
      </div>
      <Nav />
    </>
  );
}
