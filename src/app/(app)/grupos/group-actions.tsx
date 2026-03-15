"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  stage: string;
  course: string | null;
  subject: string | null;
  subject_code: string | null;
  created_at: string;
  student_count: number;
}

interface GroupFormData {
  name: string;
  stage: string;
  course: string;
  subject: string;
  subject_code: string;
}

const EMPTY_FORM: GroupFormData = {
  name: "",
  stage: "eso",
  course: "",
  subject: "",
  subject_code: "",
};

export function GroupActions({
  groups,
  stageLabels,
  stageColors,
}: {
  groups: Group[];
  stageLabels: Record<string, string>;
  stageColors: Record<string, { border: string; text: string }>;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [form, setForm] = useState<GroupFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openCreateForm = () => {
    setEditingGroup(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (group: Group) => {
    setEditingGroup(group);
    setForm({
      name: group.name,
      stage: group.stage,
      course: group.course || "",
      subject: group.subject || "",
      subject_code: group.subject_code || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      stage: form.stage,
      course: form.course.trim() || null,
      subject: form.subject.trim() || null,
      subject_code: form.subject_code.trim() || null,
    };

    if (editingGroup) {
      await supabase
        .from("groups")
        .update(payload)
        .eq("id", editingGroup.id);
    } else {
      await supabase.from("groups").insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingGroup(null);
    router.refresh();
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm("¿Eliminar este grupo y todos sus alumnos? Esta acción no se puede deshacer.")) return;
    setDeleting(groupId);

    const supabase = createClient();
    await supabase.from("groups").delete().eq("id", groupId);

    setDeleting(null);
    router.refresh();
  };

  return (
    <>
      {/* Create button */}
      <div className="mb-8 flex justify-end">
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all shadow-sm min-h-[44px]"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="font-medium">Nuevo Grupo</span>
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-2xl p-8 space-y-6 shadow-2xl">
            <h3 className="text-2xl font-headline font-bold text-on-surface">
              {editingGroup ? "Editar grupo" : "Nuevo grupo"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">
                  Nombre del grupo *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: 2º Bachillerato A"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">
                  Etapa
                </label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
                >
                  {Object.entries(stageLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1">
                    Curso
                  </label>
                  <input
                    type="text"
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                    placeholder="Ej: 2º"
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1">
                    Código asignatura
                  </label>
                  <input
                    type="text"
                    value={form.subject_code}
                    onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
                    placeholder="Ej: NOD"
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1">
                  Asignatura
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Ej: Matemáticas"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowForm(false); setEditingGroup(null); }}
                className="flex-1 py-3 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all min-h-[44px] disabled:opacity-50"
              >
                {saving ? "Guardando..." : editingGroup ? "Guardar cambios" : "Crear grupo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups grid */}
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => {
            const colors = stageColors[group.stage] || stageColors.eso;
            return (
              <div
                key={group.id}
                className={`bg-surface-container-lowest p-6 rounded-xl border-l-4 ${colors.border} hover:shadow-lg transition-all group relative`}
              >
                <div className="flex justify-between items-start">
                  <Link href={`/grupos/${group.id}`} className="flex-1">
                    <span className={`text-xs font-bold uppercase tracking-widest ${colors.text} mb-1 block`}>
                      {stageLabels[group.stage] || group.stage}
                    </span>
                    <h3 className="text-xl font-headline font-bold text-on-surface mb-1">
                      {group.name}
                    </h3>
                    {group.subject && (
                      <p className="text-sm text-on-surface-variant mb-4">
                        {group.subject}
                        {group.subject_code ? ` (${group.subject_code})` : ""}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-base ${colors.text}`}>group</span>
                      <span className="text-sm text-on-surface-variant">
                        {group.student_count} {group.student_count === 1 ? "estudiante" : "estudiantes"}
                      </span>
                    </div>
                  </Link>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditForm(group)}
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      disabled={deleting === group.id}
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {deleting === group.id ? "hourglass_empty" : "delete"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          onClick={openCreateForm}
          className="border-2 border-dashed border-outline-variant rounded-xl p-12 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
        >
          <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">school</span>
          </div>
          <p className="font-headline font-bold text-lg text-on-surface mb-1">
            Crea tu primer grupo
          </p>
          <p className="text-sm text-on-surface-variant">
            Organiza tus alumnos por clase para vincularlos a las correcciones.
          </p>
        </div>
      )}
    </>
  );
}
