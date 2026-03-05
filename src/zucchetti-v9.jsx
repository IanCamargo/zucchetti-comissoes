import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ══════════════════════════════════════════════════════════════════
//  SUPABASE CLIENT
// ══════════════════════════════════════════════════════════════════
const SUPABASE_URL  = "https://mvggudtoehsfecbjlqpo.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Z2d1ZHRvZWhzZmVjYmpscXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjY1OTksImV4cCI6MjA4ODMwMjU5OX0.xyQESprExcUx_14WV9Su30oxJE6YqVbXfaE4DGCURFM";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

const FontLink = () => (
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
);

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
  { id:"mago_cloud", nome:"Mago Cloud", ativo:true, selecao_faixa:"auto", pct_mrr:70,
    regras:[{id:"r1",label:"Faixa Premium",minHoras:60,minValorH:185,pctImpl:10},{id:"r2",label:"Faixa Padrão",minHoras:0,minValorH:0,pctImpl:3.5}]},
  { id:"mago_web",   nome:"Mago Web",   ativo:true, selecao_faixa:"auto", pct_mrr:70,
    regras:[{id:"r1",label:"Faixa Premium",minHoras:60,minValorH:185,pctImpl:10},{id:"r2",label:"Faixa Padrão",minHoras:0,minValorH:0,pctImpl:3.5}]},
  { id:"mago4",      nome:"Mago 4",     ativo:true, selecao_faixa:"auto", pct_mrr:70,
    regras:[{id:"r1",label:"Faixa Premium",minHoras:60,minValorH:185,pctImpl:10},{id:"r2",label:"Faixa Padrão",minHoras:0,minValorH:0,pctImpl:3.5}]},
  { id:"debx",       nome:"Debx",       ativo:true, selecao_faixa:"auto", pct_mrr:70,
    regras:[{id:"r1",label:"Faixa Premium",minHoras:60,minValorH:185,pctImpl:10},{id:"r2",label:"Faixa Padrão",minHoras:0,minValorH:0,pctImpl:3.5}]},
  { id:"softa",      nome:"Softa",      ativo:true, selecao_faixa:"auto", pct_mrr:70,
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
  // Normaliza campo do banco (selecao_faixa) para uso interno (selecaoFaixa)
  return { ...p, selecaoFaixa: p.selecao_faixa || p.selecaoFaixa || "auto", pctMRR: p.pct_mrr ?? p.pctMRR ?? 70 };
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
  const mrr           = venda.mrr           || 0;
  const licenca       = venda.licenca       || 0;
  const faixaIdManual = venda.faixaIdManual || venda.faixa_id_manual || null;

  const faixa     = getFaixa(p, horasImpl, valorHoraImpl, faixaIdManual);
  const implTotal = horasImpl * valorHoraImpl;
  const nr        = implTotal + licenca;

  const pctMRR  = pctMRRover ?? p.pctMRR;
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
//  MICRO UI
// ══════════════════════════════════════════════════════════════════
const inp  = { width:"100%", background:"#0c1a2e", border:"1px solid #0f2040", borderRadius:8, padding:"9px 12px", color:"#e2e8f0", fontSize:14, outline:"none", boxSizing:"border-box" };
const selS = { ...inp, cursor:"pointer" };
const Label  = ({children}) => <label style={{fontSize:10,color:"#1e4060",fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>{children}</label>;
const TH     = ({children,right}) => <th style={{padding:"10px 14px",textAlign:right?"right":"left",fontSize:10,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{children}</th>;
const TD     = ({children,right,bold,color,sub}) => <td style={{padding:"11px 14px",fontSize:13,color:color||"#94a3b8",fontWeight:bold?700:400,textAlign:right?"right":"left",verticalAlign:"top"}}>{children}{sub&&<div style={{fontSize:10,color:"#1e4060",marginTop:2}}>{sub}</div>}</td>;
const Empty  = ({msg}) => <div style={{padding:40,textAlign:"center",color:"#1a3a54",fontSize:14}}>{msg||"Nenhum registro."}</div>;
const STitle = ({children}) => <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:"#e2e8f0",margin:"0 0 20px",letterSpacing:"-0.5px"}}>{children}</h1>;
const StatCard=({l,v,c})=><div style={{background:"#060d18",border:"1px solid #0c1f35",borderRadius:12,padding:"18px 20px"}}><div style={{fontSize:10,color:"#1a3a54",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>{l}</div><div style={{fontSize:20,fontWeight:700,color:c,fontFamily:"'Syne',sans-serif"}}>{v}</div></div>;
const MiniCard=({l,v,c})=><div style={{background:"#040b14",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#1a3a54",marginBottom:4}}>{l}</div><div style={{fontSize:14,fontWeight:700,color:c}}>{v}</div></div>;

const Btn = ({children,onClick,secondary,sm,disabled}) => (
  <button onClick={onClick} disabled={disabled} style={{display:"flex",alignItems:"center",gap:6,padding:sm?"6px 12px":"9px 16px",background:secondary?"#0c1a2e":disabled?"#0c1a2e":"#0369a1",color:secondary?"#4a7a90":disabled?"#1e4060":"#fff",border:secondary?"1px solid #0f2040":"none",borderRadius:8,fontSize:sm?12:13,fontWeight:700,cursor:disabled?"not-allowed":"pointer",whiteSpace:"nowrap",fontFamily:"'IBM Plex Sans',sans-serif",opacity:disabled?.6:1}}>
    {children}
  </button>
);
const IBtn = ({children,onClick,color}) => (
  <button onClick={onClick} style={{background:color+"18",color,border:`1px solid ${color}33`,borderRadius:6,padding:"5px 8px",cursor:"pointer",display:"flex",alignItems:"center"}}>
    {children}
  </button>
);
const FaixaBadge = ({faixa}) => {
  if (!faixa) return null;
  const ok = faixa.id==="r1";
  return <span style={{background:ok?"#fef08a22":"#1e293b",color:ok?"#ca8a04":"#475569",padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700,border:ok?"1px solid #ca8a0433":"1px solid #334155",whiteSpace:"nowrap"}}>{ok?"⭐":""} {faixa.label}</span>;
};

const Spinner = ({size=20}) => (
  <div style={{width:size,height:size,border:"2px solid #0c1f35",borderTop:"2px solid #38bdf8",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
);

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
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d[n]}/></svg>;
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
  const [session, setSession] = useState(undefined); // undefined = carregando
  const [page,    setPage]    = useState("dash");
  const [mes,     setMes]     = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  });
  const [toast,   setToast]   = useState(null);

  // Escuta auth state
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const notify = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null), 3400); };

  const db = useSupabase(session);

  // Enquanto verifica sessão
  if (session === undefined) {
    return (
      <div style={{minHeight:"100vh",background:"#080f1a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <FontLink/>
        <Spinner size={32}/>
        <div style={{color:"#1e4060",fontSize:13}}>Conectando ao Supabase…</div>
      </div>
    );
  }

  if (!session) {
    return <Login notify={notify} toast={toast}/>;
  }

  if (db.loading) {
    return (
      <div style={{minHeight:"100vh",background:"#080f1a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <FontLink/>
        <Spinner size={32}/>
        <div style={{color:"#1e4060",fontSize:13}}>Carregando dados…</div>
      </div>
    );
  }

  // Encontra perfil do usuário logado
  const me = db.users.find(u => u.id === session.user.id) || {
    id: session.user.id,
    name: session.user.user_metadata?.name || session.user.email,
    role: "consultor",
    cargo: "junior",
    active: true,
  };
  const role = me.role;

  const nav=[
    {id:"dash",   label:"Dashboard",  icon:"dash",   roles:["consultor","gestor","parametros"]},
    {id:"vendas", label:"Vendas",     icon:"sales",  roles:["consultor","gestor","parametros"]},
    {id:"equipe", label:"Equipe",     icon:"team",   roles:["gestor","parametros"]},
    {id:"cal",    label:"Calendário", icon:"cal",    roles:["consultor","gestor","parametros"]},
    {id:"hist",   label:"Histórico",  icon:"hist",   roles:["consultor","gestor","parametros"]},
    {id:"params", label:"Parâmetros", icon:"params", roles:["parametros"]},
    {id:"prod",   label:"Produtos",   icon:"prod",   roles:["parametros"]},
    {id:"users",  label:"Usuários",   icon:"users",  roles:["gestor","parametros"]},
  ].filter(n=>n.roles.includes(role));

  const logout = async () => {
    await sb.auth.signOut();
    setSession(null);
  };

  return (
    <div style={{minHeight:"100vh",background:"#080f1a",color:"#cbd5e1",fontFamily:"'IBM Plex Sans',sans-serif",display:"flex"}}>
      <FontLink/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} * { scrollbar-width:thin; scrollbar-color:#0c1f35 #040b14; }`}</style>

      {/* SIDEBAR */}
      <aside style={{width:224,background:"#060d18",borderRight:"1px solid #0c1f35",display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,zIndex:10}}>
        <div style={{padding:"26px 20px 20px",borderBottom:"1px solid #0c1f35"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"#fff",letterSpacing:"-0.5px"}}><span style={{color:"#38bdf8"}}>Z</span>ucchetti</div>
          <div style={{fontSize:9,color:"#1a3a54",marginTop:3,textTransform:"uppercase",letterSpacing:2.5,fontWeight:700}}>Comissionamento</div>
          {/* Indicador online */}
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#34d399"}}/>
            <span style={{fontSize:10,color:"#1e4060"}}>Supabase conectado</span>
            {db.syncing && <Spinner size={10}/>}
          </div>
        </div>
        <nav style={{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:2}}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,background:page===n.id?"#0c2a42":"transparent",color:page===n.id?"#38bdf8":"#2a4e6a",border:"none",cursor:"pointer",fontSize:13,fontWeight:page===n.id?600:400,textAlign:"left",transition:"all .15s"}}>
              <Ic n={n.icon} s={15}/>{n.label}
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 10px",borderTop:"1px solid #0c1f35"}}>
          <div style={{padding:"8px 12px",marginBottom:4}}>
            <div style={{fontSize:13,fontWeight:600,color:"#7fa8c0"}}>{me.name?.split(" ")[0]}</div>
            <div style={{fontSize:10,color:"#1a3a54",marginTop:1}}>{ROLE_LABEL[role]||role}{me.cargo?` · ${CARGO_LABEL[me.cargo]}`:""}</div>
            <div style={{fontSize:9,color:"#0c2a42",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.user.email}</div>
          </div>
          <button onClick={logout} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:7,background:"transparent",color:"#ef4444",border:"none",cursor:"pointer",fontSize:12,width:"100%"}}>
            <Ic n="logout" s={13}/> Sair
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,marginLeft:224,minHeight:"100vh"}}>
        {/* TOAST */}
        {toast&&<div style={{position:"fixed",top:20,right:20,zIndex:999,background:toast.type==="ok"?"#052e16":"#450a0a",color:toast.type==="ok"?"#86efac":"#fca5a5",padding:"11px 18px",borderRadius:10,fontSize:13,fontWeight:500,border:`1px solid ${toast.type==="ok"?"#166534":"#991b1b"}`,display:"flex",alignItems:"center",gap:8,boxShadow:"0 8px 24px rgba(0,0,0,.4)"}}>
          <Ic n="check" s={14}/>{toast.msg}
        </div>}

        {/* TOPBAR com seletor de mês */}
        <div style={{padding:"18px 32px 14px",borderBottom:"1px solid #0c1f35",background:"#060d18",position:"sticky",top:0,zIndex:5,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"#1a3a54",fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginRight:4}}>Competência</span>
          {MESES_LIST.slice(0,10).map(m=>(
            <button key={m} onClick={()=>setMes(m)} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:mes===m?"#0c2a42":"transparent",color:mes===m?"#38bdf8":"#1e4060",transition:"all .15s"}}>
              {ML(m)}
            </button>
          ))}
        </div>

        <div style={{padding:"28px 32px 48px"}}>
          {page==="dash"   && <DashPage   me={me} users={db.users} vendas={db.vendas} produtos={db.produtos} mes={mes} metas={db.metas}/>}
          {page==="vendas" && <VendasPage me={me} users={db.users} vendas={db.vendas} addVenda={db.addVenda} updateVenda={db.updateVenda} deleteVenda={db.deleteVenda} produtos={db.produtos} mes={mes} notify={notify} metas={db.metas}/>}
          {page==="equipe" && <EquipePage users={db.users} vendas={db.vendas} produtos={db.produtos} mes={mes} metas={db.metas}/>}
          {page==="cal"    && <CalPage    me={me} users={db.users} vendas={db.vendas} produtos={db.produtos} mes={mes} metas={db.metas}/>}
          {page==="hist"   && <HistPage   me={me} users={db.users} vendas={db.vendas} produtos={db.produtos} metas={db.metas}/>}
          {page==="params" && <ParamsPage produtos={db.produtos} setProdutos={db.setProdutos} me={me} notify={notify} metas={db.metas} saveMetas={db.saveMetas}/>}
          {page==="prod"   && <ProdPage   produtos={db.produtos} setProdutos={db.setProdutos} notify={notify}/>}
          {page==="users"  && <UsersPage  users={db.users} createUserProfile={db.createUserProfile} updateProfile={db.updateProfile} notify={notify} me={me}/>}
        </div>
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  LOGIN (Supabase Auth)
// ══════════════════════════════════════════════════════════════════
function Login({notify, toast}) {
  const [email,setEmail]=useState(""); const [pw,setPw]=useState("");
  const [err,setErr]=useState(""); const [load,setLoad]=useState(false);

  const go = async () => {
    setLoad(true); setErr("");
    const { error } = await sb.auth.signInWithPassword({ email, password:pw });
    if (error) { setErr(error.message === "Invalid login credentials" ? "E-mail ou senha inválidos." : error.message); }
    setLoad(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#080f1a",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <FontLink/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {toast&&<div style={{position:"fixed",top:20,right:20,zIndex:999,background:"#052e16",color:"#86efac",padding:"11px 18px",borderRadius:10,fontSize:13,fontWeight:500,border:"1px solid #166534"}}>{toast.msg}</div>}
      <div style={{width:420,padding:"44px 40px",background:"#060d18",borderRadius:16,border:"1px solid #0c1f35",boxShadow:"0 30px 60px rgba(0,0,0,.6)"}}>
        <div style={{textAlign:"center",marginBottom:34}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:34,fontWeight:800,color:"#fff",letterSpacing:"-1px"}}><span style={{color:"#38bdf8"}}>Z</span>ucchetti</div>
          <div style={{color:"#1a3a54",fontSize:11,marginTop:5,textTransform:"uppercase",letterSpacing:3,fontWeight:700}}>Comissionamento</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:10}}>
            <Ic n="cloud" s={12}/><span style={{fontSize:10,color:"#1e4060"}}>Powered by Supabase</span>
          </div>
        </div>
        {err&&<div style={{background:"#450a0a",color:"#fca5a5",padding:"10px 14px",borderRadius:8,fontSize:13,marginBottom:16,border:"1px solid #7f1d1d"}}>{err}</div>}
        <div style={{marginBottom:14}}>
          <Label>E-MAIL</Label>
          <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="seu@email.com" style={inp}/>
        </div>
        <div style={{marginBottom:14}}>
          <Label>SENHA</Label>
          <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="••••••" style={inp}/>
        </div>
        <button onClick={go} disabled={load} style={{width:"100%",padding:"13px",background:load?"#0c1a2e":"#0369a1",color:load?"#1e4060":"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:700,cursor:load?"not-allowed":"pointer",marginTop:8,fontFamily:"'Syne',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          {load ? <><Spinner size={16}/> Verificando…</> : "Entrar"}
        </button>
        <div style={{marginTop:20,padding:14,background:"#040b14",borderRadius:8,fontSize:12,color:"#1a3a54",border:"1px solid #0c1f35"}}>
          <div style={{fontWeight:700,color:"#1e4060",marginBottom:8,fontSize:10,textTransform:"uppercase",letterSpacing:.5}}>ℹ️ Primeiro acesso?</div>
          <div style={{color:"#1e5070",lineHeight:1.6}}>Peça ao administrador para criar sua conta na aba <b style={{color:"#38bdf8"}}>Usuários</b> do sistema. O e-mail de confirmação chegará na sua caixa de entrada.</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════════

// Barra de overperformance reutilizável
function OverBar({ating, height=8}) {
  const pct   = Math.min(ating, 220);
  const color = ating>=200?"#f59e0b":ating>=150?"#34d399":"#38bdf8";
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#1e4060",marginBottom:3}}>
        <span>0%</span><span style={{color:"#38bdf8"}}>150%</span><span style={{color:"#34d399"}}>200%</span>
      </div>
      <div style={{position:"relative",height,background:"#0c1f35",borderRadius:99,overflow:"hidden"}}>
        <div style={{position:"absolute",left:"68.2%",top:0,bottom:0,width:1,background:"#38bdf855"}}/>
        <div style={{position:"absolute",left:"90.9%",top:0,bottom:0,width:1,background:"#34d39955"}}/>
        <div style={{width:`${pct/220*100}%`,height:"100%",background:color,borderRadius:99,transition:"width .6s"}}/>
      </div>
      <div style={{fontSize:11,color,fontWeight:700,marginTop:3}}>{ating.toFixed(1)}% da meta</div>
    </div>
  );
}

// Gráfico de barras simples (evolução mensal do MRR no trimestre)
function GraficoEvolucao({evolucao, overInfo}) {
  const maxVal = Math.max(...evolucao.map(e => Math.max(e.mrr, e.metaMRR)), 1);
  return (
    <div style={{display:"flex",gap:8,alignItems:"flex-end",height:80,marginTop:8}}>
      {evolucao.map((e, i) => {
        const hMRR  = (e.mrr     / maxVal) * 72;
        const hMeta = (e.metaMRR / maxVal) * 72;
        const ating = e.metaMRR > 0 ? (e.mrr / e.metaMRR) * 100 : 0;
        const cor   = ating >= 200 ? "#f59e0b" : ating >= 150 ? "#34d399" : ating >= 100 ? "#38bdf8" : "#1e4060";
        return (
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{fontSize:9,color:cor,fontWeight:700}}>{R$(e.mrr).replace("R$","").trim()}</div>
            <div style={{width:"100%",display:"flex",alignItems:"flex-end",gap:2,height:60,justifyContent:"center"}}>
              {/* barra meta */}
              <div style={{width:"40%",height:hMeta,background:"#0c2a42",borderRadius:"3px 3px 0 0",border:"1px solid #1e4060"}}/>
              {/* barra realizado */}
              <div style={{width:"40%",height:hMRR,background:cor,borderRadius:"3px 3px 0 0",opacity:.9}}/>
            </div>
            <div style={{fontSize:9,color:"#1e4060",fontWeight:600}}>{ML(e.mes).split("/")[0]}</div>
          </div>
        );
      })}
      <div style={{display:"flex",flexDirection:"column",gap:4,justifyContent:"flex-end",paddingBottom:16,marginLeft:4}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,background:"#0c2a42",border:"1px solid #1e4060",borderRadius:2}}/><span style={{fontSize:9,color:"#1e4060"}}>Meta</span></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,background:overInfo.color,borderRadius:2}}/><span style={{fontSize:9,color:"#1e4060"}}>Realizado</span></div>
      </div>
    </div>
  );
}

function DashPage({me,users,vendas,produtos,mes,metas}) {
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
    <div>
      {/* HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <STitle style={{margin:0}}>{role==="consultor"?`Olá, ${me.name?.split(" ")[0]}! 👋`:`Dashboard — ${ML(mes)}`}</STitle>
        {/* Toggle mensal / trimestral */}
        <div style={{display:"flex",background:"#040b14",border:"1px solid #0c1f35",borderRadius:10,padding:4,gap:4}}>
          {[["mensal","📅 Mensal"],["trimestral","📊 Trimestral"]].map(([v,l])=>(
            <button key={v} onClick={()=>setViewMode(v)} style={{padding:"6px 16px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:viewMode===v?"#0c2a42":"transparent",color:viewMode===v?"#38bdf8":"#1e4060",transition:"all .15s"}}>{l}</button>
          ))}
        </div>
      </div>

      {/* LEGENDA OVER */}
      <div style={{background:"#040b14",border:"1px solid #0c2a42",borderRadius:10,padding:"10px 16px",marginBottom:18,display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>Over MRR {viewMode==="trimestral"?"trimestral":"mensal"}:</span>
        <span style={{background:"#38bdf822",color:"#38bdf8",padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>70% · até 149%</span>
        <span style={{background:"#34d39922",color:"#34d399",padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>⚡ 100% · 150–199%</span>
        <span style={{background:"#f59e0b22",color:"#f59e0b",padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>🚀 200% · ≥200%</span>
        {viewMode==="trimestral"&&<span style={{fontSize:10,color:"#1e4060",marginLeft:"auto"}}>Acerto pago em {porConsultor[0]?`${ML(porConsultor[0].trim.trim.parc1)} e ${ML(porConsultor[0].trim.trim.parc2)}`:"+5 e +6 meses"}</span>}
        {viewMode==="mensal"&&<span style={{fontSize:10,color:"#1e4060",marginLeft:"auto"}}>Pagamento: +2 e +3 meses</span>}
      </div>

      {/* STAT CARDS — gestor/params */}
      {role!=="consultor"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
          {viewMode==="mensal"&&<>
            <StatCard l="Total Comissões"     v={R$(totGeral)} c="#34d399"/>
            <StatCard l="Consultores"         v={porConsultor.length} c="#38bdf8"/>
            <StatCard l="Em Overperformance"  v={porConsultor.filter(c=>c.atingMRR>=150).length} c="#f59e0b"/>
            <StatCard l="MRR Total do Mês"    v={R$(porConsultor.reduce((s,c)=>s+c.totalMRR,0))} c="#a78bfa"/>
          </>}
          {viewMode==="trimestral"&&<>
            <StatCard l={`MRR Total ${porConsultor[0]?.trim.trim.label||""}`} v={R$(totMRRTrim)} c="#34d399"/>
            <StatCard l="Consultores c/ Over Trim." v={porConsultor.filter(c=>c.trim.atingMRRTrim>=150).length} c="#f59e0b"/>
            <StatCard l="Total Acerto Over"  v={R$(totAcerto)} c="#a78bfa"/>
            <StatCard l="🚀 200%+ Trim."     v={porConsultor.filter(c=>c.trim.atingMRRTrim>=200).length} c="#f59e0b"/>
          </>}
        </div>
      )}

      {/* CARDS POR CONSULTOR */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {porConsultor.length===0&&<div style={{background:"#060d18",border:"1px solid #0c1f35",borderRadius:12}}><Empty msg="Sem vendas neste mês."/></div>}
        {porConsultor.map(c=>{
          const t = c.trim;
          const borderColor = viewMode==="mensal"
            ? (c.atingMRR>=200?"#f59e0b44":c.atingMRR>=150?"#34d39944":"#0c1f35")
            : (t.atingMRRTrim>=200?"#f59e0b44":t.atingMRRTrim>=150?"#34d39944":"#0c1f35");
          return (
          <div key={c.id} style={{background:"#060d18",border:`1px solid ${borderColor}`,borderRadius:12,overflow:"hidden"}}>

            {/* ── HEADER CARD ── */}
            <div style={{padding:"14px 20px",borderBottom:"1px solid #080f1a",display:"flex",gap:16,flexWrap:"wrap",justifyContent:"space-between",alignItems:"flex-start",background:"#040b14"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:CARGO_COLOR[c.cargo]||"#38bdf8"}}/>
                <span style={{fontWeight:700,color:"#e2e8f0",fontSize:15}}>{c.name}</span>
                <span style={{background:CARGO_COLOR[c.cargo]+"22",color:CARGO_COLOR[c.cargo],padding:"1px 8px",borderRadius:99,fontSize:11,fontWeight:700}}>{CARGO_LABEL[c.cargo]}</span>
                {viewMode==="mensal"&&<span style={{background:c.overInfo.bg,color:c.overInfo.color,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:800,border:`1px solid ${c.overInfo.border}`}}>{c.overInfo.label} mensal</span>}
                {viewMode==="trimestral"&&<span style={{background:t.overInfoTrim.bg,color:t.overInfoTrim.color,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:800,border:`1px solid ${t.overInfoTrim.border}`}}>{t.overInfoTrim.label} trim. · {t.trim.label}</span>}
              </div>
              {/* Valor destaque */}
              <div style={{textAlign:"right"}}>
                {viewMode==="mensal"&&<>
                  <div style={{fontSize:10,color:"#1e4060",marginBottom:2}}>Comissão do mês</div>
                  <div style={{fontSize:22,fontWeight:800,color:"#34d399",fontFamily:"'Syne',sans-serif"}}>{R$(c.totalCom)}</div>
                  <div style={{fontSize:11,color:"#1a3a54",marginTop:1}}>MRR {R$(c.vendasCalc.reduce((s,v)=>s+v.comMRR,0))} · NR {R$(c.vendasCalc.reduce((s,v)=>s+v.comImpl+v.comLic,0))}</div>
                  <div style={{fontSize:10,color:"#1e4060",marginTop:3}}>Parc: {ML(addMonths(mes,2))} · {ML(addMonths(mes,3))}</div>
                </>}
                {viewMode==="trimestral"&&<>
                  <div style={{fontSize:10,color:"#1e4060",marginBottom:2}}>Acerto over trimestral</div>
                  <div style={{fontSize:22,fontWeight:800,color:t.valorAcerto>0?"#f59e0b":"#1e4060",fontFamily:"'Syne',sans-serif"}}>{R$(t.valorAcerto)}</div>
                  {t.valorAcerto>0&&<div style={{fontSize:11,color:"#1a3a54",marginTop:1}}>+{t.pctAcerto}% sobre {R$(t.totalMRRTrim)}</div>}
                  {t.valorAcerto>0&&<div style={{fontSize:10,color:"#1e4060",marginTop:3}}>Parc: {ML(t.trim.parc1)} · {ML(t.trim.parc2)}</div>}
                  {t.valorAcerto===0&&<div style={{fontSize:11,color:"#1a3a54",marginTop:1}}>Sem acerto (abaixo de 150%)</div>}
                </>}
              </div>
            </div>

            {/* ── CORPO MENSAL ── */}
            {viewMode==="mensal"&&(
              <div style={{padding:"14px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div>
                  <div style={{fontSize:10,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Meta MRR — {R$(c.metaMRR)}/mês · Vendido: {R$(c.totalMRR)}</div>
                  <OverBar ating={c.atingMRR}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Meta NR — {R$(c.metaNR)}/mês · Realizado: {R$(c.totalNR)}</div>
                  <div style={{height:8,background:"#0c1f35",borderRadius:99,overflow:"hidden",marginBottom:3,marginTop:16}}>
                    <div style={{width:`${Math.min(c.atingNR,100)}%`,height:"100%",background:c.atingNR>=100?"#a78bfa":"#4a0080",borderRadius:99,transition:"width .4s"}}/>
                  </div>
                  <div style={{fontSize:11,color:c.atingNR>=100?"#a78bfa":"#64748b",fontWeight:700,marginTop:3}}>{c.atingNR.toFixed(1)}% da meta NR</div>
                </div>
              </div>
            )}

            {/* ── CORPO TRIMESTRAL ── */}
            {viewMode==="trimestral"&&(
              <div style={{padding:"14px 20px"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                  {/* Barra trimestral MRR */}
                  <div>
                    <div style={{fontSize:10,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>
                      Meta MRR Trimestral — {R$(t.metaTrimMRR)} · Vendido: {R$(t.totalMRRTrim)}
                    </div>
                    <OverBar ating={t.atingMRRTrim}/>
                  </div>
                  {/* Quanto falta para o próximo nível */}
                  <div style={{background:"#040b14",borderRadius:10,padding:"12px 14px",border:"1px solid #0c2a42"}}>
                    <div style={{fontSize:10,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Falta para o próximo nível</div>
                    {t.atingMRRTrim>=200
                      ? <div style={{fontSize:13,color:"#f59e0b",fontWeight:700}}>🚀 Nível máximo atingido!</div>
                      : <>
                          {t.faltaP1>0&&<div style={{fontSize:12,color:"#34d399",marginBottom:4}}>⚡ Para 100%: faltam <b>{R$(t.faltaP1)}</b></div>}
                          {t.faltaP1<=0&&t.faltaP2>0&&<div style={{fontSize:12,color:"#f59e0b",marginBottom:4}}>🚀 Para 200%: faltam <b>{R$(t.faltaP2)}</b></div>}
                        </>
                    }
                    {t.pctAcerto>0&&(
                      <div style={{marginTop:6,padding:"6px 10px",background:"#0c2a42",borderRadius:8,fontSize:11}}>
                        <span style={{color:"#1e4060"}}>Acerto atual: </span>
                        <span style={{color:t.overInfoTrim.color,fontWeight:800}}>+{t.pctAcerto}% = {R$(t.valorAcerto)}</span>
                        <div style={{color:"#1e4060",fontSize:10,marginTop:2}}>÷2: {R$(t.parcelaAcerto)} em {ML(t.trim.parc1)} e {ML(t.trim.parc2)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gráfico de evolução */}
                <div style={{background:"#040b14",borderRadius:10,padding:"12px 14px",border:"1px solid #0c1f35"}}>
                  <div style={{fontSize:10,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Evolução MRR no trimestre — {t.trim.label}</div>
                  <GraficoEvolucao evolucao={t.evolucao} overInfo={t.overInfoTrim}/>
                </div>
              </div>
            )}

            {/* ── TABELA DE CONTRATOS (só mensal) ── */}
            {viewMode==="mensal"&&c.vendasCalc.length>0&&(
              <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:860}}>
                <thead><tr style={{background:"#030810"}}>
                  <TH>Produto</TH><TH>Cliente</TH>
                  <TH>MRR</TH><TH>Impl. (h×R$/h)</TH><TH>Licença</TH><TH>NR</TH>
                  <TH>Faixa NR</TH>
                  <TH right>Com. MRR ({c.pctMRR}%)</TH><TH right>Com. NR</TH><TH right>Total</TH>
                  <TH right>1ª parc.</TH><TH right>2ª parc.</TH>
                </tr></thead>
                <tbody>
                  {c.vendasCalc.map((v,i)=>{
                    const prod=produtos.find(p=>p.id===v.produtoId);
                    return (
                      <tr key={v.id||i} style={{borderBottom:i<c.vendasCalc.length-1?"1px solid #080f1a":"none"}}>
                        <TD bold color="#e2e8f0">{prod?.nome}</TD>
                        <TD>{v.cliente}</TD>
                        <TD bold color="#38bdf8">{R$(v.mrr)}</TD>
                        <TD>{R$(v.implTotal)}<div style={{fontSize:10,color:"#1e4060"}}>{v.horasImpl}h × {R$(v.valorHoraImpl)}/h</div></TD>
                        <TD color={v.licenca>0?"#a78bfa":"#1e4060"}>{v.licenca>0?R$(v.licenca):"—"}</TD>
                        <TD bold color="#e2e8f0">{R$(v.nr)}</TD>
                        <TD><FaixaBadge faixa={v.faixa}/></TD>
                        <TD right bold><span style={{color:c.overInfo.color}}>{R$(v.comMRR)}</span></TD>
                        <TD right color="#a78bfa" bold>{R$(v.comImpl+v.comLic)}</TD>
                        <TD right bold color="#e2e8f0">{R$(v.total)}</TD>
                        <TD right color="#38bdf8" bold>{R$(v.parcela)}<div style={{fontSize:10,color:"#1e4060"}}>{ML(v.mesParcela1)}</div></TD>
                        <TD right color="#818cf8" bold>{R$(v.parcela)}<div style={{fontSize:10,color:"#1e4060"}}>{ML(v.mesParcela2)}</div></TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
            {viewMode==="mensal"&&c.vendasCalc.length===0&&<div style={{padding:"16px 20px",fontSize:12,color:"#1a3a54"}}>Sem contratos lançados neste mês.</div>}
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
function VendasPage({me,users,vendas,addVenda,updateVenda,deleteVenda,produtos,mes,notify,metas}) {
  const role=me.role;
  const consultores=role==="consultor"?[me]:users.filter(u=>u.role==="consultor"&&u.active);
  const EMPTY={consultorId:me.id,produtoId:produtos[0]?.id||"",cliente:"",mrr:"",horasImpl:"",valorHoraImpl:"",licenca:"",faixaIdManual:"",obs:""};
  const [form,setForm]=useState(EMPTY);
  const [editId,setEditId]=useState(null);
  const [saving,setSaving]=useState(false);
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));

  const prodSel=produtos.find(p=>p.id===form.produtoId);
  const isManual=normProd(prodSel||{}).selecaoFaixa==="manual";

  const overMes = useMemo(()=>
    calcMesConsultor(+form.consultorId||form.consultorId, mes, vendas, produtos, metas, users),
    [form.consultorId, mes, vendas, produtos, metas, users]);

  const prev=useMemo(()=>{
    if(!form.mrr&&!form.horasImpl) return null;
    return calcVenda({...form,mes,mrr:+form.mrr||0,horasImpl:+form.horasImpl||0,valorHoraImpl:+form.valorHoraImpl||0,licenca:+form.licenca||0},produtos,overMes.pctMRR);
  },[form,produtos,mes,overMes]);

  const save=async()=>{
    if(!form.cliente.trim()) return notify("Informe o cliente.","err");
    if(!form.mrr||+form.mrr<=0) return notify("Informe o MRR.","err");
    if(!form.horasImpl||+form.horasImpl<=0) return notify("Informe as horas.","err");
    if(!form.valorHoraImpl||+form.valorHoraImpl<=0) return notify("Informe o valor/hora.","err");
    if(isManual&&!form.faixaIdManual) return notify("Selecione a faixa.","err");
    setSaving(true);
    const entry={
      consultorId: form.consultorId,
      mes, produtoId:form.produtoId, cliente:form.cliente,
      mrr:+form.mrr, horasImpl:+form.horasImpl, valorHoraImpl:+form.valorHoraImpl,
      licenca:+form.licenca||0, faixaIdManual:form.faixaIdManual||null, obs:form.obs,
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
    <div>
      <STitle>Lançar Venda — {ML(mes)}</STitle>
      <div style={{background:"#060d18",border:"1px solid #0c1f35",borderRadius:12,padding:22,marginBottom:20}}>
        <div style={{fontSize:11,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>{editId?"✏ Editando":"➕ Nova venda"}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:14}}>
          {role!=="consultor"&&<div style={{gridColumn:"span 2"}}><Label>Consultor</Label><select value={form.consultorId} onChange={e=>F("consultorId",e.target.value)} style={selS}>{consultores.map(c=><option key={c.id} value={c.id}>{c.name} ({CARGO_LABEL[c.cargo]})</option>)}</select></div>}
          <div><Label>Produto</Label><select value={form.produtoId} onChange={e=>{F("produtoId",e.target.value);F("faixaIdManual","");}} style={selS}>{produtos.filter(p=>p.ativo).map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
          <div style={{gridColumn:"span 2"}}><Label>Nome do Cliente</Label><input value={form.cliente} onChange={e=>F("cliente",e.target.value)} placeholder="Ex: Empresa XYZ Ltda" style={inp}/></div>
          <div style={{background:"#040b14",borderRadius:8,padding:"10px 12px"}}><Label>💳 MRR (R$)</Label><input type="number" value={form.mrr} onChange={e=>F("mrr",e.target.value)} placeholder="Ex: 2500" style={{...inp,background:"#0c1a2e",color:"#38bdf8",fontWeight:700}}/></div>
          <div style={{background:"#040b14",borderRadius:8,padding:"10px 12px"}}><Label>🔧 Horas Implantação</Label><input type="number" value={form.horasImpl} onChange={e=>F("horasImpl",e.target.value)} placeholder="Ex: 60" style={{...inp,background:"#0c1a2e"}}/></div>
          <div style={{background:"#040b14",borderRadius:8,padding:"10px 12px"}}><Label>🔧 Valor/Hora (R$)</Label><input type="number" value={form.valorHoraImpl} onChange={e=>F("valorHoraImpl",e.target.value)} placeholder="Ex: 185" style={{...inp,background:"#0c1a2e"}}/></div>
          <div style={{background:"#040b14",borderRadius:8,padding:"10px 12px"}}><Label>📦 Licença (R$)</Label><input type="number" value={form.licenca} onChange={e=>F("licenca",e.target.value)} placeholder="0 se não houver" style={{...inp,background:"#0c1a2e",color:+form.licenca>0?"#a78bfa":"#e2e8f0"}}/></div>
          {isManual&&(
            <div style={{background:"#0c2a42",borderRadius:8,padding:"10px 12px",border:"1px solid #1e4060"}}>
              <Label>⚡ Faixa (manual)</Label>
              <select value={form.faixaIdManual} onChange={e=>F("faixaIdManual",e.target.value)} style={{...selS,background:"#0c1a2e",color:"#ca8a04",fontWeight:700}}>
                <option value="">— Selecione —</option>
                {prodSel?.regras.map(r=><option key={r.id} value={r.id}>{r.label} ({r.pctImpl}%)</option>)}
              </select>
            </div>
          )}
          <div><Label>Observação</Label><input value={form.obs} onChange={e=>F("obs",e.target.value)} placeholder="Opcional" style={inp}/></div>
        </div>
        {prev&&(
          <div style={{background:"#040b14",border:"1px solid #0c2a42",borderRadius:10,padding:"16px 18px",marginBottom:14}}>
            <div style={{fontSize:11,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:12}}>Prévia da Comissão</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
              <FaixaBadge faixa={prev.faixa}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:12}}>
              <div style={{background:"#080f1a",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#1a3a54",marginBottom:4}}>MRR</div><div style={{fontSize:13,color:"#e2e8f0",fontWeight:600}}>{R$(prev.mrr)}</div><div style={{fontSize:11,color:"#38bdf8",marginTop:2}}>com.: {R$(prev.comMRR)}</div></div>
              <div style={{background:"#080f1a",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#1a3a54",marginBottom:4}}>Implantação</div><div style={{fontSize:13,color:"#e2e8f0",fontWeight:600}}>{R$(prev.implTotal)}</div><div style={{fontSize:11,color:"#a78bfa",marginTop:2}}>com.: {R$(prev.comImpl)}</div></div>
              {prev.licenca>0&&<div style={{background:"#080f1a",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#1a3a54",marginBottom:4}}>Licença</div><div style={{fontSize:13,color:"#e2e8f0",fontWeight:600}}>{R$(prev.licenca)}</div><div style={{fontSize:11,color:"#a78bfa",marginTop:2}}>com.: {R$(prev.comLic)}</div></div>}
              <div style={{background:"#080f1a",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#1a3a54",marginBottom:4}}>NR Total</div><div style={{fontSize:13,color:"#e2e8f0",fontWeight:600}}>{R$(prev.nr)}</div></div>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{background:"#0c2a42",borderRadius:8,padding:"10px 16px",textAlign:"center"}}><div style={{fontSize:10,color:"#1e4060",marginBottom:3,textTransform:"uppercase",letterSpacing:.5}}>1ª Parcela — {ML(prev.mesParcela1)}</div><div style={{fontSize:18,fontWeight:800,color:"#38bdf8",fontFamily:"'Syne',sans-serif"}}>{R$(prev.parcela)}</div></div>
              <div style={{background:"#0c0a2e",borderRadius:8,padding:"10px 16px",textAlign:"center"}}><div style={{fontSize:10,color:"#1e4060",marginBottom:3,textTransform:"uppercase",letterSpacing:.5}}>2ª Parcela — {ML(prev.mesParcela2)}</div><div style={{fontSize:18,fontWeight:800,color:"#818cf8",fontFamily:"'Syne',sans-serif"}}>{R$(prev.parcela)}</div></div>
              <div style={{borderLeft:"1px solid #0c2a42",paddingLeft:16}}><div style={{fontSize:11,color:"#1a3a54"}}>TOTAL COMISSÃO</div><div style={{fontSize:22,fontWeight:800,color:"#34d399",fontFamily:"'Syne',sans-serif"}}>{R$(prev.total)}</div></div>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={save} disabled={saving}>{saving?<><Spinner size={13}/> Salvando…</>:editId?"Salvar":"Lançar venda"}</Btn>
          {editId&&<Btn secondary onClick={()=>{setEditId(null);setForm(EMPTY);}}>Cancelar</Btn>}
        </div>
      </div>
      {/* TABELA */}
      <div style={{background:"#060d18",border:"1px solid #0c1f35",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:"1px solid #080f1a"}}><span style={{fontSize:13,fontWeight:600,color:"#7fa8c0"}}>Contratos em {ML(mes)} · {vendasMes.length} registro{vendasMes.length!==1?"s":""}</span></div>
        <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:1000}}>
          <thead><tr style={{background:"#040b14"}}>
            {role!=="consultor"&&<TH>Consultor</TH>}
            <TH>Produto</TH><TH>Cliente</TH><TH>MRR</TH><TH>Impl. Total</TH><TH>Licença</TH><TH>NR</TH><TH>Faixa</TH>
            <TH right>Com. MRR</TH><TH right>Com. NR</TH><TH right>Total</TH>
            <TH right>1ª ({ML(addMonths(mes,2))})</TH><TH right>2ª ({ML(addMonths(mes,3))})</TH><TH>Ações</TH>
          </tr></thead>
          <tbody>
            {vendasMes.length===0?<tr><td colSpan={14}><Empty/></td></tr>:vendasMes.map((v,i)=>{
              const c=calcVenda(v,produtos); if(!c)return null;
              const prod=produtos.find(p=>p.id===(v.produtoId||v.produto_id));
              const cId = v.consultorId||v.consultor_id;
              return (
                <tr key={v.id} style={{borderBottom:i<vendasMes.length-1?"1px solid #080f1a":"none"}}>
                  {role!=="consultor"&&<TD bold color="#e2e8f0">{users.find(u=>u.id===cId)?.name||"–"}</TD>}
                  <TD bold color="#e2e8f0">{prod?.nome}</TD>
                  <TD>{v.cliente}</TD>
                  <TD bold color="#38bdf8">{R$(v.mrr)}</TD>
                  <TD>{R$(c.implTotal)}<div style={{fontSize:10,color:"#1e4060"}}>{c.horasImpl}h × {R$(c.valorHoraImpl)}/h</div></TD>
                  <TD color={v.licenca>0?"#a78bfa":"#1e4060"}>{v.licenca>0?R$(v.licenca):"—"}</TD>
                  <TD bold color="#e2e8f0">{R$(c.nr)}</TD>
                  <TD><FaixaBadge faixa={c.faixa}/></TD>
                  <TD right color="#38bdf8" bold>{R$(c.comMRR)}</TD>
                  <TD right color="#a78bfa" bold>{R$(c.comImpl+c.comLic)}</TD>
                  <TD right bold color="#e2e8f0">{R$(c.total)}</TD>
                  <TD right color="#38bdf8" bold>{R$(c.parcela)}</TD>
                  <TD right color="#818cf8" bold>{R$(c.parcela)}</TD>
                  <TD>
                    <div style={{display:"flex",gap:5}}>
                      <IBtn color="#38bdf8" onClick={()=>{setEditId(v.id);setForm({consultorId:cId,produtoId:v.produtoId||v.produto_id,cliente:v.cliente,mrr:String(v.mrr),horasImpl:String(c.horasImpl),valorHoraImpl:String(c.valorHoraImpl),licenca:String(v.licenca||0),faixaIdManual:v.faixaIdManual||v.faixa_id_manual||"",obs:v.obs||""})}}><Ic n="edit" s={13}/></IBtn>
                      <IBtn color="#ef4444" onClick={async()=>{const {error}=await deleteVenda(v.id);if(error)notify("Erro ao excluir","err");else notify("Venda removida.");}}><Ic n="trash" s={13}/></IBtn>
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
function EquipePage({users,vendas,produtos,mes,metas}) {
  const consultores=users.filter(u=>u.role==="consultor"&&u.active);
  const rows=consultores.map(u=>{
    const r=calcMesConsultor(u.id,mes,vendas,produtos,metas,users);
    return {...u,...r};
  }).sort((a,b)=>b.totalCom-a.totalCom);
  const totGeral=rows.reduce((s,r)=>s+r.totalCom,0);
  return (
    <div>
      <STitle>Equipe — {ML(mes)}</STitle>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        <StatCard l="Total Comissões"    v={R$(totGeral)} c="#34d399"/>
        <StatCard l="Consultores"        v={rows.length}  c="#38bdf8"/>
        <StatCard l="Em Overperformance" v={rows.filter(r=>r.atingMRR>=150).length} c="#f59e0b"/>
        <StatCard l="🚀 200%+"           v={rows.filter(r=>r.atingMRR>=200).length} c="#f59e0b"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {rows.map((r,idx)=>(
          <div key={r.id} style={{background:"#060d18",border:`1px solid ${r.atingMRR>=200?"#f59e0b44":r.atingMRR>=150?"#34d39944":"#0c1f35"}`,borderRadius:12,padding:20,position:"relative"}}>
            {idx===0&&r.totalCom>0&&<span style={{position:"absolute",top:14,right:14}}>🏆</span>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontWeight:700,color:"#e2e8f0",fontSize:15,marginBottom:5}}>{r.name}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <span style={{background:CARGO_COLOR[r.cargo]+"22",color:CARGO_COLOR[r.cargo],padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700}}>{CARGO_LABEL[r.cargo]}</span>
                  <span style={{background:r.overInfo.bg,color:r.overInfo.color,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:800,border:`1px solid ${r.overInfo.border}`}}>{r.overInfo.label}</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:800,color:"#34d399",fontFamily:"'Syne',sans-serif"}}>{R$(r.totalCom)}</div>
                <div style={{fontSize:10,color:"#1a3a54",marginTop:2}}>{r.vendasCalc.length} contrato{r.vendasCalc.length!==1?"s":""}</div>
              </div>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#1e4060",marginBottom:3}}><span>MRR {R$(r.totalMRR)} / {R$(r.metaMRR)}</span><span style={{color:r.overInfo.color,fontWeight:700}}>{r.atingMRR.toFixed(0)}%</span></div>
              <div style={{height:6,background:"#0c1f35",borderRadius:99,overflow:"hidden"}}><div style={{width:`${Math.min(r.atingMRR/2,100)}%`,height:"100%",background:r.overInfo.color,borderRadius:99}}/></div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#1e4060",marginBottom:3}}><span>NR {R$(r.totalNR)} / {R$(r.metaNR)}</span><span style={{color:r.atingNR>=100?"#a78bfa":"#64748b",fontWeight:700}}>{r.atingNR.toFixed(0)}%</span></div>
              <div style={{height:6,background:"#0c1f35",borderRadius:99,overflow:"hidden"}}><div style={{width:`${Math.min(r.atingNR,100)}%`,height:"100%",background:r.atingNR>=100?"#a78bfa":"#4a0080",borderRadius:99}}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <MiniCard l="Com. MRR" v={R$(r.vendasCalc.reduce((s,v)=>s+v.comMRR,0))} c={r.overInfo.color}/>
              <MiniCard l="Com. NR"  v={R$(r.vendasCalc.reduce((s,v)=>s+v.comImpl+v.comLic,0))} c="#a78bfa"/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  CALENDÁRIO
// ══════════════════════════════════════════════════════════════════
function CalPage({me,users,vendas,produtos,mes}) {
  const role=me.role;
  const mesesVis=Array.from({length:6},(_,i)=>addMonths(mes,-1+i));
  const cal=useMemo(()=>buildCalendario(role==="consultor"?vendas.filter(v=>(v.consultorId||v.consultor_id)===me.id):vendas,produtos,users),[vendas,produtos,users,me,role]);
  return (
    <div>
      <STitle>Calendário de Recebimentos</STitle>
      <div style={{fontSize:12,color:"#1e4060",marginBottom:20}}>Visão de quando cada comissão será recebida, gerada automaticamente a partir das vendas registradas.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {mesesVis.map(m=>{
          const parcelas=(cal[m]||[]).filter(p=>role!=="consultor"||(p.consultorId||p.consultor_id)===me.id);
          const total=parcelas.reduce((s,p)=>s+p.valor,0);
          const isAtual=m===mes;
          return (
            <div key={m} style={{background:"#060d18",border:`1px solid ${isAtual?"#1e4060":"#0c1f35"}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #080f1a",display:"flex",justifyContent:"space-between",alignItems:"center",background:isAtual?"#0c2a42":"#040b14"}}>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:isAtual?"#38bdf8":"#e2e8f0",fontSize:14}}>{ML(m)}</span>
                {total>0?<span style={{fontWeight:800,color:"#34d399",fontSize:14}}>{R$(total)}</span>:<span style={{color:"#1a3a54",fontSize:12}}>R$ 0</span>}
              </div>
              <div style={{padding:"6px 0",maxHeight:320,overflowY:"auto"}}>
                {parcelas.length===0?<div style={{padding:"16px",fontSize:12,color:"#1a3a54"}}>Sem recebimentos</div>:parcelas.map((p,i)=>(
                  <div key={i} style={{padding:"9px 14px",borderBottom:i<parcelas.length-1?"1px solid #080f1a":"none",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{marginBottom:3}}><span style={{background:p.tipo==="Parcela 1/2"?"#0c2a42":"#0c0a2e",color:p.tipo==="Parcela 1/2"?"#38bdf8":"#818cf8",padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700}}>{p.tipo==="Parcela 1/2"?"1ª Parcela":"2ª Parcela"}</span></div>
                      {role!=="consultor"&&<div style={{fontSize:11,color:"#2a5a80",fontWeight:600}}>{p.nomeConsultor}</div>}
                      <div style={{fontSize:11,color:"#1a3a54",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.cliente} · {produtos.find(x=>x.id===p.produtoId)?.nome}</div>
                      <div style={{fontSize:10,color:"#0f2a40",marginTop:1}}>Venda de {ML(p.mesVenda)}</div>
                    </div>
                    <span style={{fontWeight:700,color:"#34d399",whiteSpace:"nowrap",fontSize:13}}>{R$(p.valor)}</span>
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
function HistPage({me,users,vendas,produtos,metas}) {
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
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <STitle>Histórico</STitle>
        {me.role!=="consultor"&&<select value={filtro} onChange={e=>setFiltro(e.target.value)} style={{...selS,width:"auto",minWidth:200}}><option value="todos">Toda a equipe</option>{consultores.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}
      </div>
      {porMes.length===0&&<div style={{background:"#060d18",border:"1px solid #0c1f35",borderRadius:12}}><Empty/></div>}
      {porMes.map(({mes,rows,total})=>(
        <div key={mes} style={{background:"#060d18",border:"1px solid #0c1f35",borderRadius:12,overflow:"hidden",marginBottom:14}}>
          <div style={{padding:"12px 20px",borderBottom:"1px solid #080f1a",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#040b14"}}>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:"#e2e8f0",fontSize:14}}>{ML(mes)}</span>
            <div style={{display:"flex",gap:16,alignItems:"center"}}>
              <span style={{fontSize:11,color:"#1e4060"}}>Parcelas: {ML(addMonths(mes,2))} + {ML(addMonths(mes,3))}</span>
              <span style={{color:"#34d399",fontWeight:800,fontFamily:"'Syne',sans-serif"}}>{R$(total)}</span>
            </div>
          </div>
          <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
            <thead><tr style={{background:"#030810"}}>
              {filtro==="todos"&&<TH>Consultor</TH>}
              <TH>Produto</TH><TH>Cliente</TH><TH>MRR</TH><TH>Impl.</TH><TH>Licença</TH><TH>Faixa</TH>
              <TH right>Over MRR</TH><TH right>Com. MRR</TH><TH right>Com. NR</TH><TH right>Total</TH>
              <TH right>1ª Parcela</TH><TH right>2ª Parcela</TH>
            </tr></thead>
            <tbody>
              {rows.map((r,i)=>{
                const prod=produtos.find(p=>p.id===r.produtoId);
                return (
                  <tr key={(r.id||i)+"-"+mes} style={{borderBottom:i<rows.length-1?"1px solid #080f1a":"none"}}>
                    {filtro==="todos"&&<TD bold color="#e2e8f0">{r.nomeConsultor}</TD>}
                    <TD bold color="#e2e8f0">{prod?.nome}</TD>
                    <TD>{r.cliente}</TD>
                    <TD bold color="#38bdf8">{R$(r.mrr)}</TD>
                    <TD>{R$(r.implTotal)}<div style={{fontSize:10,color:"#1e4060"}}>{r.horasImpl}h × {R$(r.valorHoraImpl)}/h</div></TD>
                    <TD color={r.licenca>0?"#a78bfa":"#1e4060"}>{r.licenca>0?R$(r.licenca):"—"}</TD>
                    <TD><FaixaBadge faixa={r.faixa}/></TD>
                    <TD right><span style={{background:r.overInfo?.bg,color:r.overInfo?.color,padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:800}}>{r.overInfo?.label}</span></TD>
                    <TD right bold style={{color:r.overInfo?.color}}>{R$(r.comMRR)}</TD>
                    <TD right color="#a78bfa" bold>{R$(r.comImpl+r.comLic)}</TD>
                    <TD right bold color="#e2e8f0">{R$(r.total)}</TD>
                    <TD right color="#38bdf8" bold>{R$(r.parcela)}<div style={{fontSize:10,color:"#1e4060"}}>{ML(r.mesParcela1)}</div></TD>
                    <TD right color="#818cf8" bold>{R$(r.parcela)}<div style={{fontSize:10,color:"#1e4060"}}>{ML(r.mesParcela2)}</div></TD>
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
function ParamsPage({produtos,setProdutos,me,notify,metas,saveMetas}) {
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

  if(!draft) return <STitle>Nenhum produto.</STitle>;

  const simCenarios=[
    {mrr:2000,h:40,vh:170,lic:0},{mrr:2500,h:60,vh:185,lic:0},
    {mrr:3000,h:60,vh:190,lic:3000},{mrr:4000,h:80,vh:200,lic:5000},{mrr:5000,h:100,vh:210,lic:0},
  ];

  return (
    <div>
      <STitle>Parâmetros</STitle>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[["produtos","🎛 Comissões por Produto"],["metas","🎯 Metas Mensais"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${tab===id?"#1e4060":"#0c1f35"}`,cursor:"pointer",fontSize:13,fontWeight:700,background:tab===id?"#0c2a42":"#060d18",color:tab===id?"#38bdf8":"#2a5a80"}}>{label}</button>
        ))}
      </div>

      {tab==="metas"&&(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:10,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Mês:</span>
            {MESES_LIST.slice(0,12).slice().reverse().map(m=>(
              <button key={m} onClick={()=>setMesMeta(m)} style={{padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:mesMeta===m?"#0c2a42":"transparent",color:mesMeta===m?"#38bdf8":"#1e4060"}}>{ML(m)}</button>
            ))}
          </div>
          <div style={{background:"#040b14",border:"1px solid #0c2a42",borderRadius:10,padding:"12px 18px",marginBottom:20,fontSize:12}}>
            <div style={{fontSize:10,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Regras de Overperformance MRR</div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              <span style={{background:"#38bdf822",color:"#38bdf8",padding:"4px 12px",borderRadius:99,fontWeight:700}}>até 149% → 70% do MRR</span>
              <span style={{background:"#34d39922",color:"#34d399",padding:"4px 12px",borderRadius:99,fontWeight:700}}>⚡ 150–199% → 100% do MRR</span>
              <span style={{background:"#f59e0b22",color:"#f59e0b",padding:"4px 12px",borderRadius:99,fontWeight:700}}>🚀 200%+ → 200% do MRR</span>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {["junior","pleno","senior"].map(cargo=>{
              const m=metaDraft[cargo]||{mrr:0,nr:0};
              const color=CARGO_COLOR[cargo];
              return (
                <div key={cargo} style={{background:"#060d18",border:`1px solid ${color}33`,borderRadius:12,padding:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:color}}/>
                    <span style={{fontWeight:700,color,fontSize:14}}>{CARGO_LABEL[cargo]}</span>
                  </div>
                  <div style={{marginBottom:12}}>
                    <Label>Meta MRR (R$)</Label>
                    <input type="number" value={m.mrr||""} onChange={e=>updMeta(cargo,"mrr",e.target.value)} placeholder="Ex: 15000" style={{...inp,color:"#38bdf8",fontWeight:700,fontSize:16,textAlign:"right"}}/>
                    <div style={{fontSize:10,color:"#1e4060",marginTop:4}}>⚡ 150%: {R$((m.mrr||0)*1.5)} · 🚀 200%: {R$((m.mrr||0)*2)}</div>
                  </div>
                  <div>
                    <Label>Meta NR (R$)</Label>
                    <input type="number" value={m.nr||""} onChange={e=>updMeta(cargo,"nr",e.target.value)} placeholder="Ex: 22000" style={{...inp,color:"#a78bfa",fontWeight:700,fontSize:16,textAlign:"right"}}/>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{marginTop:14}}><Btn onClick={saveMetasMes} disabled={saving}>{saving?<><Spinner size={13}/> Salvando…</>:"Salvar Metas"}</Btn></div>
        </div>
      )}

      {tab==="produtos"&&(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {produtos.map(p=><button key={p.id} onClick={()=>{setSelId(p.id);sync(p);}} style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${selId===p.id?"#1e4060":"#0c1f35"}`,cursor:"pointer",fontSize:13,fontWeight:700,background:selId===p.id?"#0c2a42":"#060d18",color:selId===p.id?"#38bdf8":"#2a5a80"}}>{p.nome}</button>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div style={{background:"#060d18",border:"1px solid #0c1f35",borderRadius:12,padding:20}}>
              <div style={{fontSize:11,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:16}}>Configurações</div>
              <div style={{background:"#040b14",borderRadius:10,padding:"14px 16px",marginBottom:12,border:"1px solid #0c2a42"}}>
                <div style={{fontSize:12,color:"#38bdf8",fontWeight:700,marginBottom:10}}>💳 MRR — Mensalidade</div>
                <div><Label>% de Comissão sobre MRR</Label><input type="number" value={draft.pctMRR} onChange={e=>updPct("pctMRR",+e.target.value)} style={{...inp,color:"#38bdf8",fontWeight:800,fontSize:18,textAlign:"center"}}/></div>
              </div>
              <div style={{background:"#040b14",borderRadius:10,padding:"14px 16px",marginBottom:12,border:"1px solid #1e4060"}}>
                <div style={{fontSize:12,color:"#ca8a04",fontWeight:700,marginBottom:10}}>⚡ Modo de Seleção de Faixa</div>
                <div style={{display:"flex",gap:8}}>
                  {["auto","manual"].map(m=><button key={m} onClick={()=>updFaixaMode(m)} style={{flex:1,padding:"8px",border:`1px solid ${draft.selecaoFaixa===m?"#ca8a04":"#0c1f35"}`,borderRadius:7,background:draft.selecaoFaixa===m?"#ca8a0422":"#040b14",color:draft.selecaoFaixa===m?"#ca8a04":"#475569",cursor:"pointer",fontWeight:700,fontSize:13}}>{m==="auto"?"🤖 Automático":"✍️ Manual"}</button>)}
                </div>
              </div>
              {draft.regras.map((r,i)=>(
                <div key={r.id} style={{background:"#040b14",borderRadius:10,padding:"14px 16px",marginBottom:10,border:`1px solid ${i===0?"#ca8a0433":"#0c1f35"}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:i===0?"#ca8a04":"#64748b",marginBottom:10}}>{i===0?"⭐":""} {r.label}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    <div><Label>Mín. Horas</Label><input type="number" value={r.minHoras} onChange={e=>updRegra(i,"minHoras",e.target.value)} style={inp}/></div>
                    <div><Label>Mín. R$/h</Label><input type="number" value={r.minValorH} onChange={e=>updRegra(i,"minValorH",e.target.value)} style={inp}/></div>
                    <div><Label>% NR</Label><input type="number" value={r.pctImpl} onChange={e=>updRegra(i,"pctImpl",e.target.value)} style={{...inp,color:"#a78bfa",fontWeight:800,fontSize:16}}/></div>
                  </div>
                </div>
              ))}
              <div style={{background:"#040b14",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#1e4060",border:"1px solid #0c1f35"}}>
                💡 <b style={{color:"#38bdf8"}}>MRR</b> = mensalidade × {draft.pctMRR}% · <b style={{color:"#a78bfa"}}>NR</b> = (impl+lic) × faixa% · Pago em 2× (+2 e +3 meses)
              </div>
              <Btn onClick={save} disabled={saving}>{saving?<><Spinner size={13}/> Salvando…</>:"Salvar Parâmetros"}</Btn>
            </div>
            <div style={{background:"#060d18",border:"1px solid #0c1f35",borderRadius:12,padding:20}}>
              <div style={{fontSize:11,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:14}}>Simulador — {draft.nome}</div>
              {simCenarios.map((s,i)=>{
                const c=calcVenda({produtoId:draft.id,mes:"2025-01",mrr:s.mrr,horasImpl:s.h,valorHoraImpl:s.vh,licenca:s.lic,faixaIdManual:null},[draft]);
                if(!c) return null;
                return (
                  <div key={i} style={{background:"#040b14",borderRadius:8,padding:"12px 14px",marginBottom:8,border:`1px solid ${c.isPremium?"#ca8a0422":"#0c1f35"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:12,color:"#7fa8c0",fontWeight:600}}>MRR {R$(s.mrr)} · {s.h}h×{R$(s.vh)}{s.lic>0?` · Lic ${R$(s.lic)}`:""}</span>
                      <FaixaBadge faixa={c.faixa}/>
                    </div>
                    <div style={{display:"flex",gap:14,fontSize:12,flexWrap:"wrap"}}>
                      <span style={{color:"#1e4060"}}>MRR: <b style={{color:"#38bdf8"}}>{R$(c.comMRR)}</b></span>
                      <span style={{color:"#1e4060"}}>NR: <b style={{color:"#a78bfa"}}>{R$(c.comImpl+c.comLic)}</b></span>
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
function ProdPage({produtos,setProdutos,notify}) {
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
        <STitle>Produtos</STitle>
        <Btn onClick={()=>setShowNew(s=>!s)}><Ic n="plus" s={14}/>Novo Produto</Btn>
      </div>
      {showNew&&<div style={{background:"#060d18",border:"1px solid #0c1f35",borderRadius:12,padding:20,marginBottom:14,display:"flex",gap:12,alignItems:"flex-end"}}>
        <div style={{flex:1}}><Label>Nome do Produto</Label><input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Mago RH" style={inp} onKeyDown={e=>e.key==="Enter"&&add()}/></div>
        <Btn onClick={add}>Adicionar</Btn><Btn secondary onClick={()=>setShowNew(false)}>Cancelar</Btn>
      </div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {produtos.map(p=>{
          const np=normProd(p);
          return (
          <div key={p.id} style={{background:"#060d18",border:"1px solid #0c1f35",borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
                <span style={{fontWeight:700,color:"#e2e8f0",fontSize:15}}>{p.nome}</span>
                <span style={{background:np.selecaoFaixa==="manual"?"#f59e0b22":"#0c2a42",color:np.selecaoFaixa==="manual"?"#f59e0b":"#38bdf8",padding:"1px 8px",borderRadius:99,fontSize:10,fontWeight:700}}>{np.selecaoFaixa==="manual"?"✍️ Manual":"🤖 Auto"}</span>
                <span style={{background:"#38bdf822",color:"#38bdf8",padding:"1px 8px",borderRadius:99,fontSize:10,fontWeight:700}}>MRR {np.pctMRR}%</span>
              </div>
              <div style={{fontSize:12,color:"#1e4060",display:"flex",gap:16,flexWrap:"wrap"}}>
                {p.regras.map((r,i)=><span key={i}>{i===0?"⭐":"◎"} {r.label}: NR {r.pctImpl}%{np.selecaoFaixa==="auto"?` · ≥${r.minHoras}h, ≥R$${r.minValorH}/h`:""}</span>)}
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{background:p.ativo?"#14532d22":"#450a0a22",color:p.ativo?"#4ade80":"#f87171",padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>{p.ativo?"Ativo":"Inativo"}</span>
              <IBtn color={p.ativo?"#f87171":"#4ade80"} onClick={()=>setProdutos(prev=>prev.map(x=>x.id===p.id?{...x,ativo:!x.ativo}:x))}><Ic n={p.ativo?"lock":"check"} s={13}/></IBtn>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  USUÁRIOS (via Supabase Auth)
// ══════════════════════════════════════════════════════════════════
function UsersPage({users,createUserProfile,updateProfile,notify,me}) {
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
      <STitle>Usuários</STitle>
      <div style={{background:"#060d18",border:"1px solid #0c1f35",borderRadius:12,padding:22,marginBottom:20}}>
        <div style={{fontSize:11,color:"#1e4060",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>{editId?"✏ Editando":"➕ Novo usuário"}</div>
        <div style={{background:"#040b14",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#1e4060",border:"1px solid #0c2a42"}}>
          <Ic n="db" s={12}/> Usuários são criados via <b style={{color:"#38bdf8"}}>Supabase Auth</b>. Um e-mail de confirmação será enviado automaticamente.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,alignItems:"end"}}>
          <div><Label>Nome</Label><input value={form.name} onChange={e=>F("name",e.target.value)} placeholder="Nome completo" style={inp}/></div>
          {!editId&&<div><Label>E-mail</Label><input value={form.email} onChange={e=>F("email",e.target.value)} placeholder="email@empresa.com" style={inp}/></div>}
          {!editId&&<div><Label>Senha inicial</Label><input type="password" value={form.password} onChange={e=>F("password",e.target.value)} placeholder="mín. 6 caracteres" style={inp}/></div>}
          <div><Label>Perfil</Label><select value={form.role} onChange={e=>F("role",e.target.value)} style={selS}><option value="consultor">Consultor</option><option value="gestor">Gestor</option><option value="parametros">Parâmetros</option></select></div>
          {form.role==="consultor"&&<div><Label>Cargo</Label><select value={form.cargo} onChange={e=>F("cargo",e.target.value)} style={selS}><option value="junior">Júnior</option><option value="pleno">Pleno</option><option value="senior">Sênior</option></select></div>}
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={save} disabled={saving}>{saving?<><Spinner size={13}/> Salvando…</>:editId?"Salvar":"Criar"}</Btn>
            {editId&&<Btn secondary onClick={()=>{setEditId(null);setForm(EMPTY);}}>✕</Btn>}
          </div>
        </div>
      </div>
      <div style={{background:"#060d18",border:"1px solid #0c1f35",borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#040b14"}}><TH>Nome</TH><TH>Perfil</TH><TH>Cargo</TH><TH>Status</TH><TH>Ações</TH></tr></thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={u.id} style={{borderBottom:i<users.length-1?"1px solid #080f1a":"none",opacity:u.active?1:.45}}>
                <TD bold color="#e2e8f0">{u.name}<div style={{fontSize:10,color:"#0c2a42",marginTop:1}}>ID: {String(u.id).substring(0,8)}…</div></TD>
                <TD><span style={{background:RC[u.role]+"22",color:RC[u.role],padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700}}>{ROLE_LABEL[u.role]||u.role}</span></TD>
                <TD>{u.cargo?<span style={{background:CARGO_COLOR[u.cargo]+"22",color:CARGO_COLOR[u.cargo],padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700}}>{CARGO_LABEL[u.cargo]}</span>:"—"}</TD>
                <TD><span style={{background:u.active?"#14532d22":"#450a0a22",color:u.active?"#4ade80":"#f87171",padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700}}>{u.active?"Ativo":"Inativo"}</span></TD>
                <TD>
                  <div style={{display:"flex",gap:5}}>
                    <IBtn color="#38bdf8" onClick={()=>{setEditId(u.id);setForm({name:u.name,email:u.email||"",password:"",role:u.role,cargo:u.cargo||"junior"});}}><Ic n="edit" s={13}/></IBtn>
                    {u.id!==me.id&&<IBtn color={u.active?"#f87171":"#4ade80"} onClick={async()=>{const {error}=await updateProfile(u.id,{active:!u.active});if(error)notify("Erro","err");}}><Ic n={u.active?"lock":"check"} s={13}/></IBtn>}
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
