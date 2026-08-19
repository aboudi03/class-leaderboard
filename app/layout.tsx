import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Level Up Heroes",
  description: "Gamified classroom behavior and achievement platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
