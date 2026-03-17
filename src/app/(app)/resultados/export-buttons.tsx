"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ExportRow } from "@/lib/export/export-csv";

interface ExportButtonsProps {
  groupId: string;
  groupName: string;
}

export function ExportButtons({ groupId, groupName }: ExportButtonsProps) {
  const [exporting, setExporting] = useState(false);

  const fetchData = async (): Promise<{ rows: ExportRow[]; criteriaCodes: string[] }> => {
    const supabase = createClient();

    // Obtener alumnos del grupo
    const { data: students } = await supabase
      .from("students")
      .select("id, list_number, first_surname, second_surname, name")
      .eq("group_id", groupId)
      .order("list_number", { ascending: true, nullsFirst: false });

    if (!students || students.length === 0) return { rows: [], criteriaCodes: [] };

    // Obtener la corrección más reciente de cada alumno
    const { data: corrections } = await supabase
      .from("corrections")
      .select("id, student_id, grade, grade_label, grading_mode")
      .in("student_id", students.map((s) => s.id))
      .order("created_at", { ascending: false });

    // Map: student_id -> latest correction
    const latestByStudent = new Map<string, { id: string; grade: number; grade_label: string; grading_mode: string }>();
    for (const c of corrections || []) {
      if (c.student_id && !latestByStudent.has(c.student_id)) {
        latestByStudent.set(c.student_id, { id: c.id, grade: c.grade, grade_label: c.grade_label, grading_mode: c.grading_mode || "simple" });
      }
    }

    // Comprobar si hay correcciones criteriales
    const criterialCorrectionIds = Array.from(latestByStudent.values())
      .filter((c) => c.grading_mode === "criterial")
      .map((c) => c.id);

    let criterionGradesByCorrection = new Map<string, Record<string, number>>();
    let allCriteriaCodes: string[] = [];

    if (criterialCorrectionIds.length > 0) {
      const { data: criterionData } = await supabase
        .from("criterion_grades")
        .select("correction_id, criterion_code, grade")
        .in("correction_id", criterialCorrectionIds);

      if (criterionData) {
        const codesSet = new Set<string>();
        for (const cg of criterionData) {
          codesSet.add(cg.criterion_code);
          if (!criterionGradesByCorrection.has(cg.correction_id)) {
            criterionGradesByCorrection.set(cg.correction_id, {});
          }
          criterionGradesByCorrection.get(cg.correction_id)![cg.criterion_code] = cg.grade;
        }
        allCriteriaCodes = Array.from(codesSet).sort();
      }
    }

    const rows = students.map((s) => {
      const correction = latestByStudent.get(s.id);
      return {
        grupo: groupName,
        numero: s.list_number,
        primer_apellido: s.first_surname,
        segundo_apellido: s.second_surname,
        nombre: s.name,
        nota: correction?.grade ?? null,
        calificacion: correction?.grade_label ?? null,
        criterionGrades: correction ? criterionGradesByCorrection.get(correction.id) : undefined,
      };
    });

    return { rows, criteriaCodes: allCriteriaCodes };
  };

  const handleExportCSV = async () => {
    setExporting(true);
    const [{ rows, criteriaCodes }, { generateCSV, downloadBlob }] = await Promise.all([
      fetchData(),
      import("@/lib/export/export-csv"),
    ]);
    const blob = generateCSV(rows, groupName, criteriaCodes.length > 0 ? criteriaCodes : undefined);
    const filename = `${groupName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, "_")}_notas.csv`;
    downloadBlob(blob, filename);
    setExporting(false);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    const [{ rows }, { generatePDF }, { downloadBlob }] = await Promise.all([
      fetchData(),
      import("@/lib/export/export-pdf"),
      import("@/lib/export/export-csv"),
    ]);
    const blob = generatePDF(rows, groupName);
    const filename = `${groupName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, "_")}_informe.pdf`;
    downloadBlob(blob, filename);
    setExporting(false);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportCSV}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl hover:bg-surface-container-high transition-colors min-h-[44px] text-sm font-medium disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">table_view</span>
        CSV
      </button>
      <button
        onClick={handleExportPDF}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl hover:bg-surface-container-high transition-colors min-h-[44px] text-sm font-medium disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
        PDF
      </button>
    </div>
  );
}
