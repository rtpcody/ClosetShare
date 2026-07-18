"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import OutfitFacets from "@/components/OutfitFacets";
import { KINDS, EVENT_TAGS, COLORS } from "@/lib/taxonomy";

function SearchInner() {
  const params = useSearchParams();
  const [tag, setTag] = useState(params.get("tag") || "");
  const [query, setQuery] = useState(params.get("tag") || "");
  const [kind, setKind] = useState("");
  const [color, setColor] = useState("");
  const [outfits, setOutfits] = useState(null);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (query) qs.set("tag", query);
    if (kind) qs.set("kind", kind);
    if (color) qs.set("color", color);
    fetch(`/api/outfits${qs.size ? `?${qs}` : ""}`)
      .then((r) => (r.ok ? r.json() : { outfits: [] }))
      .then((d) => setOutfits(d.outfits || []));
  }, [query, kind, color]);

  return (
    <div className="screen">
      <h1 className="mb">Find an outfit</h1>
      <input
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && setQuery(tag.trim())}
        placeholder="Search friends' closets by event tag…"
      />
      <label>Event style</label>
      <div className="tags mb">
        {EVENT_TAGS.map((t) => (
          <button
            key={t}
            className={`tag ${query === t ? "on" : ""}`}
            onClick={() => {
              const next = query === t ? "" : t;
              setTag(next);
              setQuery(next);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <label>Type of clothing</label>
      <div className="tags mb">
        {KINDS.map((k) => (
          <button
            key={k.value}
            className={`tag kind ${kind === k.value ? "on" : ""}`}
            onClick={() => setKind(kind === k.value ? "" : k.value)}
          >
            {k.label}
          </button>
        ))}
      </div>
      <label>Color</label>
      <div className="tags mb">
        {Object.entries(COLORS).map(([name, hex]) => (
          <button
            key={name}
            className={`color-chip ${color === name ? "on" : ""}`}
            onClick={() => setColor(color === name ? "" : name)}
          >
            <span className="color-dot" style={{ background: hex }} />
            {name}
          </button>
        ))}
      </div>

      {outfits === null ? null : outfits.length === 0 ? (
        <div className="empty">
          <div className="big">🕵️</div>
          <p>
            {query || kind || color
              ? "Nothing in your friends' closets matches those filters yet."
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
                <div className="row mb" style={{ gap: 6 }}>
                  <Avatar user={o.owner} size="sm" />
                  <span className="muted small">{o.owner.name.split(" ")[0]}</span>
                </div>
                <OutfitFacets outfit={o} small />
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
