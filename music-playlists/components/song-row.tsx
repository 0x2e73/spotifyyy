"use client";

// Ligne de chanson — utilisée dans le détail playlist et le catalogue
// Affiche titre, artiste, album, durée, genres et actions

import { Music, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration, type SongAPI } from "@/lib/api";

interface SongRowProps {
  song: SongAPI;
  index: number;
  // Action principale : ajouter ou supprimer selon le contexte
  onAdd?: (songId: string) => void;
  onRemove?: (songId: string) => void;
}

export default function SongRow({ song, index, onAdd, onRemove }: SongRowProps) {
  return (
    <div className="group flex items-center gap-4 rounded-md px-4 py-2 transition-colors hover:bg-muted">
      {/* Numéro de la chanson */}
      <span className="w-6 text-right text-sm text-muted-foreground">
        {index + 1}
      </span>

      {/* Cover miniature */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-secondary">
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={song.title}
            className="h-full w-full rounded object-cover"
          />
        ) : (
          <Music className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Titre et artiste */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {song.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
      </div>

      {/* Album */}
      <p className="hidden w-40 truncate text-sm text-muted-foreground md:block">
        {song.album}
      </p>

      {/* Genres sous forme de badges */}
      <div className="hidden gap-1 lg:flex">
        {song.genre.slice(0, 2).map((g) => (
          <Badge key={g} variant="secondary" className="text-xs">
            {g}
          </Badge>
        ))}
      </div>

      {/* Durée formatée */}
      <span className="w-12 text-right text-sm text-muted-foreground">
        {formatDuration(song.duration)}
      </span>

      {/* Bouton d'action contextuel */}
      {onAdd && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onAdd(song._id)}
          className="opacity-0 group-hover:opacity-100"
          title="Ajouter à la playlist"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(song._id)}
          className="text-destructive opacity-0 group-hover:opacity-100"
          title="Retirer de la playlist"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
