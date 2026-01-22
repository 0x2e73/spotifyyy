import { ObjectId } from 'mongodb';

/**
 * Représente une chanson dans le catalogue
 */
export interface Song {
  _id?: ObjectId;
  title: string;
  artist: string;
  album: string;
  year: number;
  duration: number; // en secondes
  genre: string[];
  coverUrl: string;
  language: string;
}

/**
 * Représente une chanson ajoutée à une playlist
 */
export interface PlaylistSong {
  songId: string;
  addedAt: Date;
}

/**
 * Représente une playlist complète
 */
export interface Playlist {
  _id?: ObjectId;
  name: string;
  description: string;
  coverImage: string;
  createdBy: string;
  createdAt: Date;
  songs: PlaylistSong[];
}

/**
 * Paramètres de recherche pour les chansons
 */
export interface SearchParams {
  query?: string; // recherche dans titre/artiste
  genres?: string[];
  yearMin?: number;
  yearMax?: number;
}
