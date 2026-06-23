import Link from "next/link";
import Logo from "@/components/Logo";
import { CountUp, FadeIn } from "@/components/LandingAnimations";
import {
  GraduationCap, Users, Award, Globe, CheckCircle2, BookOpen,
  Calendar, Sparkles, ArrowRight, Languages, Target, Trophy,
  MapPin, Gift, Star, Clock, Heart, Smile,
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

      {/* === HERO (V3.2 — híbrido: clase gratis + local) === */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-accent-100 text-accent-700 px-3 py-1.5 rounded-full text-xs font-bold mb-4">
              <MapPin size={14} />
              Santo Domingo, República Dominicana
            </div>
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold mb-5 ml-0 md:ml-2">
              <Gift size={14} />
              Primera clase 100% gratis
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight mb-5">
              Prueba una clase de inglés{" "}
              <span className="text-brand-600">gratis</span>, sin compromiso
            </h1>
            <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
              Tu instituto de inglés en Santo Domingo. Clases online y presenciales
              con profesores certificados. Conoce nuestra metodología antes de
              inscribirte — reserva tu clase de prueba en 2 minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3.5 rounded-xl transition shadow-card text-sm md:text-base">
                <Gift size={18} />
                Reservar mi clase gratis
              </Link>
              <a href="#programas" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-brand-50 text-brand-700 font-bold px-6 py-3.5 rounded-xl border-2 border-brand-100 transition text-sm md:text-base">
                Ver programas
              </a>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 size={18} className="text-accent-600" />
                <span className="font-semibold">Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 size={18} className="text-accent-600" />
                <span className="font-semibold">Online o presencial</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 size={18} className="text-accent-600" />
                <span className="font-semibold">Profesores certificados</span>
              </div>
            </div>
          </div>

          {/* Hero card derecha — clase de prueba */}
          <div className="relative">
            <div className="relative bg-white rounded-3xl shadow-lifted border border-slate-100 p-6 md:p-8 max-w-md mx-auto lg:ml-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white">
                  <Gift size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Clase de prueba GRATIS</p>
                  <p className="text-xs text-slate-500">Conoce a tu profesor y la metodología</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-5">
                Reserva una clase real sin costo. Si te gusta, te inscribes al plan
                que mejor se adapte a ti. Sin compromiso.
              </p>
              <div className="space-y-2 mb-5">
                {["Eliges online o presencial", "Profesor certificado real", "Te ubicamos en tu nivel CEFR", "Sin tarjeta, sin compromiso"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="block w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold py-3 rounded-lg text-center transition">
                Reservar mi clase gratis →
              </Link>
            </div>
            {/* Badge flotante */}
            <div className="absolute -top-4 -right-4 bg-accent-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lifted rotate-6 hidden md:block">
              <Trophy size={14} className="inline mr-1" /> Certificado oficial
            </div>
          </div>
        </div>
      </section>

      {/* === ESTADÍSTICAS === */}
      <section className="bg-gradient-to-br from-brand-50/60 via-white to-accent-50/60 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
          <FadeIn className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-brand-600">
                <CountUp end={6} /> niveles
              </p>
              <p className="text-xs md:text-sm text-slate-500 font-semibold mt-1">Desde A1 hasta C2 (CEFR)</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-accent-600">
                <CountUp end={100} suffix="%" />
              </p>
              <p className="text-xs md:text-sm text-slate-500 font-semibold mt-1">Profesores certificados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-brand-600">
                <CountUp end={3} /> formas
              </p>
              <p className="text-xs md:text-sm text-slate-500 font-semibold mt-1">Online, presencial o híbrida</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-accent-600">
                <CountUp end={1} /> clase
              </p>
              <p className="text-xs md:text-sm text-slate-500 font-semibold mt-1">De prueba gratis para empezar</p>
            </div>
          </FadeIn>
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

      {/* === BENEFICIOS QUE ATRAEN (V3.3) === */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-brand-50/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-3">
              Aprender inglés nunca fue tan fácil
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Te acompañamos en cada paso, a tu ritmo y con un método que de verdad funciona.
            </p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Smile, color: "brand", title: "Hablas desde el día 1", desc: "Método comunicativo: practicas conversación real desde tu primera clase, no solo gramática en papel." },
              { icon: Clock, color: "accent", title: "A tu propio ritmo", desc: "Horarios flexibles que se adaptan a tu vida. Estudias cuando puedes, sin presión." },
              { icon: Target, color: "brand", title: "Sabes exactamente tu nivel", desc: "Un test te ubica en el nivel correcto. Avanzas con un plan claro hacia tu certificación." },
              { icon: Heart, color: "accent", title: "Profesores que te apoyan", desc: "Acompañamiento cercano y paciente. Aquí no te sientes uno más: te conocemos por tu nombre." },
              { icon: Globe, color: "brand", title: "Desde donde estés", desc: "Online, presencial o híbrida. Tú eliges cómo y dónde aprender." },
              { icon: Award, color: "accent", title: "Certificación que vale", desc: "Al terminar, recibes un certificado CEFR reconocido que suma a tu currículum." },
            ].map((b, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft h-full hover:shadow-card transition">
                  <div className={`w-12 h-12 bg-${b.color}-50 rounded-xl flex items-center justify-center mb-4`}>
                    <b.icon size={24} className={`text-${b.color}-600`} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* === TESTIMONIOS (V3.2) === */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-brand-50/40 to-accent-50/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-3">
              Lo que dicen nuestros estudiantes
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Personas reales que mejoraron su inglés con nosotros.
            </p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "María G.", role: "Estudiante nivel B1", text: "Empecé sin saber nada y ahora puedo mantener una conversación. Los profesores son muy pacientes y las clases son dinámicas." },
              { name: "Carlos R.", role: "Estudiante nivel A2", text: "La clase de prueba me convenció. Pude ver cómo enseñan antes de pagar. La modalidad online se adapta perfecto a mi trabajo." },
              { name: "Juana M.", role: "Estudiante nivel B2", text: "El test de nivel me ubicó justo donde debía estar. Avancé rápido y ya estoy preparándome para mi certificación." },
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 100}>
              <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100 h-full">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                    {t.name.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
              </FadeIn>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">
            Testimonios de estudiantes de Dorismon Language Institute.
          </p>
        </div>
      </section>

      {/* === SEDES (V3.2) === */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-3">
              Estudia online o en nuestras sedes
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Elige la modalidad que mejor se adapte a ti. Si prefieres lo presencial,
              te esperamos en Santo Domingo.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
              <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white mb-4">
                <Globe size={24} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Online</h3>
              <p className="text-sm text-slate-600">
                Clases en vivo desde donde estés. Solo necesitas internet. Ideal si tienes
                horarios ocupados.
              </p>
            </div>
            <div className="bg-accent-50 rounded-2xl p-6 border border-accent-100">
              <div className="w-12 h-12 bg-accent-600 rounded-xl flex items-center justify-center text-white mb-4">
                <MapPin size={24} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Presencial</h3>
              <p className="text-sm text-slate-600">
                En nuestras sedes de Santo Domingo, con aulas cómodas y atención cercana.
                Pregúntanos por las direcciones.
              </p>
            </div>
            <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white mb-4">
                <Calendar size={24} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Híbrida</h3>
              <p className="text-sm text-slate-600">
                Combina lo mejor de ambos mundos: algunas clases online y otras presenciales,
                según tu conveniencia.
              </p>
            </div>
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
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/legal/privacidad" className="hover:text-white">Política de privacidad</Link>
              <Link href="/legal/terminos" className="hover:text-white">Términos de servicio</Link>
              <span>Santo Domingo, República Dominicana 🇩🇴</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
