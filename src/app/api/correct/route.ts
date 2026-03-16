import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  CORRECTION_SIMPLE_PROMPT,
  GEMINI_MODEL,
  GEMINI_TEMPERATURE,
} from "@/lib/prompts/correction-simple";
import { buildCriterialPrompt, type CriterionInput } from "@/lib/prompts/correction-criterial";
import { tryIncrementUsage } from "@/lib/usage";
import { getGradeLabel } from "@/lib/utils/grade-label";
import type { CorrectionResult } from "@/lib/types/correction";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Validar sesión
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Verificar límite diario + incrementar atómicamente
    const usage = await tryIncrementUsage(supabase, user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: "Límite diario alcanzado",
          used: usage.used,
          limit: usage.limit,
        },
        { status: 429 }
      );
    }

    // 3. Obtener imágenes del request
    const body = await request.json();
    const { imagePaths, imagePath, studentId, activityId } = body;

    // Soportar tanto un solo path (legacy) como array de paths
    const paths: string[] = imagePaths || (imagePath ? [imagePath] : []);

    // Cargar criterios si hay actividad vinculada
    let criteriaCodes: string[] = [];
    let criteriaWithDescriptions: CriterionInput[] = [];
    if (activityId) {
      const { data: activity } = await supabase
        .from("activities")
        .select("criteria_codes, curriculum_subject_id")
        .eq("id", activityId)
        .single();
      if (activity?.criteria_codes) {
        criteriaCodes = activity.criteria_codes;

        // Intentar cargar descripciones completas del catálogo
        if (activity.curriculum_subject_id) {
          const { data: comps } = await supabase
            .from("curriculum_competencies")
            .select("id")
            .eq("subject_id", activity.curriculum_subject_id);

          if (comps && comps.length > 0) {
            const { data: catalogCriteria } = await supabase
              .from("curriculum_criteria")
              .select("full_code, description")
              .in("competency_id", comps.map((c) => c.id));

            if (catalogCriteria) {
              const descMap = new Map(catalogCriteria.map((c) => [c.full_code, c.description]));
              criteriaWithDescriptions = criteriaCodes.map((code) => ({
                code,
                description: descMap.get(code),
              }));
            }
          }
        }

        // Fallback: si no se cargaron descriptions, buscar en cualquier currículo
        if (criteriaWithDescriptions.length === 0) {
          const { data: anyCriteria } = await supabase
            .from("curriculum_criteria")
            .select("full_code, description")
            .in("full_code", criteriaCodes);

          if (anyCriteria && anyCriteria.length > 0) {
            const descMap = new Map(anyCriteria.map((c) => [c.full_code, c.description]));
            criteriaWithDescriptions = criteriaCodes.map((code) => ({
              code,
              description: descMap.get(code),
            }));
          } else {
            criteriaWithDescriptions = criteriaCodes.map((code) => ({ code }));
          }
        }
      }
    }
    const isCriterial = criteriaCodes.length > 0;

    if (paths.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos una imagen" },
        { status: 400 }
      );
    }

    // 4. Descargar todas las imágenes desde Supabase Storage
    const imageParts: { inlineData: { data: string; mimeType: string } }[] = [];

    for (const p of paths) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("exam-images")
        .download(p);

      if (downloadError || !fileData) {
        return NextResponse.json(
          { error: "Error descargando imagen: " + downloadError?.message },
          { status: 400 }
        );
      }

      const bytes = new Uint8Array(await fileData.arrayBuffer());
      imageParts.push({
        inlineData: {
          data: Buffer.from(bytes).toString("base64"),
          mimeType: fileData.type || "image/jpeg",
        },
      });
    }

    // 5. Enviar a Gemini (todas las páginas en un solo request)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: GEMINI_TEMPERATURE,
        responseMimeType: "application/json",
      },
    });

    const basePrompt = isCriterial
      ? buildCriterialPrompt(criteriaWithDescriptions)
      : CORRECTION_SIMPLE_PROMPT;

    const pageHint = paths.length > 1
      ? `\n\nNOTA: Este examen tiene ${paths.length} páginas. Las imágenes se envían en orden (página 1, página 2, etc.). Analiza TODAS las páginas como un único examen continuo.\n`
      : "";

    const result = await model.generateContent([
      { text: basePrompt + pageHint },
      ...imageParts,
    ]);

    const rawResponse = result.response.text();

    // 6. Parsear respuesta
    let correctionResult: CorrectionResult;
    try {
      correctionResult = JSON.parse(rawResponse);
    } catch {
      return NextResponse.json(
        { error: "Error parseando respuesta de Gemini", raw: rawResponse },
        { status: 500 }
      );
    }

    // 6b. En modo criterial: calcular nota global como media de criterion_grades
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const criterionGrades: { criterion_code: string; criterion_text?: string; grade: number; evidence: string; weight: number }[] =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (correctionResult as any).criterion_grades || [];

    if (isCriterial && criterionGrades.length > 0) {
      const totalWeight = criterionGrades.reduce((s, cg) => s + (cg.weight || 1), 0);
      const weightedSum = criterionGrades.reduce((s, cg) => s + cg.grade * (cg.weight || 1), 0);
      const calculatedGrade = Math.round((weightedSum / totalWeight) * 10) / 10;

      // Sobrescribir la nota de Gemini con la media calculada
      correctionResult.grade = calculatedGrade;
      correctionResult.grade_label = getGradeLabel(calculatedGrade);
    }

    // 6c. Normalizar ai_confidence para cumplir CHECK constraint
    const validConfidence = ["alta", "media", "baja"] as const;
    const rawConfidence = (correctionResult.ai_confidence || "").toString().toLowerCase().trim();
    const normalizedConfidence = validConfidence.includes(rawConfidence as typeof validConfidence[number])
      ? (rawConfidence as "alta" | "media" | "baja")
      : "media"; // fallback seguro
    correctionResult.ai_confidence = normalizedConfidence;

    // 7. Obtener URLs públicas firmadas de todas las imágenes
    const signedUrls: string[] = [];
    for (const p of paths) {
      const { data: signedUrl } = await supabase.storage
        .from("exam-images")
        .createSignedUrl(p, 60 * 60 * 24 * 90); // 90 días
      if (signedUrl?.signedUrl) signedUrls.push(signedUrl.signedUrl);
    }

    // 8. Guardar corrección en BD
    const { data: correction, error: insertError } = await supabase
      .from("corrections")
      .insert({
        user_id: user.id,
        student_id: studentId || null,
        activity_id: activityId || null,
        original_image_url: JSON.stringify(signedUrls),
        grading_mode: isCriterial ? "criterial" : "simple",
        transcription: correctionResult.transcription,
        grade: correctionResult.grade,
        grade_label: correctionResult.grade_label,
        ai_feedback: correctionResult.ai_feedback,
        ai_confidence: correctionResult.ai_confidence,
        ai_flags: correctionResult.ai_flags,
        per_question_grades: correctionResult.per_question_grades || null,
        gemini_raw_response: rawResponse,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Error guardando corrección: " + insertError.message },
        { status: 500 }
      );
    }

    // 9. Guardar desglose criterial si aplica
    if (isCriterial && correction && criterionGrades.length > 0) {
      const criterionRows = criterionGrades.map(
        (cg) => ({
          correction_id: correction.id,
          criterion_code: cg.criterion_code,
          criterion_text: cg.criterion_text || cg.criterion_code,
          grade: cg.grade,
          evidence: cg.evidence,
          weight: cg.weight || 1.0,
        })
      );

      await supabase.from("criterion_grades").insert(criterionRows);
    }

    // 10. Devolver resultado (uso ya incrementado atómicamente en paso 2)
    return NextResponse.json({
      correction,
      result: correctionResult,
    });
  } catch (error) {
    console.error("Error en corrección:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
