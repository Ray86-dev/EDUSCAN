"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Criterion {
  id: string;
  code: string;
  full_code: string;
  description: string;
  descriptors: string[] | null;
}

interface Competency {
  id: string;
  code: string;
  description: string;
  criteria: Criterion[];
}

export function CurriculumDetail({
  subjectId,
  competencies,
}: {
  subjectId: string;
  competencies: Competency[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const toggleExpanded = (compId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(compId)) next.delete(compId);
      else next.add(compId);
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(competencies.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este currículo? Se eliminarán todos los criterios asociados.")) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("curriculum_subjects").delete().eq("id", subjectId);
    router.push("/curriculos");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            Expandir todo
          </button>
          <span className="text-on-surface-variant">·</span>
          <button
            onClick={collapseAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            Colapsar todo
          </button>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-error hover:bg-error-container/30 rounded-lg transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">delete</span>
          Eliminar
        </button>
      </div>

      {/* Competencias */}
      {competencies.map((comp) => (
        <div
          key={comp.id}
          className="bg-surface-container-lowest rounded-xl overflow-hidden"
        >
          <button
            onClick={() => toggleExpanded(comp.id)}
            className="w-full flex items-center justify-between p-5 hover:bg-surface-container transition-colors text-left"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 bg-primary text-on-primary rounded-full">
                  {comp.code}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  {comp.criteria.length} criterios
                </span>
              </div>
              <p className="text-sm text-on-surface mt-2 leading-relaxed">
                {comp.description}
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-xl ml-3">
              {expanded.has(comp.id) ? "expand_less" : "expand_more"}
            </span>
          </button>

          {expanded.has(comp.id) && (
            <div className="border-t border-outline-variant/10 px-5 pb-5 space-y-4">
              {comp.criteria.map((cr) => (
                <div
                  key={cr.id}
                  className="flex gap-4 pt-4 border-t border-outline-variant/5 first:border-0 first:pt-3"
                >
                  <span className="text-sm font-bold text-secondary shrink-0 min-w-[55px]">
                    {cr.full_code}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-on-surface leading-relaxed">
                      {cr.description}
                    </p>
                    {cr.descriptors && cr.descriptors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cr.descriptors.map((d) => (
                          <span
                            key={d}
                            className="text-[10px] px-1.5 py-0.5 bg-surface-container rounded-full text-on-surface-variant font-medium"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
