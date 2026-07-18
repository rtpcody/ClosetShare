const LABELS = {
  available: "Available",
  reserved: "Reserved",
  "on-loan": "On loan",
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  completed: "Returned",
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{LABELS[status] || status}</span>;
}
