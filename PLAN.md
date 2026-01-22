# Plan de travail - Gestionnaire de Playlists Musicales

## Jeudi 1 - 29 janvier 2026
**Objectif: Setup projet + MongoDB + Base de données**

### À faire:
1. Initialiser le projet Next.js
   - `npx create-next-app@latest music-playlists --typescript --tailwind --app`
   - Configurer la structure de base

2. Setup Docker pour MongoDB
   - Créer `docker-compose.yml`
   - Lancer le container MongoDB
   - Vérifier la connexion

3. Importer les données de test
   - Utiliser le fichier `songs.json` généré
   - Importer dans MongoDB via mongoimport
   - Vérifier que les données sont bien présentes

4. Connexion Next.js ↔ MongoDB
   - Installer le driver MongoDB: `npm install mongodb`
   - Créer la configuration de connexion (`lib/mongodb.ts`)
   - Tester une requête simple

**Livrable fin de journée:** Projet Next.js fonctionnel avec MongoDB connecté et données importées

---

## Jeudi 2 - 5 février 2026
**Objectif: Fonctionnalité #1 - Gestion des playlists**

### À faire:
1. Créer les API Routes pour playlists
   - `POST /api/playlists` - Créer une playlist
   - `GET /api/playlists` - Lister toutes les playlists
   - `GET /api/playlists/[id]` - Détails d'une playlist
   - `DELETE /api/playlists/[id]` - Supprimer une playlist

2. Créer les pages frontend
   - Page liste des playlists (`/playlists`)
   - Page détails d'une playlist (`/playlists/[id]`)
   - Formulaire de création de playlist

3. Ajouter/retirer des chansons dans une playlist
   - `POST /api/playlists/[id]/songs` - Ajouter une chanson
   - `DELETE /api/playlists/[id]/songs/[songId]` - Retirer une chanson

**Livrable fin de journée:** CRUD complet des playlists fonctionnel

---

## Jeudi 3 - 12 février 2026
**Objectif: Fonctionnalité #2 - Recherche et filtres**

### À faire:
1. Créer l'API de recherche
   - `GET /api/songs/search` avec query params (title, artist, genre, mood, year)
   - Utiliser les opérateurs MongoDB (`$regex`, `$in`, `$gte`, `$lte`)
   - Tester avec différents filtres

2. Créer l'interface de recherche
   - Barre de recherche par titre/artiste
   - Filtres par genre (checkboxes)
   - Filtres par mood (checkboxes)
   - Filtre par année (range slider ou input)
   - Affichage des résultats en grille

3. Page catalogue de toutes les chansons
   - Afficher toutes les chansons avec pagination
   - Pouvoir ajouter une chanson à une playlist depuis le catalogue

**Livrable fin de journée:** Recherche avancée fonctionnelle avec tous les filtres

---

## Jeudi 4 - 19 février 2026
**Objectif: Finalisation + Documentation + Tests**

### À faire:
1. Peaufinage de l'interface
   - Améliorer le design des pages
   - Ajouter des images de couverture
   - Responsive design basique

2. Tests et vérification
   - Tester toutes les fonctionnalités
   - Vérifier que les requêtes MongoDB fonctionnent bien
   - Corriger les bugs

3. Préparer les livrables
   - Exporter la base de données complète: `mongodump`
   - Vérifier que le README est à jour
   - Créer les slides pour la présentation (9 points requis)
   - Rédiger le rapport PDF (9 sections requises)

4. Préparer la démo
   - Script de démo pour la présentation du 5 mars
   - Screenshots de l'application
   - Préparer les exemples de code pertinents à montrer

**Livrable fin de journée:** Projet complet + Rapport + Slides + Export MongoDB

---

## Deadline: 19 février 2026, 23h59
**À soumettre sur Moodle (fichier zip):**
- Code complet de l'application Next.js
- Export de la base de données MongoDB complète
- Rapport en PDF (9 sections)
- Slides de présentation

**Nom du fichier:** `VOTRENOM_projet_dm.zip`

---

## Présentation orale: 5 mars 2026, 08h05
**Durée:** 10 minutes

**Points à présenter:**
1. Contexte métier (gestion de playlists musicales)
2. But et fonctionnalités
3. Architecture (Next.js + MongoDB)
4. Justification du choix MongoDB
5. Structure des collections (playlists, songs)
6. Démonstration de l'application
7. Présentation du code (interactions avec MongoDB)
8. Conclusion (avantages/inconvénients MongoDB)
