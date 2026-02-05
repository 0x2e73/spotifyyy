"use client";

// Page d'accueil — affiche toutes les playlists sous forme de grille
// Données récupérées via GET /api/playlists/ (lecture collection MongoDB "playlists")

import { useEffect, useState } from "react";
import { fetchPlaylists, type PlaylistAPI } from "@/lib/api";
import PlaylistCard from "@/components/playlist-card";
import CreatePlaylistDialog from "@/components/create-playlist-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [playlists, setPlaylists] = useState<PlaylistAPI[]>([]);
  const [loading, setLoading] = useState(true);

  // Charge les playlists depuis l'API Django → MongoDB find()
  async function loadPlaylists() {
    try {
      const data = await fetchPlaylists();
      setPlaylists(data);
    } catch (err) {
      console.error("Erreur chargement playlists:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaylists();
  }, []);

  return (
    <div>
      {/* Header avec titre et bouton de création */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mes Playlists</h1>
        <CreatePlaylistDialog onCreated={loadPlaylists} />
      </div>

      {/* Grille de playlists — skeleton pendant le chargement */}
      {loading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg bg-card p-4">
              <Skeleton className="aspect-square w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : playlists.length === 0 ? (
        // Message si aucune playlist n'existe encore
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">Aucune playlist pour le moment</p>
          <p className="text-sm">Crée ta première playlist pour commencer !</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist._id} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  );
}
