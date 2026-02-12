# Vues API REST pour la gestion des chansons et des playlists
# Chaque vue interagit avec MongoDB via PyMongo (pas d'ORM Django)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from .db import get_songs_collection, get_playlists_collection


def serialize_doc(doc):
    """Convertit un document MongoDB en dict sérialisable.
    L'ObjectId de MongoDB n'est pas JSON-compatible, on le convertit en string."""
    if doc is None:
        return None
    doc['_id'] = str(doc['_id'])
    return doc


def serialize_docs(docs):
    """Convertit une liste de documents MongoDB en liste sérialisable."""
    return [serialize_doc(doc) for doc in docs]


def serialize_playlist(playlist):
    """Convertit une playlist MongoDB en dict sérialisable.
    Gère la conversion des ObjectId imbriqués dans le tableau songs[]."""
    if playlist is None:
        return None
    playlist['_id'] = str(playlist['_id'])
    # Convertit les songId ObjectId en strings dans le tableau songs
    for song_entry in playlist.get('songs', []):
        if isinstance(song_entry.get('songId'), ObjectId):
            song_entry['songId'] = str(song_entry['songId'])
    # Convertit les _id des songDetails issus du $lookup
    for detail in playlist.get('songDetails', []):
        if isinstance(detail.get('_id'), ObjectId):
            detail['_id'] = str(detail['_id'])
    return playlist


# ============== SONGS ==============

@api_view(['GET'])
def songs_list(request):
    """GET /api/songs/ - Liste les chansons avec filtres optionnels.
    Filtres supportés : query (recherche texte), genre, yearMin, yearMax."""
    collection = get_songs_collection()

    # Récupération des paramètres de filtre depuis la query string
    query = request.query_params.get('query')
    genre = request.query_params.get('genre')
    year_min = request.query_params.get('yearMin')
    year_max = request.query_params.get('yearMax')

    # Construction du filtre MongoDB dynamiquement
    filters = {}

    if query:
        # $or : cherche dans title, artist ou album
        # $regex + $options 'i' : recherche insensible à la casse
        filters['$or'] = [
            {'title': {'$regex': query, '$options': 'i'}},
            {'artist': {'$regex': query, '$options': 'i'}},
            {'album': {'$regex': query, '$options': 'i'}},
        ]

    if genre:
        # Filtre exact sur le champ genre (tableau de strings dans MongoDB)
        filters['genre'] = genre

    if year_min or year_max:
        # $gte / $lte : filtre par plage d'années
        filters['year'] = {}
        if year_min:
            filters['year']['$gte'] = int(year_min)
        if year_max:
            filters['year']['$lte'] = int(year_max)

    # find() avec les filtres — retourne tous les documents correspondants
    songs = list(collection.find(filters))
    return Response(serialize_docs(songs))


# ============== PLAYLISTS ==============

@api_view(['GET', 'POST'])
def playlists_list(request):
    """GET  /api/playlists/ - Liste toutes les playlists (MongoDB find)
    POST /api/playlists/ - Crée une nouvelle playlist (MongoDB insert_one)"""
    collection = get_playlists_collection()

    if request.method == 'GET':
        # find() sans filtre — retourne toutes les playlists
        playlists = list(collection.find())
        return Response([serialize_playlist(pl) for pl in playlists])

    elif request.method == 'POST':
        data = request.data

        if not data.get('name'):
            return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Structure du document playlist à insérer dans MongoDB
        new_playlist = {
            'name': data['name'],
            'description': data.get('description', ''),
            'coverImage': data.get('coverImage', ''),
            'createdBy': data.get('createdBy', 'anonymous'),
            'createdAt': datetime.utcnow(),
            'songs': [],  # Tableau vide, les chansons seront ajoutées via $push
        }

        # insert_one() — insère le document et retourne l'ObjectId généré
        result = collection.insert_one(new_playlist)
        new_playlist['_id'] = str(result.inserted_id)

        return Response(new_playlist, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
def playlist_detail(request, playlist_id):
    """GET    /api/playlists/<id>/ - Récupère une playlist avec $lookup pour joindre les chansons
    PUT    /api/playlists/<id>/ - Met à jour une playlist (MongoDB $set)
    DELETE /api/playlists/<id>/ - Supprime une playlist (MongoDB delete_one)"""
    collection = get_playlists_collection()

    # Conversion du string ID en ObjectId MongoDB
    try:
        oid = ObjectId(playlist_id)
    except InvalidId:
        return Response({'error': 'Invalid playlist ID'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        # Aggregation pipeline avec $lookup pour joindre les chansons
        # $match : filtre la playlist par _id
        # $lookup : jointure entre playlists.songs.songId et songs._id
        pipeline = [
            {'$match': {'_id': oid}},
            {'$lookup': {
                'from': 'songs',
                'localField': 'songs.songId',
                'foreignField': '_id',
                'as': 'songDetails',
            }},
        ]

        results = list(collection.aggregate(pipeline))
        if not results:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(serialize_playlist(results[0]))

    elif request.method == 'PUT':
        data = request.data
        update_data = {}

        # On ne met à jour que les champs envoyés
        if 'name' in data:
            update_data['name'] = data['name']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'coverImage' in data:
            update_data['coverImage'] = data['coverImage']
        if 'songs' in data:
            # Reconvertit les songId strings du frontend en ObjectId pour MongoDB
            update_data['songs'] = [
                {'songId': ObjectId(s['songId']), 'addedAt': s.get('addedAt', '')}
                for s in data['songs']
            ]

        # find_one_and_update() avec $set — modifie les champs spécifiés
        # return_document=True retourne le document APRÈS modification
        result = collection.find_one_and_update(
            {'_id': oid},
            {'$set': update_data},
            return_document=True
        )

        if not result:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(serialize_playlist(result))

    elif request.method == 'DELETE':
        # delete_one() — supprime le document correspondant
        result = collection.delete_one({'_id': oid})

        if result.deleted_count == 0:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'message': 'Playlist deleted'})


@api_view(['POST', 'DELETE'])
def playlist_songs(request, playlist_id):
    """POST   /api/playlists/<id>/songs/ - Ajoute une chanson ($push MongoDB)
    DELETE /api/playlists/<id>/songs/?songId= - Retire une chanson ($pull MongoDB)"""
    collection = get_playlists_collection()
    songs_collection = get_songs_collection()

    # Conversion du string ID en ObjectId MongoDB
    try:
        oid = ObjectId(playlist_id)
    except InvalidId:
        return Response({'error': 'Invalid playlist ID'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'POST':
        song_id = request.data.get('songId')

        if not song_id:
            return Response({'error': 'songId is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifie que la chanson existe dans la collection songs
        try:
            song_oid = ObjectId(song_id)
            song = songs_collection.find_one({'_id': song_oid})
            if not song:
                return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)
        except InvalidId:
            return Response({'error': 'Invalid song ID'}, status=status.HTTP_400_BAD_REQUEST)

        # $push — ajoute un élément au tableau 'songs' du document playlist
        result = collection.find_one_and_update(
            {'_id': oid},
            {'$push': {'songs': {'songId': song_oid, 'addedAt': datetime.utcnow()}}},
            return_document=True
        )

        if not result:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(serialize_playlist(result))

    elif request.method == 'DELETE':
        song_id = request.query_params.get('songId')

        if not song_id:
            return Response({'error': 'songId is required'}, status=status.HTTP_400_BAD_REQUEST)

        # $pull — retire l'élément du tableau 'songs' qui match le songId
        try:
            song_oid = ObjectId(song_id)
        except InvalidId:
            return Response({'error': 'Invalid song ID'}, status=status.HTTP_400_BAD_REQUEST)

        result = collection.find_one_and_update(
            {'_id': oid},
            {'$pull': {'songs': {'songId': song_oid}}},
            return_document=True
        )

        if not result:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(serialize_playlist(result))
