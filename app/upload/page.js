"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import { KINDS, EVENT_TAGS, COLORS } from "@/lib/taxonomy";
import { detectColors } from "@/lib/detectColors";

function UploadForm() {
  const router = useRouter();
  const search = useSearchParams();
  const albumId = search.get("album");

  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [picked, setPicked] = useState(null); // {kind:'album', photo} | {kind:'file', dataUrl}
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("");
  const [tags, setTags] = useState([]);
  const [colors, setColors] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Auto-compile color tags from the chosen photo; user can adjust after.
  async function autoDetect(src) {
    setDetecting(true);
    try {
      setColors(await detectColors(src));
    } catch {
      setColors([]);
    }
    setDetecting(false);
  }

  useEffect(() => {
    fetch("/api/album")
      .then((r) => (r.ok ? r.json() : { photos: [] }))
      .then((d) => {
        setAlbumPhotos(d.photos || []);
        if (albumId) {
          const p = (d.photos || []).find((x) => x.id === albumId);
          if (p) {
            setPicked({ kind: "album", photo: p });
            setTitle(p.suggestedTitle || "");
            autoDetect(p.image);
          }
        }
      });
  }, [albumId]);

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPicked({ kind: "file", dataUrl: reader.result });
      autoDetect(reader.result);
    };
    reader.readAsDataURL(f);
  }

  function toggleTag(t) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function addCustomTag() {
    const t = customTag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setCustomTag("");
  }

  async function submit() {
    setBusy(true);
    setError("");
    const body = { title, tags, note, kind, colors };
    if (picked?.kind === "album") body.existingImage = picked.photo.image;
    if (picked?.kind === "file") body.imageDataUrl = picked.dataUrl;
    const res = await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok) {
      setBusy(false);
      return setError(d.error || "Couldn't post the outfit.");
    }
    if (picked?.kind === "album") {
      await fetch("/api/album", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: picked.photo.id }),
      });
    }
    router.push("/");
  }

  const preview = picked?.kind === "album" ? picked.photo.image : picked?.dataUrl;

  return (
    <div className="screen">
      <h1 className="mb">Add an outfit</h1>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <label>Photo</label>
        {preview ? (
          <img
            src={preview}
            alt="Selected outfit"
            style={{ width: "100%", borderRadius: 10, marginBottom: 10 }}
          />
        ) : (
          <p className="muted small mb">
            Pick from your Lending album below, or upload a photo.
          </p>
        )}
        {albumPhotos.length > 0 && (
          <>
            <p className="muted small mb">From your Lending album (simulated folder sync):</p>
            <div className="row mb" style={{ overflowX: "auto" }}>
              {albumPhotos.map((p) => (
                <img
                  key={p.id}
                  src={p.image}
                  alt={p.suggestedTitle}
                  onClick={() => {
                    setPicked({ kind: "album", photo: p });
                    if (!title) setTitle(p.suggestedTitle || "");
                    autoDetect(p.image);
                  }}
                  style={{
                    width: 84,
                    height: 105,
                    objectFit: "cover",
                    borderRadius: 8,
                    cursor: "pointer",
                    border:
                      picked?.kind === "album" && picked.photo.id === p.id
                        ? "3px solid var(--accent)"
                        : "3px solid transparent",
                  }}
                />
              ))}
            </div>
          </>
        )}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFile} />
      </div>

      <div className="card">
        <label>Name this outfit</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Emerald wrap dress"
        />
        <label>Type of clothing</label>
        <div className="tags mb">
          {KINDS.map((k) => (
            <button
              key={k.value}
              className={`tag kind ${kind === k.value ? "on" : ""}`}
              onClick={() => setKind(k.value)}
            >
              {k.label}
            </button>
          ))}
        </div>
        <label>Event style — how friends will find it</label>
        <div className="tags mb">
          {EVENT_TAGS.map((t) => (
            <button key={t} className={`tag ${tags.includes(t) ? "on" : ""}`} onClick={() => toggleTag(t)}>
              {t}
            </button>
          ))}
          {tags
            .filter((t) => !EVENT_TAGS.includes(t))
            .map((t) => (
              <button key={t} className="tag on" onClick={() => toggleTag(t)}>
                {t} ✕
              </button>
            ))}
        </div>
        <div className="row mb">
          <input
            style={{ marginBottom: 0 }}
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
            placeholder="Custom tag"
          />
          <button className="btn subtle" onClick={addCustomTag}>Add</button>
        </div>
        <label>
          Colors {detecting ? "· detecting…" : "· auto-detected from the photo, tap to adjust"}
        </label>
        <div className="tags mb">
          {Object.entries(COLORS).map(([name, hex]) => (
            <button
              key={name}
              className={`color-chip ${colors.includes(name) ? "on" : ""}`}
              onClick={() =>
                setColors((prev) =>
                  prev.includes(name)
                    ? prev.filter((c) => c !== name)
                    : [...prev, name].slice(-3)
                )
              }
            >
              <span className="color-dot" style={{ background: hex }} />
              {name}
            </button>
          ))}
        </div>
        <label>Notes for borrowers (size, fit, quirks)</label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Size M, runs a little long…"
        />
      </div>

      <button
        className="btn block"
        disabled={busy || !picked || !title || !kind || tags.length === 0}
        onClick={submit}
      >
        {busy ? "Posting…" : "Post to my closet"}
      </button>
      <p className="muted small center mt">
        New posts appear in your friends&rsquo; feeds.
      </p>
    </div>
  );
}

export default function Upload() {
  return (
    <>
      <Suspense fallback={<div className="screen" />}>
        <UploadForm />
      </Suspense>
      <Nav />
    </>
  );
}
