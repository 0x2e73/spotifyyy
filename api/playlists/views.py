from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from .db import get_songs_collection, get_playlists_collection


def serialize_doc(doc):
    """Convertit un document MongoDB en dict serializable."""
    if doc is None:
        return None
    doc['_id'] = str(doc['_id'])
    return doc


def serialize_docs(docs):
    """Convertit une liste de documents MongoDB."""
    return [serialize_doc(doc) for doc in docs]


# ============== SONGS ==============

@api_view(['GET'])
def songs_list(request):
    """GET /api/songs/ - Liste toutes les chansons avec filtres optionnels."""
    collection = get_songs_collection()

    # Filtres
    query = request.query_params.get('query')
    genre = request.query_params.get('genre')
    year_min = request.query_params.get('yearMin')
    year_max = request.query_params.get('yearMax')

    filters = {}

    if query:
        filters['$or'] = [
            {'title': {'$regex': query, '$options': 'i'}},
            {'artist': {'$regex': query, '$options': 'i'}},
            {'album': {'$regex': query, '$options': 'i'}},
        ]

    if genre:
        filters['genre'] = genre

    if year_min or year_max:
        filters['year'] = {}
        if year_min:
            filters['year']['$gte'] = int(year_min)
        if year_max:
            filters['year']['$lte'] = int(year_max)

    songs = list(collection.find(filters))
    return Response(serialize_docs(songs))


# ============== PLAYLISTS ==============

@api_view(['GET', 'POST'])
def playlists_list(request):
    """
    GET /api/playlists/ - Liste toutes les playlists
    POST /api/playlists/ - Crée une nouvelle playlist
    """
    collection = get_playlists_collection()

    if request.method == 'GET':
        playlists = list(collection.find())
        return Response(serialize_docs(playlists))

    elif request.method == 'POST':
        data = request.data

        if not data.get('name'):
            return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)

        new_playlist = {
            'name': data['name'],
            'description': data.get('description', ''),
            'coverImage': data.get('coverImage', ''),
            'createdBy': data.get('createdBy', 'anonymous'),
            'createdAt': datetime.utcnow(),
            'songs': [],
        }

        result = collection.insert_one(new_playlist)
        new_playlist['_id'] = str(result.inserted_id)

        return Response(new_playlist, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
def playlist_detail(request, playlist_id):
    """
    GET /api/playlists/<id>/ - Récupère une playlist
    PUT /api/playlists/<id>/ - Met à jour une playlist
    DELETE /api/playlists/<id>/ - Supprime une playlist
    """
    collection = get_playlists_collection()

    try:
        oid = ObjectId(playlist_id)
    except InvalidId:
        return Response({'error': 'Invalid playlist ID'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        playlist = collection.find_one({'_id': oid})
        if not playlist:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_doc(playlist))

    elif request.method == 'PUT':
        data = request.data
        update_data = {}

        if 'name' in data:
            update_data['name'] = data['name']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'coverImage' in data:
            update_data['coverImage'] = data['coverImage']

        result = collection.find_one_and_update(
            {'_id': oid},
            {'$set': update_data},
            return_document=True
        )

        if not result:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(serialize_doc(result))

    elif request.method == 'DELETE':
        result = collection.delete_one({'_id': oid})

        if result.deleted_count == 0:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'message': 'Playlist deleted'})


@api_view(['POST', 'DELETE'])
def playlist_songs(request, playlist_id):
    """
    POST /api/playlists/<id>/songs/ - Ajoute une chanson à la playlist
    DELETE /api/playlists/<id>/songs/?songId=<songId> - Retire une chanson
    """
    collection = get_playlists_collection()
    songs_collection = get_songs_collection()

    try:
        oid = ObjectId(playlist_id)
    except InvalidId:
        return Response({'error': 'Invalid playlist ID'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'POST':
        song_id = request.data.get('songId')

        if not song_id:
            return Response({'error': 'songId is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que la chanson existe
        try:
            song = songs_collection.find_one({'_id': ObjectId(song_id)})
            if not song:
                return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)
        except InvalidId:
            return Response({'error': 'Invalid song ID'}, status=status.HTTP_400_BAD_REQUEST)

        result = collection.find_one_and_update(
            {'_id': oid},
            {'$push': {'songs': {'songId': song_id, 'addedAt': datetime.utcnow()}}},
            return_document=True
        )

        if not result:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(serialize_doc(result))

    elif request.method == 'DELETE':
        song_id = request.query_params.get('songId')

        if not song_id:
            return Response({'error': 'songId is required'}, status=status.HTTP_400_BAD_REQUEST)

        result = collection.find_one_and_update(
            {'_id': oid},
            {'$pull': {'songs': {'songId': song_id}}},
            return_document=True
        )

        if not result:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(serialize_doc(result))