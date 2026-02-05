"use client";

// Dialog de création de playlist — formulaire avec nom et description
// Appelle POST /api/playlists/ pour insérer un nouveau document dans MongoDB

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { createPlaylist } from "@/lib/api";

interface CreatePlaylistDialogProps {
  // Callback appelé après la création pour rafraîchir la liste
  onCreated: () => void;
}

export default function CreatePlaylistDialog({ onCreated }: CreatePlaylistDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Envoie la requête POST au backend pour créer la playlist
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createPlaylist({ name: name.trim(), description: description.trim() });
      // Reset du formulaire et fermeture du dialog
      setName("");
      setDescription("");
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
