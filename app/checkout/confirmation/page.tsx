"use client";
import Link from "next/link";
import { CheckCircle2, Clock, Mail } from "lucide-react";
import { Card, CardBody, Button } from "@/components/ui";

export default function CheckoutConfirmationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={48} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-2">¡Pago enviado! ✨</h1>
              <p className="text-slate-600 mb-6">
                Recibimos tu comprobante de pago. Lo verificaremos pronto.
              </p>

              <div className="space-y-3 text-left bg-slate-50 rounded-lg p-4 mb-5">
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Esperando verificación</p>
                    <p className="text-sm text-slate-600">Nuestro equipo lo revisará en máximo 24 horas (usualmente mucho menos).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Te avisaremos por email</p>
                    <p className="text-sm text-slate-600">Cuando confirmemos tu pago, recibirás un email y tu cuenta quedará inscrita automáticamente.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Link href="/dashboard/student/payments">
                  <Button className="w-full" size="lg">Ver mi historial de pagos</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">Volver al dashboard</Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
