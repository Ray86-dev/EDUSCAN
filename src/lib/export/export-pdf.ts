import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ExportRow } from "./export-csv";

export function generatePDF(rows: ExportRow[], groupName: string): Blob {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("EduScan — Informe de calificaciones", 14, 20);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Grupo: ${groupName}`, 14, 30);
  doc.text(
    `Fecha: ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`,
    14,
    37
  );

  // Stats
  const graded = rows.filter((r) => r.nota !== null);
  const avg = graded.length > 0
    ? graded.reduce((sum, r) => sum + (r.nota || 0), 0) / graded.length
    : 0;
  const passRate = graded.length > 0
    ? (graded.filter((r) => (r.nota || 0) >= 5).length / graded.length) * 100
    : 0;

  doc.setFontSize(10);
  doc.text(
    `Total alumnos: ${rows.length} | Corregidos: ${graded.length} | Media: ${avg.toFixed(1)} | Aprobados: ${passRate.toFixed(0)}%`,
    14,
    44
  );

  // Table
  autoTable(doc, {
    startY: 50,
    head: [["Nº", "Primer Apellido", "Segundo Apellido", "Nombre", "Nota", "Calificación"]],
    body: rows.map((r) => [
      r.numero ?? "—",
      r.primer_apellido,
      r.segundo_apellido ?? "",
      r.nombre,
      r.nota !== null ? r.nota.toFixed(1) : "—",
      r.calificacion ?? "—",
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [71, 101, 80] }, // primary #476550
  });

  return doc.output("blob");
}
