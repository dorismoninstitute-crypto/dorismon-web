import Link from "next/link";
import Logo from "@/components/Logo";

// V3.2 — Política de privacidad.
// ⚠️ IMPORTANTE: Esta es una plantilla profesional pero DEBE ser revisada por un
// abogado en República Dominicana antes del lanzamiento, especialmente por el
// manejo de datos de menores de edad. Reemplazar los campos entre [corchetes].

export const metadata = {
  title: "Política de Privacidad — Dorismon Language Institute",
};

export default function PrivacidadPage() {
  const lastUpdate = "junio de 2026";
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <Logo size="md" />
          <Link href="/" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Política de Privacidad</h1>
        <p className="text-sm text-slate-500 mb-8">Última actualización: {lastUpdate}</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">1. Quiénes somos</h2>
            <p>
              Dorismon Language Institute ("Dorismon", "nosotros") es un instituto de
              enseñanza de idiomas con sede en Santo Domingo, República Dominicana.
              Esta política explica cómo recopilamos, usamos y protegemos tus datos
              personales cuando usas nuestra plataforma en dorismon.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">2. Qué datos recopilamos</h2>
            <p>Recopilamos los datos que nos proporcionas al registrarte y usar la plataforma:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Datos de identificación: nombre, correo electrónico, teléfono.</li>
              <li>Datos académicos: nivel de inglés, progreso, asistencia, calificaciones.</li>
              <li>En el caso de menores de edad: datos del padre, madre o tutor responsable.</li>
              <li>Datos de uso de la plataforma para mejorar el servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">3. Menores de edad</h2>
            <p>
              Dorismon ofrece cursos a menores de edad. La inscripción de un menor debe
              ser realizada o autorizada por su padre, madre o tutor legal, quien acepta
              esta política en su nombre. Recopilamos únicamente los datos necesarios para
              la prestación del servicio educativo y protegemos especialmente la información
              de los menores. Los padres o tutores pueden solicitar acceso, corrección o
              eliminación de los datos de sus hijos en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">4. Para qué usamos tus datos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestionar tu inscripción, clases, pagos y progreso académico.</li>
              <li>Comunicarnos contigo sobre tus clases, recordatorios y avisos.</li>
              <li>Emitir certificados y constancias.</li>
              <li>Mejorar nuestra plataforma y servicios.</li>
              <li>Cumplir obligaciones legales y contables.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">5. Con quién compartimos tus datos</h2>
            <p>
              No vendemos tus datos. Solo los compartimos con proveedores que nos ayudan a
              operar la plataforma (por ejemplo, servicios de envío de correo y procesamiento
              de pagos), quienes están obligados a protegerlos. También podemos divulgarlos
              si la ley lo exige.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">6. Cómo protegemos tus datos</h2>
            <p>
              Aplicamos medidas de seguridad técnicas y organizativas para proteger tu
              información, incluyendo cifrado de contraseñas, control de acceso y copias de
              seguridad. Ningún sistema es 100% infalible, pero trabajamos para mantener tus
              datos seguros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">7. Tus derechos</h2>
            <p>
              Puedes solicitar en cualquier momento acceder, corregir o eliminar tus datos
              personales, así como retirar tu consentimiento. Para ejercer estos derechos,
              escríbenos a [CORREO DE CONTACTO].
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">8. Cookies</h2>
            <p>
              Usamos cookies y tecnologías similares necesarias para el funcionamiento de la
              plataforma (por ejemplo, mantener tu sesión iniciada). No las usamos con fines
              publicitarios de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">9. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Publicaremos la versión vigente
              en esta página con su fecha de actualización.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">10. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta política o sobre el manejo de tus datos,
              contáctanos en [CORREO DE CONTACTO] o al [TELÉFONO].
            </p>
          </section>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-8 text-xs text-amber-800">
            <strong>Nota:</strong> Esta política debe completarse con los datos de contacto
            reales de Dorismon y ser revisada por un asesor legal antes de su publicación
            definitiva.
          </div>
        </div>
      </main>
    </div>
  );
}
