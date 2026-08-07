import Link from "next/link";
import Logo from "@/components/Logo";
import { FadeIn } from "@/components/LandingAnimations";
import SiteImageSlot from "@/components/SiteImageSlot";
import LandingTestimonials from "@/components/LandingTestimonials";
import {
  DrawPlatform, DrawNextClass, DrawProgress, DrawCertificate,
  DrawFinalCta, DrawSmallGroups, DrawOnlineOnsite, DrawLevels,
} from "@/components/LandingArt";
import { ArrowRight, Gift, Users, Laptop, Award, Sparkles } from "lucide-react";

/**
 * V3.9.24 — Landing pública. Diseño aprobado por Luis: clara y con vida,
 * colores vivos, sin bloques oscuros, con movimiento suave.
 *
 * SISTEMA DE IMÁGENES (lo importante):
 * Cada espacio muestra un DIBUJO hecho en código. Cuando Luis sube una foto
 * real desde Admin → Imágenes del sitio, la foto reemplaza al dibujo sola,
 * sin tocar código ni desplegar.
 *
 * NADA DE LO QUE SE AFIRMA AQUÍ ES INVENTADO: sin cifras de estudiantes sin
 * respaldo, sin "#1 del país", sin logos de convenios inexistentes.
 */

const TINTA = "#16224A";
const AZUL = "#3D6FF5";
const CORAL = "#FF6B4A";
const AMARILLO = "#FFC93C";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Dorismon Language Institute",
    description:
      "Instituto de inglés en Santo Domingo. Clases en vivo online y presenciales, grupos de máximo 6, niveles A1 a C1 y test de nivel gratis.",
    url: "https://dorismon.com",
    logo: "https://dorismon.com/icons/icon-512.png",
    address: { "@type": "PostalAddress", addressLocality: "Santo Domingo", addressCountry: "DO" },
    areaServed: { "@type": "Country", name: "República Dominicana" },
    sameAs: [],
  };

  const niveles = [
    { code: "A1", bg: "#12B886", anim: "ds-float" },
    { code: "A2", bg: "#3D6FF5", anim: "ds-float-2" },
    { code: "B1", bg: "#7C5CFF", anim: "ds-float-3" },
    { code: "B2", bg: "#EC4899", anim: "ds-float" },
    { code: "C1", bg: "#F59E0B", anim: "ds-float-2" },
  ];

  const diferenciadores = [
    { Art: DrawSmallGroups, Icon: Users, titulo: "Grupos de máximo 6", texto: "Hablas en cada clase", tint: "#D6F5E9", color: "#0F6E56" },
    { Art: DrawOnlineOnsite, Icon: Laptop, titulo: "Online y presencial", texto: "En Santo Domingo", tint: "#DCE5FB", color: "#1B3A8C" },
    { Art: DrawLevels, Icon: Award, titulo: "De A1 hasta C1", texto: "Con certificado", tint: "#EFE7FF", color: "#5B3FD1" },
  ];

  const tarjetasPlataforma = [
    { slot: "mini_class", Draw: DrawNextClass, titulo: "Entra a clase con un toque", texto: "Tu horario y tu enlace, siempre a mano.", bg: "#DCE5FB", tt: "#0C447C", st: "#185FA5" },
    { slot: "mini_progress", Draw: DrawProgress, titulo: "Mira cuánto avanzaste", texto: "Tu profesor ve lo mismo que tú.", bg: "#EFE7FF", tt: "#3C3489", st: "#534AB7" },
    { slot: "mini_certificate", Draw: DrawCertificate, titulo: "Certifica cada nivel", texto: "Demuestra lo que lograste.", bg: "#D6F5E9", tt: "#085041", st: "#0F6E56" },
  ];

  return (
    <div className="min-h-screen bg-[#F1F4FD]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ==================== HEADER ==================== */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" asLink />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#plataforma" className="hover:text-slate-900 transition">Plataforma</a>
            <a href="#como-funciona" className="hover:text-slate-900 transition">Cómo funciona</a>
            <Link href="/login" className="hover:text-slate-900 transition">Entrar</Link>
          </nav>
          <Link href="/register" style={{ backgroundColor: CORAL }}
            className="text-sm font-bold text-white px-5 py-2.5 rounded-full hover:brightness-95 transition">
            Empieza gratis
          </Link>
        </div>
      </header>

      {/* ==================== HERO ==================== */}
      <section className="bg-[#F1F4FD]">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <FadeIn>
              <div className="ds-pulse inline-flex items-center gap-2 bg-[#FFE3D6] text-[#993C1D] text-xs font-bold px-4 py-1.5 rounded-full mb-5">
                <Gift className="w-3.5 h-3.5" />
                Clase de prueba gratis
              </div>

              <h1 className="text-3xl md:text-[2.6rem] font-extrabold leading-[1.18] mb-4" style={{ color: TINTA }}>
                Deja de estudiar inglés.
                <br />
                Empieza a <span style={{ color: AZUL }}>hablarlo.</span>
              </h1>

              <p className="text-base text-slate-600 leading-relaxed mb-7 max-w-lg">
                Profesores reales, grupos de máximo seis y una plataforma que te
                muestra cómo vas avanzando. Online o presencial en Santo Domingo.
              </p>

              <div className="flex flex-wrap gap-4 items-center">
                <Link href="/register" style={{ backgroundColor: CORAL }}
                  className="inline-flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-full hover:brightness-95 transition text-sm md:text-base">
                  Descubre tu nivel gratis
                </Link>
                <a href="#plataforma" className="inline-flex items-center gap-1.5 font-semibold text-sm" style={{ color: AZUL }}>
                  Ver la plataforma
                  <ArrowRight className="w-4 h-4 ds-nudge" />
                </a>
              </div>

              <p className="text-xs text-slate-500 mt-4">5 minutos · sin tarjeta · resultado al instante</p>
            </FadeIn>

            <FadeIn delay={120}>
              <div>
                <SiteImageSlot
                  slot="hero"
                  priority
                  alt="Estudiante en clase de inglés con Dorismon"
                  className="w-full h-[180px] sm:h-[230px] md:h-[290px] object-cover rounded-2xl"
                  placeholderText="Tu foto principal — súbela desde Admin, Imágenes del sitio"
                />
                {/* Fichas de nivel flotantes */}
                <div className="flex justify-center gap-2 mt-4 flex-wrap">
                  {niveles.map((n) => (
                    <span key={n.code} style={{ backgroundColor: n.bg }}
                      className={`${n.anim} text-white text-xs font-bold px-3.5 py-1.5 rounded-full`}>
                      {n.code}
                    </span>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-500 mt-2.5">Tu camino. Tu ritmo. Tu progreso.</p>
              </div>
            </FadeIn>
          </div>

          {/* Diferenciadores REALES con ilustración */}
          <div className="grid sm:grid-cols-3 gap-3 mt-10">
            {diferenciadores.map(({ Art, Icon, titulo, texto, tint, color }, i) => (
              <FadeIn key={titulo} delay={i * 80}>
                <div className="bg-white rounded-2xl p-4 flex items-center gap-3 h-full">
                  <div className="w-14 h-10 flex-shrink-0 rounded-xl overflow-hidden">
                    <Art className="w-full h-full" />
                  </div>
                  <div className="leading-tight min-w-0">
                    <p className="text-sm font-bold" style={{ color: TINTA }}>{titulo}</p>
                    <p className="text-xs text-slate-500">{texto}</p>
                  </div>
                  <Icon className="w-4 h-4 ml-auto flex-shrink-0" style={{ color }} aria-hidden="true" />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PLATAFORMA ==================== */}
      <section id="plataforma" className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: TINTA }}>
              Todo ocurre dentro de Dorismon
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto leading-relaxed">
              No es solo una academia: es tu plataforma. Clases, tareas, progreso
              y certificado en un mismo lugar.
            </p>
          </div>

          <FadeIn>
            {/* V3.9.24.1 — Ancho y alto limitados: a pantalla completa el panel
                se veía desproporcionado y empujaba el resto de la página.
                Aplica igual al dibujo y a la captura real que suba el admin. */}
            <div className="max-w-4xl mx-auto rounded-2xl bg-[#F1F4FD] border border-[#DCE5FB] p-3 md:p-4 mb-6">
              <SiteImageSlot
                slot="platform"
                alt="Panel del estudiante en la plataforma Dorismon"
                className="w-full max-h-[190px] sm:max-h-[280px] md:max-h-[400px] object-contain rounded-xl overflow-hidden"
                fallback={<DrawPlatform className="w-full max-h-[190px] sm:max-h-[280px] md:max-h-[400px]" />}
              />
            </div>
          </FadeIn>

          {/* V3.9.25 — En celular se deslizan con el dedo en vez de apilarse:
              antes eran 3 imágenes una debajo de otra y la página se volvía
              un álbum de fotos interminable. */}
          <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0 ds-noscrollbar">
            {tarjetasPlataforma.map((t, i) => (
              <FadeIn key={t.slot} delay={i * 90} className="snap-center shrink-0 w-[78%] sm:w-[45%] md:w-auto">
                <div style={{ backgroundColor: t.bg }} className="rounded-2xl p-5 h-full">
                  <div className="rounded-xl overflow-hidden mb-4 bg-white/60">
                    <SiteImageSlot
                      slot={t.slot}
                      alt={t.titulo}
                      className="w-full h-[110px] md:h-[130px] object-cover"
                      fallback={<t.Draw className="w-full h-[110px] md:h-[130px]" />}
                    />
                  </div>
                  <h3 className="font-bold text-sm mb-1.5" style={{ color: t.tt }}>{t.titulo}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: t.st }}>{t.texto}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <p className="md:hidden text-center text-[11px] text-slate-400 mt-2">Desliza para ver más →</p>
        </div>
      </section>

      {/* ==================== CÓMO FUNCIONA ==================== */}
      <section id="como-funciona" className="bg-[#F1F4FD] py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: TINTA }}>
              Empezar toma 3 pasos
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {[
              { n: 1, t: "Haz el test gratis", d: "Descubre tu nivel en 5 minutos, sin tarjeta.", c: "#3D6FF5" },
              { n: 2, t: "Conoce tu profesor", d: "Agenda tu clase de prueba y recibe orientación.", c: "#7C5CFF" },
              { n: 3, t: "Empieza a hablar", d: "Únete a tu grupo y comienza tu camino.", c: "#12B886" },
            ].map((p, i) => (
              <FadeIn key={p.n} delay={i * 90}>
                <div className="bg-white rounded-2xl p-6 h-full">
                  <div style={{ backgroundColor: p.c }}
                    className="w-11 h-11 rounded-2xl text-white font-bold flex items-center justify-center mb-4 text-lg">
                    {p.n}
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ color: TINTA }}>{p.t}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{p.d}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Foto de grupo */}
          <FadeIn>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center bg-white rounded-3xl p-5 md:p-8">
              <SiteImageSlot
                slot="group"
                alt="Grupo de estudiantes en clase de inglés"
                className="w-full h-[160px] md:h-[210px] object-cover rounded-2xl order-2 md:order-1"
                placeholderText="Foto de un grupo en clase"
              />
              <div className="order-1 md:order-2">
                <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: TINTA }}>
                  Aprendes con personas, no con una app
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  Grupos de máximo seis para que hables en cada clase, con un
                  profesor que te corrige y te conoce por tu nombre.
                </p>
                <Link href="/register" className="inline-flex items-center gap-2 font-bold text-sm" style={{ color: AZUL }}>
                  Agenda tu clase de prueba
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============ TESTIMONIOS (solo si hay reales) ============ */}
      <LandingTestimonials />

      {/* ==================== CIERRE ==================== */}
      <section className="bg-white py-14 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div style={{ backgroundColor: AZUL }} className="rounded-3xl px-6 py-10 md:px-12 md:py-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug mb-3">
                  ¿Listo para descubrir{" "}
                  <span style={{ color: AMARILLO }}>tu nivel?</span>
                </h2>
                <p className="text-sm text-white/80 mb-7 leading-relaxed">
                  Haz el test gratis. Toma menos de 5 minutos y recibes tu
                  resultado al instante, junto con el siguiente paso para empezar.
                </p>
                <Link href="/register" style={{ backgroundColor: AMARILLO, color: "#4A3505" }}
                  className="ds-pulse inline-flex items-center gap-2 font-bold px-7 py-4 rounded-full hover:brightness-95 transition text-sm md:text-base">
                  Quiero empezar ahora
                  <Sparkles className="w-4 h-4" />
                </Link>
              </div>
              <div className="hidden md:block">
                <SiteImageSlot
                  slot="cta"
                  alt=""
                  className="w-full max-h-[210px] object-contain"
                  fallback={<DrawFinalCta className="w-full h-[210px]" />}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-white border-t border-slate-100 pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <Logo size="md" asLink={false} />
              <p className="text-sm text-slate-500 mt-4 max-w-md leading-relaxed">
                Instituto de inglés en Santo Domingo, República Dominicana.
                Clases en vivo, grupos pequeños y seguimiento de tu progreso.
              </p>
            </div>
            <div>
              <p className="font-bold mb-3 text-sm" style={{ color: TINTA }}>Empezar</p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/register" className="hover:text-slate-900">Test de nivel gratis</Link></li>
                <li><Link href="/register" className="hover:text-slate-900">Crear cuenta</Link></li>
                <li><Link href="/login" className="hover:text-slate-900">Iniciar sesión</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-3 text-sm" style={{ color: TINTA }}>Conocer</p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#plataforma" className="hover:text-slate-900">La plataforma</a></li>
                <li><a href="#como-funciona" className="hover:text-slate-900">Cómo funciona</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Dorismon Language Institute. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/legal/privacidad" className="hover:text-slate-700">Política de privacidad</Link>
              <Link href="/legal/terminos" className="hover:text-slate-700">Términos de servicio</Link>
              <span>Santo Domingo, República Dominicana</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
