import type { Metadata } from "next";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastContainer } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dorismon Language Institute — Cursos de inglés online y presencial",
    template: "%s · Dorismon Language Institute",
  },
  description: "Domina el inglés con Dorismon Language Institute. Cursos para niños, jóvenes y adultos con profesores certificados, certificados oficiales y metodología comunicativa en Santo Domingo.",
  keywords: ["inglés", "academia de inglés", "Santo Domingo", "República Dominicana", "Dorismon", "Language Institute", "cursos de inglés", "certificación inglés"],
  authors: [{ name: "Dorismon Language Institute" }],
  openGraph: {
    title: "Dorismon Language Institute",
    description: "Academia premium de inglés en República Dominicana",
    type: "website",
    locale: "es_DO",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <ErrorBoundary>{children}</ErrorBoundary>
        <ToastContainer />
      </body>
    </html>
  );
}
