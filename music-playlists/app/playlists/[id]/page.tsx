"use client";

// Page détails d'une playlist — affiche les infos et la liste des chansons
// Utilise GET /api/playlists/:id/ pour récupérer la playlist (MongoDB find_one)
// Utilise GET /api/songs/ pour résoudre les détails des chansons
// Utilise DELETE /api/playlists/:id/songs/?songId= pour retirer (MongoDB $pull)

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchPlaylist,
  fetchSongs,
  removeSongFromPlaylist,
  deletePlaylist,
  type PlaylistAPI,
  type SongAPI,
} from "@/lib/api";
import SongRow from "@/components/song-row";
import AddSongsDialog from "@/components/add-songs-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Trash2, Music, Clock } from "lucide-react";
import { formatDuration } from "@/lib/api";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<PlaylistAPI | null>(null);
  const [songs, setSongs] = useState<SongAPI[]>([]);
  const [allSongs, setAllSongs] = useState<SongAPI[]>([]);
  const [loading, setLoading] = useState(true);

  // Charge la playlist et toutes les chansons pour résoudre les détails
  const loadData = useCallback(async () => {
    try {
      // Récupère la playlist par ID (MongoDB find_one avec ObjectId)
      const pl = await fetchPlaylist(playlistId);
      setPlaylist(pl);

      // Récupère tout le catalogue pour résoudre les songId en objets complets
      const allSongsData = await fetchSongs();
      setAllSongs(allSongsData);

      // Filtre les chansons qui sont dans la playlist
      const songIds = pl.songs.map((s) => s.songId);
      const playlistSongs = allSongsData.filter((s) =>
        songIds.includes(s._id)
      );
      setSongs(playlistSongs);
    } catch (err) {
      console.error("Erreur chargement playlist:", err);
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Retire une chanson de la playlist (MongoDB $pull sur le tableau songs)
  async function handleRemoveSong(songId: string) {
    try {
      await removeSongFromPlaylist(playlistId, songId);
      await loadData();
    } catch (err) {
      console.error("Erreur retrait chanson:", err);
    }
  }

  // Supprime la playlist entiere (MongoDB delete_one)
  async function handleDelete() {
    if (!confirm("Supprimer cette playlist ?")) return;
    try {
      await deletePlaylist(playlistId);
      router.push("/");
    } catch (err) {
      console.error("Erreur suppression playlist:", err);
    }
  }

  // Calcule la durée totale de la playlist
  const totalDuration = songs.reduce((acc, s) => acc + s.duration, 0);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          <Skeleton className="h-48 w-48 rounded-lg" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return <p className="text-muted-foreground">Playlist introuvable.</p>;
  }

  return (
    <div>
      {/* Bouton retour */}
      <Button
        variant="ghost"
        className="mb-6 gap-2"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      {/* Header de la playlist — cover, nom, description, stats */}
      <div className="mb-8 flex gap-6">
        {/* Cover de la playlist */}
        <div className="flex h-48 w-48 shrink-0 items-center justify-center rounded-lg bg-secondary shadow-lg">
          {playlist.coverImage ? (
            <img
              src={playlist.coverImage}
              alt={playlist.name}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <Music className="h-16 w-16 text-muted-foreground" />
          )}
        </div>

        {/* Infos de la playlist */}
        <div className="flex flex-col justify-end">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Playlist
          </p>
          <h1 className="mt-1 text-4xl font-bold">{playlist.name}</h1>
          {playlist.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {playlist.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{songs.length} chanson{songs.length !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions — ajouter des chansons, supprimer la playlist */}
      <div className="mb-4 flex items-center gap-3">
        <AddSongsDialog
          playlistId={playlistId}
          existingSongIds={playlist.songs.map((s) => s.songId)}
          onAdded={loadData}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-destructive"
          title="Supprimer la playlist"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      <Separator className="mb-4" />

      {/* Liste des chansons de la playlist */}
      {songs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Aucune chanson dans cette playlist. Ajoute des chansons pour commencer !
        </p>
      ) : (
        <div className="flex flex-col">
          {/* En-tête du tableau */}
          <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
            <span className="w-6 text-right">#</span>
            <span className="w-10" />
            <span className="flex-1">Titre</span>
            <span className="hidden w-40 md:block">Album</span>
            <span className="hidden lg:block lg:w-24">Genre</span>
            <span className="w-12 text-right">Durée</span>
            <span className="w-8" />
          </div>
          <Separator className="mb-1" />
          {/* Lignes de chansons avec action supprimer */}
          {songs.map((song, i) => (
            <SongRow
              key={song._id}
              song={song}
              index={i}
              onRemove={handleRemoveSong}
            />
          ))}
        </div>
      )}
    </div>
  );
}
