import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import "@fontsource/newsreader/500.css";
import "./globals.css";

export const metadata = {
  title: "Subdomain Manager",
  description: "Apne domain ke subdomains banao aur manage karo",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
