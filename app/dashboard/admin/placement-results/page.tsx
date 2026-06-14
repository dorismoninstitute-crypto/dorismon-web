"use client";
import { useEffect, useState } from "react";
import { adminPlacement, adminApi, adminHelpers, adminPlans, safeArray, getLevelTheme } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Select, Modal, showToast } from "@/components/ui";

export default function AdminPlacementResultsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<"pending" | "enrolled" | "all">("pending");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [enrolling, setEnrolling] = useState<any>(null);

  const [courses, setCourses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [enrollForm, setEnrollForm] = useState({
    course_id: "", level_id: "", teacher_id: "", plan_id: "",
  });

  const load = () => {
    setLoading(true);
    adminPlacement.list(filter)
      .then((d: any) => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, [filter]);

  const openDetail = async (testId: string) => {
    try {
      const d = await adminPlacement.detail(testId);
      setDetail(d);
    } catch (e: any) { showToast("error", e.message); }
  };

  const openEnroll = async (item: any) => {
    setEnrolling(item);
    try {
      const [c, t, p] = await Promise.all([
        adminApi.courses(), adminHelpers.teachers(), adminPlans.list(),
      ]);
      setCourses(safeArray(c));
      setTeachers(safeArray(t));
      setPlans(safeArray(p));
      // Por default, el nivel sugerido
      setEnrollForm({
        course_id: "",
        level_id: String(item.suggested_level_id || ""),
        teacher_id: "",
        plan_id: "",
      });
    } catch (e: any) { showToast("error", e.message); }
  };

  const onCourseChange = async (course_id: string) => {
    setEnrollForm({ ...enrollForm, course_id, level_id: "" });
    if (course_id) {
      try {
        const lvls = await adminHelpers.levelsByCourse(parseInt(course_id));
        setLevels(safeArray(lvls));
        // Si la lista de niveles incluye el sugerido del test, preseleccionarlo
        const found = safeArray(lvls).find((l: any) => l.code === enrolling?.suggested_level_code);
        if (found) {
          setEnrollForm(prev => ({ ...prev, course_id, level_id: String((found as any).id) }));
        }
      } catch {}
    } else { setLevels([]); }
  };

  const doEnroll = async () => {
    if (!enrolling) return;
    if (!enrollForm.course_id || !enrollForm.level_id) {
      showToast("error", "Curso y nivel son requeridos");
      return;
    }
    try {
      await adminApi.createEnrollment({
        student_id: enrolling.student_id,
        course_id: parseInt(enrollForm.course_id),
        level_id: parseInt(enrollForm.level_id),
        teacher_id: enrollForm.teacher_id || undefined,
        plan_id: enrollForm.plan_id ? parseInt(enrollForm.plan_id) : undefined,
      });
      showToast("success", `${enrolling.student_name} inscrito`);
      setEnrolling(null);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  if (loading && items.length === 0) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Resultados de Placement"
        subtitle="Estudiantes que completaron el test y esperan inscripción"
      />

      <Card className="mb-4">
        <CardBody className="flex gap-2 items-center flex-wrap">
          <Button size="sm" variant={filter === "pending" ? "primary" : "outline"} onClick={() => setFilter("pending")}>
            ⏳ Pendientes
          </Button>
          <Button size="sm" variant={filter === "enrolled" ? "primary" : "outline"} onClick={() => setFilter("enrolled")}>
            ✅ Ya inscritos
          </Button>
          <Button size="sm" variant={filter === "all" ? "primary" : "outline"} onClick={() => setFilter("all")}>
            Todos
          </Button>
        </CardBody>
      </Card>

      {/* V1.6.4: Buscador */}
      <Card className="mb-4">
        <CardBody>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar por nombre o email..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </CardBody>
      </Card>

      {(() => {
        // V1.6.4: filtrar por search
        const filtered = search.trim()
          ? items.filter((r: any) => {
              const q = search.toLowerCase().trim();
              return (r.student_name || "").toLowerCase().includes(q)
                  || (r.student_email || "").toLowerCase().includes(q)
                  || (r.phone || "").toLowerCase().includes(q);
            })
          : items;
        return filtered.length === 0 ? (
        <EmptyState icon="🎯" title={search ? "Sin resultados para tu búsqueda" : (filter === "pending" ? "Sin placements pendientes" : "Sin resultados")} description={search ? "Probá con otro nombre o email." : (filter === "pending" ? "Cuando un estudiante completa el test, aparece aquí." : "")} />
      ) : (
        <div className="space-y-3">
          {filtered.map((r: any) => {
            // V2.1.1: Si el estudiante ya está inscripto, el nivel REAL es current_level_code
            // El sugerido por el test puede diferir si el admin lo ajustó al inscribirlo
            const displayLevel = r.current_level_code || r.suggested_level_code;
            const showBothLevels = r.current_level_code && r.current_level_code !== r.suggested_level_code;
            const theme = getLevelTheme(displayLevel);
            return (
              <Card key={r.test_id}>
                <CardBody>
                  <div className="flex items-start gap-3">
                    {/* Badge nivel compacto */}
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${theme.bg} flex items-center justify-center font-black text-white text-lg md:text-xl flex-shrink-0 shadow-soft`}>
                      {displayLevel || "?"}
                    </div>

                    {/* Info estudiante — ocupa todo el espacio disponible */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-slate-900 text-sm md:text-base truncate">{r.student_name}</p>
                        {r.is_paused && <Badge variant="warning">⏸</Badge>}
                        {r.is_enrolled && <Badge variant="success">✓ Inscrito</Badge>}
                        {showBothLevels && (
                          <Badge variant="info" title={`Test sugirió ${r.suggested_level_code} pero admin asignó ${r.current_level_code}`}>
                            ⚠️ Test: {r.suggested_level_code} → Actual: {r.current_level_code}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate" title={r.student_email}>
                        {r.student_email}
                      </p>
                      {r.phone && <p className="text-xs text-slate-500">📞 {r.phone}</p>}
                      <p className="text-xs text-slate-500 mt-1">
                        Test: {r.completed_at && new Date(r.completed_at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {(r.grammar_score !== null || r.reading_score !== null) && (
                        <p className="text-xs text-slate-500">
                          {r.grammar_score !== null && `Grammar ${Math.round(r.grammar_score)}%`}
                          {r.grammar_score !== null && r.reading_score !== null && " · "}
                          {r.reading_score !== null && `Reading ${Math.round(r.reading_score)}%`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botones DEBAJO en mobile (no al lado del nombre) */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <Button size="sm" variant="outline" onClick={() => openDetail(r.test_id)} className="flex-1 md:flex-none">
                      Ver detalle
                    </Button>
                    {!r.is_enrolled && (
                      <Button size="sm" onClick={() => openEnroll(r)} className="flex-1 md:flex-none">
                        Inscribir
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      );
      })()}

      {/* Modal Detalle */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Detalle: ${detail?.student_name || ""}`} size="lg">
        {detail && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Nivel sugerido</p>
              <p className="text-2xl font-extrabold">{detail.suggested_level_code} — {detail.suggested_level_name}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Grammar</p>
                <p className="text-xl font-bold">{detail.scores?.grammar !== null ? `${Math.round(detail.scores.grammar)}%` : "—"}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Reading</p>
                <p className="text-xl font-bold">{detail.scores?.reading !== null ? `${Math.round(detail.scores.reading)}%` : "—"}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700">Listening/Speak/Writing</p>
                <p className="text-xs text-amber-700 font-semibold mt-1">A evaluar en entrevista</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Respuestas ({detail.answers?.length || 0})</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(detail.answers || []).map((a: any, i: number) => (
                  <div key={i} className={`p-2 rounded-lg text-xs ${a.is_correct ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                    <p className="font-medium">{i + 1}. {a.statement}</p>
                    <p className="text-slate-600 mt-1">
                      <span className={a.is_correct ? "text-emerald-700" : "text-red-700"}>
                        {a.is_correct ? "✓" : "✗"} Respondió: {a.selected?.toUpperCase() || "—"}
                      </span>
                      {!a.is_correct && <span className="ml-2 text-slate-500">| Correcto: {a.correct?.toUpperCase()}</span>}
                      <span className="ml-2 text-slate-400">[{a.skill} · {a.difficulty}]</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Inscribir */}
      <Modal open={!!enrolling} onClose={() => setEnrolling(null)} title={`Inscribir: ${enrolling?.student_name || ""}`} size="lg">
        <div className="space-y-3">
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
            <p className="text-xs text-violet-700 font-bold uppercase tracking-wider mb-1">Sugerido por test</p>
            <p className="font-bold text-violet-900">
              Nivel <strong>{enrolling?.suggested_level_code}</strong> — {enrolling?.suggested_level_name}
            </p>
          </div>
          <Select label="Curso *" value={enrollForm.course_id} onChange={(e: any) => onCourseChange(e.target.value)}>
            <option value="">Seleccionar...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Nivel *" value={enrollForm.level_id} onChange={(e: any) => setEnrollForm({ ...enrollForm, level_id: e.target.value })} disabled={!levels.length}>
            <option value="">{levels.length ? "Seleccionar..." : "Elegí un curso primero"}</option>
            {levels.map(l => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
          </Select>
          <Select label="Profesor (opcional)" value={enrollForm.teacher_id} onChange={(e: any) => setEnrollForm({ ...enrollForm, teacher_id: e.target.value })}>
            <option value="">Sin asignar</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>
          <Select label="Plan (opcional)" value={enrollForm.plan_id} onChange={(e: any) => setEnrollForm({ ...enrollForm, plan_id: e.target.value })}>
            <option value="">Sin plan</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${parseFloat(p.price).toFixed(2)}/mes</option>)}
          </Select>
          <Button onClick={doEnroll} className="w-full" size="lg" disabled={!enrollForm.course_id || !enrollForm.level_id}>
            Inscribir
          </Button>
        </div>
      </Modal>
    </>
  );
}
