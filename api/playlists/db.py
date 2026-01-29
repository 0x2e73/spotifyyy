from pymongo import MongoClient
from django.conf import settings

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        _client = MongoClient(settings.MONGODB_URI)
        _db = _client.get_database()
    return _db

def get_songs_collection():
    return get_db()['songs']

def get_playlists_collection():
    return get_db()['playlists']
