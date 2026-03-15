import * as XLSX from "xlsx";

export interface ParsedStudent {
  list_number: number | null;
  first_surname: string;
  second_surname: string | null;
  name: string;
}

// Nombres de columna que Pincel Ekade y otros sistemas usan
const COLUMN_ALIASES: Record<string, string[]> = {
  list_number: ["nº", "n°", "num", "numero", "número", "n"],
  first_surname: ["primer apellido", "apellido1", "apellido 1", "1er apellido"],
  second_surname: ["segundo apellido", "apellido2", "apellido 2", "2do apellido", "2º apellido"],
  name: ["nombre"],
};

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchColumn(header: string, aliases: string[]): boolean {
  const h = normalize(header);
  return aliases.some((alias) => normalize(alias) === h);
}

function detectColumns(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (!header) continue;

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (!mapping[field] && matchColumn(header, aliases)) {
        mapping[field] = i;
      }
    }
  }

  return mapping;
}

export function parseStudentsFromWorkbook(data: ArrayBuffer): {
  students: ParsedStudent[];
  headers: string[];
  error?: string;
} {
  try {
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (rows.length < 2) {
      return { students: [], headers: [], error: "El archivo no tiene datos suficientes" };
    }

    const headers = rows[0].map((h) => String(h).trim());
    const columnMap = detectColumns(headers);

    if (!columnMap.name && !columnMap.first_surname) {
      return {
        students: [],
        headers,
        error: "No se encontraron las columnas necesarias (NOMBRE, PRIMER APELLIDO). Asegúrate de que el archivo tiene encabezados.",
      };
    }

    const students: ParsedStudent[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every((cell) => !cell)) continue;

      const name = columnMap.name !== undefined ? String(row[columnMap.name] || "").trim() : "";
      const firstSurname = columnMap.first_surname !== undefined ? String(row[columnMap.first_surname] || "").trim() : "";

      if (!name && !firstSurname) continue;

      const listNumRaw = columnMap.list_number !== undefined ? row[columnMap.list_number] : null;
      const listNumber = listNumRaw ? parseInt(String(listNumRaw), 10) : null;

      students.push({
        list_number: listNumber && !isNaN(listNumber) ? listNumber : null,
        first_surname: firstSurname || name,
        second_surname: columnMap.second_surname !== undefined
          ? String(row[columnMap.second_surname] || "").trim() || null
          : null,
        name: firstSurname ? name : "",
      });
    }

    return { students, headers };
  } catch {
    return { students: [], headers: [], error: "Error leyendo el archivo. Asegúrate de que es un CSV o Excel válido." };
  }
}
