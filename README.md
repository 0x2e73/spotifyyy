# Spotifyyy

Application web pour créer et gérer des playlists avec recherche par tags.

**Projet scolaire** - Data Management - Trimestre 2 - 2025-2026

## Stack
- Next.js 14 (App Router)
- MongoDB (Docker)
- TypeScript

## Pourquoi MongoDB ?
- Structure variable des métadonnées (genres multiples, tags)
- Documents imbriqués (playlists → chansons)
- Pas de jointures nécessaires

## Fonctionnalités

**Gestion des playlists**
- Créer, modifier, supprimer des playlists
- Ajouter/retirer des chansons dans une playlist
- Afficher la liste complète des chansons d'une playlist

**Recherche et filtres**
- Recherche par titre, artiste, album
- Filtres par genre (Pop, Rock, Hip-Hop, Jazz, Électro...)
- Filtre par année de sortie
- Combinaison de plusieurs filtres simultanément

## Écrans
- `/` - Accueil
- `/playlists` - Liste des playlists
- `/playlists/[id]` - Détails d'une playlist
- `/songs` - Catalogue de chansons avec recherche

## Structure DB

**Collection `playlists`**
- `_id`, `name`, `description`, `coverImage`, `createdBy`, `createdAt`
- `songs[]`: `songId`, `addedAt`

**Collection `songs`**
- `_id`, `title`, `artist`, `album`, `year`, `duration`
- `genre[]`, `coverUrl`, `language`
- **Modèle**: basé sur la structure de l'API Spotify (champs adaptés au projet)

## Installation

```bash
docker-compose up -d
npm install
npm run seed
npm run dev
```

Ouvrir http://localhost:3000

## Notes
- Structure imbriquée évite les jointures
- Tags multiples flexibles
- Alternative: dénormalisation complète (plus rapide mais redondant)
