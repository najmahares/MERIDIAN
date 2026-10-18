import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian · Pharmacy Operations",
  description: "Point of sale and inventory for hospital pharmacy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
