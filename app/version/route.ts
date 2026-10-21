// GATE 5B — Versión del build que está publicado AHORA.
// El cliente la compara con la suya (NEXT_PUBLIC_APP_VERSION, fijada al
// construir) para saber si hay una versión nueva. Nunca se guarda en caché.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { version: process.env.NEXT_PUBLIC_APP_VERSION || "" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
