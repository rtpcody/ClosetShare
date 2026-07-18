export default function Avatar({ user, size }) {
  if (!user) return null;
  if (user.photo) {
    return (
      <img
        className={`avatar ${size || ""}`}
        src={user.photo}
        alt={user.name}
        style={{ objectFit: "cover" }}
      />
    );
  }
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
