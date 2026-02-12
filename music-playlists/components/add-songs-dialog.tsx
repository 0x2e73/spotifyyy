"use client";

// Dialog pour ajouter des chansons à une playlist
// Recherche dans le catalogue via GET /api/songs/?query=... (filtre MongoDB $regex)
// Ajoute via POST /api/playlists/:id/songs/ (opération $push MongoDB)

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Check, Music } from "lucide-react";
import { fetchSongs, addSongToPlaylist, type SongAPI } from "@/lib/api";
import { formatDuration } from "@/lib/api";

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

function SongCover({ title, coverUrl }: { title: string; coverUrl: string }) {
  const [error, setError] = useState(false);
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-secondary">
      {coverUrl && !error ? (
        <img
          src={coverUrl}
          alt={title}
          className="h-full w-full rounded object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded text-xs font-bold text-white"
          style={{ backgroundColor: COVER_COLORS[hashString(title) % COVER_COLORS.length] }}
        >
          {title.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

interface AddSongsDialogProps {
  playlistId: string;
  // IDs des chansons déjà dans la playlist pour éviter les doublons
  existingSongIds: string[];
  onAdded: () => void;
}

export default function AddSongsDialog({
  playlistId,
  existingSongIds,
  onAdded,
}: AddSongsDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [songs, setSongs] = useState<SongAPI[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Charge les chansons depuis l'API quand la recherche change
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Requête vers Django qui utilise $regex MongoDB pour la recherche
        const data = await fetchSongs(search ? { query: search } : undefined);
        setSongs(data);
      } catch (err) {
        console.error("Erreur chargement chansons:", err);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce de 300ms pour éviter trop de requêtes

    return () => clearTimeout(timer);
  }, [search, open]);

  // Ajoute une chanson à la playlist via l'API
  async function handleAdd(songId: string) {
    try {
      await addSongToPlaylist(playlistId, songId);
      setAddedIds((prev) => new Set(prev).add(songId));
      onAdded();
    } catch (err) {
      console.error("Erreur ajout chanson:", err);
    }
  }

  // Reset quand on ferme le dialog
  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setSearch("");
      setAddedIds(new Set());
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter des chansons
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter des chansons</DialogTitle>
        </DialogHeader>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre, artiste..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Liste des résultats scrollable */}
        <ScrollArea className="h-80">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chargement...
            </p>
          ) : songs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun résultat
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {songs.map((song) => {
                // Vérifie si la chanson est déjà dans la playlist
                const alreadyIn =
                  existingSongIds.includes(song._id) || addedIds.has(song._id);

                return (
                  <div
                    key={song._id}
                    className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
                  >
                    <SongCover title={song.title} coverUrl={song.coverUrl} />
                    {/* Infos */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{song.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {song.artist} — {formatDuration(song.duration)}
                      </p>
                    </div>
                    {/* Bouton ajouter / déjà ajouté */}
                    {alreadyIn ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleAdd(song._id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
