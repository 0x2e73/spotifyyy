import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Sidebar from "@/components/sidebar";
import "./globals.css";

// Polices Google Fonts utilisées dans tout le projet
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spotifyy",
  description: "Application web de gestion de playlists musicales avec MongoDB",
};

// Layout racine — applique le theme dark et la sidebar fixe
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Sidebar />
        {/* Contenu principal décalé par la largeur de la sidebar (w-60 = 240px) */}
        <main className="ml-60 min-h-screen p-8">{children}</main>
        {/* Notifications toast */}
        <Toaster />
      </body>
    </html>
  );
}
