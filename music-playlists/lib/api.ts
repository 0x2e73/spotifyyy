// Client API pour communiquer avec le backend Django REST
// Toutes les requêtes passent par localhost:8000/api/

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// --- Types de réponse API ---

export interface SongAPI {
  _id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  duration: number;
  genre: string[];
  coverUrl: string;
  language: string;
}

export interface PlaylistSongAPI {
  songId: string;
  addedAt: string;
}

export interface PlaylistAPI {
  _id: string;
  name: string;
  description: string;
  coverImage: string;
  createdBy: string;
  createdAt: string;
  songs: PlaylistSongAPI[];
}

// --- Songs ---

// Récupère la liste des chansons avec filtres optionnels
export async function fetchSongs(params?: {
  query?: string;
  genre?: string;
  yearMin?: number;
  yearMax?: number;
}): Promise<SongAPI[]> {
  const url = new URL(`${API_BASE}/songs/`);

  // Ajout des query params pour filtrer les résultats MongoDB
  if (params?.query) url.searchParams.set("query", params.query);
  if (params?.genre) url.searchParams.set("genre", params.genre);
  if (params?.yearMin) url.searchParams.set("yearMin", String(params.yearMin));
  if (params?.yearMax) url.searchParams.set("yearMax", String(params.yearMax));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Erreur lors du chargement des chansons");
  return res.json();
}

// --- Playlists ---

// Récupère toutes les playlists
export async function fetchPlaylists(): Promise<PlaylistAPI[]> {
  const res = await fetch(`${API_BASE}/playlists/`);
  if (!res.ok) throw new Error("Erreur lors du chargement des playlists");
  return res.json();
}

// Récupère une playlist par son ID MongoDB
export async function fetchPlaylist(id: string): Promise<PlaylistAPI> {
  const res = await fetch(`${API_BASE}/playlists/${id}/`);
  if (!res.ok) throw new Error("Playlist introuvable");
  return res.json();
}

// Crée une nouvelle playlist dans MongoDB
export async function createPlaylist(data: {
  name: string;
  description?: string;
  coverImage?: string;
}): Promise<PlaylistAPI> {
  const res = await fetch(`${API_BASE}/playlists/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur lors de la création de la playlist");
  return res.json();
}

// Met à jour une playlist existante
export async function updatePlaylist(
  id: string,
  data: { name?: string; description?: string; coverImage?: string }
): Promise<PlaylistAPI> {
  const res = await fetch(`${API_BASE}/playlists/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour");
  return res.json();
}

// Supprime une playlist par son ID MongoDB
export async function deletePlaylist(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/playlists/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression");
}

// --- Songs dans une playlist ---

// Ajoute une chanson à une playlist (via $push MongoDB)
export async function addSongToPlaylist(
  playlistId: string,
  songId: string
): Promise<PlaylistAPI> {
  const res = await fetch(`${API_BASE}/playlists/${playlistId}/songs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ songId }),
  });
  if (!res.ok) throw new Error("Erreur lors de l'ajout de la chanson");
  return res.json();
}

// Retire une chanson d'une playlist (via $pull MongoDB)
export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string
): Promise<PlaylistAPI> {
  const res = await fetch(
    `${API_BASE}/playlists/${playlistId}/songs/?songId=${songId}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Erreur lors du retrait de la chanson");
  return res.json();
}

// --- Utilitaires ---

// Formate la durée en secondes vers "m:ss"
export function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}
