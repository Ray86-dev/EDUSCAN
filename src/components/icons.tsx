import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function defaults(props: IconProps, size = 24) {
  const { size: s = size, ...rest } = props;
  return { width: s, height: s, viewBox: "0 0 24 24", fill: "none", ...rest };
}

/** Logo EduScan — lupa + checkmark + sparkle */
export function EduScanLogo(props: IconProps) {
  const { size: s = 36, className, ...rest } = props;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" className={className} {...rest}>
      <defs>
        <linearGradient id="eduscan-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5a8266" />
          <stop offset="100%" stopColor="#3a5440" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#eduscan-bg)" />
      <circle cx="21" cy="21" r="9" fill="none" stroke="#c8dac0" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="27.5" y1="27.5" x2="35" y2="35" stroke="#c8dac0" strokeWidth="2.5" strokeLinecap="round" />
      <polyline points="16,21 19.5,24.5 26,18" fill="none" stroke="#e8f0e4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="12" r="1.5" fill="#c8dac0" opacity="0.8" />
      <line x1="36" y1="8.5" x2="36" y2="15.5" stroke="#c8dac0" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="32.5" y1="12" x2="39.5" y2="12" stroke="#c8dac0" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Icono Home — casa con techo */
export function IconHome(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <path d="M4 12l8-8 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10.5V19a1 1 0 001 1h3.5v-5h3v5H17a1 1 0 001-1v-8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Icono Grupos — dos personas */
export function IconGroup(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20v-1a5 5 0 015-5h2a5 5 0 015 5v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path d="M19 14a4 4 0 012.5 3.7V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Icono Corregir — documento con checkmark y lupa */
export function IconGrading(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <path d="M6 3h8l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v4a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="8,13 10.5,15.5 15,11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Icono Currículos — libro abierto */
export function IconCurriculum(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <path d="M2 4c2-1 4.5-1 6 0s3 1 4 1V19c-1 0-2.5 0-4-1s-4-1-6 0z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 5c1 0 2.5 0 4-1s4-1 6 0v15c-2-1-4.5-1-6 0s-3 1-4 1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** Icono Perfil — persona */
export function IconProfile(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Icono Actividades — clipboard con lista */
export function IconActivities(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <path d="M9 2h6a1 1 0 011 1v1H8V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <line x1="9" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9" y1="14" x2="13" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Icono Corregir Grupo — documento con lupa, para botón central */
export function IconCorrectGroup(props: IconProps) {
  const p = defaults(props, 28);
  return (
    <svg {...p} viewBox="0 0 28 28">
      <path d="M7 3h9l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3v4a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="15" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14.1 17.1L17 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Icono Cámara + foto de examen */
export function IconCameraExam(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <path d="M3 7a2 2 0 012-2h2l1.5-2h7L17 5h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <rect x="10" y="9.5" width="4" height="5" rx="0.5" stroke="currentColor" strokeWidth="0.8" />
      <line x1="11" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      <line x1="11" y1="12.5" x2="13" y2="12.5" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
    </svg>
  );
}

/** Icono Correcciones totales — lista con checks */
export function IconCorrectionsTotal(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <polyline points="7,9 8.5,10.5 11,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="13" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <polyline points="7,14 8.5,15.5 11,13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="13" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Icono Hoy — calendario con reloj */
export function IconToday(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.8" />
      <line x1="8" y1="2" x2="8" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="2" x2="16" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15" r="3" stroke="currentColor" strokeWidth="1.2" />
      <line x1="12" y1="13.5" x2="12" y2="15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="15" x2="13.5" y2="15.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Icono Flecha derecha */
export function IconArrowRight(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Icono Flecha derecha grande */
export function IconArrowForward(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Icono vacío — sin correcciones */
export function IconEmpty(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <path d="M6 3h8l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <path d="M14 3v4a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <line x1="9" y1="11" x2="15" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <line x1="15" y1="11" x2="9" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

/** Icono Auto Awesome / Sparkle */
export function IconSparkle(props: IconProps) {
  const p = defaults(props);
  return (
    <svg {...p}>
      <path d="M12 2l2.1 6.4L20 10l-5.9 1.6L12 18l-2.1-6.4L4 10l5.9-1.6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
      <path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}
