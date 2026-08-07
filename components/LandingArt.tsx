/**
 * V3.9.24 — Ilustraciones dibujadas en código (SVG).
 *
 * POR QUÉ EXISTEN: la landing necesita imágenes desde el día uno, sin esperar
 * a que Luis consiga fotos. Estas se dibujan con código, así que:
 *   - pesan casi nada y cargan al instante
 *   - todas comparten el mismo estilo y colores (una sola historia visual)
 *   - no ocupan almacenamiento
 *
 * IMPORTANTE: cada una es SOLO un respaldo. Si el admin sube una imagen real
 * a ese espacio, la foto reemplaza al dibujo automáticamente (ver SiteImageSlot).
 */

const AZUL = "#3D6FF5";
const AZUL_OSCURO = "#1B3A8C";
const VIOLETA = "#7C5CFF";
const VERDE = "#12B886";
const CORAL = "#FF6B4A";
const AMARILLO = "#FFC93C";
const TINTA = "#16224A";

/** Panel del estudiante — el dibujo grande de la sección de plataforma */
export function DrawPlatform({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 380" className={className} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Vista del panel del estudiante">
      <rect width="640" height="380" rx="16" fill="#FFFFFF" />
      <rect x="0" y="0" width="150" height="380" rx="16" fill={TINTA} />
      <rect x="134" y="0" width="16" height="380" fill={TINTA} />
      <circle cx="32" cy="34" r="11" fill={AMARILLO} />
      <rect x="50" y="28" width="62" height="7" rx="3.5" fill="#FFFFFF" opacity="0.9" />
      <rect x="50" y="41" width="40" height="5" rx="2.5" fill="#FFFFFF" opacity="0.4" />
      <rect x="20" y="76" width="110" height="26" rx="8" fill={AZUL} />
      <rect x="32" y="86" width="60" height="6" rx="3" fill="#FFFFFF" opacity="0.95" />
      {[116, 148, 180, 212, 244].map((y, i) => (
        <g key={y}>
          <rect x="32" y={y + 8} width={70 - i * 6} height="6" rx="3" fill="#FFFFFF" opacity="0.32" />
        </g>
      ))}

      <rect x="176" y="28" width="150" height="11" rx="5.5" fill={TINTA} opacity="0.85" />
      <rect x="176" y="47" width="96" height="7" rx="3.5" fill={TINTA} opacity="0.3" />

      {[
        { x: 176, c: AZUL, bg: "#DCE5FB", v: "12" },
        { x: 300, c: VIOLETA, bg: "#EFE7FF", v: "8" },
        { x: 424, c: VERDE, bg: "#D6F5E9", v: "85%" },
      ].map((k) => (
        <g key={k.x}>
          <rect x={k.x} y="76" width="110" height="72" rx="12" fill={k.bg} />
          <text x={k.x + 16} y="112" fontSize="24" fontWeight="600" fill={k.c} fontFamily="system-ui, sans-serif">{k.v}</text>
          <rect x={k.x + 16} y="124" width="52" height="6" rx="3" fill={k.c} opacity="0.45" />
        </g>
      ))}

      <rect x="176" y="164" width="358" height="70" rx="12" fill="#F1F4FD" />
      <rect x="192" y="182" width="88" height="7" rx="3.5" fill={TINTA} opacity="0.55" />
      <rect x="192" y="202" width="326" height="12" rx="6" fill="#DCE5FB" />
      <rect x="192" y="202" width="238" height="12" rx="6" fill={AZUL} />

      <rect x="176" y="250" width="358" height="100" rx="12" fill="#FFFFFF" stroke="#E4EAF6" strokeWidth="1.5" />
      <circle cx="208" cy="284" r="16" fill="#EFE7FF" />
      <rect x="234" y="274" width="120" height="8" rx="4" fill={TINTA} opacity="0.7" />
      <rect x="234" y="290" width="80" height="6" rx="3" fill={TINTA} opacity="0.28" />
      <rect x="430" y="272" width="88" height="26" rx="8" fill={AZUL} />
      <rect x="448" y="282" width="52" height="6" rx="3" fill="#FFFFFF" opacity="0.95" />
      <rect x="192" y="318" width="150" height="6" rx="3" fill={TINTA} opacity="0.2" />
      <rect x="192" y="332" width="96" height="6" rx="3" fill={TINTA} opacity="0.14" />
    </svg>
  );
}

/** Mini: próxima clase / calendario */
export function DrawNextClass({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 200" className={className} role="img" aria-label="Tarjeta de próxima clase">
      <rect width="300" height="200" rx="14" fill="#FFFFFF" />
      <rect x="20" y="20" width="260" height="34" rx="9" fill="#DCE5FB" />
      <circle cx="40" cy="37" r="8" fill={AZUL} />
      <rect x="56" y="33" width="88" height="7" rx="3.5" fill={AZUL_OSCURO} opacity="0.8" />
      <rect x="214" y="31" width="50" height="12" rx="6" fill={AZUL} />

      <rect x="20" y="68" width="260" height="52" rx="10" fill="#F1F4FD" />
      <rect x="34" y="82" width="14" height="14" rx="4" fill={VERDE} />
      <rect x="58" y="83" width="104" height="7" rx="3.5" fill={TINTA} opacity="0.7" />
      <rect x="58" y="97" width="66" height="6" rx="3" fill={TINTA} opacity="0.28" />
      <rect x="196" y="82" width="68" height="24" rx="8" fill={CORAL} />
      <rect x="212" y="91" width="36" height="6" rx="3" fill="#FFFFFF" opacity="0.95" />

      <rect x="20" y="134" width="260" height="46" rx="10" fill="#F1F4FD" />
      <rect x="34" y="148" width="14" height="14" rx="4" fill={VIOLETA} />
      <rect x="58" y="149" width="88" height="7" rx="3.5" fill={TINTA} opacity="0.55" />
      <rect x="58" y="163" width="54" height="6" rx="3" fill={TINTA} opacity="0.22" />
    </svg>
  );
}

/** Mini: progreso del estudiante */
export function DrawProgress({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 200" className={className} role="img" aria-label="Tarjeta de progreso del estudiante">
      <rect width="300" height="200" rx="14" fill="#FFFFFF" />
      <rect x="20" y="22" width="96" height="8" rx="4" fill={TINTA} opacity="0.7" />
      <rect x="228" y="20" width="52" height="14" rx="7" fill="#EFE7FF" />

      <rect x="20" y="48" width="260" height="14" rx="7" fill="#EDF1FB" />
      <rect x="20" y="48" width="196" height="14" rx="7" fill={VIOLETA} />

      {[
        { x: 20, c: VERDE, bg: "#D6F5E9", w: 56 },
        { x: 88, c: AZUL, bg: "#DCE5FB", w: 44 },
        { x: 144, c: VIOLETA, bg: "#EFE7FF", w: 60 },
      ].map((b) => (
        <g key={b.x}>
          <rect x={b.x} y="80" width={b.w} height="22" rx="11" fill={b.bg} />
          <rect x={b.x + 12} y="88" width={b.w - 24} height="6" rx="3" fill={b.c} />
        </g>
      ))}

      <rect x="20" y="118" width="120" height="62" rx="11" fill="#F1F4FD" />
      <rect x="34" y="132" width="46" height="7" rx="3.5" fill={TINTA} opacity="0.45" />
      <rect x="34" y="148" width="70" height="18" rx="6" fill={VERDE} opacity="0.75" />

      <rect x="152" y="118" width="128" height="62" rx="11" fill="#F1F4FD" />
      {[168, 190, 212, 234, 256].map((x, i) => (
        <rect key={x} x={x} y={168 - (i + 1) * 7} width="12" height={(i + 1) * 7} rx="4" fill={AZUL} opacity={0.35 + i * 0.15} />
      ))}
    </svg>
  );
}

/** Mini: certificado */
export function DrawCertificate({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 200" className={className} role="img" aria-label="Certificado de nivel completado">
      <rect width="300" height="200" rx="14" fill="#FFFFFF" />
      <rect x="30" y="24" width="240" height="152" rx="10" fill="#FFFDF5" stroke={AMARILLO} strokeWidth="2" />
      <rect x="40" y="34" width="220" height="132" rx="6" fill="none" stroke={AMARILLO} strokeWidth="1" opacity="0.45" />

      <circle cx="150" cy="66" r="19" fill="#FFF2CE" />
      <path d="M150 55 l3.4 7.2 7.6 1 -5.6 5.4 1.4 7.8 -6.8 -3.8 -6.8 3.8 1.4 -7.8 -5.6 -5.4 7.6 -1z" fill={AMARILLO} />

      <rect x="98" y="98" width="104" height="9" rx="4.5" fill={TINTA} opacity="0.72" />
      <rect x="118" y="116" width="64" height="6" rx="3" fill={TINTA} opacity="0.32" />
      <rect x="126" y="132" width="48" height="18" rx="9" fill={VERDE} />

      <rect x="60" y="156" width="52" height="5" rx="2.5" fill={TINTA} opacity="0.2" />
      <rect x="188" y="156" width="52" height="5" rx="2.5" fill={TINTA} opacity="0.2" />
    </svg>
  );
}

/** Ilustración del cierre — estudiante con laptop */
export function DrawFinalCta({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 220" className={className} role="img" aria-label="Estudiante practicando inglés">
      <circle cx="150" cy="104" r="78" fill="#FFFFFF" opacity="0.12" />

      <rect x="72" y="150" width="156" height="12" rx="6" fill="#FFFFFF" opacity="0.9" />
      <rect x="88" y="106" width="124" height="46" rx="6" fill="#FFFFFF" opacity="0.95" />
      <rect x="98" y="116" width="104" height="28" rx="4" fill={AZUL} opacity="0.35" />

      <circle cx="150" cy="70" r="24" fill="#FFE0CC" />
      <path d="M126 68 a24 24 0 0 1 48 0 v-6 a24 24 0 0 0 -48 0z" fill={TINTA} opacity="0.85" />
      <rect x="124" y="62" width="9" height="18" rx="4.5" fill="#FFFFFF" opacity="0.9" />
      <rect x="167" y="62" width="9" height="18" rx="4.5" fill="#FFFFFF" opacity="0.9" />
      <rect x="124" y="58" width="52" height="7" rx="3.5" fill="#FFFFFF" opacity="0.9" />

      <rect x="42" y="46" width="62" height="26" rx="13" fill={AMARILLO} />
      <rect x="56" y="56" width="34" height="6" rx="3" fill="#4A3505" opacity="0.75" />

      <rect x="196" y="76" width="66" height="26" rx="13" fill={VERDE} />
      <rect x="212" y="86" width="34" height="6" rx="3" fill="#FFFFFF" opacity="0.95" />
    </svg>
  );
}

/** Tarjetas de diferenciadores (arriba, junto al hero) */
export function DrawSmallGroups({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} role="img" aria-label="Grupos pequeños">
      <rect width="120" height="80" rx="12" fill="#D6F5E9" />
      {[
        { x: 30, y: 30, r: 9, o: 1 },
        { x: 60, y: 24, r: 11, o: 1 },
        { x: 90, y: 30, r: 9, o: 1 },
      ].map((c) => (
        <g key={c.x}>
          <circle cx={c.x} cy={c.y} r={c.r} fill={VERDE} opacity={c.o} />
          <path d={`M${c.x - c.r - 3} ${c.y + c.r + 14} a${c.r + 3} ${c.r + 1} 0 0 1 ${(c.r + 3) * 2} 0z`} fill={VERDE} opacity="0.75" />
        </g>
      ))}
    </svg>
  );
}

export function DrawOnlineOnsite({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} role="img" aria-label="Clases online y presenciales">
      <rect width="120" height="80" rx="12" fill="#DCE5FB" />
      <rect x="18" y="22" width="48" height="34" rx="5" fill={AZUL_OSCURO} />
      <rect x="24" y="28" width="36" height="22" rx="3" fill="#FFFFFF" opacity="0.85" />
      <rect x="30" y="58" width="24" height="4" rx="2" fill={AZUL_OSCURO} opacity="0.6" />
      <path d="M78 52 l14 -18 14 18z" fill={AZUL} />
      <rect x="84" y="50" width="16" height="14" rx="2" fill={AZUL} />
      <rect x="89" y="56" width="6" height="8" rx="1" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

export function DrawLevels({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} role="img" aria-label="Niveles de A1 hasta C1">
      <rect width="120" height="80" rx="12" fill="#EFE7FF" />
      {[
        { x: 18, h: 16, c: "#12B886" },
        { x: 38, h: 26, c: "#3D6FF5" },
        { x: 58, h: 36, c: "#7C5CFF" },
        { x: 78, h: 46, c: "#EC4899" },
      ].map((b) => (
        <rect key={b.x} x={b.x} y={64 - b.h} width="14" height={b.h} rx="4" fill={b.c} />
      ))}
      <path d="M98 26 l4.6 9.4 10.4 1.6 -7.5 7.3 1.8 10.3 -9.3 -4.9 -9.3 4.9 1.8 -10.3 -7.5 -7.3 10.4 -1.6z" fill={AMARILLO} transform="translate(-2,-4) scale(0.72) translate(38,10)" />
    </svg>
  );
}
