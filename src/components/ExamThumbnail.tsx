"use client";

import { useState } from "react";

interface ExamThumbnailProps {
  src: string;
  alt?: string;
  pageNumber?: number;
  className?: string;
  maxHeight?: string;
  onClick?: () => void;
}

export default function ExamThumbnail({
  src,
  alt = "Examen",
  pageNumber,
  className = "",
  maxHeight = "400px",
  onClick,
}: ExamThumbnailProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-surface-container-low ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      } ${className}`}
      onClick={onClick}
    >
      {/* Skeleton shimmer mientras carga */}
      {status === "loading" && (
        <div className="absolute inset-0 animate-shimmer rounded-xl" />
      )}

      {/* Imagen */}
      {status !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={`w-full object-contain transition-opacity duration-300 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          style={{ maxHeight }}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}

      {/* Placeholder cuando falla */}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
          <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-outline">
              image_not_supported
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            Vista previa no disponible
          </p>
        </div>
      )}

      {/* Badge de página */}
      {pageNumber && status !== "error" && (
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-surface/90 backdrop-blur-sm rounded-lg text-xs font-bold text-on-surface shadow-sm">
          Pág. {pageNumber}
        </div>
      )}
    </div>
  );
}
