"use client";

// Dialog de création de playlist — formulaire avec nom et description
// Appelle POST /api/playlists/ pour insérer un nouveau document dans MongoDB

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Camera, Music, X } from "lucide-react";
import { createPlaylist } from "@/lib/api";

interface CreatePlaylistDialogProps {
  // Callback appelé après la création pour rafraîchir la liste
  onCreated: () => void;
}

export default function CreatePlaylistDialog({ onCreated }: CreatePlaylistDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // Envoie la requête POST au backend pour créer la playlist
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createPlaylist({
        name: name.trim(),
        description: description.trim(),
        coverImage: coverImage || undefined,
      });
      // Reset du formulaire et fermeture du dialog
      setName("");
      setDescription("");
      setCoverImage("");
      setOpen(false);
      onCreated();
    } catch (err) {
      console.error("Erreur création playlist:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Image de cover — optionnel */}
          <div className="flex justify-center">
            <div
              className="group/cover relative flex h-32 w-32 cursor-pointer items-center justify-center rounded-lg bg-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverImage ? (
                <>
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="h-full w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white opacity-0 transition-opacity group-hover/cover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); setCoverImage(""); }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Ajouter une image</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </div>
          {/* Champ nom — obligatoire */}
          <div>
            <label className="mb-1 block text-sm font-medium">Nom</label>
            <Input
              placeholder="Ma playlist..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {/* Champ description — optionnel */}
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Input
              placeholder="Une courte description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? "Création..." : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
