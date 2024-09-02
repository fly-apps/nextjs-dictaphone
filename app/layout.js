import "./globals.css";

export const metadata = {
  title: "Next.js Dictaphone",
  description: "A sample MDN Web Docs app that records audio snippets, with an Next.js/Tigris backend. ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
