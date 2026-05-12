import { useState, useEffect } from "react";

const SUPABASE_URL = "https://nwmqmwnwyfwrxqblamay.supabase.co";
const SUPABASE_KEY = "sb_publishable_L9npWi9ejapJ-07Y7slMtw_FrdEvpmX";

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...options.headers
    },
    ...options
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    console.error("Supabase error:", err);
    return null;
  }
  if (res.status === 204) return true;
  return res.json();
}

const getVacs = () => sb("vacantes?order=fecha.desc");
const getCands = () => sb("candidatos?order=id.desc");
const upsertVac = (v) => sb("vacantes", { method: "POST", prefer: "resolution=merge-duplicates,return=representation", body: JSON.stringify(v) });
const upsertCand = (c) => sb("candidatos", { method: "POST", prefer: "resolution=merge-duplicates,return=representation", body: JSON.stringify(c) });
const deleteVac = (id) => sb(`vacantes?id=eq.${id}`, { method: "DELETE", prefer: "" });
const deleteCand = (id) => sb(`candidatos?id=eq.${id}`, { method: "DELETE", prefer: "" });
const updateCand = (id, data) => sb(`candidatos?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data) });
const updateVac = (id, data) => sb(`vacantes?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data) });

const ESTADOS = [
  { id: "enviada", label: "Aplicación enviada", color: "#185FA5", bg: "#E6F1FB" },
  { id: "revision", label: "Hoja de vida en revisión", color: "#185FA5", bg: "#E6F1FB" },
  { id: "preseleccionado", label: "Perfil preseleccionado", color: "#0F6E56", bg: "#E1F5EE" },
  { id: "no_cumple", label: "No cumple perfil", color: "#A32D2D", bg: "#FCEBEB" },
  { id: "entrevista_agendada", label: "Entrevista agendada", color: "#3B6D11", bg: "#EAF3DE" },
  { id: "entrevista_realizada", label: "Entrevista realizada", color: "#3B6D11", bg: "#EAF3DE" },
  { id: "entrevista_cliente", label: "Entrevista cliente", color: "#534AB7", bg: "#EEEDFE" },
  { id: "entrevista_final", label: "Entrevista final", color: "#534AB7", bg: "#EEEDFE" },
  { id: "oferta_enviada", label: "Oferta enviada", color: "#854F0B", bg: "#FAEEDA" },
  { id: "oferta_aceptada", label: "Oferta aceptada", color: "#0F6E56", bg: "#E1F5EE" },
  { id: "examenes", label: "Exámenes médicos", color: "#185FA5", bg: "#E6F1FB" },
  { id: "contrato", label: "Contrato enviado", color: "#534AB7", bg: "#EEEDFE" },
  { id: "fecha_inicio", label: "Fecha de inicio", color: "#0F6E56", bg: "#E1F5EE" },
  { id: "cerrado", label: "Proceso cerrado", color: "#5F5E5A", bg: "#F1EFE8" },
];

const AREAS = ["Recursos Humanos","Talento Humano","Finanzas","Tecnología","Operaciones","Comercial","Marketing","Legal","Logística","Otro"];
const TIPOS = ["Tiempo completo","Medio tiempo","Contrato","Prácticas","Remoto"];
const TIPOS_P = [
  { id: "texto", label: "Texto libre" },
  { id: "multiple", label: "Opción múltiple" },
  { id: "sino", label: "Sí / No" },
  { id: "escala", label: "Escala 1 al 5" },
  { id: "archivo", label: "Carga de archivo" },
];

function fmt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) + " · " + d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}
function getE(id) { return ESTADOS.find(e => e.id === id) || ESTADOS[0]; }
function ini(n) { return (n||"?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase(); }
function uid() { return "id" + Date.now() + Math.random().toString(36).slice(2,6); }

const s = {
  page: { fontFamily: "system-ui,sans-serif", background: "#f7f8fa", minHeight: "100vh" },
  bar: { background: "#fff", borderBottom: "0.5px solid #e8e8e8", padding: "0 1.5rem", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
  body: { maxWidth: 800, margin: "0 auto", padding: "1.75rem 1.25rem" },
  card: { background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, padding: "1.25rem 1.4rem", marginBottom: 12 },
  lbl: { fontSize: 11, fontWeight: 600, color: "#aaa", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 5 },
  inp: { width: "100%", padding: "9px 11px", fontSize: 14, border: "0.5px solid #ddd", borderRadius: 8, outline: "none", boxSizing: "border-box", background: "#fff" },
  sel: { width: "100%", padding: "9px 11px", fontSize: 14, border: "0.5px solid #ddd", borderRadius: 8, outline: "none", boxSizing: "border-box", background: "#fff" },
  ta: { width: "100%", padding: "9px 11px", fontSize: 14, border: "0.5px solid #ddd", borderRadius: 8, outline: "none", boxSizing: "border-box", background: "#fff", resize: "vertical" },
  btn: { background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  btnSm: { background: "#185FA5", color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  btnG: { background: "transparent", color: "#888", border: "0.5px solid #e5e5e5", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer" },
  btnD: { background: "transparent", color: "#A32D2D", border: "0.5px solid #f0a0a0", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer" },
  badge: (e) => ({ display: "inline-block", background: e.bg, color: e.color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 500 }),
  err: { background: "#FCEBEB", color: "#A32D2D", borderRadius: 8, padding: "9px 13px", fontSize: 13, marginBottom: 10 },
  g2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  av: { width: 38, height: 38, borderRadius: "50%", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, color: "#185FA5", flexShrink: 0 },
  dot: (on) => ({ width: 10, height: 10, borderRadius: "50%", background: on ? "#185FA5" : "#e0e0e0", border: on ? "2px solid #B5D4F4" : "2px solid #eee", flexShrink: 0, marginTop: 3 }),
  tab: (on) => ({ padding: "7px 15px", fontSize: 13, fontWeight: on ? 600 : 400, color: on ? "#185FA5" : "#999", background: on ? "#E6F1FB" : "transparent", border: "none", borderRadius: 8, cursor: "pointer" }),
  step: (on) => ({ width: 28, height: 28, borderRadius: "50%", background: on ? "#185FA5" : "#e8e8e8", color: on ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }),
};

export default function App() {
  const [scr, setScr] = useState("inicio");
  const [vacs, setVacs] = useState([]);
  const [cands, setCands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candActivo, setCandActivo] = useState(null);

  const [apVac, setApVac] = useState(null);
  const [apPaso, setApPaso] = useState(1);
  const [apNombre, setApNombre] = useState(""); const [apCedula, setApCedula] = useState(""); const [apTel, setApTel] = useState(""); const [apEmail, setApEmail] = useState(""); const [apCiudad, setApCiudad] = useState(""); const [apProf, setApProf] = useState(""); const [apExp, setApExp] = useState(""); const [apEst, setApEst] = useState("Universitario");
  const [apResp, setApResp] = useState({});
  const [apErr, setApErr] = useState("");

  const [accCedula, setAccCedula] = useState(""); const [accErr, setAccErr] = useState("");
  const [adminPass, setAdminPass] = useState(""); const [adminErr, setAdminErr] = useState(""); const [showAdminLogin, setShowAdminLogin] = useState(false);

  const [aTab, setATab] = useState("vacantes");
  const [aVacMode, setAVacMode] = useState("lista"); const [aVacSel, setAVacSel] = useState(null);
  const [aCandSel, setACandSel] = useState(null); const [aFiltro, setAFiltro] = useState("todas");
  const [aEstado, setAEstado] = useState(""); const [aNota, setANota] = useState("");
  const [nvT, setNvT] = useState(""); const [nvA, setNvA] = useState(""); const [nvC, setNvC] = useState(""); const [nvTipo, setNvTipo] = useState("Tiempo completo"); const [nvD, setNvD] = useState(""); const [nvR, setNvR] = useState(""); const [nvErr, setNvErr] = useState(""); const [nvPreguntas, setNvPreguntas] = useState([]);
  const [pTipo, setPTipo] = useState("texto"); const [pTexto, setPTexto] = useState(""); const [pReq, setPReq] = useState(false); const [pOps, setPOps] = useState(""); const [pErr, setPErr] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [v, c] = await Promise.all([getVacs(), getCands()]);
      if (v) setVacs(v);
      if (c) setCands(c);
      setLoading(false);
    })();
  }, []);

  const refreshData = async () => {
    const [v, c] = await Promise.all([getVacs(), getCands()]);
    if (v) setVacs(v);
    if (c) setCands(c);
  };

  const doAcceso = async () => {
    setAccErr("");
    const found = cands.find(x => x.cedula === accCedula.trim());
    if (!found) { setAccErr("No encontramos una aplicación con esa cédula. Primero debes aplicar a una vacante."); return; }
    setCandActivo(found); setScr("portal");
  };

  const doAdminLogin = () => {
    if (adminPass === "Josedavid.15") { setShowAdminLogin(false); setAdminPass(""); setAdminErr(""); setScr("admin"); }
    else setAdminErr("Contraseña incorrecta.");
  };

  const analizarConIA = async (candidato, vac) => {
    const pregs = (vac.preguntas || []).map((p, i) => {
      const r = candidato.respuestas?.[p.id];
      const rv = r === undefined ? "Sin respuesta" : (p.tipo === "sino" ? (r === "si" ? "Sí" : "No") : (p.tipo === "escala" ? `${r}/5` : r));
      return `${i+1}. ${p.pregunta}: ${rv}`;
    }).join("\n");
    const db = candidato.datos_basicos || {};
    const prompt = `Eres un experto en selección de talento humano. Analiza este candidato para la vacante y devuelve SOLO un JSON válido sin explicaciones ni markdown.

VACANTE: ${vac.titulo} | ${vac.area} | ${vac.ciudad} | ${vac.tipo}
Descripción: ${vac.descripcion || "No especificada"}
Requisitos: ${vac.requisitos || "No especificados"}

CANDIDATO: ${candidato.nombre} | ${db.profesion} | ${db.experiencia} | ${db.nivel_estudios} | ${db.ciudad}

RESPUESTAS: ${pregs || "Sin preguntas"}

JSON: {"porcentaje":<0-100>,"resumen":"<2-3 oraciones>","fortalezas":"<puntos a favor>","debilidades":"<puntos de mejora>","recomendacion":"contratar"|"considerar"|"no_contratar","justificacion":"<1 oración>"}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      return JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch { return null; }
  };

  const doAplicar = async () => {
    setApErr("");
    if (!apNombre || !apCedula || !apTel || !apCiudad || !apProf || !apExp) { setApErr("Completa todos los campos obligatorios (*)"); return; }
    if (cands.find(x => x.cedula === apCedula && x.vacante_id === apVac.id)) { setApErr("Ya aplicaste a esta vacante anteriormente."); return; }
    const pregs = apVac.preguntas || [];
    for (const p of pregs.filter(p => p.requerida)) {
      if (apResp[p.id] === undefined || apResp[p.id] === null || apResp[p.id] === "") { setApErr("Responde todas las preguntas obligatorias (*)."); return; }
    }
    const nuevo = {
      id: "c" + Date.now(),
      nombre: apNombre, cedula: apCedula,
      vacante_id: apVac.id, vacante_titulo: apVac.titulo,
      datos_basicos: { telefono: apTel, email: apEmail, ciudad: apCiudad, profesion: apProf, experiencia: apExp, nivel_estudios: apEst },
      respuestas: apResp, analisis_ia: null, analizando: true,
      historial: [{ estado: "enviada", fecha: new Date().toISOString(), nota: "Aplicación recibida exitosamente." }]
    };
    const res = await upsertCand(nuevo);
    if (!res) { setApErr("Error al guardar. Intenta de nuevo."); return; }
    const candGuardado = Array.isArray(res) ? res[0] : res;
    setCandActivo(candGuardado);
    setCands(prev => [...prev, candGuardado]);
    setScr("confirmacion");
    const analisis = await analizarConIA(nuevo, apVac);
    await updateCand(nuevo.id, { analisis_ia: analisis, analizando: false });
    setCands(prev => prev.map(x => x.id === nuevo.id ? { ...x, analisis_ia: analisis, analizando: false } : x));
    setApVac(null);
  };

  const doCambiarEstado = async () => {
    if (!aEstado || !aCandSel) return;
    const nuevoHistorial = [...(aCandSel.historial || []), { estado: aEstado, fecha: new Date().toISOString(), nota: aNota || getE(aEstado).label }];
    await updateCand(aCandSel.id, { historial: nuevoHistorial });
    const updated = { ...aCandSel, historial: nuevoHistorial };
    setACandSel(updated);
    setCands(prev => prev.map(x => x.id === aCandSel.id ? updated : x));
    setAEstado(""); setANota("");
  };

  const doAgregarPregunta = () => {
    setPErr("");
    if (!pTexto.trim()) { setPErr("Escribe el texto de la pregunta."); return; }
    if (pTipo === "multiple" && !pOps.trim()) { setPErr("Agrega opciones separadas por coma."); return; }
    const ops = pTipo === "multiple" ? pOps.split(",").map(o => o.trim()).filter(Boolean) : [];
    setNvPreguntas(prev => [...prev, { id: uid(), tipo: pTipo, pregunta: pTexto, requerida: pReq, opciones: ops }]);
    setPTexto(""); setPOps(""); setPReq(false); setPTipo("texto"); setPErr("");
  };

  const doGuardarVac = async () => {
    if (!nvT || !nvA || !nvC) { setNvErr("Completa título, área y ciudad."); return; }
    const vacData = { titulo: nvT, area: nvA, ciudad: nvC, tipo: nvTipo, descripcion: nvD, requisitos: nvR, preguntas: nvPreguntas, publicada: true };
    if (aVacMode === "editar" && aVacSel) {
      await updateVac(aVacSel.id, vacData);
      setVacs(prev => prev.map(v => v.id === aVacSel.id ? { ...v, ...vacData } : v));
    } else {
      const nueva = { id: "v" + Date.now(), ...vacData, fecha: new Date().toISOString() };
      const res = await upsertVac(nueva);
      if (res) setVacs(prev => [...prev, Array.isArray(res) ? res[0] : res]);
    }
    setAVacMode("lista"); setAVacSel(null); setNvT(""); setNvA(""); setNvC(""); setNvTipo("Tiempo completo"); setNvD(""); setNvR(""); setNvPreguntas([]); setNvErr("");
  };

  const abrirEditar = (v) => { setAVacSel(v); setNvT(v.titulo); setNvA(v.area); setNvC(v.ciudad); setNvTipo(v.tipo); setNvD(v.descripcion||""); setNvR(v.requisitos||""); setNvPreguntas(v.preguntas||[]); setAVacMode("editar"); };

  const RenderPregunta = ({ p, valor, onChange }) => {
    if (p.tipo === "texto") return <textarea style={{ ...s.ta, height: 70 }} value={valor||""} onChange={e => onChange(e.target.value)} placeholder="Tu respuesta..." />;
    if (p.tipo === "multiple") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {p.opciones.map(op => (
          <label key={op} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
            <input type="radio" name={p.id} checked={valor === op} onChange={() => onChange(op)} /> {op}
          </label>
        ))}
      </div>
    );
    if (p.tipo === "sino") return (
      <div style={{ display: "flex", gap: 10 }}>
        {["si","no"].map(v => (
          <button key={v} onClick={() => onChange(v)} style={{ padding: "8px 24px", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: valor===v?600:400, background: valor===v?"#E6F1FB":"transparent", color: valor===v?"#185FA5":"#888", border: valor===v?"0.5px solid #185FA5":"0.5px solid #ddd" }}>{v === "si" ? "Sí" : "No"}</button>
        ))}
      </div>
    );
    if (p.tipo === "escala") return (
      <div style={{ display: "flex", gap: 8 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{ width: 40, height: 40, borderRadius: 8, fontSize: 15, cursor: "pointer", fontWeight: valor===n?700:400, background: valor===n?"#185FA5":"transparent", color: valor===n?"#fff":"#888", border: valor===n?"none":"0.5px solid #ddd" }}>{n}</button>
        ))}
      </div>
    );
    if (p.tipo === "archivo") return (
      <div onClick={() => onChange("archivo_adjunto.pdf")} style={{ border: "0.5px dashed #ccc", borderRadius: 8, padding: 14, textAlign: "center", color: "#bbb", fontSize: 13, cursor: "pointer" }}>
        {valor ? <span style={{ color: "#0F6E56" }}>✓ Archivo adjuntado</span> : "Haz clic para adjuntar archivo"}
      </div>
    );
    return null;
  };

  const MostrarRespuesta = ({ p, valor }) => {
    if (valor === undefined || valor === null || valor === "") return <span style={{ color: "#bbb", fontSize: 13 }}>Sin respuesta</span>;
    if (p.tipo === "escala") return <div style={{ display: "flex", gap: 4 }}>{[1,2,3,4,5].map(n => <span key={n} style={{ width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, background:n<=valor?"#185FA5":"#f0f0f0", color:n<=valor?"#fff":"#bbb", fontWeight:600 }}>{n}</span>)}</div>;
    if (p.tipo === "sino") return <span style={{ background:valor==="si"?"#E1F5EE":"#FCEBEB", color:valor==="si"?"#0F6E56":"#A32D2D", borderRadius:20, padding:"3px 12px", fontSize:13, fontWeight:500 }}>{valor==="si"?"Sí":"No"}</span>;
    if (p.tipo === "archivo") return <span style={{ color: "#185FA5", fontSize: 13 }}>📎 {valor}</span>;
    return <span style={{ fontSize: 14, color: "#444" }}>{valor}</span>;
  };

  const Bar = ({ children }) => (
    <div style={s.bar}>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#A0632A", fontStyle: "italic", letterSpacing: 1 }}>Mishell Fontalvo</span>
        <span style={{ fontSize: 9, letterSpacing: 3, color: "#C4966A", textTransform: "uppercase", fontWeight: 400 }}>Psicóloga</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{children}</div>
    </div>
  );

  if (loading) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #185FA5", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#aaa", fontSize: 14 }}>Cargando portal...</p>
      </div>
    </div>
  );

  if (scr === "inicio") {
    const pub = vacs.filter(v => v.publicada);
    return (
      <div style={s.page}>
        <Bar>
          <button style={s.btnG} onClick={() => setScr("acceso")}>Ver mi proceso</button>
          <button style={{ ...s.btnG, fontSize: 12 }} onClick={() => setShowAdminLogin(true)}>Admin</button>
        </Bar>
        {showAdminLogin && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "1.75rem", width: 320 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Acceso administrador</h3>
              <label style={s.lbl}>Contraseña</label>
              <input style={{ ...s.inp, marginBottom: 12 }} type="password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&doAdminLogin()} autoFocus />
              {adminErr && <div style={s.err}>{adminErr}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...s.btnG, flex: 1 }} onClick={() => { setShowAdminLogin(false); setAdminPass(""); setAdminErr(""); }}>Cancelar</button>
                <button style={{ ...s.btn, flex: 1 }} onClick={doAdminLogin}>Ingresar</button>
              </div>
            </div>
          </div>
        )}
        <div style={s.body}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Oportunidades de empleo</h2>
            <p style={{ color: "#aaa", fontSize: 14, margin: 0 }}>{pub.length} vacante{pub.length !== 1 ? "s" : ""} disponible{pub.length !== 1 ? "s" : ""}.</p>
          </div>
          {pub.length === 0 && <div style={{ ...s.card, textAlign: "center", color: "#bbb", padding: "3rem" }}>No hay vacantes publicadas en este momento.</div>}
          {pub.map(v => (
            <div key={v.id} style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{v.titulo}</div>
                  <div style={{ fontSize: 13, color: "#999", marginBottom: 8 }}>{v.area} · {v.ciudad} · {v.tipo}</div>
                  {v.descripcion && <p style={{ fontSize: 13, color: "#666", margin: "0 0 6px", lineHeight: 1.6 }}>{v.descripcion}</p>}
                  {v.requisitos && <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}><strong>Requisitos:</strong> {v.requisitos}</p>}
                  {v.preguntas && v.preguntas.length > 0 && <p style={{ fontSize: 12, color: "#378ADD", margin: "6px 0 0" }}>📋 {v.preguntas.length} preguntas en el formulario</p>}
                </div>
                <button style={s.btn} onClick={() => { setApVac(v); setApPaso(1); setApNombre(""); setApCedula(""); setApTel(""); setApEmail(""); setApCiudad(""); setApProf(""); setApExp(""); setApEst("Universitario"); setApResp({}); setApErr(""); setScr("aplicar"); }}>Aplicar</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 24, padding: "16px 20px", background: "#f0f5ff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 2px", color: "#185FA5" }}>¿Ya aplicaste?</p>
              <p style={{ fontSize: 13, color: "#378ADD", margin: 0 }}>Ingresa con tu cédula para ver tu proceso.</p>
            </div>
            <button style={s.btn} onClick={() => setScr("acceso")}>Ver mi proceso</button>
          </div>
        </div>
      </div>
    );
  }

  if (scr === "aplicar" && apVac) {
    const preguntas = apVac.preguntas || [];
    return (
      <div style={s.page}>
        <Bar><button style={s.btnG} onClick={() => setScr("inicio")}>← Volver</button></Bar>
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem 1rem" }}>
          <div style={{ width: "100%", maxWidth: 540 }}>
            <div style={{ background: "#E6F1FB", borderRadius: 10, padding: "12px 16px", marginBottom: 22 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#185FA5" }}>{apVac.titulo}</div>
              <div style={{ fontSize: 12, color: "#378ADD" }}>{apVac.area} · {apVac.ciudad} · {apVac.tipo}</div>
            </div>
            {preguntas.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
                <div style={s.step(apPaso >= 1)}>1</div>
                <span style={{ fontSize: 13, color: apPaso===1?"#185FA5":"#bbb", fontWeight: apPaso===1?600:400 }}>Tus datos</span>
                <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
                <div style={s.step(apPaso >= 2)}>2</div>
                <span style={{ fontSize: 13, color: apPaso===2?"#185FA5":"#bbb", fontWeight: apPaso===2?600:400 }}>Preguntas del cargo</span>
              </div>
            )}
            {apPaso === 1 && (
              <div style={s.card}>
                <p style={{ fontWeight: 600, fontSize: 15, margin: "0 0 16px" }}>Tus datos personales</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  <div><label style={s.lbl}>Nombre completo *</label><input style={s.inp} value={apNombre} onChange={e=>setApNombre(e.target.value)} placeholder="Tu nombre completo" /></div>
                  <div style={s.g2}>
                    <div><label style={s.lbl}>Cédula *</label><input style={s.inp} value={apCedula} onChange={e=>setApCedula(e.target.value)} placeholder="Ej: 1234567890" /></div>
                    <div><label style={s.lbl}>Teléfono *</label><input style={s.inp} value={apTel} onChange={e=>setApTel(e.target.value)} placeholder="3001234567" /></div>
                  </div>
                  <div style={s.g2}>
                    <div><label style={s.lbl}>Correo</label><input style={s.inp} type="email" value={apEmail} onChange={e=>setApEmail(e.target.value)} placeholder="tucorreo@email.com" /></div>
                    <div><label style={s.lbl}>Ciudad *</label><input style={s.inp} value={apCiudad} onChange={e=>setApCiudad(e.target.value)} placeholder="Tu ciudad" /></div>
                  </div>
                  <div style={s.g2}>
                    <div><label style={s.lbl}>Profesión *</label><input style={s.inp} value={apProf} onChange={e=>setApProf(e.target.value)} placeholder="Ej: Psicóloga" /></div>
                    <div><label style={s.lbl}>Experiencia *</label><input style={s.inp} value={apExp} onChange={e=>setApExp(e.target.value)} placeholder="Ej: 3 años" /></div>
                  </div>
                  <div><label style={s.lbl}>Nivel de estudios</label>
                    <select style={s.sel} value={apEst} onChange={e=>setApEst(e.target.value)}>
                      {["Bachiller","Técnico","Tecnólogo","Universitario","Posgrado","Maestría","Doctorado"].map(n=><option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div><label style={s.lbl}>Hoja de vida (PDF o Word)</label><div style={{ border: "0.5px dashed #ccc", borderRadius: 8, padding: 14, textAlign: "center", color: "#bbb", fontSize: 13, cursor: "pointer" }}>Haz clic para adjuntar tu CV</div></div>
                  {apErr && <div style={s.err}>{apErr}</div>}
                  <button style={{ ...s.btn, width: "100%" }} onClick={() => { if (!apNombre || !apCedula || !apTel || !apCiudad || !apProf || !apExp) { setApErr("Completa los campos obligatorios (*)"); return; } setApErr(""); if (preguntas.length === 0) doAplicar(); else setApPaso(2); }}>{preguntas.length === 0 ? "Enviar aplicación" : "Continuar →"}</button>
                </div>
              </div>
            )}
            {apPaso === 2 && (
              <div style={s.card}>
                <p style={{ fontWeight: 600, fontSize: 15, margin: "0 0 4px" }}>Preguntas del cargo</p>
                <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 20px" }}>Las marcadas con * son obligatorias.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {preguntas.map((p, i) => (
                    <div key={p.id}>
                      <label style={{ fontSize: 14, fontWeight: 500, color: "#333", display: "block", marginBottom: 8 }}>
                        {i+1}. {p.pregunta} {p.requerida && <span style={{ color: "#A32D2D" }}>*</span>}
                        <span style={{ marginLeft: 8, fontSize: 11, color: "#bbb", fontWeight: 400 }}>({TIPOS_P.find(t=>t.id===p.tipo)?.label})</span>
                      </label>
                      <RenderPregunta p={p} valor={apResp[p.id]} onChange={v => setApResp(r => ({ ...r, [p.id]: v }))} />
                    </div>
                  ))}
                </div>
                {apErr && <div style={{ ...s.err, marginTop: 14 }}>{apErr}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button style={s.btnG} onClick={() => { setApPaso(1); setApErr(""); }}>← Anterior</button>
                  <button style={{ ...s.btn, flex: 1 }} onClick={doAplicar}>Enviar aplicación</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (scr === "confirmacion" && candActivo) return (
    <div style={s.page}>
      <Bar />
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem 1rem" }}>
        <div style={{ width: "100%", maxWidth: 460, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>¡Aplicación enviada!</h2>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>Tu aplicación para <strong>{candActivo.vacante_titulo}</strong> fue recibida exitosamente.</p>
          <div style={{ background: "#E6F1FB", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: "#185FA5", margin: "0 0 4px", fontWeight: 600 }}>¿Cómo consultar tu estado?</p>
            <p style={{ fontSize: 13, color: "#378ADD", margin: 0 }}>Haz clic en <strong>"Ver mi proceso"</strong> e ingresa tu cédula: <strong>{candActivo.cedula}</strong></p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button style={s.btnG} onClick={() => setScr("inicio")}>Ver más vacantes</button>
            <button style={s.btn} onClick={() => setScr("portal")}>Ver mi proceso ahora</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (scr === "acceso") return (
    <div style={s.page}>
      <Bar><button style={s.btnG} onClick={() => setScr("inicio")}>← Vacantes</button></Bar>
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem 1rem" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <h2 style={{ fontSize: 21, fontWeight: 700, marginBottom: 4 }}>Ver mi proceso</h2>
          <p style={{ color: "#aaa", fontSize: 14, marginBottom: 24 }}>Ingresa tu cédula para consultar el estado de tu aplicación.</p>
          <div style={s.card}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={s.lbl}>Número de cédula</label><input style={s.inp} value={accCedula} onChange={e=>setAccCedula(e.target.value)} placeholder="Ej: 1234567890" onKeyDown={e=>e.key==="Enter"&&doAcceso()} autoFocus /></div>
              {accErr && <div style={s.err}>{accErr}</div>}
              <button style={{ ...s.btn, width: "100%" }} onClick={doAcceso}>Consultar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (scr === "portal" && candActivo) {
    const u = cands.find(x => x.id === candActivo.id) || candActivo;
    const ea = u.historial && u.historial.length ? getE(u.historial[u.historial.length-1].estado) : null;
    const hist = u.historial ? [...u.historial].reverse() : [];
    return (
      <div style={s.page}>
        <Bar><button style={s.btnG} onClick={() => { setCandActivo(null); setScr("inicio"); }}>Salir</button></Bar>
        <div style={s.body}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <div style={s.av}>{ini(u.nombre)}</div>
            <div><h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Hola, {u.nombre.split(" ")[0]}</h2><p style={{ color: "#aaa", fontSize: 13, margin: 0 }}>Cédula: {u.cedula}</p></div>
          </div>
          {ea && (
            <div style={{ ...s.card, borderLeft: `3px solid ${ea.color}`, marginBottom: 14 }}>
              <div style={s.lbl}>Proceso activo</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{u.vacante_titulo}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={s.badge(ea)}>{ea.label}</span>
                <span style={{ fontSize: 12, color: "#bbb" }}>{fmt(u.historial[u.historial.length-1].fecha)}</span>
              </div>
              <p style={{ fontSize: 13, color: "#666", margin: "10px 0 0" }}>{u.historial[u.historial.length-1].nota}</p>
            </div>
          )}
          <div style={s.card}>
            <div style={s.lbl}>Historial</div>
            {hist.map((h, i) => {
              const e = getE(h.estado);
              return (
                <div key={i} style={{ display: "flex", gap: 13, paddingBottom: 18, position: "relative" }}>
                  {i < hist.length-1 && <div style={{ position: "absolute", left: 4, top: 14, bottom: 0, width: 1, background: "#efefef" }} />}
                  <div style={s.dot(i===0)} />
                  <div style={{ flex: 1 }}>
                    <span style={{ ...s.badge(e), opacity: i===0?1:0.7 }}>{e.label}</span>
                    <div style={{ fontSize: 12, color: "#bbb", margin: "4px 0 2px" }}>{fmt(h.fecha)}</div>
                    <div style={{ fontSize: 13, color: "#666" }}>{h.nota}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (scr === "admin") {
    if (aCandSel) {
      const vac = vacs.find(v => v.id === aCandSel.vacante_id);
      const hist = aCandSel.historial ? [...aCandSel.historial].reverse() : [];
      const db = aCandSel.datos_basicos || {};
      const a = aCandSel.analisis_ia;
      return (
        <div style={s.page}>
          <Bar>
            <button style={s.btnG} onClick={() => setACandSel(null)}>← Candidatos</button>
            <button style={s.btnD} onClick={async () => { if(window.confirm(`¿Eliminar a ${aCandSel.nombre}?`)) { await deleteCand(aCandSel.id); setCands(prev => prev.filter(c => c.id !== aCandSel.id)); setACandSel(null); } }}>Eliminar</button>
            <button style={s.btnG} onClick={() => setScr("inicio")}>Salir</button>
          </Bar>
          <div style={s.body}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={s.av}>{ini(aCandSel.nombre)}</div>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{aCandSel.nombre}</h2>
                <p style={{ color: "#aaa", fontSize: 13, margin: 0 }}>Cédula: {aCandSel.cedula}</p>
                {vac && <p style={{ color: "#185FA5", fontSize: 13, margin: "2px 0 0" }}>{vac.titulo}</p>}
              </div>
            </div>
            {aCandSel.analizando && (
              <div style={{ ...s.card, marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 20, height: 20, border: "2px solid #185FA5", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 14, color: "#185FA5" }}>Analizando perfil con IA...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            {a && (() => {
              const rec = { contratar: { label: "Recomendado para contratar", bg: "#E1F5EE", color: "#0F6E56" }, considerar: { label: "Considerar con reservas", bg: "#FAEEDA", color: "#854F0B" }, no_contratar: { label: "No recomendado", bg: "#FCEBEB", color: "#A32D2D" } }[a.recomendacion] || { label: a.recomendacion, bg: "#f0f0f0", color: "#888" };
              const pct = Math.min(100, Math.max(0, a.porcentaje));
              const barColor = pct >= 70 ? "#0F6E56" : pct >= 45 ? "#854F0B" : "#A32D2D";
              return (
                <div style={{ ...s.card, marginBottom: 12, borderTop: `3px solid ${barColor}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={s.lbl}>Análisis IA</span>
                    <span style={{ background: rec.bg, color: rec.color, borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 600 }}>{rec.label}</span>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#666" }}>Compatibilidad con el perfil</span>
                      <span style={{ fontSize: 22, fontWeight: 700, color: barColor }}>{pct}%</span>
                    </div>
                    <div style={{ height: 8, background: "#f0f0f0", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 10 }} />
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: "0 0 12px", padding: "10px 12px", background: "#f9f9f9", borderRadius: 8 }}>{a.resumen}</p>
                  <div style={s.g2}>
                    <div style={{ background: "#f0faf5", borderRadius: 8, padding: "10px 12px" }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#0F6E56", margin: "0 0 4px", textTransform: "uppercase" }}>Fortalezas</p>
                      <p style={{ fontSize: 13, color: "#444", margin: 0, lineHeight: 1.5 }}>{a.fortalezas}</p>
                    </div>
                    <div style={{ background: "#fff8f0", borderRadius: 8, padding: "10px 12px" }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#854F0B", margin: "0 0 4px", textTransform: "uppercase" }}>Por mejorar</p>
                      <p style={{ fontSize: 13, color: "#444", margin: 0, lineHeight: 1.5 }}>{a.debilidades}</p>
                    </div>
                  </div>
                  {a.justificacion && <p style={{ fontSize: 13, color: "#888", margin: "10px 0 0", fontStyle: "italic" }}>"{a.justificacion}"</p>}
                </div>
              );
            })()}
            {Object.keys(db).length > 0 && (
              <div style={{ ...s.card, marginBottom: 12 }}>
                <div style={s.lbl}>Datos personales</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
                  {[["Teléfono",db.telefono],["Correo",db.email],["Ciudad",db.ciudad],["Profesión",db.profesion],["Experiencia",db.experiencia],["Estudios",db.nivel_estudios]].map(([k,v]) => v ? (
                    <div key={k}><span style={{ fontSize: 12, color: "#aaa" }}>{k}</span><p style={{ fontSize: 14, margin: "2px 0 0", fontWeight: 500 }}>{v}</p></div>
                  ) : null)}
                </div>
              </div>
            )}
            {vac && vac.preguntas && vac.preguntas.length > 0 && (
              <div style={{ ...s.card, marginBottom: 12 }}>
                <div style={s.lbl}>Respuestas del formulario</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {vac.preguntas.map((p, i) => (
                    <div key={p.id}>
                      <p style={{ fontSize: 13, color: "#666", margin: "0 0 6px" }}>{i+1}. {p.pregunta}</p>
                      <MostrarRespuesta p={p} valor={aCandSel.respuestas?.[p.id]} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ ...s.card, marginBottom: 12 }}>
              <div style={s.lbl}>Cambiar estado</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <select style={s.sel} value={aEstado} onChange={e=>setAEstado(e.target.value)}>
                  <option value="">Selecciona nuevo estado...</option>
                  {ESTADOS.map(e=><option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
                <input style={s.inp} placeholder="Mensaje para el candidato (opcional)" value={aNota} onChange={e=>setANota(e.target.value)} />
                <div><button style={s.btn} onClick={doCambiarEstado}>Guardar cambio</button></div>
              </div>
            </div>
            <div style={s.card}>
              <div style={s.lbl}>Historial</div>
              {hist.map((h, i) => {
                const e = getE(h.estado);
                return (
                  <div key={i} style={{ display: "flex", gap: 13, paddingBottom: 18, position: "relative" }}>
                    {i < hist.length-1 && <div style={{ position: "absolute", left: 4, top: 14, bottom: 0, width: 1, background: "#efefef" }} />}
                    <div style={s.dot(i===0)} />
                    <div style={{ flex: 1 }}>
                      <span style={{ ...s.badge(e), opacity: i===0?1:0.7 }}>{e.label}</span>
                      <div style={{ fontSize: 12, color: "#bbb", margin: "4px 0 2px" }}>{fmt(h.fecha)}</div>
                      <div style={{ fontSize: 13, color: "#666" }}>{h.nota}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    const filtrados = aFiltro === "todas" ? cands : cands.filter(x => x.vacante_id === aFiltro);
    return (
      <div style={s.page}>
        <Bar><span style={{ fontSize: 13, color: "#aaa", fontWeight: 500 }}>Panel Admin</span><button style={s.btnG} onClick={() => { refreshData(); setScr("inicio"); }}>Salir</button></Bar>
        <div style={s.body}>
          <div style={{ display: "flex", gap: 6, marginBottom: 22, background: "#f0f0f0", padding: 4, borderRadius: 10, width: "fit-content" }}>
            {[["vacantes","Vacantes"],["candidatos","Candidatos"]].map(([t,l]) => (
              <button key={t} style={s.tab(aTab===t)} onClick={() => setATab(t)}>{l}</button>
            ))}
          </div>

          {aTab === "vacantes" && aVacMode === "lista" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div><h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Vacantes</h2><p style={{ color: "#aaa", fontSize: 13, margin: "2px 0 0" }}>{vacs.length} registradas</p></div>
                <button style={s.btn} onClick={() => { setNvT(""); setNvA(""); setNvC(""); setNvTipo("Tiempo completo"); setNvD(""); setNvR(""); setNvPreguntas([]); setNvErr(""); setAVacMode("nueva"); }}>+ Nueva vacante</button>
              </div>
              {vacs.length === 0 && <div style={{ ...s.card, textAlign: "center", color: "#bbb", padding: "2.5rem" }}>No hay vacantes.</div>}
              {vacs.map(v => {
                const nA = cands.filter(x => x.vacante_id === v.id).length;
                return (
                  <div key={v.id} style={s.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>{v.titulo}</span>
                          <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: v.publicada?"#E1F5EE":"#F1EFE8", color: v.publicada?"#0F6E56":"#888", fontWeight: 500 }}>{v.publicada?"Publicada":"Pausada"}</span>
                          <span style={{ fontSize: 12, color: "#bbb" }}>{nA} aplicante{nA!==1?"s":""}</span>
                          {v.preguntas && v.preguntas.length > 0 && <span style={{ fontSize: 12, color: "#185FA5" }}>📋 {v.preguntas.length} preguntas</span>}
                        </div>
                        <div style={{ fontSize: 13, color: "#aaa" }}>{v.area} · {v.ciudad} · {v.tipo}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button style={s.btnG} onClick={async () => { await updateVac(v.id, { publicada: !v.publicada }); setVacs(prev => prev.map(x => x.id===v.id?{...x,publicada:!x.publicada}:x)); }}>{v.publicada?"Pausar":"Publicar"}</button>
                        <button style={s.btnG} onClick={() => abrirEditar(v)}>Editar</button>
                        <button style={s.btnD} onClick={async () => { if(window.confirm("¿Eliminar vacante?")) { await deleteVac(v.id); setVacs(prev => prev.filter(x => x.id!==v.id)); } }}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {aTab === "vacantes" && (aVacMode === "nueva" || aVacMode === "editar") && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <button style={s.btnG} onClick={() => setAVacMode("lista")}>← Volver</button>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{aVacMode==="nueva"?"Nueva vacante":"Editar vacante"}</h2>
              </div>
              <div style={s.card}>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  <div><label style={s.lbl}>Título *</label><input style={s.inp} value={nvT} onChange={e=>setNvT(e.target.value)} placeholder="Ej: Analista de Recursos Humanos" /></div>
                  <div style={s.g2}>
                    <div><label style={s.lbl}>Área *</label><select style={s.sel} value={nvA} onChange={e=>setNvA(e.target.value)}><option value="">Seleccionar...</option>{AREAS.map(a=><option key={a}>{a}</option>)}</select></div>
                    <div><label style={s.lbl}>Ciudad *</label><input style={s.inp} value={nvC} onChange={e=>setNvC(e.target.value)} placeholder="Ej: Barranquilla" /></div>
                  </div>
                  <div><label style={s.lbl}>Tipo</label><select style={s.sel} value={nvTipo} onChange={e=>setNvTipo(e.target.value)}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></div>
                  <div><label style={s.lbl}>Descripción</label><textarea style={{ ...s.ta, height: 80 }} value={nvD} onChange={e=>setNvD(e.target.value)} placeholder="Responsabilidades..." /></div>
                  <div><label style={s.lbl}>Requisitos</label><textarea style={{ ...s.ta, height: 65 }} value={nvR} onChange={e=>setNvR(e.target.value)} placeholder="Experiencia, estudios..." /></div>
                </div>
              </div>
              <div style={s.card}>
                <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 4px", color: "#555" }}>Preguntas del formulario</p>
                <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 16px" }}>El candidato responderá estas preguntas al aplicar.</p>
                {nvPreguntas.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    {nvPreguntas.map((p, i) => (
                      <div key={p.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "#f9f9f9", borderRadius: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: "#aaa", minWidth: 18, marginTop: 2 }}>{i+1}.</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 14, color: "#333" }}>{p.pregunta}</span>
                          <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, background: "#E6F1FB", color: "#185FA5", borderRadius: 10, padding: "2px 8px" }}>{TIPOS_P.find(t=>t.id===p.tipo)?.label}</span>
                            {p.requerida && <span style={{ fontSize: 11, background: "#FCEBEB", color: "#A32D2D", borderRadius: 10, padding: "2px 8px" }}>Obligatoria</span>}
                            {p.opciones && p.opciones.length > 0 && <span style={{ fontSize: 11, color: "#aaa" }}>{p.opciones.join(", ")}</span>}
                          </div>
                        </div>
                        <button style={s.btnD} onClick={() => setNvPreguntas(prev => prev.filter(x => x.id !== p.id))}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ background: "#f5f8ff", borderRadius: 10, padding: 14, border: "0.5px solid #dce8f8" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#185FA5", margin: "0 0 12px" }}>+ Agregar pregunta</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={s.g2}>
                      <div><label style={s.lbl}>Tipo</label><select style={s.sel} value={pTipo} onChange={e=>setPTipo(e.target.value)}>{TIPOS_P.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
                      <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}><label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={pReq} onChange={e=>setPReq(e.target.checked)} /> Obligatoria</label></div>
                    </div>
                    <div><label style={s.lbl}>Texto de la pregunta</label><input style={s.inp} value={pTexto} onChange={e=>setPTexto(e.target.value)} placeholder="Escribe la pregunta..." onKeyDown={e=>e.key==="Enter"&&doAgregarPregunta()} /></div>
                    {pTipo === "multiple" && <div><label style={s.lbl}>Opciones (separadas por coma)</label><input style={s.inp} value={pOps} onChange={e=>setPOps(e.target.value)} placeholder="Opción A, Opción B, Opción C" /></div>}
                    {pErr && <div style={s.err}>{pErr}</div>}
                    <div><button style={s.btnSm} onClick={doAgregarPregunta}>Agregar pregunta</button></div>
                  </div>
                </div>
              </div>
              {nvErr && <div style={s.err}>{nvErr}</div>}
              <button style={s.btn} onClick={doGuardarVac}>{aVacMode==="nueva"?"Publicar vacante":"Guardar cambios"}</button>
            </>
          )}

          {aTab === "candidatos" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                <div><h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 2px" }}>Candidatos</h2><p style={{ color: "#aaa", fontSize: 13, margin: 0 }}>{cands.length} registrados</p></div>
                <select style={{ ...s.sel, width: "auto", minWidth: 200 }} value={aFiltro} onChange={e=>setAFiltro(e.target.value)}>
                  <option value="todas">Todas las vacantes</option>
                  {vacs.map(v=><option key={v.id} value={v.id}>{v.titulo}</option>)}
                </select>
              </div>
              {filtrados.length === 0 && <div style={{ ...s.card, textAlign: "center", color: "#bbb", padding: "2.5rem" }}>No hay candidatos.</div>}
              {filtrados.length > 0 && (
                <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 2fr 1.4fr 1fr 60px", padding: "10px 16px", background: "#f7f8fa", borderBottom: "0.5px solid #e8e8e8" }}>
                    {["Nombre","Cédula","Vacante","Estado","IA %",""].map((h, i) => (
                      <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#aaa", letterSpacing: 0.4, textTransform: "uppercase" }}>{h}</span>
                    ))}
                  </div>
                  {filtrados.map((x, idx) => {
                    const ea = x.historial && x.historial.length ? getE(x.historial[x.historial.length-1].estado) : null;
                    const vac = vacs.find(v => v.id === x.vacante_id);
                    const pct = x.analisis_ia?.porcentaje;
                    const pctColor = pct === undefined ? "#ccc" : pct >= 70 ? "#0F6E56" : pct >= 45 ? "#854F0B" : "#A32D2D";
                    return (
                      <div key={x.id} onClick={() => setACandSel(x)} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 2fr 1.4fr 1fr 60px", padding: "12px 16px", borderBottom: idx < filtrados.length-1 ? "0.5px solid #f0f0f0" : "none", cursor: "pointer", alignItems: "center", background: "#fff" }}
                        onMouseEnter={e => e.currentTarget.style.background="#f9fbff"}
                        onMouseLeave={e => e.currentTarget.style.background="#fff"}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={s.av}>{ini(x.nombre)}</div>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{x.nombre}</span>
                        </div>
                        <span style={{ fontSize: 13, color: "#888" }}>{x.cedula}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{x.vacante_titulo || "—"}</div>
                          {vac && <div style={{ fontSize: 11, color: "#bbb" }}>{vac.area} · {vac.ciudad}</div>}
                        </div>
                        <div>{ea ? <span style={s.badge(ea)}>{ea.label}</span> : <span style={{ fontSize: 12, color: "#ccc" }}>Sin estado</span>}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {x.analizando ? <span style={{ fontSize: 12, color: "#bbb" }}>...</span>
                            : pct !== undefined ? <><span style={{ fontSize: 15, fontWeight: 700, color: pctColor }}>{pct}%</span><div style={{ width: 32, height: 5, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: pctColor, borderRadius: 4 }} /></div></>
                            : <span style={{ fontSize: 12, color: "#ccc" }}>—</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ color: "#ccc", fontSize: 18 }}>›</span>
                          <button onClick={async e => { e.stopPropagation(); if(window.confirm(`¿Eliminar a ${x.nombre}?`)) { await deleteCand(x.id); setCands(prev => prev.filter(c => c.id !== x.id)); } }} style={{ background: "transparent", border: "none", color: "#f0a0a0", fontSize: 16, cursor: "pointer", padding: "2px 4px" }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}