"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ProfileAvatarProps {
  userId: string;
  avatarUrl?: string;
  fullName: string;
}

export default function ProfileAvatar({ userId, avatarUrl, fullName }: ProfileAvatarProps) {
  const [preview, setPreview] = useState(avatarUrl || "");
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño (max 2MB)
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return;

    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;

      // Subir a Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Cachebust para forzar recarga
      const url = `${publicUrl}?t=${Date.now()}`;

      // Guardar en user_metadata
      await supabase.auth.updateUser({
        data: { avatar_url: url },
      });

      setPreview(url);
      startTransition(() => router.refresh());
    } catch {
      // Silencioso — el avatar se queda como estaba
    } finally {
      setUploading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="relative w-16 h-16 rounded-full group shrink-0"
      title="Cambiar foto de perfil"
    >
      {preview ? (
        <Image
          src={preview}
          alt={fullName}
          width={64}
          height={64}
          className="w-16 h-16 rounded-full object-cover"
        />
      ) : (
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary-container text-3xl">
            person
          </span>
        </div>
      )}

      {/* Overlay con icono de cámara */}
      <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 group-active:bg-black/30 transition-colors flex items-center justify-center">
        <span className="material-symbols-outlined text-white text-lg opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
          photo_camera
        </span>
      </div>

      {/* Badge de cámara siempre visible */}
      <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm border-2 border-surface-container-low">
        <span className="material-symbols-outlined text-on-primary text-xs">
          {uploading || isPending ? "hourglass_top" : "photo_camera"}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </button>
  );
}
