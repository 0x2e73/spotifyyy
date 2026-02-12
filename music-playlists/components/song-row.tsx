"use client";

// Ligne de chanson — utilisée dans le détail playlist et le catalogue
// Affiche titre, artiste, album, durée, genres et actions
// Supporte un mode sortable pour le drag-and-drop via @dnd-kit

import { useState } from "react";
import { Music, Plus, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration, type SongAPI } from "@/lib/api";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SongRowProps {
  song: SongAPI;
  index: number;
  // Action principale : ajouter ou supprimer selon le contexte
  onAdd?: (songId: string) => void;
  onRemove?: (songId: string) => void;
  // Active le mode drag-and-drop
  sortable?: boolean;
  // ID unique pour dnd-kit (utile si la même chanson apparaît plusieurs fois)
  sortableId?: string;
}

// Couleurs de fallback déterministes basées sur le titre
const COVER_COLORS = [
  "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c",
  "#3498db", "#9b59b6", "#e84393", "#00cec9", "#6c5ce7",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export default function SongRow({ song, index, onAdd, onRemove, sortable, sortableId }: SongRowProps) {
  const [imgError, setImgError] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId ?? song._id, disabled: !sortable });

  const style = sortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
        zIndex: isDragging ? 10 : undefined,
      }
    : undefined;

  return (
    <div
      ref={sortable ? setNodeRef : undefined}
      style={style}
      className="group flex items-center gap-4 rounded-md px-4 py-2 transition-colors hover:bg-muted"
    >
      {/* Poignée de drag */}
      {sortable && (
        <button
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Numéro de la chanson */}
      <span className="w-6 text-right text-sm text-muted-foreground">
        {index + 1}
      </span>

      {/* Cover miniature — fallback coloré avec initiale si l'image ne charge pas */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-secondary">
        {song.coverUrl && !imgError ? (
          <img
            src={song.coverUrl}
            alt={song.title}
            className="h-full w-full rounded object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center rounded text-xs font-bold text-white"
            style={{ backgroundColor: COVER_COLORS[hashString(song.title) % COVER_COLORS.length] }}
          >
            {song.title.charAt(0).toUpperCase()}
          </div>
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
