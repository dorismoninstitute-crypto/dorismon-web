import Link from "next/link";
import Logo from "@/components/Logo";
import { FadeIn } from "@/components/LandingAnimations";
import SiteImageSlot from "@/components/SiteImageSlot";
import LandingTestimonials from "@/components/LandingTestimonials";
import {
  CheckCircle2, ArrowRight, PlayCircle, Users, Laptop, Layers,
  Award, BookOpen, Clock, MessageCircle, Sparkles,
} from "lucide-react";

/**
 * V3.9.23 — Landing pública. Diseño aprobado por Luis: "moderna y juvenil,
 * clara con vida", con el test de nivel gratis como gancho principal.
 *
 * DECISIONES IMPORTANTES:
 * - Todo lo que se afirma acá es VERDADERO y verificable. No hay cifras de
 *   estudiantes inventadas, ni "#1 del país", ni logos de convenios que no
 *   existen: eso es riesgo legal y, peor, destruye la confianza cuando el
 *   interesado descubre que no era cierto.
 * - Las imágenes se suben desde Admin -> Imágenes del sitio (sin deploy).
 * - Los testimonios solo aparecen cuando hay reales cargados.
 */

const NAVY = "#0F2557";
const YELLOW = "#F5C842";

export default function Home() {
  // V3.5 — Datos estructurados para Google (escuela de idiomas)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Dorismon Language Institute",
    description:
      "Instituto de inglés en Santo Domingo. Clases en vivo online y presenciales, grupos pequeños, niveles A1 a C1 y test de nivel gratis.",
    url: "https://dorismon.com",
    logo: "https://dorismon.com/icons/icon-512.png",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Santo Domingo",
      addressCountry: "DO",
    },
    areaServed: { "@type": "Country", name: "República Dominicana" },
    sameAs: [],
  };

  const pasos = [
    { n: 1, titulo: "Haz el test gratis", texto: "Descubre tu nivel en solo 5 minutos, sin tarjeta y con resultado al instante.", color: "#2563EB", bg: "#E6F1FB" },
    { n: 2, titulo: "Conoce tu profesor", texto: "Agenda tu clase de prueba gratuita y recibe orientación personalizada.", color: "#7C3AED", bg: "#EEEDFE" },
    { n: 3, titulo: "Empieza a hablar", texto: "Únete a tu grupo y comienza tu camino en el inglés.", color: "#16A34A", bg: "#E1F5EE" },
  ];

  const niveles = [
    { code: "A1", bg: "#E1F5EE", fg: "#0F6E56" },
    { code: "A2", bg: "#E6F1FB", fg: "#185FA5" },
    { code: "B1", bg: "#EEEDFE", fg: "#534AB7" },
    { code: "B2", bg: "#FBEAF0", fg: "#993556" },
    { code: "C1", bg: "#FAEEDA", fg: "#854F0B" },
  ];

  const beneficios = [
    "Clases en vivo e interactivas",
    "Grupos de máximo 6 estudiantes",
    "Seguimiento de tu progreso en tiempo real",
    "Tareas, quizzes y materiales en la plataforma",
    "Certificado al completar tu nivel",
    "Accede desde tu celular o computadora",
  ];

  const cierreItems = [
    { Icon: Award, label: "Profesores certificados" },
    { Icon: BookOpen, label: "Material incluido" },
    { Icon: Clock, label: "Horarios flexibles" },
    { Icon: Layers, label: "Niveles A1 hasta C1" },
    { Icon: MessageCircle, label: "Acompañamiento por WhatsApp" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ==================== HEADER ==================== */}
      <header style={{ backgroundColor: NAVY }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" variant="white" asLink />
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <a href="#como-funciona" className="hover:text-white transition">Cómo funciona</a>
            <a href="#plataforma" className="hover:text-white transition">Plataforma</a>
            <Link href="/login" className="hover:text-white transition">Entrar</Link>
          </nav>
          <Link href="/register" style={{ backgroundColor: YELLOW, color: NAVY }}
            className="text-sm font-bold px-4 py-2 rounded-lg hover:brightness-95 transition shadow-sm">
            Empieza gratis
          </Link>
        </div>
      </header>

      {/* ==================== HERO ==================== */}
      <section className="bg-[#F8FAFF] border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <FadeIn>
              <div className="inline-flex items-center gap-2 bg-[#FFE9DF] text-[#993C1D] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                Clase de prueba gratis, sin compromiso
              </div>

              <h1 className="text-3xl md:text-[2.7rem] font-extrabold leading-[1.15] text-[#0F2557] mb-4">
                Deja de estudiar inglés.
                <br />
                Empieza a <span className="text-[#2563EB]">hablarlo.</span>
              </h1>

              <p className="text-base text-slate-600 leading-relaxed mb-7 max-w-lg">
                Clases en vivo con profesores certificados, grupos pequeños y una
                plataforma que te muestra tu avance. Online o presencial en Santo Domingo.
              </p>

              <div className="flex flex-wrap gap-3 items-center">
                <Link href="/register" style={{ backgroundColor: YELLOW, color: NAVY }}
                  className="inline-flex items-center gap-2 font-bold px-6 py-3.5 rounded-xl hover:brightness-95 transition shadow-md text-sm md:text-base">
                  Descubre tu nivel GRATIS
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#como-funciona"
                  className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-5 py-3.5 rounded-xl hover:border-slate-300 transition text-sm md:text-base">
                  <PlayCircle className="w-5 h-5 text-[#2563EB]" />
                  Ver cómo funciona
                </a>
              </div>

              <p className="text-xs text-slate-500 mt-4">5 minutos · sin tarjeta · resultado al instante</p>

              {/* Diferenciadores REALES (nada inventado) */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#16A34A]" />
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-[#0F2557]">Grupos pequeños</p>
                    <p className="text-xs text-slate-500">Máximo 6 estudiantes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-[#2563EB]" />
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-[#0F2557]">Clases online</p>
                    <p className="text-xs text-slate-500">y presenciales</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#7C3AED]" />
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-[#0F2557]">Desde A1</p>
                    <p className="text-xs text-slate-500">hasta C1</p>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Foto principal + fichas de niveles */}
            <FadeIn delay={120}>
              <div className="relative">
                <SiteImageSlot
                  slot="hero"
                  alt="Estudiante en clase de inglés online con Dorismon"
                  className="w-full h-[280px] md:h-[340px] object-cover rounded-2xl shadow-lg"
                  wrapperClassName="rounded-2xl"
                  placeholderText="Foto principal — súbela desde Admin, Imágenes del sitio"
                />
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 mx-4 -mt-8 relative">
                  <div className="flex justify-center gap-2 mb-2">
                    {niveles.map((n) => (
                      <span key={n.code} style={{ backgroundColor: n.bg, color: n.fg }}
                        className="text-xs font-bold px-3 py-1 rounded-full">
                        {n.code}
                      </span>
                    ))}
                  </div>
                  <p className="text-center text-xs text-slate-500">Tu camino. Tu ritmo. Tu progreso.</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ==================== CÓMO FUNCIONA ==================== */}
      <section id="como-funciona" className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0F2557]">Tu camino para hablar inglés</h2>
            <div className="w-16 h-1 rounded-full mx-auto mt-3" style={{ backgroundColor: YELLOW }} />
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {pasos.map((p, i) => (
              <FadeIn key={p.n} delay={i * 90}>
                <div style={{ backgroundColor: p.bg }} className="rounded-2xl p-6 h-full">
                  <div style={{ backgroundColor: p.color }}
                    className="w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center mb-4">
                    {p.n}
                  </div>
                  <h3 style={{ color: p.color }} className="font-bold text-base mb-2">{p.titulo}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{p.texto}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PLATAFORMA ==================== */}
      <section id="plataforma" className="py-16 md:py-20 bg-[#F8FAFF]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0F2557] mb-6 leading-snug">
                Una plataforma diseñada
                <br className="hidden md:block" /> para que avances
              </h2>
              <ul className="space-y-3 mb-8">
                {beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{b}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4FD7] text-white font-bold px-6 py-3.5 rounded-xl transition shadow-md text-sm">
                Explorar la plataforma
                <ArrowRight className="w-4 h-4" />
              </Link>
            </FadeIn>
            <FadeIn delay={120}>
              <SiteImageSlot
                slot="platform"
                alt="Panel del estudiante en la plataforma Dorismon"
                className="w-full h-[280px] md:h-[330px] object-cover object-top rounded-2xl shadow-lg border border-slate-200"
                wrapperClassName="rounded-2xl"
                placeholderText="Captura de la plataforma — entra como estudiante y toma una captura"
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIOS (solo aparece si hay reales) ============ */}
      <LandingTestimonials />

      {/* ==================== CIERRE ==================== */}
      <section className="py-14 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div style={{ backgroundColor: NAVY }} className="rounded-3xl px-6 py-10 md:px-12 md:py-12 relative overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug mb-3">
                  ¿Listo para descubrir <span className="text-[#4ADE80]">tu nivel?</span>
                </h2>
                <p className="text-sm text-white/70 mb-7 leading-relaxed">
                  Haz el test gratuito. Toma menos de 5 minutos y recibes tu
                  resultado al instante, junto con el siguiente paso para empezar.
                </p>
                <Link href="/register" style={{ backgroundColor: YELLOW, color: NAVY }}
                  className="inline-flex items-center gap-2 font-bold px-7 py-4 rounded-xl hover:brightness-95 transition shadow-lg text-sm md:text-base">
                  Quiero empezar ahora
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="hidden md:block">
                <SiteImageSlot
                  slot="cta"
                  alt=""
                  className="w-full h-[200px] object-contain"
                  wrapperClassName="rounded-2xl"
                  placeholderText="Ilustración opcional"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mt-10">
            {cierreItems.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-600">
                <Icon className="w-4 h-4 text-[#2563EB]" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-slate-900 text-white pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-1">
              <Logo size="md" variant="white" asLink={false} />
              <p className="text-sm text-slate-400 mt-4 max-w-md leading-relaxed">
                Instituto de inglés en Santo Domingo, República Dominicana.
                Clases en vivo, grupos pequeños y seguimiento de tu progreso.
              </p>
            </div>
            <div>
              <p className="font-bold text-white mb-3 text-sm">Empezar</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/register" className="hover:text-white">Test de nivel gratis</Link></li>
                <li><Link href="/register" className="hover:text-white">Crear cuenta</Link></li>
                <li><Link href="/login" className="hover:text-white">Iniciar sesión</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white mb-3 text-sm">Conocer</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#como-funciona" className="hover:text-white">Cómo funciona</a></li>
                <li><a href="#plataforma" className="hover:text-white">La plataforma</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Dorismon Language Institute. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/legal/privacidad" className="hover:text-white">Política de privacidad</Link>
              <Link href="/legal/terminos" className="hover:text-white">Términos de servicio</Link>
              <span>Santo Domingo, República Dominicana</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
