# Connexion à la base de données MongoDB via PyMongo
# Utilise un pattern singleton pour réutiliser la connexion

from pymongo import MongoClient
from django.conf import settings

_client = None
_db = None


def get_db():
    """Retourne l'instance de la base de données MongoDB.
    Crée la connexion au premier appel, puis la réutilise (singleton)."""
    global _client, _db
    if _db is None:
        # Connexion via l'URI définie dans settings.py (ex: mongodb://mongodb:27017/musicdb)
        _client = MongoClient(settings.MONGODB_URI)
        _db = _client.get_database()
    return _db


def get_songs_collection():
    """Accède à la collection 'songs' contenant le catalogue de chansons."""
    return get_db()['songs']


def get_playlists_collection():
    """Accède à la collection 'playlists' contenant les playlists des utilisateurs."""
    return get_db()['playlists']
