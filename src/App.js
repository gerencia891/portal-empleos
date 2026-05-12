import { useState, useEffect } from "react";

const SB_URL = "https://nwmqmwnwyfwrxqblamay.supabase.co";
const SB_KEY = "sb_publishable_L9npWi9ejapJ-07Y7slMtw_FrdEvpmX";

async function api(path, opts = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: opts.prefer || "return=representation", ...opts.headers },
    ...opts,
  });
  if (r.status === 204) return true;
  if (!r.ok) { console.error(await r.text()); return null; }
  return r.json();
}

const db = {
  getFlujos: () => api("flujos?order=creado_en.asc"),
  getEtapas: (fid) => api(`etapas?flujo_id=eq.${fid}&order=orden.asc`),
  getAllEtapas: () => api("etapas?order=orden.asc"),
  getCandidatos: () => api("candidatos?order=creado_en.desc"),
  getHistorial: (cid) => api(`historial_etapas?candidato_id=eq.${cid}&order=fecha.asc`),
  buscar: (t) => api(`candidatos?or=(cedula.eq.${encodeURIComponent(t)},nombre.ilike.*${encodeURIComponent(t)}*)`),
  addFlujo: (d) => api("flujos", { method: "POST", body: JSON.stringify(d) }),
  addEtapa: (d) => api("etapas", { method: "POST", body: JSON.stringify(d) }),
  addCandidato: (d) => api("candidatos", { method: "POST", body: JSON.stringify(d) }),
  addHistorial: (d) => api("historial_etapas", { method: "POST", body: JSON.stringify(d) }),
  editCandidato: (id, d) => api(`candidatos?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  editEtapa: (id, d) => api(`etapas?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  editFlujo: (id, d) => api(`flujos?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  delCandidato: (id) => api(`candidatos?id=eq.${id}`, { method: "DELETE", prefer: "" }),
  delEtapa: (id) => api(`etapas?id=eq.${id}`, { method: "DELETE", prefer: "" }),
  delFlujo: (id) => api(`flujos?id=eq.${id}`, { method: "DELETE", prefer: "" }),
};

function uid() { return "id" + Date.now() + Math.random().toString(36).slice(2, 6); }
function fmt(iso) { if (!iso) return ""; return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtFull(iso) { if (!iso) return ""; return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) + " · " + new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }); }
function ini(n) { return (n || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase(); }

const FASE_INFO = {
  consultora: { label: "Consultoría", color: "#185FA5", bg: "#E6F1FB" },
  cliente: { label: "Empresa Cliente", color: "#854F0B", bg: "#FAEEDA" },
  cierre: { label: "Cierre", color: "#0F6E56", bg: "#E1F5EE" },
};

const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .card-hover:hover { border-color: #1a1a2e !important; }
  input:focus, textarea:focus, select:focus { border-color: #1a1a2e !important; box-shadow: 0 0 0 2px rgba(26,26,46,0.08); }
`;

const S = {
  page: { fontFamily: "'Inter',system-ui,sans-serif", background: "#f4f5f9", minHeight: "100vh" },
  bar: { background: "#fff", borderBottom: "1px solid #eee", padding: "0 1.5rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 },
  body: { maxWidth: 920, margin: "0 auto", padding: "2rem 1.25rem" },
  card: { background: "#fff", border: "1px solid #ebebeb", borderRadius: 14, padding: "1.3rem 1.5rem", marginBottom: 14, animation: "fadeIn 0.2s ease" },
  lbl: { fontSize: 10.5, fontWeight: 700, color: "#aaa", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 5 },
  inp: { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 9, outline: "none", boxSizing: "border-box", background: "#fff", transition: "border 0.15s" },
  ta: { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 9, outline: "none", boxSizing: "border-box", background: "#fff", resize: "vertical" },
  sel: { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 9, outline: "none", boxSizing: "border-box", background: "#fff" },
  btn: { background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 9, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnSm: { background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  btnG: { background: "transparent", color: "#666", border: "1px solid #e0e0e0", borderRadius: 9, padding: "8px 16px", fontSize: 13, cursor: "pointer" },
  btnD: { background: "transparent", color: "#c0392b", border: "1px solid #f5c6c6", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" },
  btnGreen: { background: "#0F6E56", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  err: { background: "#fef2f2", color: "#c0392b", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 10 },
  ok: { background: "#f0fdf4", color: "#166534", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 10 },
  g2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  g3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 },
  tab: (on) => ({ padding: "8px 16px", fontSize: 13, fontWeight: on ? 700 : 400, color: on ? "#1a1a2e" : "#999", background: on ? "#fff" : "transparent", border: on ? "1px solid #e0e0e0" : "none", borderRadius: 9, cursor: "pointer" }),
  badge: (color, bg) => ({ display: "inline-block", background: bg || "#f0f0f5", color: color || "#555", borderRadius: 20, padding: "3px 11px", fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }),
  dot: (on, color) => ({ width: 12, height: 12, borderRadius: "50%", background: on ? color || "#1a1a2e" : "#e0e0e0", border: on ? `2px solid ${color || "#1a1a2e"}` : "2px solid #ddd", flexShrink: 0 }),
  av: { width: 42, height: 42, borderRadius: "50%", background: "#f5ede0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: "#8B5E2A", flexShrink: 0 },
  section: { fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f0f0f0" },
  infoItem: { fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 },
  infoVal: { fontSize: 14, color: "#222", fontWeight: 500, marginTop: 2 },
};

export default function App() {
  const [scr, setScr] = useState("portal");
  const [loading, setLoading] = useState(true);
  const [flujos, setFlujos] = useState([]);
  const [allEtapas, setAllEtapas] = useState([]);
  const [candidatos, setCandidatos] = useState([]);

  // Portal
  const [busq, setBusq] = useState("");
  const [busErr, setBusErr] = useState("");
  const [candPortal, setCandPortal] = useState(null);
  const [histPortal, setHistPortal] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // Admin
  const [adminPass, setAdminPass] = useState("");
  const [adminErr, setAdminErr] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [aTab, setATab] = useState("candidatos");

  // Candidato detalle
  const [candSel, setCandSel] = useState(null);
  const [histSel, setHistSel] = useState([]);
  const [etapasCandSel, setEtapasCandSel] = useState([]);
  const [editando, setEditando] = useState(false);
  const [formCand, setFormCand] = useState({});
  const [formErr, setFormErr] = useState("");
  const [formOk, setFormOk] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Avanzar etapa
  const [nuevaEtapaId, setNuevaEtapaId] = useState("");
  const [msgCand, setMsgCand] = useState("");
  const [comentPriv, setComentPriv] = useState("");
  const [etapaAprobada, setEtapaAprobada] = useState(true);
  const [guardandoEtapa, setGuardandoEtapa] = useState(false);

  // Nuevo candidato
  const [formNuevo, setFormNuevo] = useState({});
  const [nuevoErr, setNuevoErr] = useState("");
  const [nuevoOk, setNuevoOk] = useState("");
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);

  // Flujos
  const [flujoAbierto, setFlujoAbierto] = useState(null);
  const [etapasFlujoAbierto, setEtapasFlujoAbierto] = useState([]);
  const [loadingEtapas, setLoadingEtapas] = useState(false);
  const [showNuevoFlujo, setShowNuevoFlujo] = useState(false);
  const [formFlujo, setFormFlujo] = useState({ nombre: "", empresa: "", descripcion: "" });
  const [flujoErr, setFlujoErr] = useState("");
  const [guardandoFlujo, setGuardandoFlujo] = useState(false);
  const [showNuevaEtapa, setShowNuevaEtapa] = useState(false);
  const [formEtapa, setFormEtapa] = useState({ nombre: "", fase: "consultora", mensaje_sugerido: "" });
  const [etapaErr, setEtapaErr] = useState("");
  const [guardandoEtapaNueva, setGuardandoEtapaNueva] = useState(false);
  const [editandoEtapaId, setEditandoEtapaId] = useState(null);
  const [formEtapaEdit, setFormEtapaEdit] = useState({});

  // Contratación
  const [showContrat, setShowContrat] = useState(false);
  const [formContrat, setFormContrat] = useState({});

  // Filtros
  const [filtroTxt, setFiltroTxt] = useState("");
  const [filtroCiudad, setFiltroCiudad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  useEffect(() => { init(); }, []);

  const init = async () => {
    setLoading(true);
    const [f, e, c] = await Promise.all([db.getFlujos(), db.getAllEtapas(), db.getCandidatos()]);
    if (f) setFlujos(f);
    if (e) setAllEtapas(e);
    if (c) setCandidatos(c);
    setLoading(false);
  };

  const buscar = async () => {
    setBusErr("");
    if (!busq.trim()) { setBusErr("Ingresa tu cédula o nombre completo."); return; }
    setBuscando(true);
    const res = await db.buscar(busq.trim());
    setBuscando(false);
    if (!res || res.length === 0) { setBusErr("No encontramos tu información. Verifica los datos ingresados."); return; }
    const c = res[0];
    const h = await db.getHistorial(c.id);
    setCandPortal(c); setHistPortal(h || []); setScr("portal_cand");
  };

  const abrirCandidato = async (c) => {
    setCandSel(c); setFormCand({ ...c }); setEditando(false); setFormErr(""); setFormOk("");
    setNuevaEtapaId(""); setMsgCand(""); setComentPriv(""); setEtapaAprobada(true);
    const [h, e] = await Promise.all([db.getHistorial(c.id), c.flujo_id ? db.getEtapas(c.flujo_id) : Promise.resolve([])]);
    setHistSel(h || []); setEtapasCandSel(e || []);
    setScr("admin_cand");
  };

  const guardarCandidato = async () => {
    setFormErr(""); setFormOk(""); setGuardando(true);
    if (!formCand.nombre?.trim() || !formCand.cedula?.trim()) { setFormErr("Nombre y cédula son obligatorios."); setGuardando(false); return; }
    const res = await db.editCandidato(candSel.id, { ...formCand, actualizado_en: new Date().toISOString() });
    if (res !== null) {
      const upd = { ...candSel, ...formCand };
      setCandSel(upd); setCandidatos(prev => prev.map(x => x.id === candSel.id ? upd : x));
      setFormOk("✓ Guardado correctamente."); setEditando(false);
    } else setFormErr("Error al guardar. Intenta nuevamente.");
    setGuardando(false);
  };

  const registrarNuevo = async () => {
    setNuevoErr(""); setNuevoOk(""); setGuardandoNuevo(true);
    if (!formNuevo.nombre?.trim() || !formNuevo.cedula?.trim()) { setNuevoErr("Nombre y cédula son obligatorios."); setGuardandoNuevo(false); return; }
    if (candidatos.find(c => c.cedula === formNuevo.cedula?.trim())) { setNuevoErr("Ya existe un candidato con esa cédula."); setGuardandoNuevo(false); return; }
    const nuevo = { ...formNuevo, id: uid(), estado: formNuevo.estado || "activo", creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() };
    const res = await db.addCandidato(nuevo);
    if (res) {
      const saved = Array.isArray(res) ? res[0] : res;
      setCandidatos(prev => [saved, ...prev]);
      setNuevoOk("✓ Candidato registrado exitosamente."); setFormNuevo({});
    } else setNuevoErr("Error al guardar. Verifica los datos.");
    setGuardandoNuevo(false);
  };

  const avanzarEtapa = async () => {
    if (!nuevaEtapaId || !candSel) return;
    setGuardandoEtapa(true);
    const etapa = etapasCandSel.find(e => e.id === nuevaEtapaId);
    const msgFinal = msgCand || etapa?.mensaje_sugerido || "";
    const reg = { id: uid(), candidato_id: candSel.id, etapa_id: nuevaEtapaId, etapa_nombre: etapa?.nombre || "", fecha: new Date().toISOString(), comentario_privado: comentPriv, mensaje_visible: msgFinal, aprobado: etapaAprobada };
    await db.addHistorial(reg);
    await db.editCandidato(candSel.id, { etapa_actual_id: nuevaEtapaId, retroalimentacion: msgFinal, actualizado_en: new Date().toISOString() });
    setHistSel(prev => [...prev, reg]);
    const upd = { ...candSel, etapa_actual_id: nuevaEtapaId, retroalimentacion: msgFinal };
    setCandSel(upd); setCandidatos(prev => prev.map(x => x.id === candSel.id ? upd : x));
    setNuevaEtapaId(""); setMsgCand(""); setComentPriv(""); setEtapaAprobada(true);
    setGuardandoEtapa(false);
  };

  const crearFlujo = async () => {
    setFlujoErr(""); setGuardandoFlujo(true);
    if (!formFlujo.nombre?.trim()) { setFlujoErr("El nombre es obligatorio."); setGuardandoFlujo(false); return; }
    const nuevo = { id: uid(), nombre: formFlujo.nombre.trim(), empresa: formFlujo.empresa || "", descripcion: formFlujo.descripcion || "", activo: true, creado_en: new Date().toISOString() };
    const res = await db.addFlujo(nuevo);
    if (res) {
      const saved = Array.isArray(res) ? res[0] : res;
      setFlujos(prev => [...prev, saved]);
      setFormFlujo({ nombre: "", empresa: "", descripcion: "" }); setShowNuevoFlujo(false);
    } else setFlujoErr("Error al crear flujo. Intenta nuevamente.");
    setGuardandoFlujo(false);
  };

  const abrirFlujo = async (f) => {
    if (flujoAbierto?.id === f.id) { setFlujoAbierto(null); setEtapasFlujoAbierto([]); return; }
    setFlujoAbierto(f); setLoadingEtapas(true); setShowNuevaEtapa(false); setEditandoEtapaId(null);
    const e = await db.getEtapas(f.id);
    setEtapasFlujoAbierto(e || []); setLoadingEtapas(false);
  };

  const crearEtapa = async () => {
    setEtapaErr(""); setGuardandoEtapaNueva(true);
    if (!formEtapa.nombre?.trim()) { setEtapaErr("El nombre es obligatorio."); setGuardandoEtapaNueva(false); return; }
    const colorMap = { consultora: "#185FA5", cliente: "#854F0B", cierre: "#0F6E56" };
    const nueva = { id: uid(), flujo_id: flujoAbierto.id, nombre: formEtapa.nombre.trim(), orden: etapasFlujoAbierto.length + 1, fase: formEtapa.fase || "consultora", mensaje_sugerido: formEtapa.mensaje_sugerido || "", activa: true, color: colorMap[formEtapa.fase] || "#185FA5" };
    const res = await db.addEtapa(nueva);
    if (res) {
      const saved = Array.isArray(res) ? res[0] : res;
      setEtapasFlujoAbierto(prev => [...prev, saved]);
      setAllEtapas(prev => [...prev, saved]);
      setFormEtapa({ nombre: "", fase: "consultora", mensaje_sugerido: "" }); setShowNuevaEtapa(false);
    } else setEtapaErr("Error al crear etapa.");
    setGuardandoEtapaNueva(false);
  };

  const guardarEtapaEdit = async (id) => {
    const res = await db.editEtapa(id, formEtapaEdit);
    if (res) {
      setEtapasFlujoAbierto(prev => prev.map(e => e.id === id ? { ...e, ...formEtapaEdit } : e));
      setAllEtapas(prev => prev.map(e => e.id === id ? { ...e, ...formEtapaEdit } : e));
      setEditandoEtapaId(null);
    }
  };

  const duplicarFlujo = async (f) => {
    const etapas = await db.getEtapas(f.id);
    const nuevoId = uid();
    const nuevo = { id: nuevoId, nombre: f.nombre + " (copia)", empresa: f.empresa, descripcion: f.descripcion, activo: true, creado_en: new Date().toISOString() };
    const res = await db.addFlujo(nuevo);
    if (res) {
      setFlujos(prev => [...prev, Array.isArray(res) ? res[0] : res]);
      for (const e of (etapas || [])) {
        await db.addEtapa({ ...e, id: uid(), flujo_id: nuevoId });
      }
    }
  };

  const guardarContratacion = async () => {
    await db.editCandidato(candSel.id, { ...formContrat, estado: "contratado", actualizado_en: new Date().toISOString() });
    const upd = { ...candSel, ...formContrat, estado: "contratado" };
    setCandSel(upd); setCandidatos(prev => prev.map(x => x.id === candSel.id ? upd : x));
    setShowContrat(false); setFormContrat({});
  };

  const Logo = () => (
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
      <span style={{ fontFamily: "Georgia,serif", fontSize: 18, color: "#A0632A", fontStyle: "italic" }}>Mishell Fontalvo</span>
      <span style={{ fontSize: 9, letterSpacing: 3, color: "#C4966A", textTransform: "uppercase" }}>Psicóloga · Consultora de Talento</span>
    </div>
  );

  const Bar = ({ right }) => (
    <div style={S.bar}>
      <Logo />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{right}</div>
    </div>
  );

  const Modal = ({ title, onClose, children, width = 500 }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "2rem", width, maxWidth: "95vw", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#aaa" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <style>{CSS}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #1a1a2e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        <p style={{ color: "#aaa", fontSize: 14 }}>Cargando portal...</p>
      </div>
    </div>
  );

  // ═══════════════════════════════
  // PORTAL CANDIDATO — BÚSQUEDA
  // ═══════════════════════════════
  if (scr === "portal") return (
    <div style={S.page}>
      <style>{CSS}</style>
      <Bar right={<button style={{ ...S.btnG, fontSize: 12 }} onClick={() => setShowLogin(true)}>Administrador</button>} />

      {showLogin && (
        <Modal title="Acceso administrador" onClose={() => { setShowLogin(false); setAdminPass(""); setAdminErr(""); }} width={360}>
          <label style={S.lbl}>Contraseña</label>
          <input style={{ ...S.inp, marginBottom: 12 }} type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && (adminPass === "Josedavid.15" ? (setIsAdmin(true), setShowLogin(false), setAdminPass(""), setAdminErr(""), setScr("admin")) : setAdminErr("Contraseña incorrecta."))} autoFocus />
          {adminErr && <div style={S.err}>{adminErr}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btnG, flex: 1 }} onClick={() => { setShowLogin(false); setAdminPass(""); setAdminErr(""); }}>Cancelar</button>
            <button style={{ ...S.btn, flex: 1 }} onClick={() => { if (adminPass === "Josedavid.15") { setIsAdmin(true); setShowLogin(false); setAdminPass(""); setAdminErr(""); setScr("admin"); } else setAdminErr("Contraseña incorrecta."); }}>Ingresar</button>
          </div>
        </Modal>
      )}

      <div style={{ display: "flex", justifyContent: "center", padding: "5rem 1rem 2rem" }}>
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 10px", color: "#1a1a2e" }}>Consulta tu proceso</h1>
            <p style={{ color: "#888", fontSize: 15, margin: 0, lineHeight: 1.6 }}>Ingresa tu número de cédula o nombre completo para ver el estado actualizado de tu candidatura.</p>
          </div>
          <div style={S.card}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={S.lbl}>Cédula o nombre completo</label>
                <input style={S.inp} value={busq} onChange={e => setBusq(e.target.value)} placeholder="Ej: 1234567890 o María Rodríguez" onKeyDown={e => e.key === "Enter" && buscar()} autoFocus />
              </div>
              {busErr && <div style={S.err}>{busErr}</div>}
              <button style={{ ...S.btn, width: "100%", opacity: buscando ? 0.7 : 1 }} onClick={buscar} disabled={buscando}>
                {buscando ? "Buscando..." : "Consultar mi proceso"}
              </button>
            </div>

          </div>
          <div style={{ marginTop: 20, padding: "14px 18px", background: "#fffbf0", border: "1px solid #fde8c8", borderRadius: 12 }}>
            <p style={{ fontSize: 13, color: "#92400e", margin: 0, lineHeight: 1.6 }}>💡 <strong>¿Tienes dudas sobre tu proceso?</strong> Consulta aquí en cualquier momento sin necesidad de escribir por WhatsApp.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════
  // PORTAL CANDIDATO — RESULTADO
  // ═══════════════════════════════
  if (scr === "portal_cand" && candPortal) {
    const etapaActual = allEtapas.find(e => e.id === candPortal.etapa_actual_id);
    const etapasFlujo = candPortal.flujo_id ? allEtapas.filter(e => e.flujo_id === candPortal.flujo_id).sort((a, b) => a.orden - b.orden) : [];
    const idxActual = etapasFlujo.findIndex(e => e.id === candPortal.etapa_actual_id);
    const progreso = etapasFlujo.length > 0 ? Math.round(((idxActual + 1) / etapasFlujo.length) * 100) : 0;
    const faseGroups = ["consultora", "cliente", "cierre"];

    return (
      <div style={S.page}>
        <style>{CSS}</style>
        <Bar right={<button style={S.btnG} onClick={() => { setCandPortal(null); setBusq(""); setBusErr(""); setScr("portal"); }}>← Volver</button>} />
        <div style={S.body}>
          {/* Cabecera */}
          <div style={{ ...S.card, background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d5e 100%)", color: "#fff", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ ...S.av, background: "rgba(255,255,255,0.15)", color: "#fff", width: 52, height: 52, fontSize: 18 }}>{ini(candPortal.nombre)}</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "#fff" }}>{candPortal.nombre}</h2>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>{candPortal.profesion}{candPortal.ciudad ? ` · ${candPortal.ciudad}` : ""}</p>
                {candPortal.vacante && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "4px 0 0" }}>Vacante: <strong style={{ color: "#fff" }}>{candPortal.vacante}</strong>{candPortal.empresa ? ` — ${candPortal.empresa}` : ""}</p>}
              </div>
            </div>
          </div>

          {/* Estado actual */}
          {etapaActual && (
            <div style={{ ...S.card, borderLeft: `4px solid ${etapaActual.color || "#1a1a2e"}`, marginBottom: 16 }}>
              <div style={S.lbl}>Estado actual de tu proceso</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: etapaActual.color || "#1a1a2e" }}>{etapaActual.nombre}</span>
                {etapaActual.fase && <span style={S.badge(FASE_INFO[etapaActual.fase]?.color, FASE_INFO[etapaActual.fase]?.bg)}>{FASE_INFO[etapaActual.fase]?.label}</span>}
              </div>
              <p style={{ fontSize: 14, color: "#444", margin: "0 0 10px", lineHeight: 1.7, padding: "10px 14px", background: "#f9f9f9", borderRadius: 8 }}>
                {candPortal.retroalimentacion || etapaActual.mensaje_sugerido || "Tu proceso está siendo gestionado. Te contactaremos pronto."}
              </p>
              <div style={{ fontSize: 12, color: "#bbb" }}>Última actualización: {fmtFull(candPortal.actualizado_en)}</div>
            </div>
          )}

          {/* Progreso */}
          {etapasFlujo.length > 0 && (
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={S.lbl}>Progreso del proceso</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>{progreso}%</span>
              </div>
              <div style={{ height: 8, background: "#f0f0f0", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ height: "100%", width: `${progreso}%`, background: "linear-gradient(90deg, #1a1a2e, #4a4a8e)", borderRadius: 10, transition: "width 0.6s" }} />
              </div>
              {faseGroups.map(fase => {
                const etapasFase = etapasFlujo.filter(e => e.fase === fase);
                if (etapasFase.length === 0) return null;
                return (
                  <div key={fase} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: FASE_INFO[fase]?.color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, padding: "4px 10px", background: FASE_INFO[fase]?.bg, borderRadius: 6, display: "inline-block" }}>{FASE_INFO[fase]?.label}</div>
                    {etapasFase.map(e => {
                      const completada = histPortal.some(h => h.etapa_id === e.id);
                      const actual = e.id === candPortal.etapa_actual_id;
                      const hEntry = histPortal.find(h => h.etapa_id === e.id);
                      return (
                        <div key={e.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ ...S.dot(actual || completada, e.color), marginTop: 2 }} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, color: actual ? e.color : completada ? "#555" : "#bbb", fontWeight: actual ? 700 : completada ? 500 : 400 }}>{e.nombre}</span>
                            {actual && <span style={{ marginLeft: 8, fontSize: 10, background: e.color, color: "#fff", borderRadius: 10, padding: "1px 8px" }}>● Actual</span>}
                            {completada && hEntry && <div style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>{fmt(hEntry.fecha)}</div>}
                          </div>
                          {completada && hEntry?.aprobado !== null && (
                            <span style={S.badge(hEntry.aprobado ? "#0F6E56" : "#c0392b", hEntry.aprobado ? "#f0fdf4" : "#fef2f2")}>{hEntry.aprobado ? "✓" : "✗"}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Historial */}
          {histPortal.length > 0 && (
            <div style={S.card}>
              <div style={S.lbl}>Historial de actualizaciones</div>
              {[...histPortal].reverse().map((h, i) => (
                <div key={h.id} style={{ display: "flex", gap: 14, paddingBottom: 18, position: "relative" }}>
                  {i < histPortal.length - 1 && <div style={{ position: "absolute", left: 6, top: 14, bottom: 0, width: 1, background: "#eee" }} />}
                  <div style={{ width: 13, height: 13, borderRadius: "50%", background: i === 0 ? "#1a1a2e" : "#ddd", flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e", marginBottom: 2 }}>{h.etapa_nombre}</div>
                    <div style={{ fontSize: 12, color: "#bbb", marginBottom: 6 }}>{fmtFull(h.fecha)}</div>
                    {h.mensaje_visible && <p style={{ fontSize: 13, color: "#555", margin: 0, padding: "8px 12px", background: "#f8f8f8", borderRadius: 8, lineHeight: 1.6 }}>{h.mensaje_visible}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════
  // ADMIN — DETALLE CANDIDATO
  // ═══════════════════════════════
  if (scr === "admin_cand" && candSel && isAdmin) {
    const etapaActual = allEtapas.find(e => e.id === candSel.etapa_actual_id);
    const etapaSelObj = etapasCandSel.find(e => e.id === nuevaEtapaId);

    return (
      <div style={S.page}>
        <style>{CSS}</style>
        <Bar right={
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btnG} onClick={() => { setScr("admin"); setCandSel(null); }}>← Candidatos</button>
            {candSel.estado !== "contratado" && <button style={S.btnGreen} onClick={() => { setFormContrat({}); setShowContrat(true); }}>🎉 Registrar contratación</button>}
            <button style={S.btnD} onClick={async () => { if (window.confirm(`¿Eliminar a ${candSel.nombre}?`)) { await db.delCandidato(candSel.id); setCandidatos(prev => prev.filter(c => c.id !== candSel.id)); setScr("admin"); setCandSel(null); } }}>Eliminar</button>
            <button style={S.btnG} onClick={() => { setIsAdmin(false); setScr("portal"); }}>Salir</button>
          </div>
        } />

        {showContrat && (
          <Modal title="🎉 Registrar contratación" onClose={() => setShowContrat(false)} width={520}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={S.g2}>
                <div><label style={S.lbl}>Cargo contratado</label><input style={S.inp} value={formContrat.cargo_contratado || ""} onChange={e => setFormContrat(f => ({ ...f, cargo_contratado: e.target.value }))} placeholder="Cargo" /></div>
                <div><label style={S.lbl}>Empresa contratante</label><input style={S.inp} value={formContrat.empresa_contratante || ""} onChange={e => setFormContrat(f => ({ ...f, empresa_contratante: e.target.value }))} placeholder="Empresa" /></div>
              </div>
              <div style={S.g2}>
                <div><label style={S.lbl}>Salario final</label><input style={S.inp} value={formContrat.salario_final || ""} onChange={e => setFormContrat(f => ({ ...f, salario_final: e.target.value }))} placeholder="Ej: 4.500.000" /></div>
                <div><label style={S.lbl}>Tipo de contrato</label><input style={S.inp} value={formContrat.tipo_contrato || ""} onChange={e => setFormContrat(f => ({ ...f, tipo_contrato: e.target.value }))} placeholder="Indefinido, término fijo..." /></div>
              </div>
              <div style={S.g2}>
                <div><label style={S.lbl}>Fecha de contratación</label><input style={S.inp} type="date" value={formContrat.fecha_contratacion || ""} onChange={e => setFormContrat(f => ({ ...f, fecha_contratacion: e.target.value }))} /></div>
                <div><label style={S.lbl}>Fecha de ingreso</label><input style={S.inp} type="date" value={formContrat.fecha_ingreso || ""} onChange={e => setFormContrat(f => ({ ...f, fecha_ingreso: e.target.value }))} /></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button style={{ ...S.btnG, flex: 1 }} onClick={() => setShowContrat(false)}>Cancelar</button>
              <button style={{ ...S.btn, flex: 1 }} onClick={guardarContratacion}>Guardar contratación</button>
            </div>
          </Modal>
        )}

        <div style={S.body}>
          {/* Header candidato */}
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={S.av}>{ini(candSel.nombre)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{candSel.nombre}</h2>
                  {candSel.estado === "contratado" && <span style={S.badge("#0F6E56", "#f0fdf4")}>✓ Contratado</span>}
                </div>
                <p style={{ color: "#888", fontSize: 13, margin: "2px 0 0" }}>Cédula: {candSel.cedula} · {candSel.profesion} · {candSel.ciudad}</p>
                {etapaActual && <span style={{ ...S.badge(etapaActual.color, etapaActual.color + "22"), marginTop: 6, display: "inline-block" }}>{etapaActual.nombre}</span>}
              </div>
              <button style={S.btnG} onClick={() => { setEditando(!editando); setFormErr(""); setFormOk(""); }}>{editando ? "Cancelar" : "✏️ Editar"}</button>
            </div>
          </div>

          {/* Edición */}
          {editando && (
            <div style={S.card}>
              <div style={S.section}>Editar información del candidato</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={S.g2}>
                  <div><label style={S.lbl}>Nombre *</label><input style={S.inp} value={formCand.nombre || ""} onChange={e => setFormCand(f => ({ ...f, nombre: e.target.value }))} /></div>
                  <div><label style={S.lbl}>Cédula *</label><input style={S.inp} value={formCand.cedula || ""} onChange={e => setFormCand(f => ({ ...f, cedula: e.target.value }))} /></div>
                </div>
                <div style={S.g3}>
                  <div><label style={S.lbl}>Edad</label><input style={S.inp} value={formCand.edad || ""} onChange={e => setFormCand(f => ({ ...f, edad: e.target.value }))} /></div>
                  <div><label style={S.lbl}>Profesión</label><input style={S.inp} value={formCand.profesion || ""} onChange={e => setFormCand(f => ({ ...f, profesion: e.target.value }))} /></div>
                  <div><label style={S.lbl}>Ciudad</label><input style={S.inp} value={formCand.ciudad || ""} onChange={e => setFormCand(f => ({ ...f, ciudad: e.target.value }))} /></div>
                </div>
                <div style={S.g2}>
                  <div><label style={S.lbl}>Celular</label><input style={S.inp} value={formCand.celular || ""} onChange={e => setFormCand(f => ({ ...f, celular: e.target.value }))} /></div>
                  <div><label style={S.lbl}>Correo</label><input style={S.inp} value={formCand.correo || ""} onChange={e => setFormCand(f => ({ ...f, correo: e.target.value }))} /></div>
                </div>
                <div style={S.g2}>
                  <div><label style={S.lbl}>Aspiración salarial</label><input style={S.inp} value={formCand.salario_aspiracion || ""} onChange={e => setFormCand(f => ({ ...f, salario_aspiracion: e.target.value }))} /></div>
                  <div><label style={S.lbl}>LinkedIn</label><input style={S.inp} value={formCand.linkedin || ""} onChange={e => setFormCand(f => ({ ...f, linkedin: e.target.value }))} /></div>
                </div>
                <div><label style={S.lbl}>Link hoja de vida</label><input style={S.inp} value={formCand.cv_link || ""} onChange={e => setFormCand(f => ({ ...f, cv_link: e.target.value }))} /></div>
                <div style={S.g2}>
                  <div><label style={S.lbl}>Vacante</label><input style={S.inp} value={formCand.vacante || ""} onChange={e => setFormCand(f => ({ ...f, vacante: e.target.value }))} /></div>
                  <div><label style={S.lbl}>Empresa</label><input style={S.inp} value={formCand.empresa || ""} onChange={e => setFormCand(f => ({ ...f, empresa: e.target.value }))} /></div>
                </div>
                <div>
                  <label style={S.lbl}>Flujo de proceso</label>
                  <select style={S.sel} value={formCand.flujo_id || ""} onChange={async e => { setFormCand(f => ({ ...f, flujo_id: e.target.value })); if (e.target.value) { const et = await db.getEtapas(e.target.value); setEtapasCandSel(et || []); } }}>
                    <option value="">Sin flujo</option>
                    {flujos.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                  </select>
                </div>
                <div><label style={S.lbl}>Observaciones privadas 🔒</label><textarea style={{ ...S.ta, height: 70 }} value={formCand.observaciones_privadas || ""} onChange={e => setFormCand(f => ({ ...f, observaciones_privadas: e.target.value }))} /></div>
                {formErr && <div style={S.err}>{formErr}</div>}
                {formOk && <div style={S.ok}>{formOk}</div>}
                <button style={{ ...S.btn, opacity: guardando ? 0.7 : 1 }} onClick={guardarCandidato} disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}</button>
              </div>
            </div>
          )}

          {/* Info rápida */}
          {!editando && (
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={S.section}>Información del candidato</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px 20px", marginBottom: 14 }}>
                {[["Celular", candSel.celular], ["Correo", candSel.correo], ["Ciudad", candSel.ciudad], ["Edad", candSel.edad], ["Profesión", candSel.profesion], ["Aspiración salarial", candSel.salario_aspiracion], ["Vacante", candSel.vacante], ["Empresa", candSel.empresa], ["Fecha aplicación", candSel.fecha_aplicacion]].map(([k, v]) => v ? (
                  <div key={k}><div style={S.infoItem}>{k}</div><div style={S.infoVal}>{v}</div></div>
                ) : null)}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {candSel.cv_link && <a href={candSel.cv_link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1a1a2e", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>📄 Ver hoja de vida</a>}
                {candSel.linkedin && <a href={candSel.linkedin} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0A66C2", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>in LinkedIn</a>}
              </div>
              {candSel.observaciones_privadas && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: "#fffbf0", borderRadius: 8, border: "1px solid #fde8c8" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>🔒 Observaciones privadas</div>
                  <p style={{ fontSize: 13, color: "#555", margin: 0 }}>{candSel.observaciones_privadas}</p>
                </div>
              )}
            </div>
          )}

          {/* Contratación */}
          {candSel.estado === "contratado" && (
            <div style={{ ...S.card, borderTop: "3px solid #0F6E56", marginBottom: 14 }}>
              <div style={S.section}>🎉 Datos de contratación</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px 20px" }}>
                {[["Cargo", candSel.cargo_contratado], ["Empresa", candSel.empresa_contratante], ["Salario final", candSel.salario_final], ["Tipo contrato", candSel.tipo_contrato], ["Fecha contratación", candSel.fecha_contratacion], ["Fecha ingreso", candSel.fecha_ingreso]].map(([k, v]) => v ? (
                  <div key={k}><div style={S.infoItem}>{k}</div><div style={S.infoVal}>{v}</div></div>
                ) : null)}
              </div>
            </div>
          )}

          {/* Avanzar etapa */}
          {etapasCandSel.length > 0 && (
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={S.section}>Avanzar en el proceso</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={S.lbl}>Selecciona la etapa</label>
                  <select style={S.sel} value={nuevaEtapaId} onChange={e => { setNuevaEtapaId(e.target.value); const et = etapasCandSel.find(x => x.id === e.target.value); if (et) setMsgCand(et.mensaje_sugerido || ""); }}>
                    <option value="">Selecciona una etapa...</option>
                    {["consultora", "cliente", "cierre"].map(fase => {
                      const etsFase = etapasCandSel.filter(e => e.fase === fase);
                      if (etsFase.length === 0) return null;
                      return (
                        <optgroup key={fase} label={`── ${FASE_INFO[fase]?.label} ──`}>
                          {etsFase.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                {etapaSelObj?.mensaje_sugerido && (
                  <div style={{ padding: "8px 12px", background: "#f0f5ff", borderRadius: 8, fontSize: 12, color: "#185FA5", border: "1px solid #dde8ff" }}>
                    💡 Sugerencia: <em>"{etapaSelObj.mensaje_sugerido}"</em>
                  </div>
                )}
                <div>
                  <label style={S.lbl}>Mensaje visible para el candidato</label>
                  <textarea style={{ ...S.ta, height: 80 }} value={msgCand} onChange={e => setMsgCand(e.target.value)} placeholder="Este mensaje lo verá el candidato al consultar su proceso..." />
                </div>
                <div>
                  <label style={S.lbl}>Comentario privado 🔒 (solo admin)</label>
                  <input style={S.inp} value={comentPriv} onChange={e => setComentPriv(e.target.value)} placeholder="Notas internas que no verá el candidato..." />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                    <input type="checkbox" checked={etapaAprobada} onChange={e => setEtapaAprobada(e.target.checked)} />
                    Marcar etapa como aprobada
                  </label>
                  <button style={{ ...S.btn, opacity: guardandoEtapa || !nuevaEtapaId ? 0.6 : 1 }} onClick={avanzarEtapa} disabled={guardandoEtapa || !nuevaEtapaId}>
                    {guardandoEtapa ? "Guardando..." : "Guardar avance →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Línea de tiempo */}
          <div style={S.card}>
            <div style={S.section}>Línea de tiempo del proceso ({histSel.length} registros)</div>
            {histSel.length === 0 && <p style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: "1rem 0" }}>Sin historial aún. Avanza al candidato en una etapa para registrar.</p>}
            {[...histSel].reverse().map((h, i) => (
              <div key={h.id} style={{ display: "flex", gap: 14, paddingBottom: 18, position: "relative" }}>
                {i < histSel.length - 1 && <div style={{ position: "absolute", left: 6, top: 14, bottom: 0, width: 1, background: "#eee" }} />}
                <div style={{ width: 13, height: 13, borderRadius: "50%", background: i === 0 ? "#1a1a2e" : "#ddd", flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{h.etapa_nombre}</span>
                    {h.aprobado !== null && <span style={S.badge(h.aprobado ? "#0F6E56" : "#c0392b", h.aprobado ? "#f0fdf4" : "#fef2f2")}>{h.aprobado ? "✓ Aprobado" : "✗ No aprobado"}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#bbb", marginBottom: 6 }}>{fmtFull(h.fecha)}</div>
                  {h.mensaje_visible && <p style={{ fontSize: 13, color: "#555", margin: "0 0 4px", padding: "8px 12px", background: "#f8f8f8", borderRadius: 8, lineHeight: 1.6 }}>{h.mensaje_visible}</p>}
                  {h.comentario_privado && <p style={{ fontSize: 12, color: "#999", margin: 0, fontStyle: "italic" }}>🔒 {h.comentario_privado}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════
  // ADMIN — PANEL PRINCIPAL
  // ═══════════════════════════════
  if (scr === "admin" && isAdmin) {
    const filtrados = candidatos.filter(c => {
      const t = filtroTxt.toLowerCase();
      return (!t || c.nombre?.toLowerCase().includes(t) || c.cedula?.includes(t) || c.profesion?.toLowerCase().includes(t) || c.vacante?.toLowerCase().includes(t))
        && (!filtroCiudad || c.ciudad?.toLowerCase().includes(filtroCiudad.toLowerCase()))
        && (!filtroEstado || c.estado === filtroEstado);
    });

    return (
      <div style={S.page}>
        <style>{CSS}</style>
        <Bar right={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#aaa", fontWeight: 600 }}>Panel Admin</span>
            <button style={S.btnG} onClick={() => { setIsAdmin(false); setScr("portal"); }}>Salir</button>
          </div>
        } />
        <div style={S.body}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 22, background: "#ececec", padding: 4, borderRadius: 12, width: "fit-content" }}>
            {[["candidatos", "👥 Candidatos"], ["nuevo", "➕ Nuevo"], ["flujos", "⚙️ Flujos"], ["dashboard", "📊 Dashboard"]].map(([t, l]) => (
              <button key={t} style={S.tab(aTab === t)} onClick={() => setATab(t)}>{l}</button>
            ))}
          </div>

          {/* ── CANDIDATOS ── */}
          {aTab === "candidatos" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Base de candidatos</h2>
                  <p style={{ color: "#888", fontSize: 13, margin: "2px 0 0" }}>{filtrados.length} de {candidatos.length} candidatos</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <input style={{ ...S.inp, flex: 2, minWidth: 180 }} value={filtroTxt} onChange={e => setFiltroTxt(e.target.value)} placeholder="🔍 Buscar por nombre, cédula, profesión o vacante..." />
                <input style={{ ...S.inp, flex: 1, minWidth: 120 }} value={filtroCiudad} onChange={e => setFiltroCiudad(e.target.value)} placeholder="Ciudad..." />
                <select style={{ ...S.sel, flex: 1, minWidth: 130 }} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="activo">Activo</option>
                  <option value="contratado">Contratado</option>
                  <option value="base_datos">Base de datos</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              {filtrados.length === 0 && <div style={{ ...S.card, textAlign: "center", color: "#bbb", padding: "3rem" }}>No hay candidatos que coincidan.</div>}
              {filtrados.map(c => {
                const etapa = allEtapas.find(e => e.id === c.etapa_actual_id);
                return (
                  <div key={c.id} className="card-hover" style={{ ...S.card, cursor: "pointer", transition: "border 0.15s" }} onClick={() => abrirCandidato(c)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={S.av}>{ini(c.nombre)}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{c.nombre}</div>
                          <div style={{ fontSize: 12, color: "#888" }}>{c.cedula}{c.profesion ? ` · ${c.profesion}` : ""}{c.ciudad ? ` · ${c.ciudad}` : ""}</div>
                          {(c.vacante || c.empresa) && <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>{c.vacante}{c.empresa ? ` — ${c.empresa}` : ""}</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {etapa && <span style={S.badge(etapa.color, etapa.color + "18")}>{etapa.nombre}</span>}
                        {c.estado === "contratado" && <span style={S.badge("#0F6E56", "#f0fdf4")}>✓ Contratado</span>}
                        <span style={{ color: "#ccc", fontSize: 20 }}>›</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ── NUEVO CANDIDATO ── */}
          {aTab === "nuevo" && (
            <>
              <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 18px" }}>Registrar nuevo candidato</h2>
              <div style={S.card}>
                <div style={S.section}>Datos personales</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  <div style={S.g2}>
                    <div><label style={S.lbl}>Nombre completo *</label><input style={S.inp} value={formNuevo.nombre || ""} onChange={e => setFormNuevo(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre completo" /></div>
                    <div><label style={S.lbl}>Número de cédula *</label><input style={S.inp} value={formNuevo.cedula || ""} onChange={e => setFormNuevo(f => ({ ...f, cedula: e.target.value }))} placeholder="Número de cédula" /></div>
                  </div>
                  <div style={S.g3}>
                    <div><label style={S.lbl}>Edad</label><input style={S.inp} value={formNuevo.edad || ""} onChange={e => setFormNuevo(f => ({ ...f, edad: e.target.value }))} placeholder="Ej: 28" /></div>
                    <div><label style={S.lbl}>Profesión / Título</label><input style={S.inp} value={formNuevo.profesion || ""} onChange={e => setFormNuevo(f => ({ ...f, profesion: e.target.value }))} placeholder="Profesión" /></div>
                    <div><label style={S.lbl}>Ciudad</label><input style={S.inp} value={formNuevo.ciudad || ""} onChange={e => setFormNuevo(f => ({ ...f, ciudad: e.target.value }))} placeholder="Ciudad" /></div>
                  </div>
                  <div style={S.g2}>
                    <div><label style={S.lbl}>Celular</label><input style={S.inp} value={formNuevo.celular || ""} onChange={e => setFormNuevo(f => ({ ...f, celular: e.target.value }))} placeholder="Celular" /></div>
                    <div><label style={S.lbl}>Correo electrónico</label><input style={S.inp} value={formNuevo.correo || ""} onChange={e => setFormNuevo(f => ({ ...f, correo: e.target.value }))} placeholder="Correo" /></div>
                  </div>
                  <div style={S.g2}>
                    <div><label style={S.lbl}>Aspiración salarial</label><input style={S.inp} value={formNuevo.salario_aspiracion || ""} onChange={e => setFormNuevo(f => ({ ...f, salario_aspiracion: e.target.value }))} placeholder="Ej: 3.500.000" /></div>
                    <div><label style={S.lbl}>LinkedIn</label><input style={S.inp} value={formNuevo.linkedin || ""} onChange={e => setFormNuevo(f => ({ ...f, linkedin: e.target.value }))} placeholder="URL de LinkedIn" /></div>
                  </div>
                  <div><label style={S.lbl}>Link hoja de vida (Google Drive)</label><input style={S.inp} value={formNuevo.cv_link || ""} onChange={e => setFormNuevo(f => ({ ...f, cv_link: e.target.value }))} placeholder="https://drive.google.com/..." /></div>
                </div>
              </div>
              <div style={S.card}>
                <div style={S.section}>Proceso de selección</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  <div style={S.g2}>
                    <div><label style={S.lbl}>Vacante</label><input style={S.inp} value={formNuevo.vacante || ""} onChange={e => setFormNuevo(f => ({ ...f, vacante: e.target.value }))} placeholder="Cargo al que aplica" /></div>
                    <div><label style={S.lbl}>Empresa cliente</label><input style={S.inp} value={formNuevo.empresa || ""} onChange={e => setFormNuevo(f => ({ ...f, empresa: e.target.value }))} placeholder="Empresa" /></div>
                  </div>
                  <div style={S.g2}>
                    <div><label style={S.lbl}>Fecha de aplicación</label><input style={S.inp} type="date" value={formNuevo.fecha_aplicacion || ""} onChange={e => setFormNuevo(f => ({ ...f, fecha_aplicacion: e.target.value }))} /></div>
                    <div><label style={S.lbl}>Flujo de proceso</label>
                      <select style={S.sel} value={formNuevo.flujo_id || ""} onChange={e => setFormNuevo(f => ({ ...f, flujo_id: e.target.value }))}>
                        <option value="">Sin flujo asignado</option>
                        {flujos.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label style={S.lbl}>Observaciones internas 🔒</label><textarea style={{ ...S.ta, height: 70 }} value={formNuevo.observaciones_privadas || ""} onChange={e => setFormNuevo(f => ({ ...f, observaciones_privadas: e.target.value }))} placeholder="Notas internas que el candidato no verá..." /></div>
                </div>
              </div>
              {nuevoErr && <div style={S.err}>{nuevoErr}</div>}
              {nuevoOk && <div style={S.ok}>{nuevoOk}</div>}
              <button style={{ ...S.btn, opacity: guardandoNuevo ? 0.7 : 1 }} onClick={registrarNuevo} disabled={guardandoNuevo}>
                {guardandoNuevo ? "Guardando..." : "Registrar candidato"}
              </button>
            </>
          )}

          {/* ── FLUJOS ── */}
          {aTab === "flujos" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Flujos de reclutamiento</h2>
                  <p style={{ color: "#888", fontSize: 13, margin: "2px 0 0" }}>Personaliza las etapas para cada empresa o proceso</p>
                </div>
                <button style={S.btn} onClick={() => { setShowNuevoFlujo(!showNuevoFlujo); setFormFlujo({ nombre: "", empresa: "", descripcion: "" }); setFlujoErr(""); }}>
                  {showNuevoFlujo ? "Cancelar" : "+ Nuevo flujo"}
                </button>
              </div>

              {/* Form nuevo flujo */}
              {showNuevoFlujo && (
                <div style={{ ...S.card, background: "#f8f8ff", border: "1px solid #e0e0ff", marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#534AB7", marginBottom: 12 }}>Crear nuevo flujo</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={S.g2}>
                      <div><label style={S.lbl}>Nombre del flujo *</label><input style={S.inp} value={formFlujo.nombre} onChange={e => setFormFlujo(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Proceso Bancolombia" autoFocus /></div>
                      <div><label style={S.lbl}>Empresa cliente</label><input style={S.inp} value={formFlujo.empresa} onChange={e => setFormFlujo(f => ({ ...f, empresa: e.target.value }))} placeholder="Nombre de la empresa" /></div>
                    </div>
                    <div><label style={S.lbl}>Descripción</label><input style={S.inp} value={formFlujo.descripcion} onChange={e => setFormFlujo(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción breve del proceso" /></div>
                    {flujoErr && <div style={S.err}>{flujoErr}</div>}
                    <div>
                      <button style={{ ...S.btn, opacity: guardandoFlujo ? 0.7 : 1 }} onClick={crearFlujo} disabled={guardandoFlujo}>
                        {guardandoFlujo ? "Guardando..." : "Crear flujo"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {flujos.length === 0 && <div style={{ ...S.card, textAlign: "center", color: "#bbb", padding: "3rem" }}>No hay flujos. Crea el primero.</div>}

              {flujos.map(f => (
                <div key={f.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                  {/* Cabecera flujo — clic para expandir */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", cursor: "pointer", background: flujoAbierto?.id === f.id ? "#f8f8ff" : "#fff" }} onClick={() => abrirFlujo(f)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 18, transform: flujoAbierto?.id === f.id ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>›</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{f.nombre}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{f.empresa}{f.descripcion ? ` · ${f.descripcion}` : ""}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
                      <button style={S.btnSm} onClick={() => duplicarFlujo(f)}>Duplicar</button>
                      <button style={S.btnD} onClick={async () => { if (window.confirm("¿Eliminar este flujo y todas sus etapas?")) { await db.delFlujo(f.id); setFlujos(prev => prev.filter(x => x.id !== f.id)); if (flujoAbierto?.id === f.id) setFlujoAbierto(null); } }}>Eliminar</button>
                    </div>
                  </div>

                  {/* Etapas expandibles */}
                  {flujoAbierto?.id === f.id && (
                    <div style={{ borderTop: "1px solid #eee", padding: "1rem 1.5rem", background: "#fafafa" }}>
                      {loadingEtapas ? (
                        <p style={{ color: "#aaa", fontSize: 13, textAlign: "center" }}>Cargando etapas...</p>
                      ) : (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.6 }}>{etapasFlujoAbierto.length} etapas</span>
                            <button style={S.btnSm} onClick={() => { setShowNuevaEtapa(!showNuevaEtapa); setFormEtapa({ nombre: "", fase: "consultora", mensaje_sugerido: "" }); setEtapaErr(""); }}>
                              {showNuevaEtapa ? "Cancelar" : "+ Agregar etapa"}
                            </button>
                          </div>

                          {/* Form nueva etapa */}
                          {showNuevaEtapa && (
                            <div style={{ background: "#fff", border: "1px solid #e0e0ff", borderRadius: 10, padding: "1rem", marginBottom: 12 }}>
                              <div style={{ fontWeight: 700, fontSize: 12, color: "#534AB7", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Nueva etapa</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <div style={S.g2}>
                                  <div><label style={S.lbl}>Nombre *</label><input style={S.inp} value={formEtapa.nombre} onChange={e => setFormEtapa(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Entrevista técnica" autoFocus /></div>
                                  <div><label style={S.lbl}>Fase</label>
                                    <select style={S.sel} value={formEtapa.fase} onChange={e => setFormEtapa(f => ({ ...f, fase: e.target.value }))}>
                                      <option value="consultora">Consultoría</option>
                                      <option value="cliente">Empresa Cliente</option>
                                      <option value="cierre">Cierre</option>
                                    </select>
                                  </div>
                                </div>
                                <div><label style={S.lbl}>Mensaje sugerido para el candidato</label><textarea style={{ ...S.ta, height: 60 }} value={formEtapa.mensaje_sugerido} onChange={e => setFormEtapa(f => ({ ...f, mensaje_sugerido: e.target.value }))} placeholder="Ej: Tu perfil continúa avanzando satisfactoriamente..." /></div>
                                {etapaErr && <div style={S.err}>{etapaErr}</div>}
                                <button style={{ ...S.btnSm, opacity: guardandoEtapaNueva ? 0.7 : 1 }} onClick={crearEtapa} disabled={guardandoEtapaNueva}>
                                  {guardandoEtapaNueva ? "Guardando..." : "Agregar etapa"}
                                </button>
                              </div>
                            </div>
                          )}

                          {etapasFlujoAbierto.length === 0 && <p style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: "1rem 0" }}>Sin etapas. Agrega la primera.</p>}

                          {["consultora", "cliente", "cierre"].map(fase => {
                            const etsFase = etapasFlujoAbierto.filter(e => e.fase === fase);
                            if (etsFase.length === 0) return null;
                            return (
                              <div key={fase} style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: FASE_INFO[fase]?.color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, padding: "3px 10px", background: FASE_INFO[fase]?.bg, borderRadius: 6, display: "inline-block" }}>{FASE_INFO[fase]?.label}</div>
                                {etsFase.map((e, i) => (
                                  <div key={e.id} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 9, padding: "10px 14px", marginBottom: 6, borderLeft: `3px solid ${e.color || "#185FA5"}` }}>
                                    {editandoEtapaId === e.id ? (
                                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        <input style={S.inp} value={formEtapaEdit.nombre || ""} onChange={ev => setFormEtapaEdit(f => ({ ...f, nombre: ev.target.value }))} />
                                        <textarea style={{ ...S.ta, height: 55 }} value={formEtapaEdit.mensaje_sugerido || ""} onChange={ev => setFormEtapaEdit(f => ({ ...f, mensaje_sugerido: ev.target.value }))} placeholder="Mensaje sugerido..." />
                                        <div style={{ display: "flex", gap: 8 }}>
                                          <button style={S.btnSm} onClick={() => guardarEtapaEdit(e.id)}>Guardar</button>
                                          <button style={S.btnG} onClick={() => setEditandoEtapaId(null)}>Cancelar</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div>
                                          <span style={{ fontSize: 11, color: "#bbb", marginRight: 6 }}>{etapasFlujoAbierto.filter(x => x.fase === fase).indexOf(e) + 1 + etapasFlujoAbierto.filter(x => ["consultora", "cliente"].slice(0, ["consultora", "cliente", "cierre"].indexOf(fase)).includes(x.fase)).length}.</span>
                                          <span style={{ fontWeight: 600, fontSize: 14 }}>{e.nombre}</span>
                                          {e.mensaje_sugerido && <p style={{ fontSize: 12, color: "#888", margin: "3px 0 0" }}>{e.mensaje_sugerido}</p>}
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                          <button style={{ ...S.btnG, fontSize: 11, padding: "5px 10px" }} onClick={() => { setEditandoEtapaId(e.id); setFormEtapaEdit({ nombre: e.nombre, mensaje_sugerido: e.mensaje_sugerido || "" }); }}>✏️</button>
                                          <button style={{ ...S.btnD, fontSize: 11, padding: "5px 10px" }} onClick={async () => { if (window.confirm("¿Eliminar etapa?")) { await db.delEtapa(e.id); setEtapasFlujoAbierto(prev => prev.filter(x => x.id !== e.id)); setAllEtapas(prev => prev.filter(x => x.id !== e.id)); } }}>✕</button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ── DASHBOARD ── */}
          {aTab === "dashboard" && (() => {
            const total = candidatos.length;
            const activos = candidatos.filter(c => c.estado === "activo").length;
            const contratados = candidatos.filter(c => c.estado === "contratado").length;
            const base = candidatos.filter(c => c.estado === "base_datos").length;
            const ciudades = [...new Set(candidatos.map(c => c.ciudad).filter(Boolean))];
            const porCiudad = ciudades.map(ci => ({ ciudad: ci, count: candidatos.filter(c => c.ciudad === ci).length })).sort((a, b) => b.count - a.count).slice(0, 5);
            const porVacante = [...new Set(candidatos.map(c => c.vacante).filter(Boolean))].map(v => ({ vacante: v, count: candidatos.filter(c => c.vacante === v).length })).sort((a, b) => b.count - a.count).slice(0, 5);
            return (
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 18px" }}>Dashboard</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                  {[{ label: "Total candidatos", val: total, icon: "👥", color: "#1a1a2e" }, { label: "Procesos activos", val: activos, icon: "🔄", color: "#185FA5" }, { label: "Contratados", val: contratados, icon: "🎉", color: "#0F6E56" }, { label: "Base de datos", val: base, icon: "📁", color: "#854F0B" }].map((c, i) => (
                    <div key={i} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: "1rem 1.2rem", borderTop: `3px solid ${c.color}` }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                      <div style={{ fontSize: 30, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.val}</div>
                      <div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>{c.label}</div>
                    </div>
                  ))}
                </div>
                <div style={S.g2}>
                  {porCiudad.length > 0 && (
                    <div style={S.card}>
                      <div style={S.section}>Por ciudad</div>
                      {porCiudad.map((c, i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: "#555" }}>{c.ciudad}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{c.count}</span>
                          </div>
                          <div style={{ height: 5, background: "#f0f0f0", borderRadius: 10, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.round(c.count / total * 100)}%`, background: "#1a1a2e", borderRadius: 10 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {porVacante.length > 0 && (
                    <div style={S.card}>
                      <div style={S.section}>Por vacante</div>
                      {porVacante.map((v, i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: "#555" }}>{v.vacante}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{v.count}</span>
                          </div>
                          <div style={{ height: 5, background: "#f0f0f0", borderRadius: 10, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.round(v.count / total * 100)}%`, background: "#185FA5", borderRadius: 10 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {total === 0 && <div style={{ ...S.card, textAlign: "center", color: "#bbb", padding: "3rem" }}>No hay candidatos aún.</div>}
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  return <div style={S.page}><style>{CSS}</style></div>;
}