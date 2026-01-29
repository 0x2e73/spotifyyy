from django.urls import path
from . import views

urlpatterns = [
    # Songs
    path('songs/', views.songs_list, name='songs_list'),

    # Playlists
    path('playlists/', views.playlists_list, name='playlists_list'),
    path('playlists/<str:playlist_id>/', views.playlist_detail, name='playlist_detail'),
    path('playlists/<str:playlist_id>/songs/', views.playlist_songs, name='playlist_songs'),
]
