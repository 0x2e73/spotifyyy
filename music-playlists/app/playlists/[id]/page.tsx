"use client";

// Page détails d'une playlist — affiche les infos et la liste des chansons
// Utilise GET /api/playlists/:id/ pour récupérer la playlist (MongoDB find_one)
// Utilise GET /api/songs/ pour résoudre les détails des chansons
// Utilise DELETE /api/playlists/:id/songs/?songId= pour retirer (MongoDB $pull)
// Supporte le drag-and-drop pour réordonner les chansons via @dnd-kit

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchPlaylist,
  fetchSongs,
  removeSongFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  type PlaylistAPI,
  type SongAPI,
} from "@/lib/api";
import SongRow from "@/components/song-row";
import AddSongsDialog from "@/components/add-songs-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, Music, Clock, Pencil, Check, X, Camera } from "lucide-react";
import { formatDuration } from "@/lib/api";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<PlaylistAPI | null>(null);
  const [songs, setSongs] = useState<SongAPI[]>([]);
  const [allSongs, setAllSongs] = useState<SongAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload d'image de cover — convertit en base64 et sauvegarde via PUT
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !playlist) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const updated = await updatePlaylist(playlistId, { coverImage: base64 });
        setPlaylist(updated);
      } catch (err) {
        console.error("Erreur upload cover:", err);
      }
    };
    reader.readAsDataURL(file);
    // Reset l'input pour pouvoir re-sélectionner le même fichier
    e.target.value = "";
  }

  // Sensors pour le drag-and-drop : activation immédiate avec seuil de distance minimal
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Charge la playlist et toutes les chansons pour résoudre les détails
  const loadData = useCallback(async () => {
    try {
      // Récupère la playlist par ID (MongoDB find_one avec ObjectId)
      const pl = await fetchPlaylist(playlistId);
      setPlaylist(pl);

      // Récupère tout le catalogue pour résoudre les songId en objets complets
      const allSongsData = await fetchSongs();
      setAllSongs(allSongsData);

      // Filtre les chansons qui sont dans la playlist et trie selon l'ordre MongoDB
      const songIds = pl.songs.map((s) => s.songId);
      const songsMap = new Map(allSongsData.map((s) => [s._id, s]));
      const playlistSongs = songIds
        .map((id) => songsMap.get(id))
        .filter((s): s is SongAPI => s !== undefined);
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

  // Active le mode édition avec les valeurs actuelles
  function startEditing() {
    if (!playlist) return;
    setEditName(playlist.name);
    setEditDescription(playlist.description);
    setEditing(true);
  }

  // Sauvegarde les modifications du nom/description via PUT
  async function saveEditing() {
    if (!playlist || !editName.trim()) return;
    try {
      const updated = await updatePlaylist(playlistId, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setPlaylist(updated);
      setEditing(false);
    } catch (err) {
      console.error("Erreur mise à jour playlist:", err);
    }
  }

  // Gère la fin du drag-and-drop : réordonne localement puis persiste via PUT
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !playlist) return;

    // Les IDs dnd-kit sont au format "songId-index", on extrait l'index
    const sortableIds = songs.map((s, i) => `${s._id}-${i}`);
    const oldIndex = sortableIds.indexOf(String(active.id));
    const newIndex = sortableIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    // Réordonne les chansons localement
    const reordered = arrayMove(songs, oldIndex, newIndex);
    setSongs(reordered);

    // Réordonne aussi le tableau songs de la playlist pour le PUT
    const reorderedPlaylistSongs = arrayMove(playlist.songs, oldIndex, newIndex);
    setPlaylist({ ...playlist, songs: reorderedPlaylistSongs });

    // Persiste le nouvel ordre dans MongoDB via PUT
    try {
      await updatePlaylist(playlistId, { songs: reorderedPlaylistSongs });
    } catch (err) {
      console.error("Erreur sauvegarde ordre:", err);
      // En cas d'erreur, recharge les données pour revenir à l'état serveur
      await loadData();
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
        {/* Cover de la playlist — cliquable pour changer l'image */}
        <div
          className="group/cover relative flex h-48 w-48 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-secondary shadow-lg"
          onClick={() => fileInputRef.current?.click()}
        >
          {playlist.coverImage ? (
            <img
              src={playlist.coverImage}
              alt={playlist.name}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <Music className="h-16 w-16 text-muted-foreground" />
          )}
          {/* Overlay au hover avec icône caméra */}
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover/cover:opacity-100">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
        </div>

        {/* Infos de la playlist — mode lecture ou édition */}
        <div className="flex flex-1 flex-col justify-end">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Playlist
          </p>

          {editing ? (
            <div className="mt-1 flex flex-col gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-2xl font-bold"
                placeholder="Nom de la playlist"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveEditing()}
              />
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="text-sm"
                placeholder="Description (optionnel)"
                onKeyDown={(e) => e.key === "Enter" && saveEditing()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEditing} className="gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Enregistrer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="gap-1">
                  <X className="h-3.5 w-3.5" />
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-1 flex items-center gap-2">
                <h1 className="text-4xl font-bold">{playlist.name}</h1>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={startEditing}
                  title="Modifier"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              {playlist.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {playlist.description}
                </p>
              )}
            </>
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

      {/* Liste des chansons de la playlist avec drag-and-drop */}
      {songs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Aucune chanson dans cette playlist. Ajoute des chansons pour commencer !
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={songs.map((s, i) => `${s._id}-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col">
              {/* En-tête du tableau */}
              <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
                <span className="w-4" />
                <span className="w-6 text-right">#</span>
                <span className="w-10" />
                <span className="flex-1">Titre</span>
                <span className="hidden w-40 md:block">Album</span>
                <span className="hidden lg:block lg:w-24">Genre</span>
                <span className="w-12 text-right">Durée</span>
                <span className="w-8" />
              </div>
              <Separator className="mb-1" />
              {/* Lignes de chansons avec drag-and-drop et action supprimer */}
              {songs.map((song, i) => (
                <SongRow
                  key={`${song._id}-${i}`}
                  song={song}
                  index={i}
                  onRemove={handleRemoveSong}
                  sortable
                  sortableId={`${song._id}-${i}`}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
