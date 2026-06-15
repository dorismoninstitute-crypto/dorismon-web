import type { Metadata, Viewport } from "next";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastContainer } from "@/components/ui";
import PWAInstaller from "@/components/PWAInstaller";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dorismon Language Institute — Cursos de inglés online y presencial",
    template: "%s · Dorismon Language Institute",
  },
  description: "Domina el inglés con Dorismon Language Institute. Cursos para niños, jóvenes y adultos con profesores certificados, certificados oficiales y metodología comunicativa en Santo Domingo.",
  keywords: ["inglés", "academia de inglés", "Santo Domingo", "República Dominicana", "Dorismon", "Language Institute", "cursos de inglés", "certificación inglés"],
  authors: [{ name: "Dorismon Language Institute" }],
  manifest: "/manifest.json",  // V2.6 PWA
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
    title: "Dorismon Language Institute",
    description: "Academia premium de inglés en República Dominicana",
    type: "website",
    locale: "es_DO",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Dorismon Language Institute",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#4361ee",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
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
