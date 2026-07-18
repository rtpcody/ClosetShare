export default function Avatar({ user, size }) {
  if (!user) return null;
  return (
    <span
      className={`avatar ${size || ""}`}
      style={{ background: user.avatarColor }}
      aria-hidden="true"
    >
      {user.avatarEmoji}
    </span>
  );
}
