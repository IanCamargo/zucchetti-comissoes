import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ══════════════════════════════════════════════════════════════════
//  SUPABASE CLIENT
// ══════════════════════════════════════════════════════════════════
const SUPABASE_URL  = "https://mvggudtoehsfecbjlqpo.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Z2d1ZHRvZWhzZmVjYmpscXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjY1OTksImV4cCI6MjA4ODMwMjU5OX0.xyQESprExcUx_14WV9Su30oxJE6YqVbXfaE4DGCURFM";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

const FontLink = () => (
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
);

// ══════════════════════════════════════════════════════════════════
//  THEME TOKENS
// ══════════════════════════════════════════════════════════════════
const THEMES = {
  dark: {
    name:"dark",
    // Backgrounds — escalonados do mais escuro ao mais claro
    bg:"#07090f", bgCard:"#0d1117", bgPanel:"#121c2e", bgInput:"#1a2438",
    bgHover:"#1e2d42",
    // Bordas
    border:"#243448", borderAccent:"#2e4a6a",
    // Textos — contraste alto garantido
    text:"#f0f6ff",          // branco levemente azulado — texto principal
    textSub:"#94a3b8",       // cinza médio — texto secundário legível
    textMuted:"#546e8a",     // cinza azulado — labels, subtítulos (era muito escuro antes)
    // Accent colors
    accent:"#3b82f6", accentHover:"#60a5fa", accentGlow:"#3b82f625",
    green:"#10b981", greenGlow:"#10b98125",
    amber:"#f59e0b", amberGlow:"#f59e0b25",
    purple:"#a78bfa", purpleGlow:"#a78bfa25",
    red:"#f87171", cyan:"#22d3ee",
    // Sidebar / topbar
    sidebarBg:"#070d1a", sidebarBorder:"#1a2840", topbarBg:"#070d1a",
    // Tabelas
    tableHead:"#090f1c", tableRow:"#0d1117", tableRowAlt:"#111827",
  },
  light: {
    name:"light",
    // Backgrounds
    bg:"#eef2f7", bgCard:"#ffffff", bgPanel:"#f4f7fb", bgInput:"#edf1f7",
    bgHover:"#e0eaff",
    // Bordas
    border:"#d1dce8", borderAccent:"#93c5fd",
    // Textos — alto contraste no fundo branco
    text:"#0f172a",          // quase preto — texto principal
    textSub:"#334155",       // cinza escuro — texto secundário legível
    textMuted:"#64748b",     // cinza médio — labels (era #94a3b8, muito claro)
    // Accent colors mais escuros para contraste sobre fundo branco
    accent:"#1d4ed8", accentHover:"#1e40af", accentGlow:"#1d4ed815",
    green:"#047857", greenGlow:"#04785715",
    amber:"#b45309", amberGlow:"#b4530915",
    purple:"#6d28d9", purpleGlow:"#6d28d915",
    red:"#b91c1c", cyan:"#0369a1",
    // Sidebar / topbar
    sidebarBg:"#ffffff", sidebarBorder:"#d1dce8", topbarBg:"#ffffff",
    // Tabelas
    tableHead:"#f1f5f9", tableRow:"#ffffff", tableRowAlt:"#f8fafc",
  }
};

// ══════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════
function addMonths(mes, n) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
const ML = m => { const [y,mo]=m.split("-"); return ["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][+mo]+"/"+y; };
const R$ = v => (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

// Gera lista de meses (últimos 12 + próximos 3)
function getMesesList() {
  const now = new Date();
  const list = [];
  for (let i = 14; i >= -3; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
  }
  return list.reverse();
}
const MESES_LIST = getMesesList();

// ══════════════════════════════════════════════════════════════════
//  DEFAULTS
// ══════════════════════════════════════════════════════════════════
const PRODUTOS_DEFAULT = [
  { id:"mago_cloud",   nome:"Mago Cloud",   ativo:true, selecao_faixa:"auto", pct_mrr:70, sem_licenca:true,  so_impl:false,
    regras:[{id:"r1",label:"Faixa Premium",minHoras:60,minValorH:185,pctImpl:10},{id:"r2",label:"Faixa Padrão",minHoras:0,minValorH:0,pctImpl:3.5}]},
  { id:"mago_web",     nome:"Mago Web",     ativo:true, selecao_faixa:"auto", pct_mrr:70, sem_licenca:true,  so_impl:false,
    regras:[{id:"r1",label:"Faixa Premium",minHoras:60,minValorH:185,pctImpl:10},{id:"r2",label:"Faixa Padrão",minHoras:0,minValorH:0,pctImpl:3.5}]},
  { id:"mago4",        nome:"Mago 4",       ativo:true, selecao_faixa:"auto", pct_mrr:70, sem_licenca:false, so_impl:false,
    regras:[{id:"r1",label:"Faixa Premium",minHoras:60,minValorH:185,pctImpl:10},{id:"r2",label:"Faixa Padrão",minHoras:0,minValorH:0,pctImpl:3.5}]},
  { id:"debx",         nome:"Debx",         ativo:true, selecao_faixa:"auto", pct_mrr:70, sem_licenca:false, so_impl:false,
    regras:[{id:"r1",label:"Faixa Premium",minHoras:60,minValorH:185,pctImpl:10},{id:"r2",label:"Faixa Padrão",minHoras:0,minValorH:0,pctImpl:3.5}]},
  { id:"softa",        nome:"Softa",        ativo:true, selecao_faixa:"auto", pct_mrr:70, sem_licenca:false, so_impl:false,
    regras:[{id:"r1",label:"Faixa Premium",minHoras:60,minValorH:185,pctImpl:10},{id:"r2",label:"Faixa Padrão",minHoras:0,minValorH:0,pctImpl:3.5}]},
  { id:"horas_extras", nome:"Horas Extras", ativo:true, selecao_faixa:"auto", pct_mrr:0,  sem_licenca:true,  so_impl:true,
    regras:[{id:"r1",label:"Faixa Premium",minHoras:60,minValorH:185,pctImpl:10},{id:"r2",label:"Faixa Padrão",minHoras:0,minValorH:0,pctImpl:3.5}]},
];

const CARGO_LABEL  = { junior:"Júnior", pleno:"Pleno", senior:"Sênior" };
const CARGO_COLOR  = { junior:"#38bdf8", pleno:"#a78bfa", senior:"#fb923c" };
const ROLE_LABEL   = { consultor:"Consultor", gestor:"Gestor", parametros:"Configurações" };

// ══════════════════════════════════════════════════════════════════
//  LÓGICA DE CÁLCULO
// ══════════════════════════════════════════════════════════════════
function getPctMRR(atingPct) {
  if (atingPct >= 200) return 200;
  if (atingPct >= 150) return 100;
  return 70;
}
function getOverInfo(atingPct) {
  if (atingPct >= 200) return { label:"🚀 200%", color:"#f59e0b", bg:"#f59e0b22", border:"#f59e0b44" };
  if (atingPct >= 150) return { label:"⚡ 100%", color:"#34d399", bg:"#34d39922", border:"#34d39944" };
  return { label:"70%", color:"#38bdf8", bg:"#38bdf822", border:"#38bdf844" };
}

function normProd(p) {
  return {
    ...p,
    selecaoFaixa: p.selecao_faixa || p.selecaoFaixa || "auto",
    pctMRR:       p.pct_mrr  ?? p.pctMRR  ?? 70,
    semLicenca:   p.sem_licenca ?? p.semLicenca ?? false,
    soImpl:       p.so_impl  ?? p.soImpl   ?? false,
  };
}

function getFaixa(produto, horasImpl, valorHoraImpl, faixaIdManual) {
  const p = normProd(produto);
  if (p.selecaoFaixa === "manual" && faixaIdManual) {
    return p.regras.find(r => r.id === faixaIdManual) || p.regras[1];
  }
  const premium = p.regras[0];
  return (horasImpl >= premium.minHoras && valorHoraImpl >= premium.minValorH)
    ? premium : p.regras[1];
}

function calcVenda(venda, produtos, pctMRRover) {
  const prod = produtos.find(p => p.id === (venda.produtoId || venda.produto_id));
  if (!prod) return null;
  const p = normProd(prod);

  const horasImpl     = venda.horasImpl     || venda.horas_impl     || 0;
  const valorHoraImpl = venda.valorHoraImpl || venda.valor_hora_impl || 0;
  const mrr           = p.soImpl ? 0 : (venda.mrr || 0);
  const licenca       = (p.semLicenca || p.soImpl) ? 0 : (venda.licenca || 0);
  const faixaIdManual = venda.faixaIdManual || venda.faixa_id_manual || null;

  const faixa     = getFaixa(p, horasImpl, valorHoraImpl, faixaIdManual);
  const implTotal = horasImpl * valorHoraImpl;
  const nr        = implTotal + licenca;

  const pctMRR  = p.soImpl ? 0 : (pctMRRover ?? p.pctMRR);
  const comMRR  = mrr       * (pctMRR       / 100);
  const comImpl = implTotal * (faixa.pctImpl / 100);
  const comLic  = licenca   * (faixa.pctImpl / 100);
  const total   = comMRR + comImpl + comLic;
  const parcela = total / 2;

  const mesParcela1 = addMonths(venda.mes, 2);
  const mesParcela2 = addMonths(venda.mes, 3);
  const parcelas = [
    { tipo:"Parcela 1/2", valor:parcela, mesPagamento:mesParcela1, descricao:`${p.nome} / ${venda.cliente} — 1ª parcela` },
    { tipo:"Parcela 2/2", valor:parcela, mesPagamento:mesParcela2, descricao:`${p.nome} / ${venda.cliente} — 2ª parcela` },
  ].filter(px => px.valor > 0);

  return {
    faixa, implTotal, nr, mrr, licenca,
    comMRR, comImpl, comLic, total, parcela,
    pctMRR, mesParcela1, mesParcela2, parcelas,
    isPremium: faixa.id === "r1",
    horasImpl, valorHoraImpl,
    soImpl: p.soImpl, semLicenca: p.semLicenca,
  };
}

function buildCalendario(vendas, produtos, users) {
  const cal = {};
  vendas.forEach(v => {
    const user = users.find(u => u.id === (v.consultorId || v.consultor_id));
    const c = calcVenda(v, produtos);
    if (!c) return;
    c.parcelas.forEach(p => {
      if (!cal[p.mesPagamento]) cal[p.mesPagamento] = [];
      cal[p.mesPagamento].push({
        ...p,
        vendaId:v.id,
        consultorId: v.consultorId || v.consultor_id,
        nomeConsultor:user?.name||"–", cargo:user?.cargo,
        produtoId: v.produtoId || v.produto_id,
        cliente:v.cliente, mesVenda:v.mes,
      });
    });
  });
  return cal;
}

function calcMesConsultor(consultorId, mes, vendas, produtos, metas, users) {
  const user      = users.find(u => u.id === consultorId);
  const cargo     = user?.cargo || "junior";
  const metaMes   = metas[mes]?.[cargo] || { mrr:0, nr:0 };
  const vendasMes = vendas.filter(v => (v.consultorId||v.consultor_id) === consultorId && v.mes === mes);

  const totalMRR = vendasMes.reduce((s, v) => s + (v.mrr || 0), 0);
  const atingMRR = metaMes.mrr > 0 ? (totalMRR / metaMes.mrr) * 100 : 0;
  const pctMRR   = getPctMRR(atingMRR);
  const overInfo = getOverInfo(atingMRR);

  const totalNR  = vendasMes.reduce((s, v) => {
    const c = calcVenda(v, produtos, pctMRR);
    return s + (c?.nr || 0);
  }, 0);
  const atingNR  = metaMes.nr > 0 ? (totalNR / metaMes.nr) * 100 : 0;

  const vendasCalc = vendasMes.map(v => {
    const c = calcVenda(v, produtos, pctMRR);
    return c ? { ...v, ...c, produtoId: v.produtoId||v.produto_id, consultorId: v.consultorId||v.consultor_id } : null;
  }).filter(Boolean);

  const totalCom = vendasCalc.reduce((s, v) => s + v.total, 0);

  return {
    cargo, metaMRR:metaMes.mrr, metaNR:metaMes.nr,
    totalMRR, totalNR, atingMRR, atingNR,
    pctMRR, overInfo, vendasCalc, totalCom,
  };
}

// ══════════════════════════════════════════════════════════════════
//  LÓGICA TRIMESTRAL
// ══════════════════════════════════════════════════════════════════

// Retorna o trimestre ao qual o mês pertence
// Ex: "2025-01" → { label:"Q1/2025", meses:["2025-01","2025-02","2025-03"], mesAcerto:"2025-04", parc1:"2025-05", parc2:"2025-06" }
function getTrimestre(mes) {
  const [y, m] = mes.split("-").map(Number);
  const q = Math.ceil(m / 3); // 1,2,3 ou 4
  const m1 = (q - 1) * 3 + 1;
  const pad = n => String(n).padStart(2, "0");
  const meses = [
    `${y}-${pad(m1)}`,
    `${y}-${pad(m1+1)}`,
    `${y}-${pad(m1+2)}`,
  ];
  const mesAcerto = `${y}-${pad(m1+3 > 12 ? m1+3-12 : m1+3)}`.replace(/(\d{4})-(\d{2})/, (_, yr, mo) => {
    const mo2 = m1 + 3;
    return mo2 > 12 ? `${+y+1}-${pad(mo2-12)}` : `${y}-${pad(mo2)}`;
  });
  const parc1Num = m1 + 4;
  const parc2Num = m1 + 5;
  const parc1 = parc1Num > 12 ? `${+y+1}-${pad(parc1Num-12)}` : `${y}-${pad(parc1Num)}`;
  const parc2 = parc2Num > 12 ? `${+y+1}-${pad(parc2Num-12)}` : `${y}-${pad(parc2Num)}`;
  return { q, label:`Q${q}/${y}`, meses, mesAcerto, parc1, parc2 };
}

// Calcula o trimestre completo de um consultor
function calcTrimestreConsultor(consultorId, mes, vendas, produtos, metas, users) {
  const trim = getTrimestre(mes);
  const user = users.find(u => u.id === consultorId);
  const cargo = user?.cargo || "junior";

  // Meta trimestral = soma das metas mensais dos 3 meses
  const metaTrimMRR = trim.meses.reduce((s, m) => s + (metas[m]?.[cargo]?.mrr || 0), 0);
  const metaTrimNR  = trim.meses.reduce((s, m) => s + (metas[m]?.[cargo]?.nr  || 0), 0);

  // MRR e NR vendidos no trimestre
  const vendasTrim = vendas.filter(v => (v.consultorId||v.consultor_id) === consultorId && trim.meses.includes(v.mes));
  const totalMRRTrim = vendasTrim.reduce((s, v) => s + (v.mrr || 0), 0);
  const atingMRRTrim = metaTrimMRR > 0 ? (totalMRRTrim / metaTrimMRR) * 100 : 0;
  const pctMRRTrim   = getPctMRR(atingMRRTrim);
  const overInfoTrim = getOverInfo(atingMRRTrim);

  // NR total no trimestre
  const totalNRTrim = vendasTrim.reduce((s, v) => {
    const c = calcVenda(v, produtos, pctMRRTrim);
    return s + (c?.nr || 0);
  }, 0);
  const atingNRTrim = metaTrimNR > 0 ? (totalNRTrim / metaTrimNR) * 100 : 0;

  // Acerto: diferença entre o que deveria ter recebido (pctMRRTrim) e o que JÁ foi pago (70%)
  // Só existe acerto se houve overperformance (pctMRRTrim > 70)
  const pctJaPago   = 70; // base sempre pago mensalmente
  const pctAcerto   = Math.max(0, pctMRRTrim - pctJaPago);
  const valorAcerto = totalMRRTrim * (pctAcerto / 100);
  const parcelaAcerto = valorAcerto / 2;

  // Progresso mensal dentro do trimestre (para o gráfico de evolução)
  const evolucao = trim.meses.map(m => {
    const v = vendas.filter(vv => (vv.consultorId||vv.consultor_id) === consultorId && vv.mes === m)
      .reduce((s, vv) => s + (vv.mrr || 0), 0);
    return { mes: m, mrr: v, metaMRR: metas[m]?.[cargo]?.mrr || 0 };
  });

  // Quanto falta para o próximo nível
  const faltaP1 = metaTrimMRR > 0 ? Math.max(0, metaTrimMRR * 1.5 - totalMRRTrim) : 0;
  const faltaP2 = metaTrimMRR > 0 ? Math.max(0, metaTrimMRR * 2.0 - totalMRRTrim) : 0;

  return {
    trim, cargo,
    metaTrimMRR, metaTrimNR,
    totalMRRTrim, totalNRTrim,
    atingMRRTrim, atingNRTrim,
    pctMRRTrim, overInfoTrim,
    pctAcerto, valorAcerto, parcelaAcerto,
    evolucao, faltaP1, faltaP2,
    vendasTrim,
  };
}

// ══════════════════════════════════════════════════════════════════
//  GLOBAL CSS
// ══════════════════════════════════════════════════════════════════
const GlobalCSS = ({t}) => (
  <style>{`
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
    @keyframes glow { 0%,100% { box-shadow:0 0 8px ${t.accent}44; } 50% { box-shadow:0 0 20px ${t.accent}88; } }
    *, *::before, *::after { box-sizing:border-box; }
    html { -webkit-text-size-adjust:100%; touch-action:manipulation; overflow-x:hidden; max-width:100vw; }
    body { margin:0; background:${t.bg}; font-family:'Outfit',sans-serif; color:${t.text}; overflow-x:hidden; max-width:100vw; }
    ::-webkit-scrollbar { width:4px; height:4px; }
    ::-webkit-scrollbar-track { background:${t.bgCard}; }
    ::-webkit-scrollbar-thumb { background:${t.border}; border-radius:99px; }
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
    input::placeholder { color:${t.textMuted}; }
    select option { background:${t.bgCard}; color:${t.text}; }
    .nav-item { transition: all .18s cubic-bezier(.4,0,.2,1) !important; }
    .nav-item:hover { background:${t.bgHover} !important; color:${t.accentHover} !important; transform:translateX(2px); }
    .nav-item.active { background:${t.accentGlow} !important; color:${t.accent} !important; }
    .card-hover { transition: all .2s cubic-bezier(.4,0,.2,1); }
    .card-hover:hover { transform:translateY(-2px); box-shadow:0 12px 40px ${t.accent}18; }
    .btn-primary { transition: all .15s cubic-bezier(.4,0,.2,1); }
    .btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px ${t.accent}44; }
    .btn-primary:active:not(:disabled) { transform:translateY(0); }
    .fade-in { animation: fadeIn .3s ease forwards; }
    .slide-in { animation: slideIn .25s ease forwards; }
    table tr { transition: background .12s; }
    table tbody tr:hover { background: ${t.bgHover} !important; }
    .table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }

    /* ── LAYOUT ── */
    .sidebar-wrap {
      width:220px; background:${t.sidebarBg};
      border-right:1px solid ${t.sidebarBorder};
      display:flex; flex-direction:column;
      position:fixed; top:0; bottom:0; left:0; z-index:40;
      transition:transform .28s cubic-bezier(.4,0,.2,1);
      overflow-y:auto;
    }
    .main-wrap { margin-left:220px; min-height:100vh; display:flex; flex-direction:column; overflow-x:hidden; }
    .page-content { padding:28px 32px 60px; flex:1; width:100%; min-width:0; overflow-x:hidden; }
    .topbar-mobile-row { display:none; }
    .sidebar-close-btn { display:none !important; }
    .drawer-overlay { display:none; position:fixed; inset:0; background:#00000088; z-index:39; backdrop-filter:blur(2px); }
    .period-bar-wrap { display:flex; align-items:center; min-height:50px; padding:0 14px; overflow-x:auto; }

    /* ── GRIDS ── */
    .stat-grid   { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    .stat-grid-5 { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
    .mini-grid   { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:10px; }
    .form-grid   { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; }

    /* ── CARDS DE CONSULTOR NO DASHBOARD ── */
    .dash-card-body    { display:grid; grid-template-columns:1fr 1fr; gap:16px; padding:14px 20px; }
    .dash-trim-body    { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .params-grid       { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    .metas-grid        { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
    .equipe-grid       { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
    .cal-grid          { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
    .preview-parcelas  { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
    .usuarios-form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; align-items:end; }

    /* ── BOTTOM NAV ── */
    .mobile-bottom-nav { display:none; }

    /* ══ TABLET ≤ 1024px ══ */
    @media (max-width:1024px) {
      .stat-grid   { grid-template-columns:repeat(2,1fr); }
      .stat-grid-5 { grid-template-columns:repeat(3,1fr); }
      .params-grid { grid-template-columns:1fr; }
      .metas-grid  { grid-template-columns:repeat(3,1fr); }
    }

    /* ══ MOBILE ≤ 768px ══ */
    @media (max-width:768px) {
      .sidebar-wrap { transform:translateX(-100%); width:265px; }
      .sidebar-wrap.open { transform:translateX(0); box-shadow:6px 0 40px rgba(0,0,0,.55); }
      .drawer-overlay.open { display:block; }
      .sidebar-close-btn { display:flex !important; }
      .main-wrap { margin-left:0 !important; width:100vw; max-width:100vw; overflow-x:hidden; }
      .topbar-mobile-row { display:flex; }
      .page-content { padding:14px 12px 88px; width:100%; max-width:100vw; overflow-x:hidden; }
      .stat-grid   { grid-template-columns:repeat(2,1fr); gap:10px; }
      .stat-grid-5 { grid-template-columns:repeat(2,1fr); gap:10px; }
      .mini-grid   { grid-template-columns:repeat(2,1fr); }
      .form-grid   { grid-template-columns:1fr; }
      .period-bar-wrap { padding:6px 10px; flex-wrap:wrap; gap:4px; min-height:auto; }

      /* ── Contenção de overflow: Dashboard, Vendas, Histórico ── */
      .main-wrap > main { width:100%; max-width:100vw; overflow-x:hidden; }
      .page-content > div { max-width:100%; }
      .table-scroll { max-width:calc(100vw - 24px); }

      /* ── Dash card containers ── */
      .dash-header-card > div:first-child { max-width:100%; overflow:hidden; }
      .dash-header-card .cargo-badges { flex-wrap:wrap; }

      /* ── Vendas: preview da comissão ── */
      .preview-comissao { max-width:100%; }

      /* ── Histórico: header mês ── */
      .hist-header { min-width:0; }

      /* ── Legenda overperformance ── */
      .over-legend { max-width:100%; overflow:hidden; }

      /* Impede qualquer elemento filho de alargar além da viewport */
      .page-content * { max-width:100%; }
      .page-content input,
      .page-content select { max-width:100% !important; }
      .dash-card-body  { grid-template-columns:1fr; gap:10px; padding:12px 14px; }
      .dash-trim-body  { grid-template-columns:1fr; gap:10px; }
      .dash-header-card { flex-direction:column !important; align-items:flex-start !important; gap:8px !important; }
      .dash-header-value { text-align:left !important; }

      /* ── Parâmetros mobile ── */
      .params-grid   { grid-template-columns:1fr; gap:12px; }
      .metas-grid    { grid-template-columns:1fr; gap:10px; }
      .regras-grid   { grid-template-columns:1fr !important; }

      /* ── Equipe mobile ── */
      .equipe-grid   { grid-template-columns:1fr; }

      /* ── Calendário mobile ── */
      .cal-grid      { grid-template-columns:1fr 1fr; gap:8px; }

      /* ── Relatório mobile ── */
      .rel-filtros   { flex-direction:column !important; align-items:stretch !important; gap:8px !important; }
      .rel-tipo-btns { flex-wrap:wrap; gap:4px; }

      /* ── Preview parcelas mobile ── */
      .preview-parcelas { flex-direction:column; align-items:stretch; }
      .preview-parcelas > div { text-align:left !important; }

      /* ── Usuários mobile ── */
      .usuarios-form-grid { grid-template-columns:1fr; }

      /* ── Histórico cabeçalho mobile ── */
      .hist-header  { flex-direction:column !important; align-items:flex-start !important; gap:6px !important; }

      .mobile-bottom-nav {
        display:flex !important;
        position:fixed; bottom:0; left:0; right:0;
        background:${t.sidebarBg};
        border-top:1px solid ${t.sidebarBorder};
        z-index:30;
        padding:5px 0 max(env(safe-area-inset-bottom,0px),5px);
        justify-content:space-around; align-items:center;
      }
      .mobile-bottom-nav button {
        flex:1; display:flex; flex-direction:column;
        align-items:center; gap:2px; padding:4px 2px;
        background:transparent; border:none; cursor:pointer;
        color:${t.textMuted}; font-size:9px; font-weight:600;
        font-family:'Outfit',sans-serif; transition:color .15s;
        max-width:70px;
      }
      .mobile-bottom-nav button.active { color:${t.accent}; }
      .mobile-bottom-nav button.active svg { filter:drop-shadow(0 0 4px ${t.accent}88); }

      /* ── Títulos menores ── */
      h1 { font-size:20px !important; margin-bottom:14px !important; }
      .stat-card-val { font-size:18px !important; }

      /* ── Legenda overperformance ── */
      .over-legend { flex-direction:column !important; align-items:flex-start !important; gap:6px !important; }
      .over-legend span { font-size:10px !important; }
    }

    /* ══ SMALL ≤ 480px ══ */
    @media (max-width:480px) {
      .stat-grid   { grid-template-columns:1fr 1fr; gap:8px; }
      .stat-grid-5 { grid-template-columns:1fr 1fr; gap:8px; }
      .page-content { padding:10px 8px 88px; }
      .cal-grid    { grid-template-columns:1fr; }
      .meses-meta-btns { display:grid !important; grid-template-columns:repeat(4,1fr); gap:4px; }
      .produtos-tabs { display:grid !important; grid-template-columns:repeat(3,1fr); gap:4px; }
      .rel-stat-grid { grid-template-columns:1fr 1fr !important; }
    }
  `}</style>
);

// ══════════════════════════════════════════════════════════════════
//  MICRO UI — themed
// ══════════════════════════════════════════════════════════════════
const inp = t => ({
  width:"100%", background:t.bgInput, border:`1px solid ${t.border}`,
  borderRadius:10, padding:"10px 14px", color:t.text, fontSize:14,
  outline:"none", fontFamily:"'Outfit',sans-serif", transition:"border .15s",
});
const selS = t => ({ ...inp(t), cursor:"pointer" });

const Label = ({children,t}) => (
  <label style={{fontSize:10,color:t.textMuted,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:.8}}>
    {children}
  </label>
);

const TH = ({children,right,t}) => (
  <th style={{padding:"11px 16px",textAlign:right?"right":"left",fontSize:10,color:t.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:.6,whiteSpace:"nowrap",background:t.tableHead,borderBottom:`1px solid ${t.border}`}}>
    {children}
  </th>
);

const TD = ({children,right,bold,color,sub,t}) => (
  <td style={{padding:"12px 16px",fontSize:13,color:color||t.textSub,fontWeight:bold?700:400,textAlign:right?"right":"left",verticalAlign:"top",borderBottom:`1px solid ${t.border}22`}}>
    {children}
    {sub&&<div style={{fontSize:10,color:t.textMuted,marginTop:2}}>{sub}</div>}
  </td>
);

const Empty = ({msg,t}) => (
  <div style={{padding:48,textAlign:"center",color:t.textMuted,fontSize:14}}>
    <div style={{fontSize:32,marginBottom:12}}>📭</div>
    {msg||"Nenhum registro encontrado."}
  </div>
);

const STitle = ({children,t}) => (
  <h1 style={{fontFamily:"'Outfit',sans-serif",fontSize:24,fontWeight:800,color:t.text,margin:"0 0 20px",letterSpacing:"-0.5px",lineHeight:1.2}}>
    {children}
  </h1>
);

const StatCard = ({l,v,c,icon,sub,t}) => (
  <div className="card-hover" style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:16,padding:"20px 22px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,right:0,width:80,height:80,background:`radial-gradient(circle at top right,${c}18,transparent 70%)`,borderRadius:"0 16px 0 0"}}/>
    <div style={{fontSize:10,color:t.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
      {icon&&<span style={{fontSize:14}}>{icon}</span>}{l}
    </div>
    <div style={{fontSize:22,fontWeight:800,color:c,fontFamily:"'Outfit',sans-serif",letterSpacing:"-0.5px"}}>{v}</div>
    {sub&&<div style={{fontSize:11,color:t.textMuted,marginTop:4}}>{sub}</div>}
  </div>
);

const MiniCard = ({l,v,c,t}) => (
  <div style={{background:t.bgPanel,borderRadius:10,padding:"10px 14px",border:`1px solid ${t.border}`}}>
    <div style={{fontSize:10,color:t.textMuted,marginBottom:4,fontWeight:600}}>{l}</div>
    <div style={{fontSize:14,fontWeight:700,color:c||t.text}}>{v}</div>
  </div>
);

const Btn = ({children,onClick,secondary,sm,disabled,t,color}) => {
  const bg = disabled ? t.bgPanel : secondary ? t.bgPanel : (color||t.accent);
  const fg = disabled ? t.textMuted : secondary ? t.textSub : "#fff";
  const brd = secondary ? `1px solid ${t.border}` : "none";
  return (
    <button onClick={onClick} disabled={disabled} className="btn-primary"
      style={{display:"flex",alignItems:"center",gap:7,padding:sm?"6px 12px":"10px 18px",
        background:bg,color:fg,border:brd,borderRadius:10,fontSize:sm?12:13,fontWeight:700,
        cursor:disabled?"not-allowed":"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif",
        opacity:disabled?.5:1}}>
      {children}
    </button>
  );
};

const IBtn = ({children,onClick,color,t}) => (
  <button onClick={onClick}
    style={{background:color+"15",color,border:`1px solid ${color}30`,borderRadius:8,
      padding:"6px 9px",cursor:"pointer",display:"flex",alignItems:"center",transition:"all .15s"}}
    onMouseEnter={e=>{e.currentTarget.style.background=color+"30";}}
    onMouseLeave={e=>{e.currentTarget.style.background=color+"15";}}>
    {children}
  </button>
);

const FaixaBadge = ({faixa,t}) => {
  if (!faixa) return null;
  const ok = faixa.id==="r1";
  return (
    <span style={{background:ok?`#f59e0b18`:`${t.border}44`,color:ok?"#f59e0b":t.textMuted,
      padding:"2px 10px",borderRadius:99,fontSize:11,fontWeight:700,
      border:ok?"1px solid #f59e0b33":`1px solid ${t.border}`,whiteSpace:"nowrap"}}>
      {ok?"⭐ ":""}{faixa.label}
    </span>
  );
};

const Badge = ({children,color,t}) => (
  <span style={{background:`${color}18`,color,border:`1px solid ${color}30`,
    padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>
    {children}
  </span>
);

const Spinner = ({size=20,color}) => (
  <div style={{width:size,height:size,border:`2px solid ${color||"#ffffff30"}`,
    borderTop:`2px solid ${color||"#ffffff"}`,borderRadius:"50%",animation:"spin 0.7s linear infinite",flexShrink:0}}/>
);

const ProgressBar = ({value,max,color,height=8,t}) => {
  const pct = max>0?Math.min((value/max)*100,100):0;
  return (
    <div style={{height,background:t.bgInput,borderRadius:99,overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",inset:0,width:`${pct}%`,background:`linear-gradient(90deg,${color},${color}cc)`,borderRadius:99,transition:"width .6s cubic-bezier(.4,0,.2,1)"}}/>
    </div>
  );
};

const OverBar = ({ating,t}) => {
  const color = ating>=200?t.amber:ating>=150?t.green:t.accent;
  const pct   = Math.min(ating,220)/220*100;
  return (
    <div>
      <div style={{position:"relative",height:10,background:t.bgInput,borderRadius:99,overflow:"hidden",marginBottom:4}}>
        <div style={{position:"absolute",left:"68.2%",top:0,bottom:0,width:1,background:t.accent+"55",zIndex:1}}/>
        <div style={{position:"absolute",left:"90.9%",top:0,bottom:0,width:1,background:t.green+"55",zIndex:1}}/>
        <div style={{position:"absolute",inset:0,width:`${pct}%`,background:`linear-gradient(90deg,${color}aa,${color})`,borderRadius:99,transition:"width .6s cubic-bezier(.4,0,.2,1)"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:t.textMuted}}>
        <span>0%</span>
        <span style={{color:t.accent}}>150%</span>
        <span style={{color:t.green}}>200%</span>
      </div>
      <div style={{fontSize:11,color,fontWeight:700,marginTop:2}}>{ating.toFixed(1)}% da meta</div>
    </div>
  );
};

const Ic = ({n,s=18}) => {
  const d={
    dash:  "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    sales: "M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
    team:  "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    cal:   "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
    params:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    users: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    logout:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
    hist:  "M12 8v4l3 3 M3.05 11a9 9 0 1 0 .5-4.5 M3 3v5h5",
    prod:  "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01",
    edit:  "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    trash: "M3 6h18 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6 M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
    check: "M20 6L9 17l-5-5",
    lock:  "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4",
    plus:  "M12 5v14 M5 12h14",
    dl:    "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
    arrow: "M5 12h14 M12 5l7 7-7 7",
    db:    "M12 2C6.48 2 2 4.24 2 7s4.48 5 10 5 10-2.24 10-5-4.48-5-10-5z M2 7v5c0 2.76 4.48 5 10 5s10-2.24 10-5V7 M2 12v5c0 2.76 4.48 5 10 5s10-2.24 10-5v-5",
    cloud: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z",
    sun:   "M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 6a6 6 0 0 0 0 12 6 6 0 0 0 0-12z",
    moon:  "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
    menu:  "M3 12h18 M3 6h18 M3 18h18",
    x:     "M18 6L6 18 M6 6l12 12",
    chart: "M18 20V10 M12 20V4 M6 20v-6",
    trophy:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2z",
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d[n]||d.arrow}/></svg>;
};

// ══════════════════════════════════════════════════════════════════
//  HOOK: useSupabase — carrega e sincroniza todos os dados
// ══════════════════════════════════════════════════════════════════
function useSupabase(session) {
  const [users,    setUsers]    = useState([]);
  const [produtos, setProdutosRaw] = useState([]);
  const [vendas,   setVendasRaw]   = useState([]);
  const [metas,    setMetasRaw]    = useState({});
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState(false);

  const uid = session?.user?.id;

  // ── Carrega tudo após login ──────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [pRes, vRes, mRes, uRes] = await Promise.all([
        sb.from("produtos").select("*").order("nome"),
        sb.from("vendas").select("*").order("created_at", { ascending:false }),
        sb.from("metas").select("*"),
        sb.from("profiles").select("*"),
      ]);

      // Produtos: seed automático se vazio
      if (!pRes.data?.length) {
        await sb.from("produtos").upsert(PRODUTOS_DEFAULT);
        setProdutosRaw(PRODUTOS_DEFAULT);
      } else {
        setProdutosRaw(pRes.data);
      }

      // Vendas — normaliza campo produto_id → produtoId
      setVendasRaw((vRes.data || []).map(v => ({
        ...v,
        consultorId: v.consultor_id,
        produtoId:   v.produto_id,
        horasImpl:   v.horas_impl,
        valorHoraImpl: v.valor_hora_impl,
        faixaIdManual: v.faixa_id_manual,
      })));

      // Metas: transforma array em objeto { "2025-01": { junior:{...}, ... } }
      const metaObj = {};
      (mRes.data || []).forEach(m => {
        if (!metaObj[m.mes]) metaObj[m.mes] = {};
        metaObj[m.mes][m.cargo] = { mrr: m.mrr, nr: m.nr };
      });
      setMetasRaw(metaObj);

      setUsers(uRes.data || []);
    } catch(e) {
      console.error("loadAll error", e);
    }
    setLoading(false);
  }, [uid]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Wrappers com sync para Supabase ─────────────────────────

  const setProdutos = useCallback(async (updater) => {
    setProdutosRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // Upsert assíncrono
      sb.from("produtos").upsert(next).then(({error}) => { if(error) console.error(error); });
      return next;
    });
  }, []);

  const addVenda = useCallback(async (entry) => {
    setSyncing(true);
    const row = {
      consultor_id:   entry.consultorId,
      mes:            entry.mes,
      produto_id:     entry.produtoId,
      cliente:        entry.cliente,
      mrr:            entry.mrr,
      horas_impl:     entry.horasImpl,
      valor_hora_impl: entry.valorHoraImpl,
      licenca:        entry.licenca,
      faixa_id_manual: entry.faixaIdManual || null,
      obs:            entry.obs || null,
    };
    const { data, error } = await sb.from("vendas").insert(row).select().single();
    setSyncing(false);
    if (error) return { error };
    const norm = { ...data, consultorId:data.consultor_id, produtoId:data.produto_id, horasImpl:data.horas_impl, valorHoraImpl:data.valor_hora_impl, faixaIdManual:data.faixa_id_manual };
    setVendasRaw(p => [norm, ...p]);
    return { data: norm };
  }, []);

  const updateVenda = useCallback(async (id, entry) => {
    setSyncing(true);
    const row = {
      consultor_id:   entry.consultorId,
      mes:            entry.mes,
      produto_id:     entry.produtoId,
      cliente:        entry.cliente,
      mrr:            entry.mrr,
      horas_impl:     entry.horasImpl,
      valor_hora_impl: entry.valorHoraImpl,
      licenca:        entry.licenca,
      faixa_id_manual: entry.faixaIdManual || null,
      obs:            entry.obs || null,
    };
    const { error } = await sb.from("vendas").update(row).eq("id", id);
    setSyncing(false);
    if (error) return { error };
    const norm = { id, ...entry };
    setVendasRaw(p => p.map(v => v.id === id ? { ...v, ...norm } : v));
    return { data: norm };
  }, []);

  const deleteVenda = useCallback(async (id) => {
    setSyncing(true);
    const { error } = await sb.from("vendas").delete().eq("id", id);
    setSyncing(false);
    if (!error) setVendasRaw(p => p.filter(v => v.id !== id));
    return { error };
  }, []);

  const saveMetas = useCallback(async (metaObj) => {
    setSyncing(true);
    // Transforma objeto em array de rows
    const rows = [];
    Object.entries(metaObj).forEach(([mes, cargos]) => {
      Object.entries(cargos).forEach(([cargo, vals]) => {
        rows.push({ mes, cargo, mrr: vals.mrr, nr: vals.nr });
      });
    });
    const { error } = await sb.from("metas").upsert(rows, { onConflict:"mes,cargo" });
    setSyncing(false);
    if (!error) setMetasRaw(metaObj);
    return { error };
  }, []);

  const createUserProfile = useCallback(async (form) => {
    setSyncing(true);
    // Cria conta de auth via Supabase
    const { data: authData, error: authErr } = await sb.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } }
    });
    if (authErr) { setSyncing(false); return { error: authErr }; }

    const profile = {
      id:     authData.user.id,
      name:   form.name,
      role:   form.role,
      cargo:  form.cargo || null,
      active: true,
    };
    const { error: pErr } = await sb.from("profiles").upsert(profile);
    setSyncing(false);
    if (pErr) return { error: pErr };
    setUsers(prev => [...prev, profile]);
    return { data: profile };
  }, []);

  const updateProfile = useCallback(async (id, fields) => {
    setSyncing(true);
    const { error } = await sb.from("profiles").update(fields).eq("id", id);
    setSyncing(false);
    if (!error) setUsers(prev => prev.map(u => u.id === id ? {...u, ...fields} : u));
    return { error };
  }, []);

  return {
    users, setUsers,
    produtos, setProdutos,
    vendas, addVenda, updateVenda, deleteVenda,
    metas, saveMetas,
    loading, syncing,
    reload: loadAll,
    createUserProfile, updateProfile,
  };
}

// ══════════════════════════════════════════════════════════════════
//  APP ROOT
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [session, setSession] = useState(undefined);
  const [page,    setPage]    = useState("dash");
  const [mes,     setMes]     = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  });
  const [toast,   setToast]   = useState(null);
  const [themeName, setThemeName] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = THEMES[themeName];

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const notify = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null), 3400); };
  const db = useSupabase(session);

  if (session === undefined) return (
    <div style={{minHeight:"100vh",background:THEMES.dark.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <FontLink/><Spinner size={32} color="#3b82f6"/>
      <div style={{color:t.textSub,fontSize:13,fontFamily:"'Outfit',sans-serif"}}>Conectando…</div>
    </div>
  );

  if (!session) return <Login notify={notify} toast={toast} t={t} themeName={themeName} setThemeName={setThemeName}/>;

  if (db.loading) return (
    <div style={{minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <FontLink/><GlobalCSS t={t}/><Spinner size={32} color={t.accent}/>
      <div style={{color:t.textMuted,fontSize:13,fontFamily:"'Outfit',sans-serif"}}>Carregando dados…</div>
    </div>
  );

  const me = db.users.find(u => u.id === session.user.id) || {
    id: session.user.id, name: session.user.user_metadata?.name || session.user.email,
    role: "consultor", cargo: "junior", active: true,
  };
  const role = me.role;

  const nav=[
    {id:"dash",      label:"Dashboard",  icon:"dash",   roles:["consultor","gestor","parametros"]},
    {id:"vendas",    label:"Vendas",     icon:"sales",  roles:["consultor","gestor","parametros"]},
    {id:"equipe",    label:"Equipe",     icon:"team",   roles:["gestor","parametros"]},
    {id:"cal",       label:"Calendário", icon:"cal",    roles:["consultor","gestor","parametros"]},
    {id:"hist",      label:"Histórico",  icon:"hist",   roles:["consultor","gestor","parametros"]},
    {id:"relatorio", label:"Relatórios", icon:"dl",     roles:["consultor","gestor","parametros"]},
    {id:"params",    label:"Parâmetros", icon:"params", roles:["parametros"]},
    {id:"prod",      label:"Produtos",   icon:"prod",   roles:["parametros"]},
    {id:"users",     label:"Usuários",   icon:"users",  roles:["gestor","parametros"]},
  ].filter(n=>n.roles.includes(role));

  const logout = async () => { await sb.auth.signOut(); setSession(null); };

  const CARGO_GRADIENT = {
    junior: `linear-gradient(135deg,${t.accent},${t.cyan})`,
    pleno:  `linear-gradient(135deg,${t.purple},${t.accent})`,
    senior: `linear-gradient(135deg,${t.amber},${t.red})`,
  };

  // Sidebar content
  const SidebarContent = () => (
    <>
      {/* Logo + close button (mobile) */}
      <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${t.sidebarBorder}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:22,fontWeight:900,letterSpacing:"-1px",lineHeight:1}}>
            <span style={{background:`linear-gradient(135deg,${t.accent},${t.cyan})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Z</span>
            <span style={{color:t.text}}>ucchetti</span>
          </div>
          <button onClick={()=>setSidebarOpen(false)}
            style={{background:"transparent",border:`1px solid ${t.border}`,borderRadius:8,cursor:"pointer",color:t.textMuted,padding:"4px 6px",display:"flex",lineHeight:1}}>
            <Ic n="x" s={14}/>
          </button>
        </div>
        <div style={{fontSize:9,color:t.textMuted,textTransform:"uppercase",letterSpacing:3,fontWeight:600}}>Comissionamento</div>
        <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:t.green,boxShadow:`0 0 6px ${t.green}`}}/>
          <span style={{fontSize:10,color:t.textMuted}}>Online</span>
          {db.syncing&&<Spinner size={10} color={t.accent}/>}
        </div>
      </div>

      {/* Nav */}
      <nav style={{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:2}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>{setPage(n.id);setSidebarOpen(false);}}
            className={`nav-item${page===n.id?" active":""}`}
            style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,
              background:page===n.id?t.accentGlow:"transparent",
              color:page===n.id?t.accent:t.textMuted,
              border:"none",cursor:"pointer",fontSize:13,fontWeight:page===n.id?700:500,
              textAlign:"left",width:"100%",position:"relative"}}>
            {page===n.id&&<div style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:3,background:t.accent,borderRadius:"0 4px 4px 0"}}/>}
            <Ic n={n.icon} s={15}/>{n.label}
          </button>
        ))}
      </nav>

      {/* User + controls */}
      <div style={{padding:"12px 10px",borderTop:`1px solid ${t.sidebarBorder}`}}>
        {/* Theme toggle */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",marginBottom:6}}>
          <span style={{fontSize:11,color:t.textMuted,fontWeight:600}}>Tema</span>
          <button onClick={()=>setThemeName(n=>n==="dark"?"light":"dark")}
            style={{display:"flex",alignItems:"center",gap:6,background:t.bgPanel,border:`1px solid ${t.border}`,borderRadius:20,padding:"4px 10px",cursor:"pointer",color:t.text,fontSize:11,fontWeight:600}}>
            <Ic n={themeName==="dark"?"sun":"moon"} s={12}/>
            {themeName==="dark"?"Claro":"Escuro"}
          </button>
        </div>
        {/* User info */}
        <div style={{padding:"10px 12px",background:t.bgPanel,borderRadius:10,marginBottom:6,border:`1px solid ${t.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:CARGO_GRADIENT[me.cargo]||`linear-gradient(135deg,${t.accent},${t.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>
              {me.name?.[0]?.toUpperCase()||"?"}
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{me.name?.split(" ")[0]}</div>
              <div style={{fontSize:10,color:t.textMuted}}>{ROLE_LABEL[role]}{me.cargo?` · ${CARGO_LABEL[me.cargo]}`:""}</div>
            </div>
          </div>
        </div>
        <button onClick={logout}
          style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,
            background:"transparent",color:t.red,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,width:"100%",transition:"all .15s"}}
          onMouseEnter={e=>e.currentTarget.style.background=t.red+"15"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <Ic n="logout" s={13}/> Sair
        </button>
      </div>
    </>
  );

  return (
    <div style={{minHeight:"100vh",background:t.bg,color:t.text,fontFamily:"'Outfit',sans-serif",display:"flex",width:"100%",maxWidth:"100vw",overflowX:"hidden"}}>
      <FontLink/>
      <GlobalCSS t={t}/>

      {/* TOAST */}
      {toast&&(
        <div className="fade-in" style={{position:"fixed",top:20,right:20,zIndex:9999,
          background:toast.type==="ok"?t.green:t.red,color:"#fff",
          padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:600,
          display:"flex",alignItems:"center",gap:8,boxShadow:"0 8px 32px rgba(0,0,0,.3)",maxWidth:"calc(100vw - 40px)"}}>
          <Ic n="check" s={14}/>{toast.msg}
        </div>
      )}

      {/* OVERLAY (mobile drawer) */}
      <div className={`drawer-overlay${sidebarOpen?" open":""}`} onClick={()=>setSidebarOpen(false)}/>

      {/* SIDEBAR */}
      <aside className={`sidebar-wrap${sidebarOpen?" open":""}`}>
        <SidebarContent/>
      </aside>

      {/* MAIN */}
      <main className="main-wrap" style={{minWidth:0,overflow:"hidden"}}>

        {/* TOPBAR */}
        <div style={{background:t.topbarBg,borderBottom:`1px solid ${t.sidebarBorder}`,position:"sticky",top:0,zIndex:10}}>
          {/* Mobile top row */}
          <div className="topbar-mobile-row"
            style={{padding:"10px 16px",alignItems:"center",gap:12,borderBottom:`1px solid ${t.border}`}}>
            <button onClick={()=>setSidebarOpen(true)}
              style={{background:"transparent",border:"none",cursor:"pointer",color:t.textSub,padding:4,display:"flex"}}>
              <Ic n="menu" s={22}/>
            </button>
            <span style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:20,color:t.text,flex:1,letterSpacing:"-0.5px"}}>
              <span style={{color:t.accent}}>Z</span>ucchetti
            </span>
            <button onClick={()=>setThemeName(n=>n==="dark"?"light":"dark")}
              style={{background:t.bgPanel,border:`1px solid ${t.border}`,borderRadius:20,padding:"5px 10px",cursor:"pointer",color:t.text,fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
              <Ic n={themeName==="dark"?"sun":"moon"} s={13}/>
            </button>
          </div>
          <PeriodBar page={page} mes={mes} setMes={setMes} t={t}/>
        </div>

        {/* PAGE CONTENT */}
        <div className="page-content fade-in" style={{minWidth:0}}>
          {page==="dash"      && <DashPage      me={me} users={db.users} vendas={db.vendas} produtos={db.produtos} mes={mes} metas={db.metas} t={t}/>}
          {page==="vendas"    && <VendasPage    me={me} users={db.users} vendas={db.vendas} addVenda={db.addVenda} updateVenda={db.updateVenda} deleteVenda={db.deleteVenda} produtos={db.produtos} mes={mes} notify={notify} metas={db.metas} t={t}/>}
          {page==="equipe"    && <EquipePage    users={db.users} vendas={db.vendas} produtos={db.produtos} mes={mes} metas={db.metas} t={t}/>}
          {page==="cal"       && <CalPage       me={me} users={db.users} vendas={db.vendas} produtos={db.produtos} mes={mes} metas={db.metas} t={t}/>}
          {page==="hist"      && <HistPage      me={me} users={db.users} vendas={db.vendas} produtos={db.produtos} metas={db.metas} t={t}/>}
          {page==="relatorio" && <RelatorioPage me={me} users={db.users} vendas={db.vendas} produtos={db.produtos} metas={db.metas} t={t}/>}
          {page==="params"    && <ParamsPage    produtos={db.produtos} setProdutos={db.setProdutos} me={me} notify={notify} metas={db.metas} saveMetas={db.saveMetas} t={t}/>}
          {page==="prod"      && <ProdPage      produtos={db.produtos} setProdutos={db.setProdutos} notify={notify} t={t}/>}
          {page==="users"     && <UsersPage     users={db.users} createUserProfile={db.createUserProfile} updateProfile={db.updateProfile} notify={notify} me={me} t={t}/>}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-bottom-nav">
        {nav.slice(0,5).map(n=>(
          <button key={n.id} onClick={()=>setPage(n.id)} className={page===n.id?"active":""}>
            <Ic n={n.icon} s={20}/>
            {n.label}
          </button>
        ))}
        {nav.length>5&&(
          <button onClick={()=>setSidebarOpen(true)}>
            <Ic n="menu" s={20}/>
            Mais
          </button>
        )}
      </nav>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  LOGIN
// ══════════════════════════════════════════════════════════════════
function Login({notify, toast, t, themeName, setThemeName}) {
  const [email,setEmail]=useState(""); const [pw,setPw]=useState("");
  const [err,setErr]=useState(""); const [load,setLoad]=useState(false);

  const go = async () => {
    setLoad(true); setErr("");
    const { error } = await sb.auth.signInWithPassword({ email, password:pw });
    if (error) setErr(error.message==="Invalid login credentials"?"E-mail ou senha inválidos.":error.message);
    setLoad(false);
  };

  return (
    <div style={{minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:16,position:"relative",overflow:"hidden"}}>
      <FontLink/>
      <GlobalCSS t={t}/>
      {/* Background decoration */}
      <div style={{position:"absolute",top:"-20%",left:"-10%",width:500,height:500,background:`radial-gradient(circle,${t.accent}18,transparent 60%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:400,height:400,background:`radial-gradient(circle,${t.purple}15,transparent 60%)`,pointerEvents:"none"}}/>

      {toast&&<div className="fade-in" style={{position:"fixed",top:20,right:20,zIndex:999,background:t.green,color:"#fff",padding:"11px 18px",borderRadius:10,fontSize:13,fontWeight:600}}>{toast.msg}</div>}

      <div className="fade-in" style={{width:"100%",maxWidth:420,padding:"36px 28px",background:t.bgCard,borderRadius:24,border:`1px solid ${t.border}`,boxShadow:`0 32px 80px rgba(0,0,0,.3),0 0 0 1px ${t.border}`}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:40,fontWeight:900,letterSpacing:"-2px",lineHeight:1,marginBottom:6}}>
            <span style={{background:`linear-gradient(135deg,${t.accent},${t.cyan})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Z</span>
            <span style={{color:t.text}}>ucchetti</span>
          </div>
          <div style={{color:t.textMuted,fontSize:11,textTransform:"uppercase",letterSpacing:3,fontWeight:600}}>Comissionamento</div>
        </div>

        {err&&<div className="fade-in" style={{background:`${t.red}18`,color:t.red,padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:16,border:`1px solid ${t.red}30`}}>{err}</div>}

        <div style={{marginBottom:14}}>
          <Label t={t}>E-mail</Label>
          <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="seu@zucchetti.com" style={{...inp(t),border:`1px solid ${err?t.red:t.border}`}}/>
        </div>
        <div style={{marginBottom:20}}>
          <Label t={t}>Senha</Label>
          <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="••••••••" style={{...inp(t),border:`1px solid ${err?t.red:t.border}`}}/>
        </div>

        <button onClick={go} disabled={load} className="btn-primary"
          style={{width:"100%",padding:"13px",background:load?t.bgPanel:`linear-gradient(135deg,${t.accent},${t.cyan})`,
            color:load?t.textMuted:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,
            cursor:load?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",
            display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          {load?<><Spinner size={16} color={t.accent}/> Verificando…</>:"Entrar"}
        </button>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:24}}>
          <div style={{fontSize:11,color:t.textMuted}}>
            Primeiro acesso? Peça ao <span style={{color:t.accent}}>administrador</span>.
          </div>
          <button onClick={()=>setThemeName(n=>n==="dark"?"light":"dark")}
            style={{background:t.bgPanel,border:`1px solid ${t.border}`,borderRadius:20,padding:"4px 10px",cursor:"pointer",color:t.text,fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
            <Ic n={themeName==="dark"?"sun":"moon"} s={12}/>
            {themeName==="dark"?"Claro":"Escuro"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════════

// Barra de overperformance reutilizável
// Gráfico de barras simples (evolução mensal do MRR no trimestre)
function GraficoEvolucao({evolucao, overInfo, t}) {
  const maxVal = Math.max(...evolucao.map(e => Math.max(e.mrr, e.metaMRR)), 1);
  const ALTURA = 90;
  return (
    <div style={{display:"flex",gap:6,alignItems:"flex-end",height:ALTURA+40,marginTop:8,padding:"0 4px"}}>
      {evolucao.map((e, i) => {
        const hMRR  = Math.max((e.mrr     / maxVal) * ALTURA, e.mrr>0?4:0);
        const hMeta = Math.max((e.metaMRR / maxVal) * ALTURA, e.metaMRR>0?2:0);
        const ating = e.metaMRR > 0 ? (e.mrr / e.metaMRR) * 100 : 0;
        const cor = ating >= 200 ? t.amber : ating >= 150 ? t.green : ating >= 100 ? t.accent : t.textMuted;
        const mesLabel = ML(e.mes).split("/")[0];
        return (
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:0,position:"relative"}}>
            {/* Valor acima */}
            {e.mrr > 0 && (
              <div style={{fontSize:8,color:cor,fontWeight:700,marginBottom:3,whiteSpace:"nowrap"}}>
                {e.mrr >= 1000 ? `${(e.mrr/1000).toFixed(1)}k` : e.mrr}
              </div>
            )}
            {e.mrr === 0 && <div style={{height:15}}/>}
            {/* Barras */}
            <div style={{width:"100%",display:"flex",alignItems:"flex-end",justifyContent:"center",gap:2,height:ALTURA}}>
              {/* Barra meta */}
              <div style={{
                width:"38%", height:hMeta,
                background:`${t.accent}22`,
                borderRadius:"3px 3px 0 0",
                border:`1px solid ${t.accent}33`,
              }}/>
              {/* Barra realizado */}
              <div style={{
                width:"38%", height:hMRR,
                background: e.mrr > 0
                  ? `linear-gradient(180deg,${cor},${cor}99)`
                  : "transparent",
                borderRadius:"3px 3px 0 0",
                boxShadow: e.mrr > 0 ? `0 0 8px ${cor}44` : "none",
                transition:"height .4s cubic-bezier(.4,0,.2,1)",
              }}/>
            </div>
            {/* Label do mês */}
            <div style={{fontSize:9,color:t.textMuted,fontWeight:600,marginTop:4}}>{mesLabel}</div>
            {/* Indicador atingimento */}
            {e.metaMRR > 0 && (
              <div style={{fontSize:8,color:cor,fontWeight:700}}>{ating.toFixed(0)}%</div>
            )}
          </div>
        );
      })}
      {/* Legenda */}
      <div style={{display:"flex",flexDirection:"column",gap:5,justifyContent:"flex-end",paddingBottom:28,marginLeft:6,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:8,height:8,background:`${t.accent}33`,border:`1px solid ${t.accent}44`,borderRadius:2}}/>
          <span style={{fontSize:9,color:t.textMuted,whiteSpace:"nowrap"}}>Meta</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:8,height:8,background:overInfo.color,borderRadius:2,boxShadow:`0 0 4px ${overInfo.color}66`}}/>
          <span style={{fontSize:9,color:t.textMuted,whiteSpace:"nowrap"}}>Realizado</span>
        </div>
      </div>
    </div>
  );
}

function DashPage({me,users,vendas,produtos,mes,metas,t}) {
  const role=me.role;
  const [viewMode, setViewMode] = useState("mensal"); // "mensal" | "trimestral"
  const consultores = role==="consultor" ? [me] : users.filter(u=>u.role==="consultor"&&u.active);

  const porConsultor = consultores.map(u => {
    const r  = calcMesConsultor(u.id, mes, vendas, produtos, metas, users);
    const rt = calcTrimestreConsultor(u.id, mes, vendas, produtos, metas, users);
    return { ...u, ...r, trim: rt };
  }).sort((a,b)=>b.totalCom-a.totalCom);

  const totGeral     = porConsultor.reduce((s,c)=>s+c.totalCom,0);
  const totMRRTrim   = porConsultor.reduce((s,c)=>s+c.trim.totalMRRTrim,0);
  const totAcerto    = porConsultor.reduce((s,c)=>s+c.trim.valorAcerto,0);

  return (
    <div style={{width:"100%",minWidth:0,overflowX:"hidden"}}>
      {/* HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <STitle t={t} style={{margin:0}}>{role==="consultor"?`Olá, ${me.name?.split(" ")[0]}! 👋`:`Dashboard — ${ML(mes)}`}</STitle>
        {/* Toggle mensal / trimestral */}
        <div style={{display:"flex",background:t.tableHead,border:`1px solid ${t.border}`,borderRadius:10,padding:4,gap:4}}>
          {[["mensal","📅 Mensal"],["trimestral","📊 Trim."]].map(([v,l])=>(
            <button key={v} onClick={()=>setViewMode(v)} style={{padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:viewMode===v?t.bgHover:"transparent",color:viewMode===v?t.accent:t.textMuted,transition:"all .15s"}}>{l}</button>
          ))}
        </div>
      </div>

      {/* LEGENDA OVER */}
      <div className="over-legend" style={{background:t.tableHead,border:`1px solid ${t.borderAccent}`,borderRadius:10,padding:"10px 16px",marginBottom:18,display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:t.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>Over MRR {viewMode==="trimestral"?"trim.":"mensal"}:</span>
        <span style={{background:"#38bdf822",color:"#38bdf8",padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>70% · até 149%</span>
        <span style={{background:"#34d39922",color:"#34d399",padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>⚡ 100% · 150–199%</span>
        <span style={{background:"#f59e0b22",color:"#f59e0b",padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>🚀 200% · ≥200%</span>
        {viewMode==="trimestral"&&<span style={{fontSize:10,color:t.textMuted,marginLeft:"auto"}}>Acerto: {porConsultor[0]?`${ML(porConsultor[0].trim.trim.parc1)} e ${ML(porConsultor[0].trim.trim.parc2)}`:"+5 e +6 meses"}</span>}
        {viewMode==="mensal"&&<span style={{fontSize:10,color:t.textMuted,marginLeft:"auto"}}>Pgto: +2 e +3 meses</span>}
      </div>

      {/* STAT CARDS — gestor/params */}
      {role!=="consultor"&&(
        <div className="stat-grid" style={{marginBottom:20}}>
          {viewMode==="mensal"&&<>
            <StatCard t={t} l="Total Comissões"     v={R$(totGeral)} c="#34d399"/>
            <StatCard t={t} l="Consultores"         v={porConsultor.length} c="#38bdf8"/>
            <StatCard t={t} l="Em Overperformance"  v={porConsultor.filter(c=>c.atingMRR>=150).length} c="#f59e0b"/>
            <StatCard t={t} l="MRR Total do Mês"    v={R$(porConsultor.reduce((s,c)=>s+c.totalMRR,0))} c="#a78bfa"/>
          </>}
          {viewMode==="trimestral"&&<>
            <StatCard t={t} l={`MRR Total ${porConsultor[0]?.trim.trim.label||""}`} v={R$(totMRRTrim)} c="#34d399"/>
            <StatCard t={t} l="Consultores c/ Over Trim." v={porConsultor.filter(c=>c.trim.atingMRRTrim>=150).length} c="#f59e0b"/>
            <StatCard t={t} l="Total Acerto Over"  v={R$(totAcerto)} c="#a78bfa"/>
            <StatCard t={t} l="🚀 200%+ Trim."     v={porConsultor.filter(c=>c.trim.atingMRRTrim>=200).length} c="#f59e0b"/>
          </>}
        </div>
      )}

      {/* CARDS POR CONSULTOR */}
      <div style={{display:"flex",flexDirection:"column",gap:16,width:"100%",minWidth:0}}>
        {porConsultor.length===0&&<div style={{background:t.bgCard,border:"1px solid #0c1f35",borderRadius:12}}><Empty t={t} msg="Sem vendas neste mês."/></div>}
        {porConsultor.map(c=>{
          const t = c.trim;
          const borderColor = viewMode==="mensal"
            ? (c.atingMRR>=200?"#f59e0b44":c.atingMRR>=150?"#34d39944":"#243448")
            : (t.atingMRRTrim>=200?"#f59e0b44":t.atingMRRTrim>=150?"#34d39944":"#243448");
          return (
          <div key={c.id} style={{background:t.bgCard,border:`1px solid ${borderColor}`,borderRadius:12,overflow:"hidden",minWidth:0,width:"100%"}}>

            {/* ── HEADER CARD ── */}
            <div className="dash-header-card" style={{padding:"14px 20px",borderBottom:`1px solid ${t.border}`,display:"flex",gap:16,flexWrap:"wrap",justifyContent:"space-between",alignItems:"flex-start",background:t.tableHead}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:CARGO_COLOR[c.cargo]||"#38bdf8"}}/>
                <span style={{fontWeight:700,color:t.text,fontSize:15}}>{c.name}</span>
                <span style={{background:CARGO_COLOR[c.cargo]+"22",color:CARGO_COLOR[c.cargo],padding:"1px 8px",borderRadius:99,fontSize:11,fontWeight:700}}>{CARGO_LABEL[c.cargo]}</span>
                {viewMode==="mensal"&&<span style={{background:c.overInfo.bg,color:c.overInfo.color,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:800,border:`1px solid ${c.overInfo.border}`}}>{c.overInfo.label} mensal</span>}
                {viewMode==="trimestral"&&<span style={{background:t.overInfoTrim.bg,color:t.overInfoTrim.color,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:800,border:`1px solid ${t.overInfoTrim.border}`}}>{t.overInfoTrim.label} trim. · {t.trim.label}</span>}
              </div>
              {/* Valor destaque */}
              <div className="dash-header-value" style={{textAlign:"right"}}>
                {viewMode==="mensal"&&<>
                  <div style={{fontSize:10,color:"#546e8a",marginBottom:2}}>Comissão do mês</div>
                  <div style={{fontSize:22,fontWeight:800,color:"#34d399",fontFamily:"'Syne',sans-serif"}}>{R$(c.totalCom)}</div>
                  <div style={{fontSize:11,color:"#546e8a",marginTop:1}}>MRR {R$(c.vendasCalc.reduce((s,v)=>s+v.comMRR,0))} · NR {R$(c.vendasCalc.reduce((s,v)=>s+v.comImpl+v.comLic,0))}</div>
                  <div style={{fontSize:10,color:"#546e8a",marginTop:3}}>Parc: {ML(addMonths(mes,2))} · {ML(addMonths(mes,3))}</div>
                </>}
                {viewMode==="trimestral"&&<>
                  <div style={{fontSize:10,color:"#546e8a",marginBottom:2}}>Acerto over trimestral</div>
                  <div style={{fontSize:22,fontWeight:800,color:t.valorAcerto>0?"#f59e0b":"#546e8a",fontFamily:"'Syne',sans-serif"}}>{R$(t.valorAcerto)}</div>
                  {t.valorAcerto>0&&<div style={{fontSize:11,color:"#546e8a",marginTop:1}}>+{t.pctAcerto}% sobre {R$(t.totalMRRTrim)}</div>}
                  {t.valorAcerto>0&&<div style={{fontSize:10,color:"#546e8a",marginTop:3}}>Parc: {ML(t.trim.parc1)} · {ML(t.trim.parc2)}</div>}
                  {t.valorAcerto===0&&<div style={{fontSize:11,color:"#546e8a",marginTop:1}}>Sem acerto (abaixo de 150%)</div>}
                </>}
              </div>
            </div>

            {/* ── CORPO MENSAL ── */}
            {viewMode==="mensal"&&(
              <div className="dash-card-body">
                <div>
                  <div style={{fontSize:10,color:t.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Meta MRR — {R$(c.metaMRR)}/mês · Vendido: {R$(c.totalMRR)}</div>
                  <OverBar t={t} ating={c.atingMRR}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:t.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Meta NR — {R$(c.metaNR)}/mês · Realizado: {R$(c.totalNR)}</div>
                  <div style={{height:8,background:t.border,borderRadius:99,overflow:"hidden",marginBottom:3,marginTop:16}}>
                    <div style={{width:`${Math.min(c.atingNR,100)}%`,height:"100%",background:c.atingNR>=100?"#a78bfa":"#4a0080",borderRadius:99,transition:"width .4s"}}/>
                  </div>
                  <div style={{fontSize:11,color:c.atingNR>=100?"#a78bfa":"#64748b",fontWeight:700,marginTop:3}}>{c.atingNR.toFixed(1)}% da meta NR</div>
                </div>
              </div>
            )}

            {/* ── CORPO TRIMESTRAL ── */}
            {viewMode==="trimestral"&&(
              <div style={{padding:"14px 20px"}}>
                <div className="dash-trim-body" style={{marginBottom:16}}>
                  {/* Barra trimestral MRR */}
                  <div>
                    <div style={{fontSize:10,color:"#546e8a",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>
                      Meta MRR Trimestral — {R$(t.metaTrimMRR)} · Vendido: {R$(t.totalMRRTrim)}
                    </div>
                    <OverBar t={t} ating={t.atingMRRTrim}/>
                  </div>
                  {/* Quanto falta para o próximo nível */}
                  <div style={{background:t.tableHead,borderRadius:10,padding:"12px 14px",border:"1px solid #0c2a42"}}>
                    <div style={{fontSize:10,color:"#546e8a",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Falta para o próximo nível</div>
                    {t.atingMRRTrim>=200
                      ? <div style={{fontSize:13,color:"#f59e0b",fontWeight:700}}>🚀 Nível máximo atingido!</div>
                      : <>
                          {t.faltaP1>0&&<div style={{fontSize:12,color:"#34d399",marginBottom:4}}>⚡ Para 100%: faltam <b>{R$(t.faltaP1)}</b></div>}
                          {t.faltaP1<=0&&t.faltaP2>0&&<div style={{fontSize:12,color:"#f59e0b",marginBottom:4}}>🚀 Para 200%: faltam <b>{R$(t.faltaP2)}</b></div>}
                        </>
                    }
                    {t.pctAcerto>0&&(
                      <div style={{marginTop:6,padding:"6px 10px",background:"#1a2d4a",borderRadius:8,fontSize:11}}>
                        <span style={{color:"#546e8a"}}>Acerto atual: </span>
                        <span style={{color:t.overInfoTrim.color,fontWeight:800}}>+{t.pctAcerto}% = {R$(t.valorAcerto)}</span>
                        <div style={{color:"#546e8a",fontSize:10,marginTop:2}}>÷2: {R$(t.parcelaAcerto)} em {ML(t.trim.parc1)} e {ML(t.trim.parc2)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gráfico de evolução */}
                <div style={{background:t.tableHead,borderRadius:10,padding:"12px 14px",border:"1px solid #0c1f35"}}>
                  <div style={{fontSize:10,color:"#546e8a",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Evolução MRR no trimestre — {t.trim.label}</div>
                  <GraficoEvolucao t={t} evolucao={t.evolucao} overInfo={t.overInfoTrim}/>
                </div>
              </div>
            )}

            {/* ── TABELA DE CONTRATOS (só mensal) ── */}
            {viewMode==="mensal"&&c.vendasCalc.length>0&&(
              <div className="table-scroll">
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:650}}>
                <thead><tr style={{background:"#030810"}}>
                  <TH t={t}>Produto</TH><TH t={t}>Cliente</TH>
                  <TH t={t}>MRR</TH><TH t={t}>Impl. (h×R$/h)</TH><TH t={t}>Licença</TH><TH t={t}>NR</TH>
                  <TH t={t}>Faixa NR</TH>
                  <TH t={t} right>Com. MRR ({c.pctMRR}%)</TH><TH t={t} right>Com. NR</TH><TH t={t} right>Total</TH>
                  <TH t={t} right>1ª parc.</TH><TH t={t} right>2ª parc.</TH>
                </tr></thead>
                <tbody>
                  {c.vendasCalc.map((v,i)=>{
                    const prod=produtos.find(p=>p.id===v.produtoId);
                    return (
                      <tr key={v.id||i} style={{borderBottom:i<c.vendasCalc.length-1?"1px solid #080f1a":"none"}}>
                        <TD t={t} bold color="#e2e8f0">{prod?.nome}</TD>
                        <TD t={t}>{v.cliente}</TD>
                        <TD t={t} bold color="#38bdf8">{R$(v.mrr)}</TD>
                        <TD t={t}>{R$(v.implTotal)}<div style={{fontSize:10,color:"#546e8a"}}>{v.horasImpl}h × {R$(v.valorHoraImpl)}/h</div></TD>
                        <TD t={t} color={v.licenca>0?"#a78bfa":"#546e8a"}>{v.licenca>0?R$(v.licenca):"—"}</TD>
                        <TD t={t} bold color="#e2e8f0">{R$(v.nr)}</TD>
                        <TD t={t}><FaixaBadge t={t} faixa={v.faixa}/></TD>
                        <TD t={t} right bold><span style={{color:c.overInfo.color}}>{R$(v.comMRR)}</span></TD>
                        <TD t={t} right color="#a78bfa" bold>{R$(v.comImpl+v.comLic)}</TD>
                        <TD t={t} right bold color="#e2e8f0">{R$(v.total)}</TD>
                        <TD t={t} right color="#38bdf8" bold>{R$(v.parcela)}<div style={{fontSize:10,color:"#546e8a"}}>{ML(v.mesParcela1)}</div></TD>
                        <TD t={t} right color="#818cf8" bold>{R$(v.parcela)}<div style={{fontSize:10,color:"#546e8a"}}>{ML(v.mesParcela2)}</div></TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
            {viewMode==="mensal"&&c.vendasCalc.length===0&&<div style={{padding:"16px 20px",fontSize:12,color:"#546e8a"}}>Sem contratos lançados neste mês.</div>}
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  VENDAS
// ══════════════════════════════════════════════════════════════════
function VendasPage({me,users,vendas,addVenda,updateVenda,deleteVenda,produtos,mes,notify,metas,t}) {
  const role=me.role;
  // Jennifer (parametros) também pode lançar vendas
  const podeVender = role==="consultor" || role==="parametros" || role==="gestor";
  const consultores = role==="consultor"
    ? [me]
    : users.filter(u=>(u.role==="consultor"||(u.role==="parametros"))&&u.active);
  const EMPTY={consultorId:me.id,produtoId:produtos[0]?.id||"",cliente:"",mrr:"",horasImpl:"",valorHoraImpl:"",licenca:"",faixaIdManual:"",obs:""};
  const [form,setForm]=useState(EMPTY);
  const [editId,setEditId]=useState(null);
  const [saving,setSaving]=useState(false);
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));

  const prodSel  = produtos.find(p=>p.id===form.produtoId);
  const prodNorm = normProd(prodSel||{});
  const isManual   = prodNorm.selecaoFaixa==="manual";
  const isSoImpl   = prodNorm.soImpl;
  const isSemLic   = prodNorm.semLicenca || isSoImpl;

  const overMes = useMemo(()=>
    calcMesConsultor(form.consultorId, mes, vendas, produtos, metas, users),
    [form.consultorId, mes, vendas, produtos, metas, users]);

  const prev=useMemo(()=>{
    if(!isSoImpl&&!form.mrr&&!form.horasImpl) return null;
    if(isSoImpl&&!form.horasImpl) return null;
    return calcVenda({...form,mes,mrr:+form.mrr||0,horasImpl:+form.horasImpl||0,valorHoraImpl:+form.valorHoraImpl||0,licenca:+form.licenca||0},produtos,overMes.pctMRR);
  },[form,produtos,mes,overMes,isSoImpl]);

  const save=async()=>{
    if(!form.cliente.trim()) return notify("Informe o cliente.","err");
    if(!isSoImpl&&(!form.mrr||+form.mrr<=0)) return notify("Informe o MRR.","err");
    if(!form.horasImpl||+form.horasImpl<=0) return notify("Informe as horas.","err");
    if(!form.valorHoraImpl||+form.valorHoraImpl<=0) return notify("Informe o valor/hora.","err");
    if(isManual&&!form.faixaIdManual) return notify("Selecione a faixa.","err");
    setSaving(true);
    const entry={
      consultorId: form.consultorId,
      mes, produtoId:form.produtoId, cliente:form.cliente,
      mrr:isSoImpl?0:+form.mrr||0,
      horasImpl:+form.horasImpl, valorHoraImpl:+form.valorHoraImpl,
      licenca:isSemLic?0:+form.licenca||0,
      faixaIdManual:form.faixaIdManual||null, obs:form.obs,
    };
    if(editId){
      const {error}=await updateVenda(editId,entry);
      if(error) notify("Erro ao salvar: "+error.message,"err");
      else { notify("Venda atualizada!"); setEditId(null); }
    } else {
      const {error}=await addVenda(entry);
      if(error) notify("Erro ao salvar: "+error.message,"err");
      else notify("Venda lançada!");
    }
    setSaving(false);
    setForm({...EMPTY,consultorId:form.consultorId,produtoId:form.produtoId});
  };

  const vendasMes=vendas.filter(v=>role==="consultor"?(v.consultorId||v.consultor_id)===me.id&&v.mes===mes:v.mes===mes);

  return (
    <div style={{width:"100%",minWidth:0,overflowX:"hidden"}}>
      <STitle t={t}>Lançar Venda — {ML(mes)}</STitle>
      <div style={{background:t.bgCard,border:"1px solid #0c1f35",borderRadius:12,padding:22,marginBottom:20}}>
        <div style={{fontSize:11,color:"#546e8a",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>{editId?"✏ Editando":"➕ Nova venda"}</div>
        <div className="form-grid" style={{marginBottom:14}}>
          {role!=="consultor"&&<div style={{gridColumn:"span 2"}}><Label t={t}>Consultor</Label><select value={form.consultorId} onChange={e=>F("consultorId",e.target.value)} style={selS(t)}>{consultores.map(c=><option key={c.id} value={c.id}>{c.name}{c.cargo?` (${CARGO_LABEL[c.cargo]})`:""}</option>)}</select></div>}
          <div><Label t={t}>Produto</Label><select value={form.produtoId} onChange={e=>{F("produtoId",e.target.value);F("faixaIdManual","");}} style={selS(t)}>{produtos.filter(p=>p.ativo).map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
          <div style={{gridColumn:"span 2"}}><Label t={t}>Nome do Cliente / Projeto</Label><input value={form.cliente} onChange={e=>F("cliente",e.target.value)} placeholder="Ex: Empresa XYZ Ltda" style={inp(t)}/></div>

          {/* MRR — oculto para Horas Extras */}
          {!isSoImpl&&(
            <div style={{background:t.tableHead,borderRadius:8,padding:"10px 12px"}}>
              <Label t={t}>💳 MRR — Mensalidade (R$)</Label>
              <input type="number" value={form.mrr} onChange={e=>F("mrr",e.target.value)} placeholder="Ex: 2500" style={{...inp(t),background:t.bgInput,color:"#38bdf8",fontWeight:700}}/>
            </div>
          )}

          <div style={{background:t.tableHead,borderRadius:8,padding:"10px 12px"}}><Label t={t}>🔧 Horas Implantação</Label><input type="number" value={form.horasImpl} onChange={e=>F("horasImpl",e.target.value)} placeholder="Ex: 60" style={{...inp(t),background:t.bgInput}}/></div>
          <div style={{background:t.tableHead,borderRadius:8,padding:"10px 12px"}}><Label t={t}>🔧 Valor/Hora (R$)</Label><input type="number" value={form.valorHoraImpl} onChange={e=>F("valorHoraImpl",e.target.value)} placeholder="Ex: 185" style={{...inp(t),background:t.bgInput}}/></div>

          {/* Licença — oculto para sem_licenca e so_impl */}
          {!isSemLic&&(
            <div style={{background:t.tableHead,borderRadius:8,padding:"10px 12px"}}>
              <Label t={t}>📦 Licença (R$)</Label>
              <input type="number" value={form.licenca} onChange={e=>F("licenca",e.target.value)} placeholder="0 se não houver" style={{...inp(t),background:t.bgInput,color:+form.licenca>0?"#a78bfa":"#e2e8f0"}}/>
            </div>
          )}

          {isManual&&(
            <div style={{background:"#1a2d4a",borderRadius:8,padding:"10px 12px",border:"1px solid #1e4060"}}>
              <Label t={t}>⚡ Faixa (manual)</Label>
              <select value={form.faixaIdManual} onChange={e=>F("faixaIdManual",e.target.value)} style={{...selS(t),background:t.bgInput,color:"#ca8a04",fontWeight:700}}>
                <option value="">— Selecione —</option>
                {prodSel?.regras.map(r=><option key={r.id} value={r.id}>{r.label} ({r.pctImpl}%)</option>)}
              </select>
            </div>
          )}
          <div><Label t={t}>Observação</Label><input value={form.obs} onChange={e=>F("obs",e.target.value)} placeholder="Opcional" style={inp(t)}/></div>
        </div>

        {/* PRÉVIA */}
        {prev&&(
          <div style={{background:t.tableHead,border:"1px solid #0c2a42",borderRadius:10,padding:"16px 18px",marginBottom:14}}>
            <div style={{fontSize:11,color:"#546e8a",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:12}}>Prévia da Comissão</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
              <FaixaBadge t={t} faixa={prev.faixa}/>
              {isSoImpl&&<span style={{background:"#f59e0b22",color:"#f59e0b",padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,border:"1px solid #f59e0b33"}}>⏱ Apenas Implantação</span>}
            </div>
            <div className="mini-grid" style={{marginBottom:16}}>
              {!isSoImpl&&<div style={{background:t.bgCard,borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#546e8a",marginBottom:4}}>MRR</div><div style={{fontSize:13,color:t.text,fontWeight:600}}>{R$(prev.mrr)}</div><div style={{fontSize:11,color:"#38bdf8",marginTop:2}}>com.: {R$(prev.comMRR)}</div></div>}
              <div style={{background:t.bgCard,borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#546e8a",marginBottom:4}}>Implantação</div><div style={{fontSize:13,color:t.text,fontWeight:600}}>{R$(prev.implTotal)}</div><div style={{fontSize:11,color:"#a78bfa",marginTop:2}}>com.: {R$(prev.comImpl)}</div></div>
              {prev.licenca>0&&<div style={{background:t.bgCard,borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#546e8a",marginBottom:4}}>Licença</div><div style={{fontSize:13,color:t.text,fontWeight:600}}>{R$(prev.licenca)}</div><div style={{fontSize:11,color:"#a78bfa",marginTop:2}}>com.: {R$(prev.comLic)}</div></div>}
              <div style={{background:t.bgCard,borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#546e8a",marginBottom:4}}>NR Total</div><div style={{fontSize:13,color:t.text,fontWeight:600}}>{R$(prev.nr)}</div></div>
            </div>
            <div className="preview-parcelas" style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{background:"#1a2d4a",borderRadius:8,padding:"10px 16px",textAlign:"center"}}><div style={{fontSize:10,color:"#546e8a",marginBottom:3,textTransform:"uppercase",letterSpacing:.5}}>1ª Parcela — {ML(prev.mesParcela1)}</div><div style={{fontSize:18,fontWeight:800,color:"#38bdf8",fontFamily:"'Syne',sans-serif"}}>{R$(prev.parcela)}</div></div>
              <div style={{background:"#1a1640",borderRadius:8,padding:"10px 16px",textAlign:"center"}}><div style={{fontSize:10,color:"#546e8a",marginBottom:3,textTransform:"uppercase",letterSpacing:.5}}>2ª Parcela — {ML(prev.mesParcela2)}</div><div style={{fontSize:18,fontWeight:800,color:"#818cf8",fontFamily:"'Syne',sans-serif"}}>{R$(prev.parcela)}</div></div>
              <div style={{borderLeft:"1px solid #0c2a42",paddingLeft:16}}><div style={{fontSize:11,color:"#546e8a"}}>TOTAL COMISSÃO</div><div style={{fontSize:22,fontWeight:800,color:"#34d399",fontFamily:"'Syne',sans-serif"}}>{R$(prev.total)}</div></div>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:8}}>
          <Btn t={t} onClick={save} disabled={saving}>{saving?<><Spinner size={13}/> Salvando…</>:editId?"Salvar":"Lançar venda"}</Btn>
          {editId&&<Btn t={t} secondary onClick={()=>{setEditId(null);setForm(EMPTY);}}>Cancelar</Btn>}
        </div>
      </div>

      {/* TABELA */}
      <div style={{background:t.bgCard,border:"1px solid #0c1f35",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:"1px solid #080f1a"}}><span style={{fontSize:13,fontWeight:600,color:"#7fa8c0"}}>Contratos em {ML(mes)} · {vendasMes.length} registro{vendasMes.length!==1?"s":""}</span></div>
        <div className="table-scroll">
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:520}}>
          <thead><tr style={{background:t.tableHead}}>
            {role!=="consultor"&&<TH t={t}>Consultor</TH>}
            <TH t={t}>Produto</TH><TH t={t}>Cliente</TH><TH t={t}>MRR</TH><TH t={t}>Impl. Total</TH><TH t={t}>Licença</TH><TH t={t}>NR</TH><TH t={t}>Faixa</TH>
            <TH t={t} right>Com. MRR</TH><TH t={t} right>Com. NR</TH><TH t={t} right>Total</TH>
            <TH t={t} right>1ª ({ML(addMonths(mes,2))})</TH><TH t={t} right>2ª ({ML(addMonths(mes,3))})</TH><TH t={t}>Ações</TH>
          </tr></thead>
          <tbody>
            {vendasMes.length===0?<tr><td colSpan={14}><Empty t={t}/></td></tr>:vendasMes.map((v,i)=>{
              const c=calcVenda(v,produtos); if(!c)return null;
              const prod=produtos.find(p=>p.id===(v.produtoId||v.produto_id));
              const cId = v.consultorId||v.consultor_id;
              return (
                <tr key={v.id} style={{borderBottom:i<vendasMes.length-1?"1px solid #080f1a":"none"}}>
                  {role!=="consultor"&&<TD t={t} bold color="#e2e8f0">{users.find(u=>u.id===cId)?.name||"–"}</TD>}
                  <TD t={t} bold color="#e2e8f0">{prod?.nome}{c.soImpl&&<div style={{fontSize:9,color:"#f59e0b",marginTop:1}}>⏱ só impl.</div>}</TD>
                  <TD t={t}>{v.cliente}</TD>
                  <TD t={t} bold color={c.soImpl?"#546e8a":"#38bdf8"}>{c.soImpl?"—":R$(v.mrr)}</TD>
                  <TD t={t}>{R$(c.implTotal)}<div style={{fontSize:10,color:"#546e8a"}}>{c.horasImpl}h × {R$(c.valorHoraImpl)}/h</div></TD>
                  <TD t={t} color={v.licenca>0?"#a78bfa":"#546e8a"}>{v.licenca>0?R$(v.licenca):"—"}</TD>
                  <TD t={t} bold color="#e2e8f0">{R$(c.nr)}</TD>
                  <TD t={t}><FaixaBadge t={t} faixa={c.faixa}/></TD>
                  <TD t={t} right color="#38bdf8" bold>{c.soImpl?"—":R$(c.comMRR)}</TD>
                  <TD t={t} right color="#a78bfa" bold>{R$(c.comImpl+c.comLic)}</TD>
                  <TD t={t} right bold color="#e2e8f0">{R$(c.total)}</TD>
                  <TD t={t} right color="#38bdf8" bold>{R$(c.parcela)}</TD>
                  <TD t={t} right color="#818cf8" bold>{R$(c.parcela)}</TD>
                  <TD t={t}>
                    <div style={{display:"flex",gap:5}}>
                      <IBtn t={t} color="#38bdf8" onClick={()=>{setEditId(v.id);setForm({consultorId:cId,produtoId:v.produtoId||v.produto_id,cliente:v.cliente,mrr:String(v.mrr||0),horasImpl:String(c.horasImpl),valorHoraImpl:String(c.valorHoraImpl),licenca:String(v.licenca||0),faixaIdManual:v.faixaIdManual||v.faixa_id_manual||"",obs:v.obs||""})}}><Ic n="edit" s={13}/></IBtn>
                      <IBtn t={t} color="#ef4444" onClick={async()=>{const {error}=await deleteVenda(v.id);if(error)notify("Erro ao excluir","err");else notify("Venda removida.");}}><Ic n="trash" s={13}/></IBtn>
                    </div>
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  EQUIPE
// ══════════════════════════════════════════════════════════════════
function EquipePage({users,vendas,produtos,mes,metas,t}) {
  const consultores=users.filter(u=>u.role==="consultor"&&u.active);
  const rows=consultores.map(u=>{
    const r=calcMesConsultor(u.id,mes,vendas,produtos,metas,users);
    return {...u,...r};
  }).sort((a,b)=>b.totalCom-a.totalCom);
  const totGeral=rows.reduce((s,r)=>s+r.totalCom,0);
  return (
    <div>
      <STitle t={t}>Equipe — {ML(mes)}</STitle>
      <div className="stat-grid" style={{marginBottom:20}}>
        <StatCard t={t} l="Total Comissões"    v={R$(totGeral)} c="#34d399"/>
        <StatCard t={t} l="Consultores"        v={rows.length}  c="#38bdf8"/>
        <StatCard t={t} l="Em Overperformance" v={rows.filter(r=>r.atingMRR>=150).length} c="#f59e0b"/>
        <StatCard t={t} l="🚀 200%+"           v={rows.filter(r=>r.atingMRR>=200).length} c="#f59e0b"/>
      </div>
      <div className="equipe-grid">
        {rows.map((r,idx)=>(
          <div key={r.id} style={{background:t.bgCard,border:`1px solid ${r.atingMRR>=200?"#f59e0b44":r.atingMRR>=150?"#34d39944":"#243448"}`,borderRadius:12,padding:20,position:"relative"}}>
            {idx===0&&r.totalCom>0&&<span style={{position:"absolute",top:14,right:14}}>🏆</span>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontWeight:700,color:t.text,fontSize:15,marginBottom:5}}>{r.name}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <span style={{background:CARGO_COLOR[r.cargo]+"22",color:CARGO_COLOR[r.cargo],padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700}}>{CARGO_LABEL[r.cargo]}</span>
                  <span style={{background:r.overInfo.bg,color:r.overInfo.color,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:800,border:`1px solid ${r.overInfo.border}`}}>{r.overInfo.label}</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:800,color:"#34d399",fontFamily:"'Syne',sans-serif"}}>{R$(r.totalCom)}</div>
                <div style={{fontSize:10,color:"#546e8a",marginTop:2}}>{r.vendasCalc.length} contrato{r.vendasCalc.length!==1?"s":""}</div>
              </div>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#546e8a",marginBottom:3}}><span>MRR {R$(r.totalMRR)} / {R$(r.metaMRR)}</span><span style={{color:r.overInfo.color,fontWeight:700}}>{r.atingMRR.toFixed(0)}%</span></div>
              <div style={{height:6,background:t.border,borderRadius:99,overflow:"hidden"}}><div style={{width:`${Math.min(r.atingMRR/2,100)}%`,height:"100%",background:r.overInfo.color,borderRadius:99}}/></div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#546e8a",marginBottom:3}}><span>NR {R$(r.totalNR)} / {R$(r.metaNR)}</span><span style={{color:r.atingNR>=100?"#a78bfa":"#64748b",fontWeight:700}}>{r.atingNR.toFixed(0)}%</span></div>
              <div style={{height:6,background:t.border,borderRadius:99,overflow:"hidden"}}><div style={{width:`${Math.min(r.atingNR,100)}%`,height:"100%",background:r.atingNR>=100?"#a78bfa":"#4a0080",borderRadius:99}}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <MiniCard t={t} l="Com. MRR" v={R$(r.vendasCalc.reduce((s,v)=>s+v.comMRR,0))} c={r.overInfo.color}/>
              <MiniCard t={t} l="Com. NR"  v={R$(r.vendasCalc.reduce((s,v)=>s+v.comImpl+v.comLic,0))} c="#a78bfa"/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  CALENDÁRIO — 12 meses do ano + seletor de ano
// ══════════════════════════════════════════════════════════════════
function CalPage({me,users,vendas,produtos,t}) {
  const role=me.role;
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const anos = Array.from({length: ano - 2025 + 3}, (_,i) => 2025 + i);
  const mesesDoAno = Array.from({length:12},(_,i)=>`${ano}-${String(i+1).padStart(2,"0")}`);
  const vendasFiltradas = role==="consultor" ? vendas.filter(v=>(v.consultorId||v.consultor_id)===me.id) : vendas;
  const cal = useMemo(()=>buildCalendario(vendasFiltradas,produtos,users),[vendasFiltradas,produtos,users]);
  const mesAtual = `${anoAtual}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
  const totalAno = mesesDoAno.reduce((s,m)=>(cal[m]||[]).reduce((ss,p)=>ss+p.valor,s),0);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <STitle t={t} style={{margin:0}}>Calendário de Recebimentos</STitle>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:"#546e8a",fontWeight:700}}>Total {ano}: <span style={{color:"#34d399"}}>{R$(totalAno)}</span></span>
          <div style={{display:"flex",gap:4,marginLeft:8,background:t.tableHead,border:"1px solid #0c1f35",borderRadius:8,padding:4}}>
            {anos.map(a=>(
              <button key={a} onClick={()=>setAno(a)} style={{padding:"4px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:ano===a?"#0369a1":"transparent",color:ano===a?"#fff":"#546e8a",transition:"all .15s"}}>{a}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="cal-grid">
        {mesesDoAno.map(m=>{
          const parcelas=(cal[m]||[]);
          const total=parcelas.reduce((s,p)=>s+p.valor,0);
          const isAtual=m===mesAtual;
          return (
            <div key={m} style={{background:t.bgCard,border:`1px solid ${isAtual?"#0369a1":total>0?"#1a2d4a":"#243448"}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",background:isAtual?"#1a2d4a":"#090f1c",borderBottom:"1px solid #080f1a"}}>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:isAtual?"#38bdf8":"#e2e8f0",fontSize:13}}>{ML(m)}</span>
                <span style={{fontWeight:800,color:total>0?"#34d399":"#546e8a",fontSize:13}}>{total>0?R$(total):"—"}</span>
              </div>
              <div style={{maxHeight:240,overflowY:"auto"}}>
                {parcelas.length===0
                  ? <div style={{padding:"12px 14px",fontSize:11,color:"#546e8a"}}>Sem recebimentos</div>
                  : parcelas.map((p,i)=>(
                  <div key={i} style={{padding:"8px 14px",borderBottom:i<parcelas.length-1?"1px solid #080f1a":"none",display:"flex",justifyContent:"space-between",gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <span style={{background:p.tipo==="Parcela 1/2"?"#1a2d4a":"#1a1640",color:p.tipo==="Parcela 1/2"?"#38bdf8":"#818cf8",padding:"1px 6px",borderRadius:99,fontSize:9,fontWeight:700,marginRight:4}}>
                        {p.tipo==="Parcela 1/2"?"1ª":"2ª"}
                      </span>
                      {role!=="consultor"&&<span style={{fontSize:10,color:"#2a5a80",fontWeight:600}}>{p.nomeConsultor} · </span>}
                      <span style={{fontSize:10,color:"#546e8a"}}>{p.cliente}</span>
                    </div>
                    <span style={{fontWeight:700,color:"#34d399",whiteSpace:"nowrap",fontSize:11}}>{R$(p.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
//  HISTÓRICO
// ══════════════════════════════════════════════════════════════════
function HistPage({me,users,vendas,produtos,metas,t}) {
  const [filtro,setFiltro]=useState(me.role==="consultor"?String(me.id):"todos");
  const consultores=me.role==="consultor"?[me]:users.filter(u=>u.role==="consultor"&&u.active);
  const porMes=MESES_LIST.map(mes=>{
    const cId = filtro==="todos" ? null : filtro;
    const vsAll = vendas.filter(v=>v.mes===mes && (me.role!=="consultor"||(v.consultorId||v.consultor_id)===me.id) && (filtro==="todos"||(v.consultorId||v.consultor_id)===cId));
    const consultorIds = [...new Set(vsAll.map(v=>v.consultorId||v.consultor_id))];
    const rows = consultorIds.flatMap(uid => {
      const r = calcMesConsultor(uid, mes, vendas, produtos, metas, users);
      return r.vendasCalc.map(v => {
        const u = users.find(x=>x.id===uid);
        return {...v, nomeConsultor:u?.name||"–", cargo:u?.cargo, pctMRRover:r.pctMRR, overInfo:r.overInfo};
      });
    }).filter(Boolean);
    return {mes, rows, total:rows.reduce((s,r)=>s+r.total,0)};
  }).filter(m=>m.rows.length>0);

  return (
    <div style={{width:"100%",minWidth:0,overflowX:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <STitle t={t}>Histórico</STitle>
        {me.role!=="consultor"&&<select value={filtro} onChange={e=>setFiltro(e.target.value)} style={{...selS(t),width:"auto",minWidth:160,maxWidth:"100%"}}><option value="todos">Toda a equipe</option>{consultores.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}
      </div>
      {porMes.length===0&&<div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:12}}><Empty t={t}/></div>}
      {porMes.map(({mes,rows,total})=>(
        <div key={mes} style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:12,overflow:"hidden",marginBottom:14,width:"100%",minWidth:0}}>
          <div className="hist-header" style={{padding:"12px 20px",borderBottom:`1px solid ${t.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:t.tableHead}}>
            <span style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,color:t.text,fontSize:14}}>{ML(mes)}</span>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:t.textMuted}}>Parc: {ML(addMonths(mes,2))} + {ML(addMonths(mes,3))}</span>
              <span style={{color:"#34d399",fontWeight:800,fontFamily:"'Outfit',sans-serif"}}>{R$(total)}</span>
            </div>
          </div>
          <div className="table-scroll">
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:650}}>
            <thead><tr style={{background:"#030810"}}>
              {filtro==="todos"&&<TH t={t}>Consultor</TH>}
              <TH t={t}>Produto</TH><TH t={t}>Cliente</TH><TH t={t}>MRR</TH><TH t={t}>Impl.</TH><TH t={t}>Licença</TH><TH t={t}>Faixa</TH>
              <TH t={t} right>Over MRR</TH><TH t={t} right>Com. MRR</TH><TH t={t} right>Com. NR</TH><TH t={t} right>Total</TH>
              <TH t={t} right>1ª Parcela</TH><TH t={t} right>2ª Parcela</TH>
            </tr></thead>
            <tbody>
              {rows.map((r,i)=>{
                const prod=produtos.find(p=>p.id===r.produtoId);
                return (
                  <tr key={(r.id||i)+"-"+mes} style={{borderBottom:i<rows.length-1?"1px solid #080f1a":"none"}}>
                    {filtro==="todos"&&<TD t={t} bold color="#e2e8f0">{r.nomeConsultor}</TD>}
                    <TD t={t} bold color="#e2e8f0">{prod?.nome}</TD>
                    <TD t={t}>{r.cliente}</TD>
                    <TD t={t} bold color="#38bdf8">{R$(r.mrr)}</TD>
                    <TD t={t}>{R$(r.implTotal)}<div style={{fontSize:10,color:"#546e8a"}}>{r.horasImpl}h × {R$(r.valorHoraImpl)}/h</div></TD>
                    <TD t={t} color={r.licenca>0?"#a78bfa":"#546e8a"}>{r.licenca>0?R$(r.licenca):"—"}</TD>
                    <TD t={t}><FaixaBadge t={t} faixa={r.faixa}/></TD>
                    <TD t={t} right><span style={{background:r.overInfo?.bg,color:r.overInfo?.color,padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:800}}>{r.overInfo?.label}</span></TD>
                    <TD t={t} right bold style={{color:r.overInfo?.color}}>{R$(r.comMRR)}</TD>
                    <TD t={t} right color="#a78bfa" bold>{R$(r.comImpl+r.comLic)}</TD>
                    <TD t={t} right bold color="#e2e8f0">{R$(r.total)}</TD>
                    <TD t={t} right color="#38bdf8" bold>{R$(r.parcela)}<div style={{fontSize:10,color:"#546e8a"}}>{ML(r.mesParcela1)}</div></TD>
                    <TD t={t} right color="#818cf8" bold>{R$(r.parcela)}<div style={{fontSize:10,color:"#546e8a"}}>{ML(r.mesParcela2)}</div></TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  PARÂMETROS
// ══════════════════════════════════════════════════════════════════
function ParamsPage({produtos,setProdutos,me,notify,metas,saveMetas,t}) {
  const [tab,setTab]=useState("produtos");
  const [selId,setSelId]=useState(produtos[0]?.id||"");
  const prod=produtos.find(p=>p.id===selId);
  const [draft,setDraft]=useState(prod?JSON.parse(JSON.stringify(normProd(prod))):null);
  const [saving,setSaving]=useState(false);
  const sync=p=>setDraft(JSON.parse(JSON.stringify(normProd(p))));
  const updPct=(k,v)=>setDraft(d=>({...d,[k]:+v}));
  const updRegra=(i,k,v)=>setDraft(d=>({...d,regras:d.regras.map((r,idx)=>idx===i?{...r,[k]:+v}:r)}));
  const updFaixaMode=v=>setDraft(d=>({...d,selecaoFaixa:v,selecao_faixa:v}));

  const save=async()=>{
    setSaving(true);
    // Prepara para salvar no Supabase (campo snake_case)
    await setProdutos(p=>p.map(x=>x.id===draft.id?{...draft,selecao_faixa:draft.selecaoFaixa,pct_mrr:draft.pctMRR}:x));
    setSaving(false);
    notify("Parâmetros salvos!");
  };

  const [mesMeta,setMesMeta]=useState(()=>{
    const now=new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  });
  const metaAtual=metas[mesMeta]||{junior:{mrr:0,nr:0},pleno:{mrr:0,nr:0},senior:{mrr:0,nr:0}};
  const [metaDraft,setMetaDraft]=useState(metaAtual);
  useEffect(()=>setMetaDraft(metas[mesMeta]||{junior:{mrr:0,nr:0},pleno:{mrr:0,nr:0},senior:{mrr:0,nr:0}}),[mesMeta,metas]);
  const updMeta=(cargo,k,v)=>setMetaDraft(m=>({...m,[cargo]:{...(m[cargo]||{}),[k]:+v}}));

  const saveMetasMes=async()=>{
    setSaving(true);
    const newMetas={...metas,[mesMeta]:metaDraft};
    const {error}=await saveMetas(newMetas);
    setSaving(false);
    if(error) notify("Erro ao salvar metas: "+error.message,"err");
    else notify("Metas salvas!");
  };

  if(!draft) return <STitle t={t}>Nenhum produto.</STitle>;

  const simCenarios=[
    {mrr:2000,h:40,vh:170,lic:0},{mrr:2500,h:60,vh:185,lic:0},
    {mrr:3000,h:60,vh:190,lic:3000},{mrr:4000,h:80,vh:200,lic:5000},{mrr:5000,h:100,vh:210,lic:0},
  ];

  return (
    <div>
      <STitle t={t}>Parâmetros</STitle>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[["produtos","🎛 Comissões por Produto"],["metas","🎯 Metas Mensais"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${tab===id?"#546e8a":"#243448"}`,cursor:"pointer",fontSize:13,fontWeight:700,background:tab===id?"#1a2d4a":"#0d1117",color:tab===id?"#38bdf8":"#2a5a80"}}>{label}</button>
        ))}
      </div>

      {tab==="metas"&&(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:10,color:t.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Mês:</span>
            <div className="meses-meta-btns" style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {MESES_LIST.slice(0,12).slice().reverse().map(m=>(
              <button key={m} onClick={()=>setMesMeta(m)} style={{padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:mesMeta===m?t.bgHover:"transparent",color:mesMeta===m?t.accent:t.textMuted}}>{ML(m)}</button>
            ))}
            </div>
          </div>
          <div style={{background:t.tableHead,border:"1px solid #0c2a42",borderRadius:10,padding:"12px 18px",marginBottom:20,fontSize:12}}>
            <div style={{fontSize:10,color:"#546e8a",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Regras de Overperformance MRR</div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              <span style={{background:"#38bdf822",color:"#38bdf8",padding:"4px 12px",borderRadius:99,fontWeight:700}}>até 149% → 70% do MRR</span>
              <span style={{background:"#34d39922",color:"#34d399",padding:"4px 12px",borderRadius:99,fontWeight:700}}>⚡ 150–199% → 100% do MRR</span>
              <span style={{background:"#f59e0b22",color:"#f59e0b",padding:"4px 12px",borderRadius:99,fontWeight:700}}>🚀 200%+ → 200% do MRR</span>
            </div>
          </div>
          <div className="metas-grid">
            {["junior","pleno","senior"].map(cargo=>{
              const m=metaDraft[cargo]||{mrr:0,nr:0};
              const color=CARGO_COLOR[cargo];
              return (
                <div key={cargo} style={{background:t.bgCard,border:`1px solid ${color}33`,borderRadius:12,padding:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:color}}/>
                    <span style={{fontWeight:700,color,fontSize:14}}>{CARGO_LABEL[cargo]}</span>
                  </div>
                  <div style={{marginBottom:12}}>
                    <Label t={t}>Meta MRR (R$)</Label>
                    <input type="number" value={m.mrr||""} onChange={e=>updMeta(cargo,"mrr",e.target.value)} placeholder="Ex: 15000" style={{...inp(t),color:"#38bdf8",fontWeight:700,fontSize:16,textAlign:"right"}}/>
                    <div style={{fontSize:10,color:"#546e8a",marginTop:4}}>⚡ 150%: {R$((m.mrr||0)*1.5)} · 🚀 200%: {R$((m.mrr||0)*2)}</div>
                  </div>
                  <div>
                    <Label t={t}>Meta NR (R$)</Label>
                    <input type="number" value={m.nr||""} onChange={e=>updMeta(cargo,"nr",e.target.value)} placeholder="Ex: 22000" style={{...inp(t),color:"#a78bfa",fontWeight:700,fontSize:16,textAlign:"right"}}/>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{marginTop:14}}><Btn t={t} onClick={saveMetasMes} disabled={saving}>{saving?<><Spinner size={13}/> Salvando…</>:"Salvar Metas"}</Btn></div>
        </div>
      )}

      {tab==="produtos"&&(
        <div>
          <div className="produtos-tabs" style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {produtos.map(p=><button key={p.id} onClick={()=>{setSelId(p.id);sync(p);}} style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${selId===p.id?"#546e8a":"#243448"}`,cursor:"pointer",fontSize:13,fontWeight:700,background:selId===p.id?"#1a2d4a":"#0d1117",color:selId===p.id?"#38bdf8":"#2a5a80"}}>{p.nome}</button>)}
          </div>
          <div className="params-grid">
            <div style={{background:t.bgCard,border:"1px solid #0c1f35",borderRadius:12,padding:20}}>
              <div style={{fontSize:11,color:"#546e8a",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:16}}>Configurações</div>
              <div style={{background:t.tableHead,borderRadius:10,padding:"14px 16px",marginBottom:12,border:"1px solid #0c2a42"}}>
                <div style={{fontSize:12,color:"#38bdf8",fontWeight:700,marginBottom:10}}>💳 MRR — Mensalidade</div>
                <div><Label t={t}>% de Comissão sobre MRR</Label><input type="number" value={draft.pctMRR} onChange={e=>updPct("pctMRR",+e.target.value)} style={{...inp(t),color:"#38bdf8",fontWeight:800,fontSize:18,textAlign:"center"}}/></div>
              </div>
              <div style={{background:t.tableHead,borderRadius:10,padding:"14px 16px",marginBottom:12,border:"1px solid #1e4060"}}>
                <div style={{fontSize:12,color:"#ca8a04",fontWeight:700,marginBottom:10}}>⚡ Modo de Seleção de Faixa</div>
                <div style={{display:"flex",gap:8}}>
                  {["auto","manual"].map(m=><button key={m} onClick={()=>updFaixaMode(m)} style={{flex:1,padding:"8px",border:`1px solid ${draft.selecaoFaixa===m?"#ca8a04":"#243448"}`,borderRadius:7,background:draft.selecaoFaixa===m?"#ca8a0422":"#090f1c",color:draft.selecaoFaixa===m?"#ca8a04":"#475569",cursor:"pointer",fontWeight:700,fontSize:13}}>{m==="auto"?"🤖 Automático":"✍️ Manual"}</button>)}
                </div>
              </div>
              {draft.regras.map((r,i)=>(
                <div key={r.id} style={{background:t.tableHead,borderRadius:10,padding:"14px 16px",marginBottom:10,border:`1px solid ${i===0?"#ca8a0433":"#243448"}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:i===0?"#ca8a04":"#64748b",marginBottom:10}}>{i===0?"⭐":""} {r.label}</div>
                  <div className="regras-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    <div><Label t={t}>Mín. Horas</Label><input type="number" value={r.minHoras} onChange={e=>updRegra(i,"minHoras",e.target.value)} style={inp(t)}/></div>
                    <div><Label t={t}>Mín. R$/h</Label><input type="number" value={r.minValorH} onChange={e=>updRegra(i,"minValorH",e.target.value)} style={inp(t)}/></div>
                    <div><Label t={t}>% NR</Label><input type="number" value={r.pctImpl} onChange={e=>updRegra(i,"pctImpl",e.target.value)} style={{...inp(t),color:"#a78bfa",fontWeight:800,fontSize:16}}/></div>
                  </div>
                </div>
              ))}
              <div style={{background:t.tableHead,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#546e8a",border:"1px solid #0c1f35"}}>
                💡 <b style={{color:"#38bdf8"}}>MRR</b> = mensalidade × {draft.pctMRR}% · <b style={{color:"#a78bfa"}}>NR</b> = (impl+lic) × faixa% · Pago em 2× (+2 e +3 meses)
              </div>
              <Btn t={t} onClick={save} disabled={saving}>{saving?<><Spinner size={13}/> Salvando…</>:"Salvar Parâmetros"}</Btn>
            </div>
            <div style={{background:t.bgCard,border:"1px solid #0c1f35",borderRadius:12,padding:20}}>
              <div style={{fontSize:11,color:"#546e8a",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:14}}>Simulador — {draft.nome}</div>
              {simCenarios.map((s,i)=>{
                const c=calcVenda({produtoId:draft.id,mes:"2025-01",mrr:s.mrr,horasImpl:s.h,valorHoraImpl:s.vh,licenca:s.lic,faixaIdManual:null},[draft]);
                if(!c) return null;
                return (
                  <div key={i} style={{background:t.tableHead,borderRadius:8,padding:"12px 14px",marginBottom:8,border:`1px solid ${c.isPremium?"#ca8a0422":"#243448"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:12,color:"#7fa8c0",fontWeight:600}}>MRR {R$(s.mrr)} · {s.h}h×{R$(s.vh)}{s.lic>0?` · Lic ${R$(s.lic)}`:""}</span>
                      <FaixaBadge t={t} faixa={c.faixa}/>
                    </div>
                    <div style={{display:"flex",gap:14,fontSize:12,flexWrap:"wrap"}}>
                      <span style={{color:"#546e8a"}}>MRR: <b style={{color:"#38bdf8"}}>{R$(c.comMRR)}</b></span>
                      <span style={{color:"#546e8a"}}>NR: <b style={{color:"#a78bfa"}}>{R$(c.comImpl+c.comLic)}</b></span>
                      <span style={{color:"#34d399",fontWeight:700}}>= {R$(c.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  PRODUTOS
// ══════════════════════════════════════════════════════════════════
function ProdPage({produtos,setProdutos,notify,t}) {
  const [showNew,setShowNew]=useState(false); const [nome,setNome]=useState("");
  const add=async()=>{
    if(!nome.trim()) return notify("Informe o nome.","err");
    const id=nome.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"");
    if(produtos.find(p=>p.id===id)) return notify("Já existe.","err");
    await setProdutos(p=>[...p,{id,nome:nome.trim(),ativo:true,selecao_faixa:"auto",selecaoFaixa:"auto",pct_mrr:70,pctMRR:70,regras:[{id:"r1",label:"Faixa Premium",minHoras:60,minValorH:185,pctImpl:10},{id:"r2",label:"Faixa Padrão",minHoras:0,minValorH:0,pctImpl:3.5}]}]);
    notify("Produto adicionado!"); setShowNew(false); setNome("");
  };
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <STitle t={t}>Produtos</STitle>
        <Btn t={t} onClick={()=>setShowNew(s=>!s)}><Ic n="plus" s={14}/>Novo Produto</Btn>
      </div>
      {showNew&&<div style={{background:t.bgCard,border:"1px solid #0c1f35",borderRadius:12,padding:20,marginBottom:14,display:"flex",gap:12,alignItems:"flex-end"}}>
        <div style={{flex:1}}><Label t={t}>Nome do Produto</Label><input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Mago RH" style={inp(t)} onKeyDown={e=>e.key==="Enter"&&add()}/></div>
        <Btn t={t} onClick={add}>Adicionar</Btn><Btn t={t} secondary onClick={()=>setShowNew(false)}>Cancelar</Btn>
      </div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {produtos.map(p=>{
          const np=normProd(p);
          return (
          <div key={p.id} style={{background:t.bgCard,border:"1px solid #0c1f35",borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
                <span style={{fontWeight:700,color:t.text,fontSize:15}}>{p.nome}</span>
                <span style={{background:np.selecaoFaixa==="manual"?"#f59e0b22":"#1a2d4a",color:np.selecaoFaixa==="manual"?"#f59e0b":"#38bdf8",padding:"1px 8px",borderRadius:99,fontSize:10,fontWeight:700}}>{np.selecaoFaixa==="manual"?"✍️ Manual":"🤖 Auto"}</span>
                <span style={{background:"#38bdf822",color:"#38bdf8",padding:"1px 8px",borderRadius:99,fontSize:10,fontWeight:700}}>MRR {np.pctMRR}%</span>
              </div>
              <div style={{fontSize:12,color:"#546e8a",display:"flex",gap:16,flexWrap:"wrap"}}>
                {p.regras.map((r,i)=><span key={i}>{i===0?"⭐":"◎"} {r.label}: NR {r.pctImpl}%{np.selecaoFaixa==="auto"?` · ≥${r.minHoras}h, ≥R$${r.minValorH}/h`:""}</span>)}
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{background:p.ativo?"#14532d22":"#450a0a22",color:p.ativo?"#4ade80":"#f87171",padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>{p.ativo?"Ativo":"Inativo"}</span>
              <IBtn t={t} color={p.ativo?"#f87171":"#4ade80"} onClick={()=>setProdutos(prev=>prev.map(x=>x.id===p.id?{...x,ativo:!x.ativo}:x))}><Ic n={p.ativo?"lock":"check"} s={13}/></IBtn>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  PERIOD BAR — seletor inteligente de período na topbar
// ══════════════════════════════════════════════════════════════════
function PeriodBar({page, mes, setMes, t}) {
  const semPeriodo = ["params","prod","users","relatorio","cal"];
  const now = new Date();
  const anoAtual = now.getFullYear();
  const mesAtualStr = `${anoAtual}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const [anoVis, setAnoVis] = useState(mes ? +mes.split("-")[0] : anoAtual);

  // Sync anoVis when mes changes externally
  useEffect(() => { if (mes) setAnoVis(+mes.split("-")[0]); }, [mes]);

  const MESES_LABEL = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const mesesDoAno = Array.from({length:12}, (_,i) => `${anoVis}-${String(i+1).padStart(2,"0")}`);

  const mesSel   = mes || mesAtualStr;
  const mesAno   = mesSel.split("-")[0];
  const mesNum   = +mesSel.split("-")[1];

  if (semPeriodo.includes(page)) {
    return (
      <div style={{padding:"0 28px",borderBottom:`1px solid ${t.border}`,background:t.topbarBg,height:52,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>{page==="relatorio"?"📊":page==="cal"?"🗓":"⚙️"}</span>
        <span style={{fontSize:12,color:t.textMuted,fontWeight:500}}>
          {page==="relatorio"?"Selecione o período na página" : page==="cal"?"Selecione o ano na página" : "Configurações"}
        </span>
      </div>
    );
  }

  return (
    <div className="period-bar-wrap" style={{background:t.topbarBg,borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",padding:"0 12px",minHeight:50,overflowX:"auto"}}>

      {/* Ano + setas */}
      <div style={{display:"flex",alignItems:"center",gap:2,marginRight:16,flexShrink:0}}>
        <button onClick={()=>setAnoVis(a=>a-1)}
          style={{width:26,height:26,borderRadius:7,border:`1px solid ${t.border}`,background:"transparent",cursor:"pointer",color:t.textMuted,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",fontSize:14,lineHeight:1}}
          onMouseEnter={e=>{e.currentTarget.style.background=t.bgHover;e.currentTarget.style.color=t.text;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.textMuted;}}>
          ‹
        </button>
        <div style={{minWidth:48,textAlign:"center",fontSize:13,fontWeight:800,color:anoVis===anoAtual?t.accent:t.text,fontFamily:"'Outfit',sans-serif",letterSpacing:"-0.5px"}}>
          {anoVis}
        </div>
        <button onClick={()=>setAnoVis(a=>a+1)}
          style={{width:26,height:26,borderRadius:7,border:`1px solid ${t.border}`,background:"transparent",cursor:"pointer",color:t.textMuted,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",fontSize:14,lineHeight:1}}
          onMouseEnter={e=>{e.currentTarget.style.background=t.bgHover;e.currentTarget.style.color=t.text;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.textMuted;}}>
          ›
        </button>
      </div>

      {/* Divisor */}
      <div style={{width:1,height:28,background:t.border,marginRight:16,flexShrink:0}}/>

      {/* 12 meses do ano */}
      <div style={{display:"flex",gap:3,flex:1,overflowX:"auto",alignItems:"center"}}>
        {mesesDoAno.map((mm,i) => {
          const isSel    = mm === mesSel;
          const isAtual  = mm === mesAtualStr;
          const isFuturo = mm > mesAtualStr;
          return (
            <button key={mm} onClick={()=>setMes(mm)}
              style={{
                position:"relative",
                padding:"5px 10px",
                borderRadius:9,
                border:"none",
                cursor:"pointer",
                fontSize:12,
                fontWeight: isSel ? 700 : 500,
                background: isSel
                  ? `linear-gradient(135deg,${t.accent},${t.cyan})`
                  : isAtual
                  ? `${t.accent}15`
                  : "transparent",
                color: isSel ? "#fff" : isAtual ? t.accent : isFuturo ? t.textMuted+"88" : t.textSub,
                transition:"all .18s cubic-bezier(.4,0,.2,1)",
                whiteSpace:"nowrap",
                flexShrink:0,
                boxShadow: isSel ? `0 4px 14px ${t.accent}55` : "none",
                transform: isSel ? "translateY(-1px)" : "none",
              }}
              onMouseEnter={e=>{ if(!isSel){ e.currentTarget.style.background=t.bgHover; e.currentTarget.style.color=t.text; }}}
              onMouseLeave={e=>{ if(!isSel){ e.currentTarget.style.background=isAtual?`${t.accent}15`:"transparent"; e.currentTarget.style.color=isAtual?t.accent:isFuturo?t.textMuted+"88":t.textSub; }}}>
              {MESES_LABEL[i]}
              {isAtual && !isSel && (
                <div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:t.accent}}/>
              )}
            </button>
          );
        })}
      </div>

      {/* Botão "Hoje" se ano não for atual */}
      {anoVis !== anoAtual && (
        <button onClick={()=>{ setAnoVis(anoAtual); setMes(mesAtualStr); }}
          style={{marginLeft:12,padding:"4px 11px",borderRadius:8,border:`1px solid ${t.accent}55`,background:`${t.accent}15`,color:t.accent,fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all .15s"}}
          onMouseEnter={e=>e.currentTarget.style.background=t.accent+"30"}
          onMouseLeave={e=>e.currentTarget.style.background=t.accent+"15"}>
          Hoje
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  RELATÓRIOS — Anual / Semestral / Trimestral / Mensal
// ══════════════════════════════════════════════════════════════════
function RelatorioPage({me,users,vendas,produtos,metas,t}) {
  const role = me.role;
  const isConsultor = role === "consultor";
  const now = new Date();

  const [tipo,   setTipo]   = useState("trimestral");
  const [ano,    setAno]    = useState(now.getFullYear());
  const [sem,    setSem]    = useState(now.getMonth()<6?"S1":"S2");
  const [trim,   setTrim]   = useState(`Q${Math.ceil((now.getMonth()+1)/3)}`);
  const [mesSel, setMesSel] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`);
  const [filtroConsultor, setFiltroConsultor] = useState("todos");

  const anos = Array.from({length: ano - 2025 + 3}, (_,i)=>2025+i);
  const consultores = users.filter(u=>u.role==="consultor"&&u.active);

  // Meses do período
  const mesesPeriodo = useMemo(()=>{
    const pad = n => String(n).padStart(2,"0");
    if (tipo==="mensal")     return [mesSel];
    if (tipo==="trimestral") { const q=parseInt(trim.replace("Q","")); const m1=(q-1)*3+1; return [`${ano}-${pad(m1)}`,`${ano}-${pad(m1+1)}`,`${ano}-${pad(m1+2)}`]; }
    if (tipo==="semestral")  { const m1=sem==="S1"?1:7; return Array.from({length:6},(_,i)=>`${ano}-${pad(m1+i)}`); }
    if (tipo==="anual")      return Array.from({length:12},(_,i)=>`${ano}-${pad(i+1)}`);
    return [];
  },[tipo,ano,sem,trim,mesSel]);

  // Consultores a exibir — consultor só vê ele mesmo
  const consultoresVis = useMemo(()=>{
    if (isConsultor) return [me];
    return filtroConsultor==="todos" ? consultores : consultores.filter(c=>c.id===filtroConsultor);
  },[isConsultor, me, consultores, filtroConsultor]);

  // Dados por consultor
  const dadosPeriodo = useMemo(()=>{
    return consultoresVis.map(u=>{
      const vendasP  = vendas.filter(v=>(v.consultorId||v.consultor_id)===u.id && mesesPeriodo.includes(v.mes));
      const totalMRR = vendasP.reduce((s,v)=>s+(v.mrr||0),0);
      const metaMRR  = mesesPeriodo.reduce((s,m)=>s+(metas[m]?.[u.cargo]?.mrr||0),0);
      const metaNR   = mesesPeriodo.reduce((s,m)=>s+(metas[m]?.[u.cargo]?.nr||0),0);
      const atingMRR = metaMRR>0?(totalMRR/metaMRR)*100:0;
      const pctMRR   = getPctMRR(atingMRR);
      const overInfo = getOverInfo(atingMRR);
      const vendasCalc = vendasP.map(v=>{ const c=calcVenda(v,produtos,pctMRR); return c?{...v,...c}:null; }).filter(Boolean);
      const totalNR  = vendasCalc.reduce((s,v)=>s+v.nr,0);
      const totalCom = vendasCalc.reduce((s,v)=>s+v.total,0);
      const comMRR   = vendasCalc.reduce((s,v)=>s+v.comMRR,0);
      const comNR    = vendasCalc.reduce((s,v)=>s+v.comImpl+v.comLic,0);
      const atingNR  = metaNR>0?(totalNR/metaNR)*100:0;
      const evolucao = mesesPeriodo.map(m=>({
        mes:m,
        mrr: vendas.filter(v=>(v.consultorId||v.consultor_id)===u.id&&v.mes===m).reduce((s,v)=>s+(v.mrr||0),0),
        meta: metas[m]?.[u.cargo]?.mrr||0,
      }));
      return { ...u, totalMRR, totalNR, metaMRR, metaNR, atingMRR, atingNR, pctMRR, overInfo, totalCom, comMRR, comNR, vendasCalc, evolucao, nVendas:vendasP.length };
    }).sort((a,b)=>b.totalCom-a.totalCom);
  },[consultoresVis,vendas,mesesPeriodo,metas,produtos]);

  const totais = {
    mrr:    dadosPeriodo.reduce((s,d)=>s+d.totalMRR,0),
    nr:     dadosPeriodo.reduce((s,d)=>s+d.totalNR,0),
    com:    dadosPeriodo.reduce((s,d)=>s+d.totalCom,0),
    comMRR: dadosPeriodo.reduce((s,d)=>s+d.comMRR,0),
    comNR:  dadosPeriodo.reduce((s,d)=>s+d.comNR,0),
  };

  const labelPeriodo = tipo==="mensal"?ML(mesSel):tipo==="trimestral"?`${trim}/${ano}`:tipo==="semestral"?`${sem}/${ano}`:`Ano ${ano}`;

  // Botão de tipo de período
  const TipoBtn = ({v,l}) => (
    <button onClick={()=>setTipo(v)}
      style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,
        background:tipo===v?t.accent:"transparent",
        color:tipo===v?"#fff":t.textSub,transition:"all .15s"}}>
      {l}
    </button>
  );

  // Botão de seleção genérico (ano, trim, sem, mês)
  const SelBtn = ({val,cur,set,label}) => (
    <button onClick={()=>set(val)}
      style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,
        background:cur===val?t.bgHover:"transparent",
        color:cur===val?t.accent:t.textSub,transition:"all .15s"}}>
      {label||val}
    </button>
  );

  const SelGroup = ({children}) => (
    <div style={{display:"flex",gap:3,background:t.tableHead,border:`1px solid ${t.border}`,borderRadius:9,padding:4}}>
      {children}
    </div>
  );

  return (
    <div>
      {/* HEADER */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
        <div>
          <STitle t={t} style={{margin:0}}>
            {isConsultor ? `Meus Relatórios` : `Relatórios`}
            <span style={{fontSize:14,fontWeight:500,color:t.textMuted,marginLeft:10}}>— {labelPeriodo}</span>
          </STitle>
          {isConsultor && (
            <div style={{fontSize:12,color:t.textMuted,marginTop:4}}>
              Visualizando dados de <span style={{color:t.accent,fontWeight:700}}>{me.name?.split(" ")[0]}</span>
            </div>
          )}
        </div>
      </div>

      {/* SELETORES — tipo + período */}
      <div className="rel-filtros" style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:16}}>
        {/* Tipo */}
        <div className="rel-tipo-btns">
        <SelGroup>
          <TipoBtn v="mensal"      l="📅 Mensal"/>
          <TipoBtn v="trimestral"  l="📊 Trim."/>
          <TipoBtn v="semestral"   l="📈 Sem."/>
          <TipoBtn v="anual"       l="🗓 Anual"/>
        </SelGroup>
        </div>

        {/* Ano */}
        {tipo!=="mensal" && (
          <SelGroup>{anos.map(a=><SelBtn key={a} val={a} cur={ano} set={setAno}/>)}</SelGroup>
        )}

        {/* Trimestre */}
        {tipo==="trimestral" && (
          <SelGroup>{["Q1","Q2","Q3","Q4"].map(q=><SelBtn key={q} val={q} cur={trim} set={setTrim}/>)}</SelGroup>
        )}

        {/* Semestre */}
        {tipo==="semestral" && (
          <SelGroup>
            <SelBtn val="S1" cur={sem} set={setSem} label="1º Sem."/>
            <SelBtn val="S2" cur={sem} set={setSem} label="2º Sem."/>
          </SelGroup>
        )}

        {/* Mês */}
        {tipo==="mensal" && (
          <SelGroup>
            {Array.from({length:12},(_,i)=>{
              const m=`${now.getFullYear()}-${String(i+1).padStart(2,"0")}`;
              return <SelBtn key={m} val={m} cur={mesSel} set={setMesSel} label={["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i]}/>;
            })}
          </SelGroup>
        )}

        {/* Filtro consultor — só para gestor/parametros */}
        {!isConsultor && (
          <select value={filtroConsultor} onChange={e=>setFiltroConsultor(e.target.value)}
            style={{...selS(t),width:"auto",minWidth:160,maxWidth:"100%"}}>
            <option value="todos">Toda a equipe</option>
            {consultores.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Pílulas dos meses */}
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {mesesPeriodo.map(m=>(
          <span key={m} style={{background:t.accentGlow,color:t.accent,padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:600,border:`1px solid ${t.accent}33`}}>
            {ML(m)}
          </span>
        ))}
      </div>

      {/* CARDS DE TOTAIS */}
      <div className="stat-grid-5" style={{marginBottom:20}}>
        <StatCard t={t} l="MRR Total"       v={R$(totais.mrr)}    c={t.accent}   icon="💳"/>
        <StatCard t={t} l="NR Total"        v={R$(totais.nr)}     c={t.purple}   icon="🔧"/>
        <StatCard t={t} l="Com. MRR"        v={R$(totais.comMRR)} c={t.green}    icon="📈"/>
        <StatCard t={t} l="Com. NR"         v={R$(totais.comNR)}  c={t.green}    icon="⚙️"/>
        <StatCard t={t} l="Total Comissões" v={R$(totais.com)}    c={t.amber}    icon="💰"/>
      </div>

      {/* TABELA RESUMO — só para gestor com múltiplos consultores */}
      {!isConsultor && consultoresVis.length > 1 && (
        <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:14,overflow:"hidden",marginBottom:20}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${t.border}`,background:t.tableHead,display:"flex",alignItems:"center",gap:10}}>
            <Ic n="team" s={15}/>
            <span style={{fontSize:13,fontWeight:700,color:t.text}}>Resumo da Equipe — {labelPeriodo}</span>
          </div>
          <div className="table-scroll">
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:550}}>
              <thead><tr>
                <TH t={t}>Consultor</TH><TH t={t}>Cargo</TH><TH t={t}>Vendas</TH>
                <TH t={t} right>MRR</TH><TH t={t} right>Meta</TH><TH t={t} right>Ating.</TH>
                <TH t={t} right>Com. MRR</TH><TH t={t} right>Com. NR</TH><TH t={t} right>Total</TH>
              </tr></thead>
              <tbody>
                {dadosPeriodo.length===0
                  ? <tr><td colSpan={9}><Empty t={t} msg="Nenhum dado no período."/></td></tr>
                  : dadosPeriodo.map((d,i)=>(
                  <tr key={d.id} style={{borderBottom:i<dadosPeriodo.length-1?`1px solid ${t.border}22`:"none"}}>
                    <TD t={t} bold color={t.text}>{d.name}</TD>
                    <TD t={t}><span style={{background:CARGO_COLOR[d.cargo]+"22",color:CARGO_COLOR[d.cargo],padding:"1px 8px",borderRadius:99,fontSize:11,fontWeight:700}}>{CARGO_LABEL[d.cargo]}</span></TD>
                    <TD t={t}>{d.nVendas}</TD>
                    <TD t={t} right bold color={t.accent}>{R$(d.totalMRR)}</TD>
                    <TD t={t} right color={t.textMuted}>{R$(d.metaMRR)}</TD>
                    <TD t={t} right><span style={{background:d.overInfo.bg,color:d.overInfo.color,padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:800}}>{d.atingMRR.toFixed(0)}%</span></TD>
                    <TD t={t} right bold color={t.green}>{R$(d.comMRR)}</TD>
                    <TD t={t} right bold color={t.purple}>{R$(d.comNR)}</TD>
                    <TD t={t} right bold color={t.amber}>{R$(d.totalCom)}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARDS INDIVIDUAIS — um por consultor */}
      {dadosPeriodo.map(d=>(
        <div key={d.id} style={{background:t.bgCard,border:`1px solid ${d.overInfo.border||t.border}`,borderRadius:14,overflow:"hidden",marginBottom:16}}>
          {/* Header do consultor */}
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${t.border}`,background:t.tableHead,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${CARGO_COLOR[d.cargo]},${t.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff",flexShrink:0}}>
                {d.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{fontWeight:700,color:t.text,fontSize:14}}>{d.name}</div>
                <div style={{fontSize:11,color:t.textMuted}}>{CARGO_LABEL[d.cargo]} · {d.nVendas} venda{d.nVendas!==1?"s":""}</div>
              </div>
              <span style={{background:d.overInfo.bg,color:d.overInfo.color,padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:800,border:`1px solid ${d.overInfo.border||t.border}`}}>
                {d.overInfo.label} · {d.atingMRR.toFixed(0)}%
              </span>
            </div>
            <div>
              <div style={{fontSize:11,color:t.textMuted}}>Total comissões</div>
              <div style={{fontSize:22,fontWeight:900,color:t.amber,fontFamily:"'Outfit',sans-serif",letterSpacing:"-1px"}}>{R$(d.totalCom)}</div>
            </div>
          </div>

          {/* Mini cards de resumo */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,padding:"14px 20px",borderBottom:`1px solid ${t.border}`}}>
            <MiniCard t={t} l="MRR"       v={R$(d.totalMRR)} c={t.accent}/>
            <MiniCard t={t} l="Meta MRR"  v={R$(d.metaMRR)}  c={t.textSub}/>
            <MiniCard t={t} l="NR"        v={R$(d.totalNR)}  c={t.purple}/>
            <MiniCard t={t} l="Meta NR"   v={R$(d.metaNR)}   c={t.textSub}/>
            <MiniCard t={t} l="Com. MRR"  v={R$(d.comMRR)}   c={t.green}/>
            <MiniCard t={t} l="Com. NR"   v={R$(d.comNR)}    c={t.green}/>
          </div>

          {/* Barra de atingimento */}
          {d.metaMRR > 0 && (
            <div style={{padding:"12px 20px",borderBottom:`1px solid ${t.border}`}}>
              <OverBar t={t} ating={d.atingMRR}/>
            </div>
          )}

          {/* Tabela de vendas */}
          {d.vendasCalc.length > 0 ? (
            <div className="table-scroll">
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:650}}>
                <thead><tr>
                  <TH t={t}>Mês</TH><TH t={t}>Produto</TH><TH t={t}>Cliente</TH>
                  <TH t={t} right>MRR</TH><TH t={t} right>NR</TH>
                  <TH t={t}>Faixa</TH>
                  <TH t={t} right>Com. Total</TH>
                  <TH t={t} right>1ª Parcela</TH><TH t={t} right>2ª Parcela</TH>
                </tr></thead>
                <tbody>
                  {d.vendasCalc.map((v,i)=>{
                    const prod = produtos.find(p=>p.id===v.produtoId);
                    return (
                      <tr key={v.id||i} style={{borderBottom:i<d.vendasCalc.length-1?`1px solid ${t.border}22`:"none"}}>
                        <TD t={t} color={t.textMuted}>{ML(v.mes)}</TD>
                        <TD t={t} bold color={t.text}>{prod?.nome}</TD>
                        <TD t={t} color={t.textSub}>{v.cliente}</TD>
                        <TD t={t} right bold color={t.accent}>{v.soImpl?"—":R$(v.mrr)}</TD>
                        <TD t={t} right color={t.purple}>{R$(v.nr)}</TD>
                        <TD t={t}><FaixaBadge t={t} faixa={v.faixa}/></TD>
                        <TD t={t} right bold color={t.amber}>{R$(v.total)}</TD>
                        <TD t={t} right color={t.accent}>
                          {R$(v.parcela)}
                          <div style={{fontSize:9,color:t.textMuted}}>{ML(v.mesParcela1)}</div>
                        </TD>
                        <TD t={t} right color={t.purple}>
                          {R$(v.parcela)}
                          <div style={{fontSize:9,color:t.textMuted}}>{ML(v.mesParcela2)}</div>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty t={t} msg="Nenhuma venda neste período."/>
          )}
        </div>
      ))}

      {dadosPeriodo.length === 0 && (
        <Empty t={t} msg="Nenhum dado encontrado para o período selecionado."/>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  USUÁRIOS (via Supabase Auth)
// ══════════════════════════════════════════════════════════════════
function UsersPage({users,createUserProfile,updateProfile,notify,me,t}) {
  const EMPTY={name:"",email:"",password:"",role:"consultor",cargo:"junior"};
  const [form,setForm]=useState(EMPTY); const [editId,setEditId]=useState(null); const [saving,setSaving]=useState(false);
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));

  const save=async()=>{
    if(!form.name.trim()||!form.email.trim()) return notify("Preencha nome e e-mail.","err");
    setSaving(true);
    if(editId){
      const {error}=await updateProfile(editId,{name:form.name,role:form.role,cargo:form.cargo||null,active:true});
      if(error) notify("Erro: "+error.message,"err");
      else { notify("Perfil atualizado!"); setEditId(null); setForm(EMPTY); }
    } else {
      if(!form.password.trim()) { setSaving(false); return notify("Informe a senha.","err"); }
      const {error}=await createUserProfile(form);
      if(error) notify("Erro: "+error.message,"err");
      else { notify("Usuário criado! Confirmar e-mail para ativar."); setForm(EMPTY); }
    }
    setSaving(false);
  };

  const RC={consultor:"#38bdf8",gestor:"#a78bfa",parametros:"#f59e0b"};
  return (
    <div>
      <STitle t={t}>Usuários</STitle>
      <div style={{background:t.bgCard,border:"1px solid #0c1f35",borderRadius:12,padding:22,marginBottom:20}}>
        <div style={{fontSize:11,color:"#546e8a",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>{editId?"✏ Editando":"➕ Novo usuário"}</div>
        <div style={{background:t.tableHead,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#546e8a",border:"1px solid #0c2a42"}}>
          <Ic n="db" s={12}/> Usuários são criados via <b style={{color:"#38bdf8"}}>Supabase Auth</b>. Um e-mail de confirmação será enviado automaticamente.
        </div>
        <div className="usuarios-form-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,alignItems:"end"}}>
          <div><Label t={t}>Nome</Label><input value={form.name} onChange={e=>F("name",e.target.value)} placeholder="Nome completo" style={inp(t)}/></div>
          {!editId&&<div><Label t={t}>E-mail</Label><input value={form.email} onChange={e=>F("email",e.target.value)} placeholder="email@empresa.com" style={inp(t)}/></div>}
          {!editId&&<div><Label t={t}>Senha inicial</Label><input type="password" value={form.password} onChange={e=>F("password",e.target.value)} placeholder="mín. 6 caracteres" style={inp(t)}/></div>}
          <div><Label t={t}>Perfil</Label><select value={form.role} onChange={e=>F("role",e.target.value)} style={selS(t)}><option value="consultor">Consultor</option><option value="gestor">Gestor</option><option value="parametros">Parâmetros</option></select></div>
          {form.role==="consultor"&&<div><Label t={t}>Cargo</Label><select value={form.cargo} onChange={e=>F("cargo",e.target.value)} style={selS(t)}><option value="junior">Júnior</option><option value="pleno">Pleno</option><option value="senior">Sênior</option></select></div>}
          <div style={{display:"flex",gap:8}}>
            <Btn t={t} onClick={save} disabled={saving}>{saving?<><Spinner size={13}/> Salvando…</>:editId?"Salvar":"Criar"}</Btn>
            {editId&&<Btn t={t} secondary onClick={()=>{setEditId(null);setForm(EMPTY);}}>✕</Btn>}
          </div>
        </div>
      </div>
      <div style={{background:t.bgCard,border:"1px solid #0c1f35",borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:t.tableHead}}><TH t={t}>Nome</TH><TH t={t}>Perfil</TH><TH t={t}>Cargo</TH><TH t={t}>Status</TH><TH t={t}>Ações</TH></tr></thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={u.id} style={{borderBottom:i<users.length-1?"1px solid #080f1a":"none",opacity:u.active?1:.45}}>
                <TD t={t} bold color="#e2e8f0">{u.name}<div style={{fontSize:10,color:"#6b8caa",marginTop:1}}>ID: {String(u.id).substring(0,8)}…</div></TD>
                <TD t={t}><span style={{background:RC[u.role]+"22",color:RC[u.role],padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700}}>{ROLE_LABEL[u.role]||u.role}</span></TD>
                <TD t={t}>{u.cargo?<span style={{background:CARGO_COLOR[u.cargo]+"22",color:CARGO_COLOR[u.cargo],padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700}}>{CARGO_LABEL[u.cargo]}</span>:"—"}</TD>
                <TD t={t}><span style={{background:u.active?"#14532d22":"#450a0a22",color:u.active?"#4ade80":"#f87171",padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700}}>{u.active?"Ativo":"Inativo"}</span></TD>
                <TD t={t}>
                  <div style={{display:"flex",gap:5}}>
                    <IBtn t={t} color="#38bdf8" onClick={()=>{setEditId(u.id);setForm({name:u.name,email:u.email||"",password:"",role:u.role,cargo:u.cargo||"junior"});}}><Ic n="edit" s={13}/></IBtn>
                    {u.id!==me.id&&<IBtn t={t} color={u.active?"#f87171":"#4ade80"} onClick={async()=>{const {error}=await updateProfile(u.id,{active:!u.active});if(error)notify("Erro","err");}}><Ic n={u.active?"lock":"check"} s={13}/></IBtn>}
                  </div>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
