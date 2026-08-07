import type { Metadata, Viewport } from "next";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastContainer } from "@/components/ui";
import PWAInstaller from "@/components/PWAInstaller";
import "./globals.css";

const baseMetadata: Metadata = {
  metadataBase: new URL("https://dorismon.com"),
  title: {
    default: "Clases de Inglés en Santo Domingo | Dorismon Language Institute",
    template: "%s · Dorismon Language Institute",
  },
  description: "Aprende inglés en Santo Domingo con Dorismon Language Institute. Clases online y presenciales para niños, jóvenes y adultos. Profesores certificados, certificación CEFR. Reserva tu clase de prueba gratis.",
  keywords: ["clases de inglés Santo Domingo", "inglés República Dominicana", "academia de inglés", "curso de inglés online", "inglés presencial Santo Domingo", "Dorismon", "Language Institute", "certificación inglés CEFR", "clase de prueba gratis inglés"],
  authors: [{ name: "Dorismon Language Institute" }],
  alternates: {
    canonical: "https://dorismon.com",
  },
  manifest: "/manifest.webmanifest",  // V2.6 PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dorismon",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Clases de Inglés en Santo Domingo | Dorismon Language Institute",
    description: "Clases online y presenciales con profesores certificados. Reserva tu clase de prueba gratis.",
    type: "website",
    locale: "es_DO",
    url: "https://dorismon.com",
    siteName: "Dorismon Language Institute",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Dorismon Language Institute",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clases de Inglés en Santo Domingo | Dorismon",
    description: "Clases online y presenciales con profesores certificados. Reserva tu clase de prueba gratis.",
    images: ["/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#4361ee",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/**
 * V3.9.26 — La imagen que se ve al compartir el enlace por WhatsApp.
 *
 * ANTES: se usaba el ícono cuadrado de 512 px, que WhatsApp muestra chiquito
 * y sin gracia. AHORA: si el admin subió la "Imagen para compartir por
 * WhatsApp" (1200 × 630), se usa esa y el enlace se ve grande y con marca.
 * Si no hay ninguna, se cae al ícono como antes (nada se rompe).
 *
 * En RD casi todo se comparte por WhatsApp, así que esto pesa en la conversión.
 */
export async function generateMetadata(): Promise<Metadata> {
  let ogUrl: string | null = null;
  try {
    const api = process.env.NEXT_PUBLIC_API_URL || "https://dorismon-api.onrender.com";
    if (api) {
      const res = await fetch(`${api}/site-images`, { next: { revalidate: 300 } });
      if (res.ok) {
        const data = await res.json();
        ogUrl = data?.og || null;
      }
    }
  } catch {
    // Si el servidor no responde, se usa la imagen por defecto
  }

  if (!ogUrl) return baseMetadata;

  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: "Dorismon Language Institute" }],
    },
    twitter: {
      ...baseMetadata.twitter,
      images: [ogUrl],
    },
  };
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#4361ee" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Dorismon" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <ErrorBoundary>{children}</ErrorBoundary>
        <ToastContainer />
        <PWAInstaller />
      </body>
    </html>
  );
}
