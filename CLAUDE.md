# CLAUDE.md — EduScan

## Qué es EduScan

Corrector IA de exámenes manuscritos para docentes españoles. Producto standalone. El docente sube una foto del examen → el sistema la envía a Gemini 2.5 Flash (multimodal) → recibe transcripción + evaluación + feedback formativo → el docente revisa y confirma → exporta informe para consultar mientras introduce notas manualmente en Pincel Ekade.

**NO es un módulo de EduCanarias.** Es un producto independiente con su propio repo, DB y dominio.

## Stack

- **Frontend:** Next.js 14+ (App Router) + Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Auth:** Supabase Auth con Google OAuth
- **IA:** Gemini 2.5 Flash (multimodal) vía google-generativeai SDK
- **Exportación:** SheetJS (xlsx/csv), jspdf + jspdf-autotable (PDF)
- **Deploy:** Vercel
- **Idioma del código:** Inglés (variables, funciones, componentes). Comentarios en español cuando ayuden.

## Arquitectura del flujo core

```
Foto/PDF → [Upload + validación client] → [Supabase Storage] → [Gemini 2.5 Flash multimodal] → JSON estructurado → [Revisión docente en UI] → [Supabase DB] → [Exportación CSV/PDF]
```

No hay paso OCR separado. El modelo multimodal recibe la imagen directamente y devuelve transcripción + evaluación en un solo call.

## Modelo de datos (Supabase)

```sql
-- Usuarios (docentes)
users (
  id uuid PK (Supabase Auth),
  email text,
  full_name text,
  plan_tier text DEFAULT 'free', -- 'free' | 'premium'
  created_at timestamptz
)

-- Contadores de uso diario
usage_logs (
  id uuid PK,
  user_id uuid FK → users,
  date date,
  corrections_count int DEFAULT 0,
  generations_count int DEFAULT 0
)

-- Grupos/Clases
groups (
  id uuid PK,
  user_id uuid FK → users,
  name text, -- ej: "ESPAsp1Tse"
  stage text, -- 'infantil' | 'primaria' | 'eso' | 'bachillerato' | 'fp' | 'adultos'
  course text,
  subject text,
  subject_code text, -- código Pincel Ekade, ej: "NOD"
  created_at timestamptz
)

-- Alumnos
students (
  id uuid PK,
  user_id uuid FK → users,
  group_id uuid FK → groups,
  list_number int,
  first_surname text,
  second_surname text,
  name text,
  repeats boolean DEFAULT false,
  created_at timestamptz
)

-- Actividades/Tareas
activities (
  id uuid PK,
  user_id uuid FK → users,
  group_id uuid FK → groups,
  title text,
  description text,
  criteria_codes text[], -- ej: ['CE 1.1', 'CE 8.1']
  created_at timestamptz
)

-- Correcciones (tabla central)
corrections (
  id uuid PK,
  user_id uuid FK → users,
  student_id uuid FK → students (nullable),
  activity_id uuid FK → activities (nullable),
  original_image_url text,
  grading_mode text DEFAULT 'simple', -- 'simple' | 'criterial'
  transcription jsonb, -- array de {question_number, question_text, student_answer, legibility}
  grade numeric(3,1), -- 0.0-10.0
  grade_label text, -- 'Insuficiente' | 'Suficiente' | 'Bien' | 'Notable' | 'Sobresaliente'
  ai_feedback jsonb, -- {strengths, improvements, advice}
  ai_confidence text, -- 'alta' | 'media' | 'baja'
  ai_flags text[],
  criteria_referenced jsonb,
  is_reviewed boolean DEFAULT false, -- el docente ha revisado
  gemini_raw_response text, -- respuesta raw para debug
  created_at timestamptz,
  updated_at timestamptz
)

-- Desglose criterial (solo modo criterial)
criterion_grades (
  id uuid PK,
  correction_id uuid FK → corrections,
  criterion_code text,
  criterion_text text,
  grade numeric(3,1),
  evidence text,
  weight numeric(3,2)
)
```

RLS: cada tabla filtrada por user_id. El docente solo ve sus datos.

## Prompt de corrección (Gemini 2.5 Flash)

El prompt completo está en `src/lib/prompts/correction-simple.ts` y `correction-criterial.ts`.

Arquitectura RISEN:
- **Role:** Corrector educativo LOMLOE
- **Instructions:** Analizar imagen manuscrita, evaluar contra criterios
- **Steps:** Lectura → Evaluación por pregunta → Nota global → Feedback Sandwich
- **End Goal:** JSON estructurado (ver tipo `CorrectionResult`)
- **Narrowing:** No inventar, no evaluar ortografía, no juzgar contenido personal

Reglas de lectura de imagen CRÍTICAS:
1. Bicolor rojo/azul: rojo = preguntas docente (NO evaluar), azul/negro = respuestas alumno
2. Corrector/tipex: ignorar contenido tapado
3. Ilegible: marcar [Ilegible], NUNCA inventar
4. CE detectados en la imagen: reportar en flags

Temperatura: 0.1 (determinista).

## Patrón de exportación

Pincel Ekade NO permite importar calificaciones. La exportación es un informe de consulta.

CSV para referencia rápida:
- Separador: `;`
- Encoding: ISO-8859-1 (NO UTF-8)
- Line endings: CRLF
- Campos: GRUPO, Nº, PRIMER APELLIDO, SEGUNDO APELLIDO, NOMBRE, NOTA, CRITERIOS...

PDF para familias: informe individual por alumno con feedback cualitativo.

## Modelo freemium

- **Free:** 2 correcciones/día. Reset a las 00:00 hora canaria (UTC+0/UTC+1).
- **Premium:** Sin límites. Pricing pendiente (€5-€15/mes).
- Paywall: modal bloqueante al intentar la 3ª corrección del día.
- Contadores independientes de cualquier otro producto.

## Convenciones de código

- **Componentes React:** PascalCase (`CorrectionCard.tsx`)
- **Funciones/hooks:** camelCase (`useCorrection.ts`)
- **Utilidades:** kebab-case (`format-grade.ts`)
- **TypeScript estricto:** interfaces tipadas, cero `any`
- **Estilos:** Tailwind + shadcn/ui. Mobile-first.
- **CTAs:** min-height 44px (accesibilidad táctil)

## Contexto del usuario final

Docente canaria, 35-55 años, competencia digital media. Usa el móvil para sacar fotos de exámenes. Quiere que funcione rápido, en español, sin complicaciones. "Que funcione" > "Que sea innovador". Conectividad irregular en zonas rurales/islas menores.

## Contexto educativo

- LOMLOE (Ley Orgánica 3/2020) — marco vigente
- Evaluación criterial: escala Insuficiente (1-4.9) → Sobresaliente (9-10)
- Pincel Ekade: sistema de gestión de calificaciones de la Consejería de Educación de Canarias
- EVAGD: entorno Moodle de Canarias
- Uso de "ustedes" (no "vosotros") en todo el copy

## LOPD/GDPR

- Imágenes de exámenes pueden contener nombres de alumnos
- Supabase Storage con bucket privado + RLS
- Retención de imágenes: 90 días máximo
- Los datos NO se usan para entrenar modelos (API de Gemini no lo hace)
- Menores de 14 años: requiere consentimiento parental
- EduScan actúa como encargado del tratamiento, no como responsable

## Comandos frecuentes

```bash
npm run dev          # desarrollo local
npm run build        # build de producción
npm run lint         # linting
npx supabase start   # Supabase local
npx supabase db push # aplicar migraciones
```

## Lo que NO hacer

- No usar Firebase, AWS, u otros backends — Supabase es la decisión.
- No crear pipelines OCR separados — el modelo multimodal lo hace todo.
- No generar código en Vue/Angular/Svelte.
- No proponer features que no ahorren tiempo REAL al docente.
- No ignorar el contexto canario (terminología, normativa, particularidades).
