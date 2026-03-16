import { describe, it, expect } from "vitest";
import { generateCSV, ExportRow } from "../export/export-csv";

const sampleRows: ExportRow[] = [
  {
    grupo: "2ESO-A",
    numero: 1,
    primer_apellido: "García",
    segundo_apellido: "López",
    nombre: "Ana",
    nota: 7.5,
    calificacion: "Notable",
  },
  {
    grupo: "2ESO-A",
    numero: 2,
    primer_apellido: "Rodríguez",
    segundo_apellido: null,
    nombre: "Pedro",
    nota: 4.0,
    calificacion: "Insuficiente",
  },
];

describe("generateCSV", () => {
  it("generates a Blob with correct MIME type", () => {
    const blob = generateCSV(sampleRows, "2ESO-A");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("text/csv;charset=iso-8859-1");
  });

  it("uses semicolon separator and CRLF line endings", async () => {
    const blob = generateCSV(sampleRows, "2ESO-A");
    const buffer = await blob.arrayBuffer();
    const text = new TextDecoder("iso-8859-1").decode(buffer);

    expect(text).toContain(";");
    expect(text).toContain("\r\n");
    // Header line
    expect(text.startsWith("GRUPO;")).toBe(true);
  });

  it("includes all base headers", async () => {
    const blob = generateCSV(sampleRows, "2ESO-A");
    const buffer = await blob.arrayBuffer();
    const text = new TextDecoder("iso-8859-1").decode(buffer);
    const headerLine = text.split("\r\n")[0];

    expect(headerLine).toContain("GRUPO");
    expect(headerLine).toContain("PRIMER APELLIDO");
    expect(headerLine).toContain("NOTA");
  });

  it("formats grades with one decimal place", async () => {
    const blob = generateCSV(sampleRows, "2ESO-A");
    const buffer = await blob.arrayBuffer();
    const text = new TextDecoder("iso-8859-1").decode(buffer);

    expect(text).toContain("7.5");
    expect(text).toContain("4.0");
  });

  it("handles null values gracefully", async () => {
    const rows: ExportRow[] = [
      {
        grupo: "1ESO",
        numero: null,
        primer_apellido: "Test",
        segundo_apellido: null,
        nombre: "Student",
        nota: null,
        calificacion: null,
      },
    ];
    const blob = generateCSV(rows, "1ESO");
    const buffer = await blob.arrayBuffer();
    const text = new TextDecoder("iso-8859-1").decode(buffer);
    const dataLine = text.split("\r\n")[1];

    // Null values should render as empty strings between semicolons
    expect(dataLine).toBe("1ESO;;Test;;Student;;");
  });

  it("adds criteria columns when criteriaCodes provided", async () => {
    const rows: ExportRow[] = [
      {
        grupo: "2ESO-A",
        numero: 1,
        primer_apellido: "García",
        segundo_apellido: "López",
        nombre: "Ana",
        nota: 7.5,
        calificacion: "Notable",
        criterionGrades: { "CE 1.1": 8.0, "CE 2.1": 7.0 },
      },
    ];
    const blob = generateCSV(rows, "2ESO-A", ["CE 1.1", "CE 2.1"]);
    const buffer = await blob.arrayBuffer();
    const text = new TextDecoder("iso-8859-1").decode(buffer);
    const headerLine = text.split("\r\n")[0];
    const dataLine = text.split("\r\n")[1];

    expect(headerLine).toContain("CE 1.1");
    expect(headerLine).toContain("CE 2.1");
    expect(dataLine).toContain("8.0");
    expect(dataLine).toContain("7.0");
  });
});
