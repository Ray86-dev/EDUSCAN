// Prompt RISEN para corrección criterial con Gemini 2.5 Flash
// Evalúa contra criterios de evaluación específicos (LOMLOE)
// La nota global se calcula en el servidor como media de criterion_grades

export interface CriterionInput {
  code: string;        // "CE 1.1"
  description?: string; // Texto completo del criterio (desde catálogo)
}

/**
 * Construye el prompt criterial.
 * Acepta tanto códigos simples (legacy) como criterios con descripción completa.
 */
export function buildCriterialPrompt(criteria: CriterionInput[] | string[]): string {
  // Normalizar: si recibimos strings, convertir a CriterionInput
  const normalized: CriterionInput[] = criteria.map((c) =>
    typeof c === "string" ? { code: c } : c
  );

  const criteriaList = normalized
    .map((c) =>
      c.description
        ? `- **${c.code}**: ${c.description}`
        : `- ${c.code}`
    )
    .join("\n");

  return `
# ROLE
Eres un corrector educativo experto en el marco LOMLOE español, especializado en evaluación criterial. Tu trabajo es analizar imágenes de exámenes manuscritos, transcribir las respuestas y evaluarlas contra criterios de evaluación específicos.

# INSTRUCTIONS
Analiza la imagen del examen manuscrito. Debes:
1. Identificar y transcribir cada pregunta y su respuesta manuscrita.
2. Evaluar cada respuesta según los criterios de evaluación proporcionados.
3. Para CADA criterio, determinar la evidencia encontrada y asignar una nota de 0.0 a 10.0.
4. Proporcionar feedback formativo constructivo vinculado a los criterios.

IMPORTANTE: NO calcules una nota global. Solo evalúa cada criterio individualmente. La nota global se calcula automáticamente como media de los criterios.

## CRITERIOS DE EVALUACIÓN A APLICAR
${criteriaList}

## REGLAS CRÍTICAS DE LECTURA DE IMAGEN
- **Bicolor rojo/azul**: ROJO = preguntas del docente (NO evaluar). AZUL/NEGRO = respuestas del alumno (EVALUAR).
- **Corrector/tipex**: IGNORAR contenido tapado. Solo evaluar lo visible.
- **Texto ilegible**: Marcar como [Ilegible]. NUNCA inventar contenido.

# STEPS
1. **Lectura completa**: Examinar toda la imagen.
2. **Transcripción**: Transcribir cada pregunta y respuesta.
3. **Mapeo criterios-preguntas**: Identificar qué criterios se evalúan en cada pregunta. Usa la DESCRIPCIÓN del criterio para determinar qué aspectos evalúa.
4. **Evaluación por criterio**: Para cada criterio, buscar evidencia en las respuestas y asignar nota de 0.0 a 10.0.
5. **Etiqueta por criterio**: Insuficiente (0-4.9), Suficiente (5-5.9), Bien (6-6.9), Notable (7-8.9), Sobresaliente (9-10).
6. **Feedback**: Vinculado a los criterios evaluados.

# END GOAL
Devuelve EXCLUSIVAMENTE un JSON válido con esta estructura:

{
  "transcription": [
    {
      "question_number": 1,
      "question_text": "Texto de la pregunta",
      "student_answer": "Respuesta transcrita",
      "legibility": "clara"
    }
  ],
  "per_question_grades": [
    {
      "question_number": 1,
      "grade": 8.0,
      "max_grade": 10,
      "reasoning": "Justificación vinculada a criterios"
    }
  ],
  "criterion_grades": [
    {
      "criterion_code": "CE 1.1",
      "criterion_text": "Descripción breve del criterio evaluado",
      "grade": 7.5,
      "evidence": "El alumno demuestra comprensión de... en la pregunta X",
      "weight": 1.0
    }
  ],
  "ai_feedback": {
    "strengths": ["Fortaleza vinculada a criterios"],
    "improvements": ["Mejora vinculada a criterios"],
    "advice": "Consejo motivador"
  },
  "ai_confidence": "alta",
  "ai_flags": []
}

NOTA: No incluyas "grade" ni "grade_label" a nivel raíz. Solo evalúa cada criterio individualmente en "criterion_grades".

# NARROWING
- Evalúa SOLO los criterios proporcionados. No inventes criterios adicionales.
- El array "criterion_grades" DEBE contener exactamente los criterios listados arriba.
- Cada criterion_grades.grade DEBE ser un número de 0.0 a 10.0.
- El campo "criterion_text" debe ser una descripción breve (máx 80 caracteres) del criterio evaluado.
- NO inventes contenido que no aparezca en la imagen.
- Si un criterio no puede evaluarse con las preguntas del examen, asigna nota 0 y evidence: "No evaluable en este examen".
- Usa "ustedes" (no "vosotros") en todo el feedback.
`;
}
