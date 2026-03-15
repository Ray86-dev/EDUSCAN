export interface ExportRow {
  grupo: string;
  numero: number | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  nombre: string;
  nota: number | null;
  calificacion: string | null;
  criterionGrades?: Record<string, number>;
}

// Convierte texto Unicode a bytes ISO-8859-1 (Latin-1)
function toISO88591(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes[i] = code <= 255 ? code : 63; // '?' para caracteres fuera de Latin-1
  }
  return bytes;
}

export function generateCSV(rows: ExportRow[], groupName: string, criteriaCodes?: string[]): Blob {
  const baseHeaders = ["GRUPO", "Nº", "PRIMER APELLIDO", "SEGUNDO APELLIDO", "NOMBRE", "NOTA", "CALIFICACIÓN"];
  const headers = criteriaCodes && criteriaCodes.length > 0
    ? [...baseHeaders, ...criteriaCodes]
    : baseHeaders;

  const header = headers.join(";");

  const lines = rows.map((r) => {
    const baseCols = [
      r.grupo,
      r.numero ?? "",
      r.primer_apellido,
      r.segundo_apellido ?? "",
      r.nombre,
      r.nota !== null ? r.nota.toFixed(1) : "",
      r.calificacion ?? "",
    ];

    if (criteriaCodes && criteriaCodes.length > 0) {
      const criteriaCols = criteriaCodes.map((code) =>
        r.criterionGrades?.[code] !== undefined ? r.criterionGrades[code].toFixed(1) : ""
      );
      return [...baseCols, ...criteriaCols].join(";");
    }

    return baseCols.join(";");
  });

  const content = [header, ...lines].join("\r\n") + "\r\n";
  const bytes = toISO88591(content);

  return new Blob([bytes.buffer as BlobPart], { type: "text/csv;charset=iso-8859-1" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
