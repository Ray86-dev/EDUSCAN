"use client";

import { useState } from "react";

export default function CorregirPage() {
  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
      {/* Top Progress */}
      <div className="lg:col-span-12">
        <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: "65%" }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-headline font-bold text-on-surface">Corregir</h2>
          <span className="text-sm font-medium text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
            14 de 22 corregidos
          </span>
        </div>
      </div>

      {/* Left Column: Student Info */}
      <div className="lg:col-span-4 space-y-8">
        <section className="bg-surface-container-low p-8 rounded-xl space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              Estudiante actual
            </span>
            <h2 className="text-3xl font-headline font-extrabold leading-tight text-on-background">
              Alejandro Martos
            </h2>
            <p className="text-on-surface-variant text-sm">
              Examen Parcial: Biología - Genética
            </p>
          </div>

          <div className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-secondary-container">
                person
              </span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">4º ESO B - Nº 15</p>
              <p className="text-sm font-semibold">Martos García, Alejandro</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-on-surface-variant">Estado del envío</h3>
            <div className="flex items-center gap-2 text-sm text-on-primary-fixed-variant">
              <span
                className="material-symbols-outlined text-primary text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              Entregado a tiempo
            </div>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-base">attach_file</span>
              1 imagen adjunta
            </div>
          </div>
        </section>

        {/* Quick Observations */}
        <section className="bg-surface-container-low p-8 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-on-surface-variant">Observaciones rápidas</h3>
          <div className="grid grid-cols-1 gap-2">
            {[
              "Excelente redacción",
              "Falta profundizar conceptos",
              "Buena estructura lógica",
              "Cuidado con la ortografía",
            ].map((obs) => (
              <button
                key={obs}
                className="text-left px-4 py-3 bg-surface-container-lowest hover:bg-primary-container/10 border-b-2 border-transparent hover:border-primary transition-all text-sm rounded-lg"
              >
                {obs}
              </button>
            ))}
          </div>
          <div className="pt-4">
            <textarea
              className="w-full bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 text-sm py-2 resize-none h-24 transition-all font-body"
              placeholder="Añadir comentario personalizado..."
              spellCheck={false}
            />
          </div>
        </section>
      </div>

      {/* Right Column: Questions & Scoring */}
      <div className="lg:col-span-8 space-y-6 custom-scrollbar">
        {/* Question 1 */}
        <QuestionCard
          number={1}
          question="Explique el proceso de la mitosis y sus fases principales."
          answer="La mitosis es la división celular donde una célula madre se divide en dos células hijas idénticas. Las fases son: profase, donde los cromosomas se condensan; metafase, donde se alinean en el centro; anafase, donde se separan; y telofase, donde se forman los núcleos nuevos..."
          maxScore={10}
          defaultScore={8}
        />

        {/* Question 2 */}
        <QuestionCard
          number={2}
          question="Defina el concepto de alelo dominante y alelo recesivo."
          answer="Un alelo dominante es el que se expresa siempre que está presente. El recesivo solo se expresa cuando los dos alelos son recesivos."
          maxScore={5}
          defaultScore={3.5}
          useSlider
        />

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-outline-variant">
          <button className="flex items-center gap-2 px-6 py-3 text-secondary font-bold hover:bg-secondary-container/20 rounded-xl transition-all min-h-[44px]">
            <span className="material-symbols-outlined">arrow_back</span>
            Anterior
          </button>
          <div className="flex gap-4">
            <button className="px-8 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-xl hover:shadow-md transition-all min-h-[44px]">
              Guardar Borrador
            </button>
            <button className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all min-h-[44px]">
              Siguiente Estudiante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({
  number,
  question,
  answer,
  maxScore,
  defaultScore,
  useSlider = false,
}: {
  number: number;
  question: string;
  answer: string;
  maxScore: number;
  defaultScore: number;
  useSlider?: boolean;
}) {
  const [score, setScore] = useState(defaultScore);

  return (
    <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border-l-4 border-primary">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest">
            Pregunta {number}
          </span>
          <p className="text-lg font-headline font-semibold leading-snug">{question}</p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-extrabold text-primary">/{maxScore}</span>
        </div>
      </div>

      <div className="bg-surface-container-low p-6 rounded-lg text-on-surface-variant text-base leading-relaxed mb-6 italic">
        &ldquo;{answer}&rdquo;
      </div>

      {useSlider ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-bold">Ajuste de precisión:</span>
            <span className="text-lg font-bold text-primary">
              {score} / {maxScore}.0
            </span>
          </div>
          <div className="relative w-full">
            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all"
                style={{ width: `${(score / maxScore) * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={maxScore}
              step={0.5}
              value={score}
              onChange={(e) => setScore(parseFloat(e.target.value))}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold mr-2">Calificación:</span>
          <div className="flex gap-1">
            {Array.from({ length: maxScore }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setScore(n)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all font-bold ${
                  score === n
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-surface-container-high hover:bg-primary hover:text-white"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
