"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";

const QUICK = ["wedding", "bridesmaid", "black-tie", "formal", "cocktail", "date night", "casual"];

function SearchInner() {
  const params = useSearchParams();
  const [tag, setTag] = useState(params.get("tag") || "");
  const [query, setQuery] = useState(params.get("tag") || "");
  const [outfits, setOutfits] = useState(null);

  useEffect(() => {
    const url = query ? `/api/outfits?tag=${encodeURIComponent(query)}` : "/api/outfits";
    fetch(url)
      .then((r) => (r.ok ? r.json() : { outfits: [] }))
      .then((d) => setOutfits(d.outfits || []));
  }, [query]);

  return (
    <div className="screen">
      <h1 className="mb">Find an outfit</h1>
      <input
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && setQuery(tag.trim())}
        placeholder="Search friends' closets by tag…"
      />
      <div className="tags mb">
        {QUICK.map((t) => (
          <button
            key={t}
            className={`tag ${query === t ? "on" : ""}`}
            onClick={() => {
              setTag(t);
              setQuery(t);
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {outfits === null ? null : outfits.length === 0 ? (
        <div className="empty">
          <div className="big">🕵️</div>
          <p>
            {query
              ? `Nothing tagged "${query}" in your friends' closets yet.`
              : "Follow friends to search their closets."}
          </p>
        </div>
      ) : (
        <div className="closet-grid">
          {outfits.map((o) => (
            <Link className="closet-item" key={o.id} href={`/outfit/${o.id}`}>
              <StatusBadge status={o.status} />
              <img
                className={o.status !== "available" ? "dim" : ""}
                src={o.image}
                alt={o.title}
              />
              <div className="ci-body">
                <div className="ci-title">{o.title}</div>
                <div className="row" style={{ gap: 6 }}>
                  <Avatar user={o.owner} size="sm" />
                  <span className="muted small">{o.owner.name.split(" ")[0]}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Search() {
  return (
    <>
      <Suspense fallback={<div className="screen" />}>
        <SearchInner />
      </Suspense>
      <Nav />
    </>
  );
}
