import "./globals.css";

export const metadata = {
  title: "ClosetShare",
  description: "Follow your friends' closets. Borrow what you need.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="phone">{children}</div>
      </body>
    </html>
  );
}
