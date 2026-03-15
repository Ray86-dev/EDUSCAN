import type { GradeLabel } from "@/lib/types/correction";

export function getGradeLabel(grade: number): GradeLabel {
  if (grade < 5) return "Insuficiente";
  if (grade < 6) return "Suficiente";
  if (grade < 7) return "Bien";
  if (grade < 9) return "Notable";
  return "Sobresaliente";
}
