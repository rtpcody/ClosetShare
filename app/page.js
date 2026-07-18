"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";

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
  const [nudge, setNudge] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) return router.replace("/login");
        setMe(d.user);
      });
    fetch("/api/feed")
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((d) => setPosts(d.posts || []));
    fetch("/api/album")
      .then((r) => (r.ok ? r.json() : { photos: [] }))
      .then((d) => setAlbum(d.photos || []));
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

        {nudge && (
          <div className="banner calendar">
            <div className="spread">
              <h3>📅 Emma&rsquo;s wedding is in 12 days</h3>
              <button className="tag" onClick={() => setNudge(false)}>✕</button>
            </div>
            <p className="muted small">
              Need an outfit? <Link href="/search?tag=wedding">Browse friends&rsquo; wedding looks →</Link>
              <br />
              (Mock of the opt-in calendar nudge — event title + date only.)
            </p>
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
              <img className="post-img" src={p.image} alt={p.title} />
            </Link>
            <div className="post-body">
              <div className="post-title">{p.title}</div>
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
