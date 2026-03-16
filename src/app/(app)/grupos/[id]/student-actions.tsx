"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImportStudents } from "./import-students";

interface Student {
  id: string;
  list_number: number | null;
  first_surname: string;
  second_surname: string | null;
  name: string;
  repeats: boolean;
}

interface StudentFormData {
  list_number: string;
  first_surname: string;
  second_surname: string;
  name: string;
  repeats: boolean;
}

const EMPTY_FORM: StudentFormData = {
  list_number: "",
  first_surname: "",
  second_surname: "",
  name: "",
  repeats: false,
};

interface GradeInfo {
  correctionId: string;
  grade: number;
  gradeLabel: string;
  isReviewed: boolean;
  aiConfidence: string | null;
}

export function StudentActions({
  groupId,
  students,
  gradesByStudent,
}: {
  groupId: string;
  students: Student[];
  gradesByStudent?: Map<string, GradeInfo>;
}) {
  const hasGrades = gradesByStudent && gradesByStudent.size > 0;
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const openCreateForm = () => {
    setEditingStudent(null);
    setForm({
      ...EMPTY_FORM,
      list_number: String((students.length || 0) + 1),
    });
    setShowForm(true);
  };

  const openEditForm = (student: Student) => {
    setEditingStudent(student);
    setForm({
      list_number: student.list_number?.toString() || "",
      first_surname: student.first_surname,
      second_surname: student.second_surname || "",
      name: student.name,
      repeats: student.repeats,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.first_surname.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      group_id: groupId,
      list_number: form.list_number ? parseInt(form.list_number, 10) : null,
      first_surname: form.first_surname.trim(),
      second_surname: form.second_surname.trim() || null,
      name: form.name.trim(),
      repeats: form.repeats,
    };

    if (editingStudent) {
      await supabase
        .from("students")
        .update(payload)
        .eq("id", editingStudent.id);
    } else {
      await supabase.from("students").insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingStudent(null);
    router.refresh();
  };

  const handleDelete = async (studentId: string) => {
    if (!confirm("¿Eliminar este alumno?")) return;
    setDeleting(studentId);

    const supabase = createClient();
    await supabase.from("students").delete().eq("id", studentId);

    setDeleting(null);
    router.refresh();
  };

  return (
    <>
      {/* Import modal */}
      {showImport && (
        <ImportStudents groupId={groupId} onClose={() => setShowImport(false)} />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-headline font-bold text-on-surface">
          Alumnos ({students.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary-container text-on-secondary-container rounded-xl hover:bg-secondary-container/80 transition-all min-h-[44px] text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Importar CSV
          </button>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all min-h-[44px] text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Añadir alumno
          </button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-2xl p-8 space-y-6 shadow-2xl">
            <h3 className="text-2xl font-headline font-bold text-on-surface">
              {editingStudent ? "Editar alumno" : "Nuevo alumno"}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1">
                    N.º lista
                  </label>
                  <input
                    type="number"
                    value={form.list_number}
                    onChange={(e) => setForm({ ...form, list_number: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-on-surface-variant block mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nombre"
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1">
                    Primer apellido *
                  </label>
                  <input
                    type="text"
                    value={form.first_surname}
                    onChange={(e) => setForm({ ...form, first_surname: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1">
                    Segundo apellido
                  </label>
                  <input
                    type="text"
                    value={form.second_surname}
                    onChange={(e) => setForm({ ...form, second_surname: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.repeats}
                  onChange={(e) => setForm({ ...form, repeats: e.target.checked })}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span className="text-sm text-on-surface">Repite curso</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowForm(false); setEditingStudent(null); }}
                className="flex-1 py-3 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.first_surname.trim()}
                className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all min-h-[44px] disabled:opacity-50"
              >
                {saving ? "Guardando..." : editingStudent ? "Guardar" : "Añadir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students list */}
      {students.length > 0 ? (
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest px-6 py-3 w-16">
                  N.º
                </th>
                <th className="text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest px-6 py-3">
                  Apellidos, Nombre
                </th>
                {hasGrades && (
                  <th className="text-center text-xs font-bold text-on-surface-variant uppercase tracking-widest px-4 py-3 w-20">
                    Nota
                  </th>
                )}
                <th className="text-right text-xs font-bold text-on-surface-variant uppercase tracking-widest px-6 py-3 w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const gradeInfo = gradesByStudent?.get(student.id);
                return (
                  <tr
                    key={student.id}
                    className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">
                      {student.list_number || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-on-surface">
                        {student.first_surname}
                        {student.second_surname ? ` ${student.second_surname}` : ""}
                        , {student.name}
                      </span>
                      {student.repeats && (
                        <span className="ml-2 text-xs font-bold px-1.5 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded">
                          Rep.
                        </span>
                      )}
                    </td>
                    {hasGrades && (
                      <td className="px-4 py-4 text-center">
                        {gradeInfo ? (
                          <a
                            href={`/resultados/${gradeInfo.correctionId}`}
                            className="inline-flex flex-col items-center gap-0.5 group/grade"
                          >
                            <span className={`text-base font-headline font-bold ${
                              gradeInfo.grade >= 5 ? "text-primary" : "text-error"
                            } group-hover/grade:underline`}>
                              {gradeInfo.grade.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-on-surface-variant leading-none">
                              {gradeInfo.gradeLabel}
                            </span>
                            {gradeInfo.isReviewed && (
                              <span className="material-symbols-outlined text-primary text-xs" style={{ fontSize: "12px" }}>
                                check_circle
                              </span>
                            )}
                          </a>
                        ) : (
                          <span className="text-xs text-on-surface-variant/40">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditForm(student)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          disabled={deleting === student.id}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {deleting === student.id ? "hourglass_empty" : "delete"}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          onClick={openCreateForm}
          className="border-2 border-dashed border-outline-variant rounded-xl p-10 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
        >
          <div className="w-14 h-14 bg-primary-fixed rounded-2xl flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
          </div>
          <p className="font-headline font-bold text-on-surface mb-1">
            Añade alumnos a este grupo
          </p>
          <p className="text-sm text-on-surface-variant text-center">
            Podrás vincular las correcciones a cada alumno.
          </p>
        </div>
      )}
    </>
  );
}
