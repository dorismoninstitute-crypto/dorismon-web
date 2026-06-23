import Link from "next/link";
import Logo from "@/components/Logo";

// V3.2 — Términos de servicio.
// ⚠️ IMPORTANTE: Plantilla profesional que DEBE ser revisada por un abogado en
// República Dominicana antes del lanzamiento. Reemplazar los campos entre [corchetes].

export const metadata = {
  title: "Términos de Servicio — Dorismon Language Institute",
};

export default function TerminosPage() {
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
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Términos de Servicio</h1>
        <p className="text-sm text-slate-500 mb-8">Última actualización: {lastUpdate}</p>

        <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">1. Aceptación</h2>
            <p>
              Al crear una cuenta o usar la plataforma de Dorismon Language Institute
              ("Dorismon") en dorismon.com, aceptas estos Términos de Servicio. Si no estás
              de acuerdo, por favor no uses la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">2. Descripción del servicio</h2>
            <p>
              Dorismon ofrece cursos de inglés en modalidades online, presencial e híbrida,
              incluyendo clases, materiales, evaluaciones de nivel, seguimiento de progreso y
              certificaciones. Las características pueden variar según el plan contratado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">3. Registro y cuenta</h2>
            <p>
              Para usar la plataforma debes registrarte con información veraz y mantenerla
              actualizada. Eres responsable de la confidencialidad de tu contraseña y de la
              actividad en tu cuenta. Las cuentas de menores de edad deben ser gestionadas o
              autorizadas por su padre, madre o tutor legal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">4. Clase de prueba e inscripción</h2>
            <p>
              La clase de prueba gratuita se ofrece sin costo ni compromiso de inscripción.
              La inscripción a un plan de pago se rige por las condiciones del plan elegido,
              que se te informarán antes de confirmar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">5. Pagos</h2>
            <p>
              Los precios de los planes se muestran en la plataforma. Los pagos se procesan
              según los métodos disponibles. Salvo que la ley o una promoción indiquen lo
              contrario, los pagos por servicios ya prestados no son reembolsables. Las
              condiciones específicas de reembolso se indicarán en cada plan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">6. Conducta del usuario</h2>
            <p>Al usar la plataforma, te comprometes a:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>No compartir tu cuenta ni el material del curso con terceros.</li>
              <li>Tratar con respeto a profesores, personal y otros estudiantes.</li>
              <li>No usar la plataforma para fines ilícitos o no autorizados.</li>
            </ul>
            <p className="mt-2">
              Podemos suspender cuentas que incumplan estas normas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">7. Propiedad intelectual</h2>
            <p>
              Los materiales, contenidos y la plataforma de Dorismon están protegidos por
              derechos de autor. Se te otorga una licencia personal y no transferible para
              usarlos con fines de aprendizaje mientras tengas una cuenta activa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">8. Cancelación de clases</h2>
            <p>
              Dorismon o el profesor podrán reprogramar o cancelar clases por causas
              justificadas, notificándote con la mayor anticipación posible. En caso de
              cancelación por parte de Dorismon, la clase será reprogramada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">9. Limitación de responsabilidad</h2>
            <p>
              Dorismon se esfuerza por ofrecer un servicio educativo de calidad, pero no
              garantiza resultados específicos de aprendizaje, que dependen también del
              esfuerzo del estudiante. La plataforma se ofrece "tal cual", sujeta a
              mantenimientos y mejoras.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">10. Cambios a los términos</h2>
            <p>
              Podemos actualizar estos términos. Publicaremos la versión vigente en esta
              página. El uso continuado de la plataforma implica la aceptación de los cambios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">11. Ley aplicable y contacto</h2>
            <p>
              Estos términos se rigen por las leyes de la República Dominicana. Para cualquier
              consulta, escríbenos a [CORREO DE CONTACTO] o al [TELÉFONO].
            </p>
          </section>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-8 text-xs text-amber-800">
            <strong>Nota:</strong> Estos términos deben completarse con los datos reales de
            Dorismon y ser revisados por un asesor legal antes de su publicación definitiva,
            especialmente las cláusulas de pagos, reembolsos y responsabilidad.
          </div>
        </div>
      </main>
    </div>
  );
}
