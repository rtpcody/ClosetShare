"use client";

// Build and download an all-day calendar event (.ics) for returning an item —
// the calendar integration we're sure about: it never reads the user's
// calendar, it only offers to add the return date to it.
export function downloadReturnIcs(outfitTitle, ownerName, dateStr) {
  const d = dateStr.replace(/-/g, "");
  const next = new Date(dateStr + "T00:00:00Z");
  next.setUTCDate(next.getUTCDate() + 1);
  const dEnd = next.toISOString().slice(0, 10).replace(/-/g, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClosetShare//Prototype//EN",
    "BEGIN:VEVENT",
    `UID:closetshare-${Date.now()}@prototype`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${dEnd}`,
    `SUMMARY:Return "${outfitTitle}" to ${ownerName} (ClosetShare)`,
    "DESCRIPTION:Ship it back with the prepaid return label or arrange your meetup.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "closetshare-return.ics";
  a.click();
  URL.revokeObjectURL(a.href);
}
