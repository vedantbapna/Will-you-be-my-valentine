import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Will You Be My Valentine?",
  description: "A playful Valentine surprise."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
