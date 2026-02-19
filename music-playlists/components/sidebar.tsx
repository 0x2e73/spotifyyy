"use client";

// Sidebar de navigation principale — style Spotify avec fond noir
// Contient les liens vers les playlists et le catalogue de chansons

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, ListMusic, Library } from "lucide-react";
import { cn } from "@/lib/utils";

// Liens de navigation de la sidebar
const navItems = [
  { href: "/", label: "Playlists", icon: Library },
  { href: "/songs", label: "Catalogue", icon: Music },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo / Titre de l'app */}
      <div className="flex items-center gap-2 px-6 py-5">
        <ListMusic className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold text-white">Salimifyy</span>
      </div>

      {/* Navigation principale */}
      <nav className="mt-2 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          // Vérifie si le lien est actif pour le style
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/playlists")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
