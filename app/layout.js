export const metadata = {
  title: "Subdomain Manager",
  description: "Apne domain ke subdomains banao aur manage karo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
