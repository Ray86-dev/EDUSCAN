// Utilidades para extraer texto de documentos PDF y ODT

// Importar desde lib directamente para evitar que pdf-parse cargue un PDF de test en build
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
import JSZip from "jszip";

/**
 * Extrae texto plano de un archivo PDF
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Extrae texto plano de un archivo ODT (OpenDocument Text)
 * Un ODT es un ZIP que contiene content.xml con el texto
 */
export async function extractTextFromODT(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const contentXml = zip.file("content.xml");

  if (!contentXml) {
    throw new Error("No se encontró content.xml en el archivo ODT");
  }

  const xmlContent = await contentXml.async("string");

  // Extraer texto de los elementos XML quitando tags
  // Los elementos de texto en ODT están en <text:p>, <text:span>, etc.
  const textContent = xmlContent
    // Reemplazar saltos de línea de ODT con newlines
    .replace(/<text:line-break\/>/g, "\n")
    // Reemplazar tabulaciones
    .replace(/<text:tab\/>/g, "\t")
    // Reemplazar espacios especiales
    .replace(/<text:s[^>]*\/>/g, " ")
    // Añadir newline después de cada párrafo
    .replace(/<\/text:p>/g, "\n")
    // Quitar todos los tags XML
    .replace(/<[^>]+>/g, "")
    // Decodificar entidades HTML básicas
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // Limpiar líneas vacías excesivas
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return textContent;
}

/**
 * Extrae texto de un archivo según su tipo MIME
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
    return extractTextFromPDF(buffer);
  }

  if (
    mimeType === "application/vnd.oasis.opendocument.text" ||
    filename.endsWith(".odt")
  ) {
    return extractTextFromODT(buffer);
  }

  throw new Error(`Formato no soportado: ${mimeType}. Use PDF o ODT.`);
}
