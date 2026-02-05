"use client";

// Card de playlist — affichée dans la grille de la page d'accueil
// Montre le nom, la description et le nombre de chansons

import Link from "next/link";
import { Music } from "lucide-react";
import type { PlaylistAPI } from "@/lib/api";

interface PlaylistCardProps {
  playlist: PlaylistAPI;
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <Link href={`/playlists/${playlist._id}`}>
      <div className="group cursor-pointer rounded-lg bg-card p-4 transition-colors hover:bg-muted">
        {/* Cover image ou placeholder */}
        <div className="mb-4 flex aspect-square items-center justify-center rounded-md bg-secondary shadow-lg">
          {playlist.coverImage ? (
            <img
              src={playlist.coverImage}
              alt={playlist.name}
              className="h-full w-full rounded-md object-cover"
            />
          ) : (
            <Music className="h-12 w-12 text-muted-foreground" />
          )}
        </div>

        {/* Infos de la playlist */}
        <h3 className="truncate text-sm font-semibold text-foreground">
          {playlist.name}
        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {playlist.description || "Aucune description"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {playlist.songs.length} chanson{playlist.songs.length !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}
