"use client";

// Page catalogue — affiche toutes les chansons avec recherche et filtres
// Utilise GET /api/songs/?query=&genre=&yearMin=&yearMax=
// Le backend utilise MongoDB $regex pour la recherche texte et $gte/$lte pour les filtres année

import { useEffect, useState } from "react";
import { fetchSongs, fetchPlaylists, addSongToPlaylist, type SongAPI, type PlaylistAPI } from "@/lib/api";
import SongRow from "@/components/song-row";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Search, ListPlus } from "lucide-react";
import { toast } from "sonner";

// Genres disponibles pour le filtre
const GENRES = [
  "Pop", "Rock", "Hip-Hop", "R&B", "Jazz", "Electronic",
  "Classical", "Metal", "Folk", "Country", "Reggae", "Blues",
];

export default function SongsPage() {
  const [songs, setSongs] = useState<SongAPI[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Charge les chansons avec les filtres actifs
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Construit les params pour l'API (traduits en filtres MongoDB côté backend)
        const params: { query?: string; genre?: string } = {};
        if (search) params.query = search;
        if (selectedGenre) params.genre = selectedGenre;

        const data = await fetchSongs(params);
        setSongs(data);
      } catch (err) {
        console.error("Erreur chargement chansons:", err);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [search, selectedGenre]);

  // Charge les playlists pour le menu "Ajouter à"
  useEffect(() => {
    fetchPlaylists().then(setPlaylists).catch(console.error);
  }, []);

  // Ajoute une chanson à une playlist choisie (MongoDB $push)
  async function handleAddToPlaylist(songId: string, playlistId: string, playlistName: string) {
    try {
      await addSongToPlaylist(playlistId, songId);
      toast.success(`Ajouté à "${playlistName}"`);
    } catch (err) {
      toast.error("Erreur lors de l'ajout");
    }
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Catalogue</h1>

      {/* Barre de recherche et filtres */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Recherche texte — envoyé comme $regex MongoDB */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre, artiste, album..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filtres par genre */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge
          variant={selectedGenre === null ? "default" : "secondary"}
          className="cursor-pointer"
          onClick={() => setSelectedGenre(null)}
        >
          Tous
        </Badge>
        {GENRES.map((genre) => (
          <Badge
            key={genre}
            variant={selectedGenre === genre ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() =>
              setSelectedGenre(selectedGenre === genre ? null : genre)
            }
          >
            {genre}
          </Badge>
        ))}
      </div>

      <Separator className="mb-4" />

      {/* Liste des chansons */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Aucune chanson trouvée
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

          {/* Chaque chanson avec un menu dropdown pour ajouter à une playlist */}
          {songs.map((song, i) => (
            <div key={song._id} className="group relative flex items-center">
              <div className="flex-1">
                <SongRow song={song} index={i} />
              </div>
              {/* Menu pour ajouter à une playlist */}
              {playlists.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="mr-2 opacity-0 group-hover:opacity-100"
                      title="Ajouter à une playlist"
                    >
                      <ListPlus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {playlists.map((pl) => (
                      <DropdownMenuItem
                        key={pl._id}
                        onClick={() =>
                          handleAddToPlaylist(song._id, pl._id, pl.name)
                        }
                      >
                        {pl.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}

          {/* Compteur de résultats */}
          <p className="mt-4 text-sm text-muted-foreground">
            {songs.length} chanson{songs.length !== 1 ? "s" : ""} trouvée{songs.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
