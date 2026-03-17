"use client";

import { createClient } from "@/lib/supabase/client";
import { EduScanLogo } from "@/components/icons";

const features = [
  { icon: "photo_camera", text: "Foto del examen" },
  { icon: "psychology", text: "Corrección IA" },
  { icon: "assignment_turned_in", text: "Nota + feedback" },
];

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Patrón de fondo sutil */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow detrás del logo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="w-full max-w-sm space-y-10 relative z-10">
        {/* Logo y propuesta de valor */}
        <div className="text-center space-y-5 animate-fade-in-up">
          <EduScanLogo size={72} className="mx-auto mb-2 shadow-xl shadow-primary/15 rounded-2xl" />

          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">
              EduScan
            </h1>
            <p className="text-primary font-headline font-semibold text-sm tracking-wide uppercase">
              Corrector IA de exámenes
            </p>
          </div>

          <p className="text-on-surface-variant text-[15px] leading-relaxed max-w-[300px] mx-auto">
            Sube una foto del examen y obtén la corrección, nota y feedback formativo en segundos.
          </p>
        </div>

        {/* Flow visual: Foto → IA → Resultado */}
        <div className="flex items-center justify-center gap-3 animate-fade-in-up-delay-1">
          {features.map((f, i) => (
            <div key={f.icon} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 bg-primary-container/60 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">
                    {f.icon}
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant font-medium leading-tight text-center w-16">
                  {f.text}
                </span>
              </div>
              {i < features.length - 1 && (
                <span className="material-symbols-outlined text-outline-variant text-sm -mt-4">
                  arrow_forward
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Login button */}
        <div className="space-y-4 animate-fade-in-up-delay-2">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-surface-container-lowest border border-outline-variant rounded-xl hover:bg-surface-container-low hover:shadow-md transition-all min-h-[44px] shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="font-medium text-on-surface">
              Iniciar sesión con Google
            </span>
          </button>

          <p className="text-[11px] text-on-surface-variant/70 text-center leading-relaxed">
            Al iniciar sesión, acepta el tratamiento de datos conforme a la
            normativa LOPD/GDPR vigente.
          </p>
        </div>
      </div>
    </div>
  );
}
