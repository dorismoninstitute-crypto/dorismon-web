"use client";
import React from "react";

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold tracking-tight mb-2">Algo no funcionó</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              Encontramos un error al cargar esta pantalla.
            </p>
            <details className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs text-left mb-5">
              <summary className="cursor-pointer font-bold">Detalles técnicos</summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">
                {this.state.error?.message || "Error desconocido"}
              </pre>
            </details>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-5 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition">
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
