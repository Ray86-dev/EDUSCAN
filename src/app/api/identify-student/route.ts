import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  IDENTIFY_STUDENT_PROMPT,
  IDENTIFY_STUDENT_MODEL,
  IDENTIFY_STUDENT_TEMPERATURE,
} from "@/lib/prompts/identify-student";
import { matchStudent } from "@/lib/utils/fuzzy-match";

interface DetectedName {
  detected: boolean;
  name: string | null;
  first_surname: string | null;
  second_surname: string | null;
  raw_text: string;
  confidence: "alta" | "media" | "baja";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { imageBase64, imageMimeType, groupId } = body;

    if (!imageBase64 || !groupId) {
      return NextResponse.json(
        { error: "Se requiere imageBase64 y groupId" },
        { status: 400 }
      );
    }

    // Load students for this group
    const { data: students } = await supabase
      .from("students")
      .select("id, name, first_surname, second_surname")
      .eq("group_id", groupId)
      .order("list_number", { ascending: true });

    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: "No hay alumnos en este grupo" },
        { status: 400 }
      );
    }

    // Send first page to Gemini for name detection
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: IDENTIFY_STUDENT_MODEL,
      generationConfig: {
        temperature: IDENTIFY_STUDENT_TEMPERATURE,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent([
      { text: IDENTIFY_STUDENT_PROMPT },
      {
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType || "image/jpeg",
        },
      },
    ]);

    const rawResponse = result.response.text();

    let detected: DetectedName;
    try {
      detected = JSON.parse(rawResponse);
    } catch {
      return NextResponse.json({
        detected: false,
        matches: [],
        raw: rawResponse,
      });
    }

    if (!detected.detected) {
      return NextResponse.json({
        detected: false,
        matches: [],
        detectedName: detected,
      });
    }

    // Fuzzy match against student list
    const matches = matchStudent(
      {
        name: detected.name,
        first_surname: detected.first_surname,
        second_surname: detected.second_surname,
      },
      students.map((s) => ({
        id: s.id,
        name: s.name,
        first_surname: s.first_surname,
        second_surname: s.second_surname || null,
      }))
    );

    return NextResponse.json({
      detected: true,
      detectedName: detected,
      matches: matches.slice(0, 3), // Top 3 candidates
    });
  } catch (error) {
    console.error("Error identificando alumno:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
