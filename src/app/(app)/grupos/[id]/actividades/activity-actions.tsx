"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CriteriaPicker } from "@/components/CriteriaPicker";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  criteria_codes: string[];
  created_at: string;
}

interface FormData {
  title: string;
  description: string;
  criteria_codes: string[];
  newCriterion: string;
}

const EMPTY_FORM: FormData = { title: "", description: "", criteria_codes: [], newCriterion: "" };

export function ActivityActions({
  groupId,
  activities,
  groupStage,
  groupSubject,
}: {
  groupId: string;
  activities: Activity[];
  groupStage?: string;
  groupSubject?: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (activity: Activity) => {
    setEditing(activity);
    setForm({
      title: activity.title,
      description: activity.description || "",
      criteria_codes: activity.criteria_codes || [],
      newCriterion: "",
    });
    setShowForm(true);
  };

  const addCriterion = () => {
    const code = form.newCriterion.trim().toUpperCase();
    if (code && !form.criteria_codes.includes(code)) {
      setForm({ ...form, criteria_codes: [...form.criteria_codes, code], newCriterion: "" });
    }
  };

  const removeCriterion = (code: string) => {
    setForm({ ...form, criteria_codes: form.criteria_codes.filter((c) => c !== code) });
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      group_id: groupId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      criteria_codes: form.criteria_codes,
    };

    if (editing) {
      await supabase.from("activities").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("activities").insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    setEditing(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta actividad?")) return;
    const supabase = createClient();
    await supabase.from("activities").delete().eq("id", id);
    router.refresh();
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all min-h-[44px] text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva actividad
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-2xl p-8 space-y-6 shadow-2xl">
            <h3 className="text-2xl font-headline font-bold text-on-surface">
              {editing ? "Editar actividad" : "Nueva actividad"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Examen Tema 3 — Funciones"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <CriteriaPicker
                subjectId={null}
                selectedCodes={form.criteria_codes}
                onSelect={(codes) => setForm({ ...form, criteria_codes: codes })}
                stage={groupStage}
                subjectName={groupSubject}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 py-3 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all min-h-[44px] disabled:opacity-50"
              >
                {saving ? "Guardando..." : editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activities list */}
      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-surface-container-lowest rounded-xl border-l-4 border-secondary hover:shadow-md transition-all relative"
            >
              <Link
                href={`/grupos/${groupId}/actividades/${activity.id}`}
                className="block p-5 pr-20"
              >
                <h4 className="font-headline font-bold text-on-surface">{activity.title}</h4>
                {activity.description && (
                  <p className="text-sm text-on-surface-variant mt-1">{activity.description}</p>
                )}
                {activity.criteria_codes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {activity.criteria_codes.map((code) => (
                      <span
                        key={code}
                        className="text-xs font-medium px-2 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
              <div className="absolute top-3 right-3 flex gap-1">
                <button
                  onClick={() => openEdit(activity)}
                  className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(activity.id)}
                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={openCreate}
          className="border-2 border-dashed border-outline-variant rounded-xl p-10 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
        >
          <div className="w-14 h-14 bg-secondary-fixed rounded-2xl flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-secondary text-2xl">assignment</span>
          </div>
          <p className="font-headline font-bold text-on-surface mb-1">Crea tu primera actividad</p>
          <p className="text-sm text-on-surface-variant text-center">
            Define criterios de evaluación para correcciones criteriales.
          </p>
        </div>
      )}
    </>
  );
}
