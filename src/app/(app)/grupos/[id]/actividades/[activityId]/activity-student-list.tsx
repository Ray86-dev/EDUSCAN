"use client";

import { useState } from "react";
import Link from "next/link";
import { getGradeColorClasses } from "@/lib/utils/grade-colors";

interface Student {
  id: string;
  list_number: number | null;
  first_surname: string;
  second_surname: string | null;
  name: string;
  repeats: boolean;
}

interface GradeInfo {
  correctionId: string;
  grade: number;
  gradeLabel: string;
  isReviewed: boolean;
}

type SortMode = "list" | "grade-asc" | "grade-desc";

export function ActivityStudentList({
  students,
  grades,
}: {
  students: Student[];
  grades: Record<string, GradeInfo>;
}) {
  const [sort, setSort] = useState<SortMode>("list");

  const sorted = [...students].sort((a, b) => {
    if (sort === "grade-asc" || sort === "grade-desc") {
      const ga = grades[a.id]?.grade ?? (sort === "grade-asc" ? 999 : -1);
      const gb = grades[b.id]?.grade ?? (sort === "grade-asc" ? 999 : -1);
      return sort === "grade-asc" ? ga - gb : gb - ga;
    }
    return (a.list_number ?? 999) - (b.list_number ?? 999);
  });

  const cycleSort = () => {
    setSort((prev) =>
      prev === "list" ? "grade-desc" : prev === "grade-desc" ? "grade-asc" : "list"
    );
  };

  const sortIcon = sort === "list" ? "format_list_numbered" : sort === "grade-desc" ? "arrow_downward" : "arrow_upward";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-headline font-bold text-on-surface">
          Alumnado ({students.length})
        </h3>
        <button
          onClick={cycleSort}
          className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary-fixed"
        >
          <span className="material-symbols-outlined text-base">{sortIcon}</span>
          {sort === "list" ? "N.º lista" : sort === "grade-desc" ? "Mayor nota" : "Menor nota"}
        </button>
      </div>

      {/* Student rows */}
      {students.length > 0 ? (
        <div className="space-y-1.5">
          {sorted.map((student) => {
            const info = grades[student.id] ?? null;
            const grade = info?.grade ?? null;
            const colors = getGradeColorClasses(grade);

            return (
              <div
                key={student.id}
                className={`flex items-center gap-3 bg-surface-container-lowest rounded-xl px-4 py-3 border-l-4 ${colors.border}`}
              >
                {/* List number */}
                <span className="text-xs font-bold text-on-surface-variant w-6 text-center shrink-0">
                  {student.list_number ?? "—"}
                </span>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">
                    {student.first_surname}
                    {student.second_surname ? ` ${student.second_surname}` : ""}
                    , {student.name}
                  </p>
                  {student.repeats && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded-full">
                      Rep.
                    </span>
                  )}
                </div>

                {/* Grade badge */}
                {info ? (
                  <Link
                    href={`/resultados/${info.correctionId}`}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${colors.bg} ${colors.text} font-bold text-sm min-w-[52px] justify-center hover:opacity-80 transition-opacity`}
                  >
                    {grade!.toFixed(1)}
                    {info.isReviewed && (
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    )}
                  </Link>
                ) : (
                  <span className="shrink-0 px-3 py-1.5 rounded-lg bg-surface-container text-outline text-sm font-medium min-w-[52px] text-center">
                    —
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-on-surface-variant/40 text-3xl mb-2 block">group</span>
          <p className="text-sm text-on-surface-variant">
            No hay alumnos en este grupo.
          </p>
        </div>
      )}
    </div>
  );
}
