"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/", ico: "🏠", label: "Feed" },
  { href: "/search", ico: "🔎", label: "Search" },
  { href: "/upload", ico: "📸", label: "Add" },
  { href: "/requests", ico: "🔁", label: "Borrows", badge: "pendingBorrowRequests" },
  { href: "/people", ico: "👯", label: "Friends", badge: "pendingFriendRequests" },
];

export default function Nav() {
  const pathname = usePathname();
  const [badges, setBadges] = useState({});

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setBadges(d.badges || {}))
      .catch(() => {});
  }, [pathname]);

  return (
    <nav className="nav">
      {TABS.map((t) => {
        const n = t.badge ? badges[t.badge] : 0;
        return (
          <Link key={t.href} href={t.href} className={pathname === t.href ? "active" : ""}>
            <span className="ico">{t.ico}</span>
            {t.label}
            {n > 0 && <span className="dot">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
