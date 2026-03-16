"use client";

import { useState } from "react";
import { CurriculumUpload } from "./curriculum-upload";

export function CollapsibleUpload({ defaultOpen }: { defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-3 py-4 bg-surface-container-low rounded-xl border border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container transition-all min-h-[56px]"
      >
        <span className="material-symbols-outlined text-primary text-xl">
          upload_file
        </span>
        <span className="font-medium text-on-surface text-sm">
          Subir nuevo currículo
        </span>
      </button>
    );
  }

  return (
    <div className="relative">
      {!defaultOpen && (
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 z-10 p-1.5 hover:bg-surface-container rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-xl">
            close
          </span>
        </button>
      )}
      <CurriculumUpload />
    </div>
  );
}
