"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_USERS = [
  { username: "sarah", name: "Sarah Nguyen", emoji: "🌸" },
  { username: "maya", name: "Maya Patel", emoji: "✨" },
  { username: "jess", name: "Jess Rivera", emoji: "🪩" },
  { username: "tom", name: "Tom Okafor", emoji: "🎷" },
];

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(path, body) {
    setBusy(true);
    setError("");
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Something went wrong.");
    router.push("/");
  }

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <div className="center" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 52 }}>🚪</div>
        <div className="brand" style={{ fontSize: 34 }}>
          Closet<span>Share</span>
        </div>
        <p className="muted mt">
          Follow your friends&rsquo; closets. Borrow the outfit, skip the purchase.
        </p>
      </div>

      <div className="seg">
        <button className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>
          Sign in
        </button>
        <button className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>
          Create account
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {mode === "login" ? (
        <div className="card">
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. sarah"
            autoCapitalize="none"
          />
          <button
            className="btn block"
            disabled={busy || !username}
            onClick={() => submit("/api/auth/login", { username })}
          >
            Sign in
          </button>
          <hr className="divider" />
          <p className="muted small mb">Demo closets — hop into any of them:</p>
          <div className="btn-row" style={{ flexWrap: "wrap" }}>
            {DEMO_USERS.map((u) => (
              <button
                key={u.username}
                className="btn subtle"
                style={{ minWidth: "45%" }}
                disabled={busy}
                onClick={() => submit("/api/auth/login", { username: u.username })}
              >
                {u.emoji} {u.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <label>Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Kim" />
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="alexk"
            autoCapitalize="none"
          />
          <label>City (used for local-meetup vs shipping)</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Austin, TX"
          />
          <button
            className="btn block"
            disabled={busy || !username || !name}
            onClick={() => submit("/api/auth/signup", { username, name, location })}
          >
            Create account
          </button>
          <p className="muted small mt">
            Prototype note: no passwords yet — real auth comes with the production build.
          </p>
        </div>
      )}
    </div>
  );
}
