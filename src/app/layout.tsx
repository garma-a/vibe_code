import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AASTMT Room Management System",
  description:
    "Room and Lecture Hall Management System for Arab Academy for Science, Technology & Maritime Transport",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
