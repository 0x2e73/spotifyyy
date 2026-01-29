import { ObjectId } from 'mongodb';

export interface Song {
  _id?: ObjectId;
  title: string;
  artist: string;
  album: string;
  year: number;
  duration: number;
  genre: string[];
  coverUrl: string;
  language: string;
}

export interface PlaylistSong {
  songId: string;
  addedAt: Date;
}

export interface Playlist {
  _id?: ObjectId;
  name: string;
  description: string;
  coverImage: string;
  createdBy: string;
  createdAt: Date;
  songs: PlaylistSong[];
}

export interface SearchParams {
  query?: string;
  genres?: string[];
  yearMin?: number;
  yearMax?: number;
}
