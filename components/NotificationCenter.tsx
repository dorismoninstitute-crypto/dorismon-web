"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";

// V3.1 — Centro de avisos universal (campanita + mensajes) para los 3 roles.
// Actualización periódica suave (cada 45s) + al montar. Sin websockets.

export function NotificationCenter() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadCounts = async () => {
    try {
      const [n, m] = await Promise.all([
        api("/notifications/unread-count", { auth: true }).catch(() => ({ unread: 0 })),
        api("/messages/unread-count", { auth: true }).catch(() => ({ unread: 0 })),
      ]);
      setUnreadNotifs(n?.unread || 0);
      setUnreadMsgs(m?.unread || 0);
    } catch {}
  };

  const loadNotifs = async () => {
    try {
      const items = await api("/notifications?limit=15", { auth: true });
      setNotifs(Array.isArray(items) ? items : []);
    } catch {}
  };

  useEffect(() => {
    loadCounts();
    // Actualización periódica suave cada 45s
    const t = setInterval(loadCounts, 45000);
    return () => clearInterval(t);
  }, []);

  // Cerrar el panel al hacer click afuera
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const togglePanel = async () => {
    const next = !open;
    setOpen(next);
    if (next) await loadNotifs();
  };

  const handleNotifClick = async (n: any) => {
    if (!n.is_read) {
      try {
        await api(`/notifications/${n.id}/read`, { method: "POST", auth: true });
        setUnreadNotifs((c) => Math.max(0, c - 1));
        setNotifs((list) => list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      } catch {}
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const markAllRead = async () => {
    try {
      await api("/notifications/read-all", { method: "POST", auth: true });
      setUnreadNotifs(0);
      setNotifs((list) => list.map((x) => ({ ...x, is_read: true })));
    } catch {}
  };

  const timeAgo = (iso: string) => {
    if (!iso) return "";
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "ahora";
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return `hace ${Math.floor(diff / 86400)} d`;
  };

  return (
    <div className="flex items-center gap-1 relative" ref={panelRef}>
      {/* Mensajes */}
      <button
        onClick={() => router.push("/dashboard/messages")}
        className="relative p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
        aria-label="Mensajes"
      >
        <MessageCircle size={20} />
        {unreadMsgs > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadMsgs > 9 ? "9+" : unreadMsgs}
          </span>
        )}
      </button>

      {/* Campanita */}
      <button
        onClick={togglePanel}
        className="relative p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadNotifs > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadNotifs > 9 ? "9+" : unreadNotifs}
          </span>
        )}
      </button>

      {/* Panel desplegable */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Notificaciones</h3>
            {unreadNotifs > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline font-semibold">
                Marcar todas leídas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                No tienes notificaciones
              </div>
            ) : (
              notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${
                    !n.is_read ? "bg-brand-50/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />}
                    <div className={`flex-1 min-w-0 ${n.is_read ? "pl-4" : ""}`}>
                      <p className="text-sm font-semibold text-slate-900 truncate">{n.title}</p>
                      {n.body && <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
