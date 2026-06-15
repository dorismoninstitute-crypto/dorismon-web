import Link from "next/link";
import Logo from "@/components/Logo";
import {
  GraduationCap, Users, Award, Globe, CheckCircle2, BookOpen,
  Calendar, Sparkles, ArrowRight, Languages, Target, Trophy,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* === NAVBAR === */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 flex items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <a href="#programas" className="hover:text-brand-600 transition">Programas</a>
            <a href="#por-que" className="hover:text-brand-600 transition">¿Por qué Dorismon?</a>
            <a href="#metodologia" className="hover:text-brand-600 transition">Metodología</a>
            <a href="#contacto" className="hover:text-brand-600 transition">Contacto</a>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2">
              Iniciar sesión
            </Link>
            <Link href="/register" className="text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition shadow-soft">
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* === HERO === */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full text-xs font-bold mb-5">
              <Sparkles size={14} />
              Inscripciones abiertas
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight mb-5">
              Domina el inglés y{" "}
              <span className="text-brand-600">transforma tu futuro</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
              Cursos para niños, jóvenes y adultos con profesores certificados,
              metodología comunicativa y certificación reconocida.
              Aprende hablando desde la primera clase.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3.5 rounded-xl transition shadow-card text-sm md:text-base">
                Empieza ahora
                <ArrowRight size={18} />
              </Link>
              <a href="#programas" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-bold px-6 py-3.5 rounded-xl border-2 border-slate-200 transition text-sm md:text-base">
                Ver programas
              </a>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 size={18} className="text-accent-600" />
                <span className="font-semibold">Test de nivel gratuito</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 size={18} className="text-accent-600" />
                <span className="font-semibold">Certificación oficial</span>
              </div>
            </div>
          </div>

          {/* Hero card derecha — placement test preview */}
          <div className="relative">
            <div className="relative bg-white rounded-3xl shadow-lifted border border-slate-100 p-6 md:p-8 max-w-md mx-auto lg:ml-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white">
                  <Target size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Test de nivel gratuito</p>
                  <p className="text-xs text-slate-500">Conoce tu nivel CEFR en minutos</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-5">
                Evaluación honesta de Grammar, Reading y Use of English.
                Listening y Speaking se evalúan en entrevista con coordinador.
              </p>
              <div className="space-y-2 mb-5">
                {["A1 — Principiante", "A2 — Elemental", "B1 — Intermedio", "B2 — Intermedio Alto", "C1 — Avanzado"].map((lvl, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    <span className="text-slate-700">{lvl}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="block w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold py-3 rounded-lg text-center transition">
                Hacer test gratis →
              </Link>
            </div>
            {/* Decorative badges flotantes */}
            <div className="absolute -top-4 -right-4 bg-accent-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lifted rotate-6 hidden md:block">
              <Trophy size={14} className="inline mr-1" /> Certificado oficial
            </div>
          </div>
        </div>
      </section>

      {/* === ESTADÍSTICAS === */}
      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-brand-600">CEFR</p>
              <p className="text-xs md:text-sm text-slate-600 font-semibold mt-1">A1 a C2</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-brand-600">100%</p>
              <p className="text-xs md:text-sm text-slate-600 font-semibold mt-1">Profesores certificados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-brand-600">3</p>
              <p className="text-xs md:text-sm text-slate-600 font-semibold mt-1">Modalidades: online, presencial, híbrida</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-brand-600">RD</p>
              <p className="text-xs md:text-sm text-slate-600 font-semibold mt-1">Santo Domingo, República Dominicana</p>
            </div>
          </div>
        </div>
      </section>

      {/* === PROGRAMAS === */}
      <section id="programas" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent-100 text-accent-700 px-3 py-1.5 rounded-full text-xs font-bold mb-3">
              <BookOpen size={14} />
              Nuestros programas
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-3">
              Cursos para cada etapa de la vida
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Programas diseñados según edad y objetivo. Desde los más pequeños hasta inglés ejecutivo.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Sparkles, title: "Inglés para Niños", desc: "Aprendizaje lúdico y motivador para los más pequeños (6-12 años).", color: "bg-pink-500" },
              { icon: GraduationCap, title: "Inglés para Jóvenes", desc: "Preparación para escuela secundaria y exámenes internacionales (13-17 años).", color: "bg-amber-500" },
              { icon: Users, title: "Inglés para Adultos", desc: "Para uso personal, viajes y desarrollo profesional. Todos los niveles.", color: "bg-brand-600" },
              { icon: Trophy, title: "Inglés Empresarial", desc: "Business English: presentaciones, emails, negociaciones, reuniones.", color: "bg-accent-600" },
            ].map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-lifted transition p-6">
                <div className={`w-12 h-12 ${p.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                  <p.icon size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{p.desc}</p>
                <Link href="/register" className="text-sm font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
                  Más información <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === POR QUÉ DORISMON === */}
      <section id="por-que" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full text-xs font-bold mb-3">
              <Award size={14} />
              Diferenciales
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-3">
              ¿Por qué Dorismon Language Institute?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Languages, title: "Metodología comunicativa", desc: "Aprendes hablando desde la primera clase. Sin enfoque gramatical tradicional aburrido." },
              { icon: GraduationCap, title: "Profesores certificados", desc: "Docentes con certificación internacional (TEFL, CELTA) y experiencia comprobada." },
              { icon: Award, title: "Certificación oficial", desc: "Recibí un certificado digital verificable al completar cada nivel CEFR." },
              { icon: Calendar, title: "Flexibilidad horaria", desc: "Clases online, presenciales o híbridas. Elige lo que mejor se adapte a tu rutina." },
              { icon: Target, title: "Test de nivel inteligente", desc: "Evaluación gratuita con 60 preguntas balanceadas. Te asignamos al nivel correcto." },
              { icon: Globe, title: "Plataforma moderna", desc: "Acceso a clases, materiales, tareas y progreso desde cualquier dispositivo." },
            ].map((b, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-brand-600 mb-4 shadow-soft">
                  <b.icon size={22} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA FINAL === */}
      <section id="contacto" className="py-16 md:py-24 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
            Empieza hoy tu camino al inglés
          </h2>
          <p className="text-base md:text-xl text-brand-100 mb-8 max-w-2xl mx-auto">
            Haz el test gratuito y conoce tu nivel CEFR. Te contactamos en 24 horas para diseñar tu plan personalizado.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-7 py-4 rounded-xl hover:bg-slate-50 transition shadow-lifted">
              <Sparkles size={18} />
              Crear cuenta gratis
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-brand-500/20 backdrop-blur-sm text-white font-bold px-7 py-4 rounded-xl hover:bg-brand-500/30 transition border border-white/20">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Logo size="md" variant="white" asLink={false} />
              <p className="text-sm text-slate-400 mt-4 max-w-md leading-relaxed">
                Academia de inglés en Santo Domingo, República Dominicana.
                Metodología comunicativa, profesores certificados y certificación oficial CEFR.
              </p>
            </div>
            <div>
              <p className="font-bold text-white mb-3 text-sm">Programas</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#programas" className="hover:text-white">Inglés para niños</a></li>
                <li><a href="#programas" className="hover:text-white">Inglés para jóvenes</a></li>
                <li><a href="#programas" className="hover:text-white">Inglés para adultos</a></li>
                <li><a href="#programas" className="hover:text-white">Inglés empresarial</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white mb-3 text-sm">Plataforma</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/register" className="hover:text-white">Crear cuenta</Link></li>
                <li><Link href="/login" className="hover:text-white">Iniciar sesión</Link></li>
                <li><Link href="/register" className="hover:text-white">Test de nivel</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Dorismon Language Institute. Todos los derechos reservados.</p>
            <p>Santo Domingo, República Dominicana 🇩🇴</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
