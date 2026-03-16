// Prompt ligero para identificar al alumno a partir de la primera página del examen.
// Gemini solo necesita leer el nombre/apellidos, no corregir nada.

export const IDENTIFY_STUDENT_PROMPT = `
# TAREA
Analiza esta imagen de la primera página de un examen manuscrito. Tu ÚNICO objetivo es extraer el nombre y apellidos del alumno/a que aparecen escritos en la hoja.

# INSTRUCCIONES
1. Busca el nombre del alumno/a en la cabecera, margen superior, o cualquier zona donde habitualmente se escribe el nombre en un examen.
2. Los exámenes suelen tener campos como "Nombre:", "Alumno/a:", "Nombre y apellidos:", etc.
3. El nombre puede estar escrito a mano o impreso. Si está escrito a mano, haz tu mejor interpretación.
4. Extrae por separado: nombre de pila, primer apellido, y segundo apellido (si aparece).
5. Si no puedes identificar un nombre con confianza, indica "no_detectado".

# REGLAS
- NO corrijas ni evalúes el contenido del examen.
- NO inventes nombres. Si es ilegible, devuelve "no_detectado".
- Si solo ves un nombre parcial (ej: solo el apellido), devuelve lo que puedas leer.
- Normaliza la capitalización: primera letra mayúscula, resto minúsculas.

# FORMATO DE RESPUESTA (JSON)
{
  "detected": true/false,
  "name": "string o null",
  "first_surname": "string o null",
  "second_surname": "string o null",
  "raw_text": "texto exacto como aparece en la imagen",
  "confidence": "alta" | "media" | "baja"
}
`;

export const IDENTIFY_STUDENT_MODEL = "gemini-2.5-flash";
export const IDENTIFY_STUDENT_TEMPERATURE = 0.1;
