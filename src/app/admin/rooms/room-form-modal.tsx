"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRoom, updateRoom } from "@/server/actions/rooms";
import type { Room } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function RoomFormModal({
  open,
  onOpenChange,
  room,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  onSaved: (room: Room) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (open) {
      if (room) {
        setName(room.name);
        setSlug(room.slug);
        setDescription(room.description);
        setCapacity(String(room.capacity));
        setLocation(room.location ?? "");
        setImageUrl(room.image_url ?? "");
        setImagePreview(room.image_url ?? null);
        setSlugManuallyEdited(true);
      } else {
        setName("");
        setSlug("");
        setDescription("");
        setCapacity("1");
        setLocation("");
        setImageUrl("");
        setImagePreview(null);
        setSlugManuallyEdited(false);
      }
    }
  }, [open, room]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? "Falha ao enviar imagem.");
        return;
      }
      const { fullUrl } = (await res.json()) as { fullUrl: string };
      setImageUrl(fullUrl);
      setImagePreview(fullUrl);
    } catch {
      toast.error("Erro ao enviar imagem. Tente novamente.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedCapacity = parseInt(capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity < 1) {
      toast.error("Capacidade inválida.");
      return;
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      capacity: parsedCapacity,
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(imageUrl ? { image_url: imageUrl } : {}),
    };

    startTransition(async () => {
      const res = room
        ? await updateRoom(room.id, payload)
        : await createRoom(payload);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success(room ? "Sala atualizada." : "Sala criada com sucesso.");
      onSaved(res.data);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100vh] overflow-y-auto sm:max-w-lg sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{room ? "Editar sala" : "Nova sala"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="room-name">Nome</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Sala de Reuniões A"
              required
              minLength={2}
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="room-slug">Slug</Label>
            <Input
              id="room-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManuallyEdited(true);
              }}
              placeholder="sala-reunioes-a"
              required
              pattern="[a-z0-9-]+"
              title="Apenas letras minúsculas, números e hífen"
            />
            <p className="text-xs text-stone-500">Apenas letras minúsculas, números e hífen.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="room-description">Descrição</Label>
            <Textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a sala brevemente..."
              required
              minLength={5}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="room-capacity">Capacidade</Label>
              <Input
                id="room-capacity"
                type="number"
                min={1}
                max={500}
                inputMode="numeric"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room-location">Localização</Label>
              <Input
                id="room-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bloco A, Piso 2"
                maxLength={200}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagem</Label>
            {imagePreview && (
              <div className="relative h-40 w-full overflow-hidden rounded-xl border border-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => { setImageUrl(""); setImagePreview(null); }}
                  className="absolute right-2 top-2 rounded-full bg-stone-950/50 p-1 text-white hover:bg-stone-950/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {imagePreview ? "Trocar imagem" : "Escolher imagem"}
                </>
              )}
            </Button>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending || uploadingImage}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || uploadingImage}>
              {isPending ? "Salvando..." : room ? "Salvar alterações" : "Criar sala"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
