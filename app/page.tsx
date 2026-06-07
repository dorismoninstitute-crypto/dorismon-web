import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-lg">D</div>
            <span className="font-bold text-lg tracking-tight">Dorismon</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
              Iniciar sesión
            </Link>
            <Link href="/register" className="text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition">
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center bg-gradient-to-br from-brand-50 to-accent-50">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <span className="inline-block bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            Academia de inglés profesional
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            Aprende inglés con<br />
            <span className="text-brand-600">profesores certificados</span>
          </h1>
          <p className="text-base md:text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Clases online, presenciales e híbridas. Niveles A1 a C2, certificaciones reconocidas y un sistema de aprendizaje moderno.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-7 py-3.5 rounded-lg transition shadow-md hover:shadow-lg">
              Empezar gratis →
            </Link>
            <Link href="/login" className="bg-white border border-slate-300 hover:border-slate-400 text-slate-900 font-bold px-7 py-3.5 rounded-lg transition">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          {[
            { icon: "🎯", title: "Niveles CEFR", desc: "Desde A1 hasta C2 con seguimiento personalizado" },
            { icon: "👨‍🏫", title: "Profesores reales", desc: "Docentes certificados con años de experiencia" },
            { icon: "🏆", title: "Certificados oficiales", desc: "Verificación pública con código único" },
          ].map((f, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          © 2026 Dorismon Language Institute. Santo Domingo, RD.
        </div>
      </footer>
    </div>
  );
}
