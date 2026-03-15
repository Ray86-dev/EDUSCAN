"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Criterion {
  id: string;
  code: string;
  full_code: string;
  description: string;
  competency_code: string;
  competency_description: string;
}

interface CriteriaPickerProps {
  /** ID del curriculum_subject (si hay uno vinculado al grupo) */
  subjectId: string | null;
  /** Códigos seleccionados actualmente */
  selectedCodes: string[];
  /** Callback cuando cambia la selección */
  onSelect: (codes: string[]) => void;
  /** Etapa del grupo (para buscar currículos disponibles) */
  stage?: string;
  /** Asignatura del grupo (para auto-matchear currículo) */
  subjectName?: string;
}

export function CriteriaPicker({
  subjectId: initialSubjectId,
  selectedCodes,
  onSelect,
  stage,
  subjectName,
}: CriteriaPickerProps) {
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [subjects, setSubjects] = useState<{ id: string; subject_name: string; stage: string; course: string | null }[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");

  // Cargar lista de currículos disponibles
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      let query = supabase.from("curriculum_subjects").select("id, subject_name, stage, course");
      if (stage) query = query.eq("stage", stage);
      const { data } = await query.order("subject_name");
      setSubjects(data || []);

      // Auto-matchear si hay subjectName
      if (!initialSubjectId && subjectName && data) {
        const match = data.find(
          (s) => s.subject_name.toLowerCase().includes(subjectName.toLowerCase())
        );
        if (match) setSubjectId(match.id);
      }
    };
    load();
  }, [stage, subjectName, initialSubjectId]);

  // Cargar criterios cuando cambia el subject
  useEffect(() => {
    if (!subjectId) {
      setCriteria([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      const supabase = createClient();

      // Cargar competencias
      const { data: comps } = await supabase
        .from("curriculum_competencies")
        .select("id, code, description")
        .eq("subject_id", subjectId)
        .order("sort_order");

      if (!comps || comps.length === 0) {
        setCriteria([]);
        setLoading(false);
        return;
      }

      // Cargar criterios
      const { data: crs } = await supabase
        .from("curriculum_criteria")
        .select("id, competency_id, code, full_code, description, sort_order")
        .in("competency_id", comps.map((c) => c.id))
        .order("sort_order");

      // Mapear con datos de competencia
      const compMap = new Map(comps.map((c) => [c.id, c]));
      const mapped: Criterion[] = (crs || []).map((cr) => {
        const comp = compMap.get(cr.competency_id)!;
        return {
          id: cr.id,
          code: cr.code,
          full_code: cr.full_code,
          description: cr.description,
          competency_code: comp.code,
          competency_description: comp.description,
        };
      });

      setCriteria(mapped);
      setLoading(false);
    };
    load();
  }, [subjectId]);

  // Agrupar criterios por competencia
  const grouped = criteria.reduce((acc, cr) => {
    if (!acc[cr.competency_code]) {
      acc[cr.competency_code] = {
        code: cr.competency_code,
        description: cr.competency_description,
        criteria: [],
      };
    }
    acc[cr.competency_code].criteria.push(cr);
    return acc;
  }, {} as Record<string, { code: string; description: string; criteria: Criterion[] }>);

  // Filtrar por búsqueda
  const searchLower = search.toLowerCase();
  const filteredGroups = Object.values(grouped)
    .map((group) => ({
      ...group,
      criteria: search
        ? group.criteria.filter(
            (cr) =>
              cr.full_code.toLowerCase().includes(searchLower) ||
              cr.description.toLowerCase().includes(searchLower)
          )
        : group.criteria,
    }))
    .filter((group) => group.criteria.length > 0);

  const toggleCriterion = (fullCode: string) => {
    if (selectedCodes.includes(fullCode)) {
      onSelect(selectedCodes.filter((c) => c !== fullCode));
    } else {
      onSelect([...selectedCodes, fullCode]);
    }
  };

  const toggleCompetency = (compCode: string) => {
    const compCriteria = grouped[compCode]?.criteria || [];
    const compCodes = compCriteria.map((c) => c.full_code);
    const allSelected = compCodes.every((c) => selectedCodes.includes(c));

    if (allSelected) {
      onSelect(selectedCodes.filter((c) => !compCodes.includes(c)));
    } else {
      const newCodes = [...selectedCodes, ...compCodes.filter((c) => !selectedCodes.includes(c))];
      onSelect(newCodes);
    }
  };

  const addManual = () => {
    const code = manualInput.trim().toUpperCase();
    if (code && !selectedCodes.includes(code)) {
      onSelect([...selectedCodes, code]);
      setManualInput("");
    }
  };

  // Si no hay currículos o está en modo manual
  if (manualMode || (subjects.length === 0 && !subjectId)) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-on-surface-variant">
            Criterios de evaluación
          </label>
          {subjects.length > 0 && (
            <button
              onClick={() => setManualMode(false)}
              className="text-xs text-primary hover:underline"
            >
              Usar catálogo
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManual(); } }}
            placeholder="Ej: CE 1.1"
            className="flex-1 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
          />
          <button
            onClick={addManual}
            className="px-4 py-2.5 bg-secondary-container text-on-secondary-container rounded-xl text-sm font-medium hover:bg-secondary-container/80 transition-colors"
          >
            Añadir
          </button>
        </div>
        {selectedCodes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCodes.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-sm font-medium"
              >
                {code}
                <button onClick={() => onSelect(selectedCodes.filter((c) => c !== code))} className="hover:text-error">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
        {selectedCodes.length === 0 && (
          <p className="text-xs text-on-surface-variant">
            Sin criterios = corrección simple. Añade criterios para modo criterial.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-on-surface-variant">
          Criterios de evaluación
        </label>
        <button
          onClick={() => setManualMode(true)}
          className="text-xs text-primary hover:underline"
        >
          Modo manual
        </button>
      </div>

      {/* Subject selector (si no hay uno fijo) */}
      {!initialSubjectId && subjects.length > 0 && (
        <select
          value={subjectId || ""}
          onChange={(e) => setSubjectId(e.target.value || null)}
          className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
        >
          <option value="">Seleccionar currículo...</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.subject_name} ({s.stage}{s.course ? ` ${s.course}` : ""})
            </option>
          ))}
        </select>
      )}

      {/* Selected badges */}
      {selectedCodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCodes.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full text-xs font-medium"
            >
              {code}
              <button onClick={() => onSelect(selectedCodes.filter((c) => c !== code))} className="hover:text-error">
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <span className="text-sm text-on-surface-variant">Cargando criterios...</span>
        </div>
      ) : criteria.length > 0 ? (
        <>
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar criterio..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Accordion */}
          <div className="max-h-[300px] overflow-y-auto space-y-1 rounded-xl border border-outline-variant/20">
            {filteredGroups.map((group) => {
              const compCodes = group.criteria.map((c) => c.full_code);
              const allSelected = compCodes.every((c) => selectedCodes.includes(c));
              const someSelected = compCodes.some((c) => selectedCodes.includes(c));

              return (
                <div key={group.code} className="bg-surface-container-lowest">
                  <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-surface-container transition-colors">
                    <button
                      onClick={() => toggleCompetency(group.code)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        allSelected
                          ? "bg-primary border-primary"
                          : someSelected
                          ? "border-primary bg-primary/20"
                          : "border-outline-variant"
                      }`}
                    >
                      {(allSelected || someSelected) && (
                        <span className="material-symbols-outlined text-on-primary text-xs">
                          {allSelected ? "check" : "remove"}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const next = new Set(expanded);
                        if (next.has(group.code)) next.delete(group.code);
                        else next.add(group.code);
                        setExpanded(next);
                      }}
                      className="flex-1 flex items-center justify-between text-left"
                    >
                      <div>
                        <span className="text-xs font-bold text-primary">{group.code}</span>
                        <span className="text-xs text-on-surface-variant ml-2 line-clamp-1">
                          {group.description.substring(0, 80)}...
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-base ml-2">
                        {expanded.has(group.code) ? "expand_less" : "expand_more"}
                      </span>
                    </button>
                  </div>

                  {expanded.has(group.code) && (
                    <div className="pl-7 pr-3 pb-2 space-y-1">
                      {group.criteria.map((cr) => {
                        const isSelected = selectedCodes.includes(cr.full_code);
                        return (
                          <button
                            key={cr.id}
                            onClick={() => toggleCriterion(cr.full_code)}
                            className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors ${
                              isSelected ? "bg-primary-fixed/30" : "hover:bg-surface-container"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? "bg-primary border-primary" : "border-outline-variant"
                              }`}
                            >
                              {isSelected && (
                                <span className="material-symbols-outlined text-on-primary text-[10px]">check</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-secondary">{cr.full_code}</span>
                              <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 mt-0.5">
                                {cr.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : subjectId ? (
        <p className="text-xs text-on-surface-variant text-center py-2">
          No se encontraron criterios para este currículo.
        </p>
      ) : null}

      {selectedCodes.length === 0 && !loading && (
        <p className="text-xs text-on-surface-variant">
          Sin criterios = corrección simple. Selecciona criterios para modo criterial.
        </p>
      )}
    </div>
  );
}
