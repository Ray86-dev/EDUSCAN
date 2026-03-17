"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseStudentsFromWorkbook, type ParsedStudent } from "@/lib/import/parse-students";

interface ImportStudentsProps {
  groupId: string;
  onClose: () => void;
}

export function ImportStudents({ groupId, onClose }: ImportStudentsProps) {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "preview" | "importing" | "done">("select");
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const buffer = await file.arrayBuffer();
    const result = parseStudentsFromWorkbook(buffer);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.students.length === 0) {
      setError("No se encontraron alumnos en el archivo.");
      return;
    }

    setStudents(result.students);
    setStep("preview");
  };

  const handleImport = async () => {
    setStep("importing");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rows = students.map((s) => ({
      user_id: user.id,
      group_id: groupId,
      list_number: s.list_number,
      first_surname: s.first_surname,
      second_surname: s.second_surname,
      name: s.name,
      repeats: false,
    }));

    const { error: insertError } = await supabase.from("students").insert(rows);

    if (insertError) {
      setError("Error importando: " + insertError.message);
      setStep("preview");
      return;
    }

    setImportedCount(rows.length);
    setStep("done");
    router.refresh();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-2xl rounded-2xl p-8 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-headline font-bold text-on-surface">
            Importar alumnos
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-lg">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Step: Select file */}
        {step === "select" && (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Sube un archivo CSV o Excel exportado de Pincel Ekade u otro sistema.
              El archivo debe tener columnas: <strong>Nº, PRIMER APELLIDO, SEGUNDO APELLIDO, NOMBRE</strong>.
            </p>
            <div
              onClick={() => document.getElementById("import-file")?.click()}
              className="border-2 border-dashed border-outline-variant rounded-xl p-10 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 bg-primary-fixed rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">upload_file</span>
              </div>
              <p className="font-headline font-bold text-on-surface">
                Seleccionar archivo
              </p>
              <p className="text-xs text-on-surface-variant">CSV, XLS o XLSX</p>
            </div>
            <input
              id="import-file"
              type="file"
              accept=".csv,.xls,.xlsx,.tsv"
              onChange={handleFile}
              className="hidden"
            />
            {error && (
              <div className="bg-error-container p-4 rounded-xl">
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Se encontraron <strong>{students.length}</strong> alumnos. Revisa los datos antes de importar.
            </p>

            <div className="bg-surface-container-lowest rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-container-low">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-bold text-on-surface-variant uppercase">Nº</th>
                    <th className="text-left px-4 py-2 text-xs font-bold text-on-surface-variant uppercase">Primer Apellido</th>
                    <th className="text-left px-4 py-2 text-xs font-bold text-on-surface-variant uppercase">Segundo Apellido</th>
                    <th className="text-left px-4 py-2 text-xs font-bold text-on-surface-variant uppercase">Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={i} className="border-t border-outline-variant/10">
                      <td className="px-4 py-2 text-on-surface-variant">{s.list_number || "—"}</td>
                      <td className="px-4 py-2">{s.first_surname}</td>
                      <td className="px-4 py-2 text-on-surface-variant">{s.second_surname || "—"}</td>
                      <td className="px-4 py-2">{s.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="bg-error-container p-4 rounded-xl">
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep("select"); setStudents([]); setError(null); }}
                className="flex-1 py-3 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors min-h-[44px]"
              >
                Volver
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors min-h-[44px]"
              >
                Importar {students.length} alumnos
              </button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <span className="material-symbols-outlined text-on-primary-container text-3xl">group_add</span>
            </div>
            <p className="font-headline font-bold text-on-surface">Importando alumnos...</p>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-primary text-3xl">check_circle</span>
            </div>
            <p className="font-headline font-bold text-on-surface">
              {importedCount} alumnos importados
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
