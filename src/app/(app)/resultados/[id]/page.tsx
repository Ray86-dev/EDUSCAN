import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditCorrection } from "./edit-correction";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CorrectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: correction } = await supabase
    .from("corrections")
    .select("*")
    .eq("id", id)
    .single();

  if (!correction) {
    notFound();
  }

  // Generar signed URLs frescas para las imágenes
  let freshImageUrls: string[] = [];
  if (correction.original_image_url) {
    try {
      const parsed = JSON.parse(correction.original_image_url);
      const urls: string[] = Array.isArray(parsed) ? parsed : [correction.original_image_url];

      // Intentar extraer paths de storage y generar URLs frescas
      for (const url of urls) {
        // Si la URL contiene un path de Supabase Storage, regenerar
        const storageMatch = url.match(/\/storage\/v1\/object\/sign\/([^?]+)/);
        if (storageMatch) {
          const storagePath = decodeURIComponent(storageMatch[1]);
          // El path viene como "bucket/ruta", separamos
          const firstSlash = storagePath.indexOf("/");
          if (firstSlash > 0) {
            const bucket = storagePath.substring(0, firstSlash);
            const filePath = storagePath.substring(firstSlash + 1);
            const { data: signedData } = await supabase.storage
              .from(bucket)
              .createSignedUrl(filePath, 3600); // 1 hora
            if (signedData?.signedUrl) {
              freshImageUrls.push(signedData.signedUrl);
              continue;
            }
          }
        }
        // Fallback: usar la URL tal cual
        freshImageUrls.push(url);
      }
    } catch {
      freshImageUrls = [correction.original_image_url];
    }
  }

  // Cargar desglose criterial si es modo criterial
  let criterionGrades: { criterion_code: string; criterion_text: string; grade: number; evidence: string; weight: number }[] = [];
  if (correction.grading_mode === "criterial") {
    const { data } = await supabase
      .from("criterion_grades")
      .select("id, criterion_code, criterion_text, grade, evidence, weight")
      .eq("correction_id", id)
      .order("criterion_code");
    criterionGrades = data || [];
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 mb-20">
      {/* Back */}
      <Link
        href="/resultados"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a resultados
      </Link>

      <EditCorrection
        correction={{
          id: correction.id,
          grade: correction.grade,
          grade_label: correction.grade_label,
          grading_mode: correction.grading_mode || "simple",
          ai_confidence: correction.ai_confidence,
          ai_flags: correction.ai_flags,
          is_reviewed: correction.is_reviewed,
          teacher_modified: correction.teacher_modified ?? false,
          original_image_url: JSON.stringify(freshImageUrls),
          transcription: correction.transcription,
          per_question_grades: correction.per_question_grades ?? null,
          ai_feedback: correction.ai_feedback,
          created_at: correction.created_at,
          criterion_grades: criterionGrades,
        }}
      />
    </div>
  );
}
