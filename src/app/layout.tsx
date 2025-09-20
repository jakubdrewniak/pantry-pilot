import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pantry Pilot",
  description: "Streamline meal planning with AI-powered recipe generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
