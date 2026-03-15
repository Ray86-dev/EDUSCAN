import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  CORRECTION_SIMPLE_PROMPT,
  GEMINI_MODEL,
  GEMINI_TEMPERATURE,
} from "@/lib/prompts/correction-simple";
import { checkDailyLimit, incrementUsage } from "@/lib/usage";
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

    // 2. Verificar límite diario
    const usage = await checkDailyLimit(supabase, user.id);
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

    // 3. Obtener imagen del request
    const body = await request.json();
    const { imageUrl, imagePath } = body;

    if (!imageUrl && !imagePath) {
      return NextResponse.json(
        { error: "Se requiere imageUrl o imagePath" },
        { status: 400 }
      );
    }

    // 4. Descargar la imagen desde Supabase Storage
    let imageBytes: Uint8Array;
    let mimeType: string;

    if (imagePath) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("exam-images")
        .download(imagePath);

      if (downloadError || !fileData) {
        return NextResponse.json(
          { error: "Error descargando imagen: " + downloadError?.message },
          { status: 400 }
        );
      }

      imageBytes = new Uint8Array(await fileData.arrayBuffer());
      mimeType = fileData.type || "image/jpeg";
    } else {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return NextResponse.json(
          { error: "No se pudo descargar la imagen" },
          { status: 400 }
        );
      }
      imageBytes = new Uint8Array(await response.arrayBuffer());
      mimeType = response.headers.get("content-type") || "image/jpeg";
    }

    // 5. Enviar a Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: GEMINI_TEMPERATURE,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent([
      { text: CORRECTION_SIMPLE_PROMPT },
      {
        inlineData: {
          data: Buffer.from(imageBytes).toString("base64"),
          mimeType,
        },
      },
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

    // 7. Obtener URL pública firmada de la imagen
    let publicImageUrl = imageUrl || "";
    if (imagePath) {
      const { data: signedUrl } = await supabase.storage
        .from("exam-images")
        .createSignedUrl(imagePath, 60 * 60 * 24 * 90); // 90 días
      publicImageUrl = signedUrl?.signedUrl || "";
    }

    // 8. Guardar en BD
    const { data: correction, error: insertError } = await supabase
      .from("corrections")
      .insert({
        user_id: user.id,
        original_image_url: publicImageUrl,
        grading_mode: "simple",
        transcription: correctionResult.transcription,
        grade: correctionResult.grade,
        grade_label: correctionResult.grade_label,
        ai_feedback: correctionResult.ai_feedback,
        ai_confidence: correctionResult.ai_confidence,
        ai_flags: correctionResult.ai_flags,
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

    // 9. Incrementar uso diario
    await incrementUsage(supabase, user.id);

    // 10. Devolver resultado
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
