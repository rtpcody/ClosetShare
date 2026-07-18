"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";

export default function People() {
  const [users, setUsers] = useState([]);

  function load() {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) => setUsers(d.users || []));
  }
  useEffect(load, []);

  async function follow(userId) {
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    load();
  }

  async function respond(friendshipId, action) {
    await fetch(`/api/friends/${friendshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  const incoming = users.filter(
    (u) => u.friendship?.status === "pending" && !u.friendship.requestedByMe
  );
  const rest = users.filter((u) => !incoming.includes(u));

  function ActionFor({ u }) {
    const f = u.friendship;
    if (!f) {
      return (
        <button className="btn subtle" onClick={() => follow(u.id)}>
          Follow
        </button>
      );
    }
    if (f.status === "accepted") {
      return (
        <Link className="btn ghost" href={`/closet/${u.id}`}>
          Open closet
        </Link>
      );
    }
    if (f.requestedByMe) {
      return <span className="badge pending">Requested</span>;
    }
    return null;
  }

  return (
    <>
      <div className="screen">
        <h1 className="mb">Friends</h1>
        <p className="muted mb">
          Mutual-follow model: once you both follow each other, you can open each other&rsquo;s
          closets and borrow.
        </p>

        {incoming.length > 0 && (
          <>
            <h2>Follow requests</h2>
            {incoming.map((u) => (
              <div className="card" key={u.id}>
                <div className="row">
                  <Avatar user={u} />
                  <div style={{ flex: 1 }}>
                    <strong>{u.name}</strong>
                    <div className="muted small">
                      @{u.username}
                      {u.location ? ` · ${u.location}` : ""}
                    </div>
                  </div>
                </div>
                <div className="btn-row mt">
                  <button className="btn sage" onClick={() => respond(u.friendship.id, "accept")}>
                    Accept
                  </button>
                  <button className="btn ghost" onClick={() => respond(u.friendship.id, "decline")}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
            <hr className="divider" />
          </>
        )}

        <h2>People on ClosetShare</h2>
        {rest.map((u) => (
          <div className="card" key={u.id}>
            <div className="row">
              <Avatar user={u} />
              <div style={{ flex: 1 }}>
                <strong>{u.name}</strong>
                <div className="muted small">
                  @{u.username}
                  {u.location ? ` · ${u.location}` : ""} · {u.outfitCount} outfit
                  {u.outfitCount === 1 ? "" : "s"}
                </div>
                {u.bio && <div className="muted small">{u.bio}</div>}
              </div>
              <ActionFor u={u} />
            </div>
          </div>
        ))}
      </div>
      <Nav />
    </>
  );
}
