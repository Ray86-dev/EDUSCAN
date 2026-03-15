import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractText } from "@/lib/import/extract-text";
import {
  PARSE_CURRICULUM_PROMPT,
  PARSE_CURRICULUM_MODEL,
  PARSE_CURRICULUM_TEMPERATURE,
} from "@/lib/prompts/parse-curriculum";

interface ParsedCriterion {
  code: string;
  full_code: string;
  description: string;
  descriptors: string[];
}

interface ParsedCompetency {
  code: string;
  description: string;
  criteria: ParsedCriterion[];
}

interface ParsedCourse {
  course: string | null;
  competencies: ParsedCompetency[];
}

interface ParsedCurriculum {
  courses: ParsedCourse[];
}

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

    // 2. Obtener FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const stage = formData.get("stage") as string;
    const subjectName = formData.get("subject_name") as string;

    if (!file || !stage || !subjectName) {
      return NextResponse.json(
        { error: "Se requiere archivo, etapa y asignatura" },
        { status: 400 }
      );
    }

    // 3. Extraer texto del documento
    const buffer = Buffer.from(await file.arrayBuffer());
    let documentText: string;

    try {
      documentText = await extractText(buffer, file.type, file.name);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Error extrayendo texto" },
        { status: 400 }
      );
    }

    if (documentText.length < 500) {
      return NextResponse.json(
        { error: "El documento parece estar vacío o tiene muy poco contenido" },
        { status: 400 }
      );
    }

    // 4. Enviar a Gemini para parseo
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: PARSE_CURRICULUM_MODEL,
      generationConfig: {
        temperature: PARSE_CURRICULUM_TEMPERATURE,
        responseMimeType: "application/json",
      },
    });

    // Truncar si es muy largo (Gemini tiene límite de tokens)
    const maxChars = 100000;
    const textToSend = documentText.length > maxChars
      ? documentText.substring(0, maxChars) + "\n\n[TEXTO TRUNCADO]"
      : documentText;

    const result = await model.generateContent([
      { text: PARSE_CURRICULUM_PROMPT },
      { text: `\n\n--- DOCUMENTO CURRICULAR ---\n\n${textToSend}` },
    ]);

    const rawResponse = result.response.text();

    // 5. Parsear respuesta
    let parsed: ParsedCurriculum;
    try {
      const rawParsed = JSON.parse(rawResponse);

      // Compatibilidad: si Gemini devuelve formato antiguo { competencies: [...] }
      // convertir al nuevo formato multi-curso
      if (rawParsed.competencies && !rawParsed.courses) {
        parsed = {
          courses: [{
            course: null,
            competencies: rawParsed.competencies,
          }],
        };
      } else {
        parsed = rawParsed;
      }
    } catch {
      return NextResponse.json(
        { error: "Error parseando respuesta de Gemini", raw: rawResponse.substring(0, 500) },
        { status: 500 }
      );
    }

    if (!parsed.courses || parsed.courses.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron cursos/competencias en el documento" },
        { status: 400 }
      );
    }

    // Validar que al menos un curso tenga competencias
    const validCourses = parsed.courses.filter(
      (c) => c.competencies && c.competencies.length > 0
    );
    if (validCourses.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron competencias en ningún curso" },
        { status: 400 }
      );
    }

    // 6. Modo preview: devolver sin guardar
    const previewOnly = formData.get("preview") === "true";
    if (previewOnly) {
      const totalCriteria = validCourses.reduce(
        (sum, course) => sum + course.competencies.reduce(
          (cSum, comp) => cSum + comp.criteria.length, 0
        ), 0
      );
      return NextResponse.json({
        courses: validCourses,
        totalCriteria,
      });
    }

    // 7. Guardar en BD — un curriculum_subject por curso seleccionado
    const selectedCoursesRaw = formData.get("selected_courses") as string | null;
    let selectedIndices: number[] | null = null;
    if (selectedCoursesRaw) {
      try {
        selectedIndices = JSON.parse(selectedCoursesRaw);
      } catch {
        // Si no se puede parsear, guardar todos
      }
    }

    const coursesToSave = selectedIndices
      ? validCourses.filter((_, i) => selectedIndices!.includes(i))
      : validCourses;

    const createdIds: string[] = [];

    for (const courseData of coursesToSave) {
      // Crear curriculum_subject
      const { data: subject, error: subjectError } = await supabase
        .from("curriculum_subjects")
        .insert({
          stage,
          course: courseData.course || null,
          subject_name: subjectName,
          source_filename: file.name,
          parsed_by: user.id,
        })
        .select()
        .single();

      if (subjectError || !subject) {
        console.error("Error guardando subject:", subjectError?.message);
        continue;
      }

      createdIds.push(subject.id);

      // Insertar competencias y criterios
      for (let i = 0; i < courseData.competencies.length; i++) {
        const comp = courseData.competencies[i];

        const { data: competency, error: compError } = await supabase
          .from("curriculum_competencies")
          .insert({
            subject_id: subject.id,
            code: comp.code,
            description: comp.description,
            sort_order: i,
          })
          .select()
          .single();

        if (compError || !competency) continue;

        const criteriaRows = comp.criteria.map((cr, j) => ({
          competency_id: competency.id,
          code: cr.code,
          full_code: cr.full_code,
          description: cr.description,
          descriptors: cr.descriptors || [],
          sort_order: j,
        }));

        if (criteriaRows.length > 0) {
          await supabase.from("curriculum_criteria").insert(criteriaRows);
        }
      }
    }

    // 8. Devolver resultado
    const totalCriteria = coursesToSave.reduce(
      (sum, course) => sum + course.competencies.reduce(
        (cSum, comp) => cSum + comp.criteria.length, 0
      ), 0
    );

    return NextResponse.json({
      subjectIds: createdIds,
      coursesCount: createdIds.length,
      competencies: coursesToSave.reduce((sum, c) => sum + c.competencies.length, 0),
      criteria: totalCriteria,
    });
  } catch (error) {
    console.error("Error parseando currículo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
