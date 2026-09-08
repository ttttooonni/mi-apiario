import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, ArrowRight, Bell, BookOpen, CalendarDays, Check, ChevronLeft,
  ClipboardList, CloudOff, Crown, Database, Download, Droplets, FileUp,
  Hexagon, Home, Leaf, MapPin, Menu, Plus, RefreshCw, Save, Settings,
  ShieldCheck, Sparkles, Trash2, Upload, Weight, X
} from "lucide-react";
import "./styles.css";

type Status = "good" | "attention" | "urgent";
type Colony = {
  id: string; code: string; apiaryId: string; queen: string; queenColor: string;
  status: Status; lastReview: string; nextReview: string; varroa: "ok" | "pending";
  notes: string; production: number;
};
type Apiary = { id: string; name: string; location: string; colonies: number; status: Status };
type Production = { id: string; date: string; product: string; quantity: number; apiaryId: string; colonyId: string };
type Data = { apiaries: Apiary[]; colonies: Colony[]; production: Production[] };

const seed: Data = {
  apiaries: [
    { id:"a1", name:"El Tablero", location:"Gran Canaria", colonies:12, status:"good" },
    { id:"a2", name:"La Cumbre", location:"Gran Canaria", colonies:9, status:"attention" },
    { id:"a3", name:"El Pinar", location:"Gran Canaria", colonies:6, status:"good" }
  ],
  colonies: [
    {id:"c1",code:"COL-001",apiaryId:"a1",queen:"2026",queenColor:"Blanco",status:"good",lastReview:"2026-09-03",nextReview:"2026-09-12",varroa:"ok",notes:"Buena población y puesta compacta.",production:14.2},
    {id:"c2",code:"COL-002",apiaryId:"a1",queen:"2025",queenColor:"Azul",status:"attention",lastReview:"2026-08-28",nextReview:"2026-09-09",varroa:"pending",notes:"Revisar carga de varroa.",production:11.8},
    {id:"c3",code:"COL-003",apiaryId:"a2",queen:"2026",queenColor:"Rojo",status:"good",lastReview:"2026-09-02",nextReview:"2026-09-15",varroa:"ok",notes:"Entrada de néctar activa.",production:16.4},
    {id:"c4",code:"COL-004",apiaryId:"a2",queen:"2024",queenColor:"Verde",status:"urgent",lastReview:"2026-08-20",nextReview:"2026-09-08",varroa:"pending",notes:"Colonia débil. Revisión prioritaria.",production:6.1},
    {id:"c5",code:"COL-005",apiaryId:"a3",queen:"2026",queenColor:"Blanco",status:"good",lastReview:"2026-09-04",nextReview:"2026-09-18",varroa:"ok",notes:"Estado estable.",production:13.7}
  ],
  production: [
    {id:"p1",date:"2026-08-21",product:"Miel",quantity:42,apiaryId:"a1",colonyId:"c1"},
    {id:"p2",date:"2026-08-29",product:"Miel",quantity:31.5,apiaryId:"a2",colonyId:"c3"},
    {id:"p3",date:"2026-09-02",product:"Cera",quantity:4.2,apiaryId:"a1",colonyId:"c2"}
  ]
};

const KEY="mi-apiario-v1";
const load=():Data=>{ try { const x=localStorage.getItem(KEY); return x?JSON.parse(x):seed } catch { return seed } };
const fmt=(d:string)=>new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(d+"T12:00:00"));
const statusLabel=(s:Status)=>s==="good"?"Correcto":s==="attention"?"Atención":"Prioridad";
const productIcon=(p:string)=>p==="Miel"?<Droplets/>:p==="Cera"?<Leaf/>:<Sparkles/>;

function App(){
  const [data,setData]=useState<Data>(load);
  const [page,setPage]=useState("home");
  const [selected,setSelected]=useState<string|null>(null);
  const [toast,setToast]=useState("");
  const [showMore,setShowMore]=useState(false);

  useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(data));},[data]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(""),2200);return()=>clearTimeout(t)}},[toast]);

  const stats=useMemo(()=>{
    const urgent=data.colonies.filter(c=>c.status==="urgent").length;
    const attention=data.colonies.filter(c=>c.status==="attention"||c.varroa==="pending").length;
    const honey=data.production.filter(p=>p.product==="Miel").reduce((a,p)=>a+p.quantity,0);
    return {urgent,attention,honey};
  },[data]);

  const go=(p:string)=>{setPage(p);setSelected(null);setShowMore(false);window.scrollTo({top:0,behavior:"smooth"})};
  const backup=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`mi-apiario-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);setToast("Copia de seguridad creada")};
  const restore=(f:File)=>{const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(String(r.result));if(d.apiaries&&d.colonies&&d.production){setData(d);setToast("Datos restaurados")}else throw 0}catch{setToast("Archivo no válido")}};r.readAsText(f)};
  const reset=()=>{if(confirm("¿Restaurar los datos de ejemplo?")){setData(seed);setToast("Datos de ejemplo restaurados")}};

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="brandMark">🐝</div><div><b>mi-apiario</b><span>Centro de mando</span></div></div>
      <nav>{[
        ["home","Inicio",Home],["apiaries","Apiarios",MapPin],["health","Sanidad",ShieldCheck],["production","Producción",Droplets],["history","Histórico",Activity]
      ].map(([id,label,I]:any)=><button className={page===id?"nav active":"nav"} onClick={()=>go(id)} key={id}><I size={19}/>{label}</button>)}</nav>
      <div className="sideBottom"><div className="offline"><CloudOff size={16}/><span>Datos en este dispositivo</span></div><button className="nav" onClick={()=>go("data")}><Database size={19}/>Datos</button></div>
    </aside>

    <main>
      <header className="topbar"><button className="mobileIcon" onClick={()=>setShowMore(true)}><Menu/></button><div className="mobileBrand">🐝 <b>mi-apiario</b></div><div className="topActions"><span className="sync"><CloudOff size={15}/> Local</span><button className="iconBtn"><Bell size={18}/></button></div></header>

      {page==="home" && <HomePage data={data} stats={stats} go={go} setSelected={setSelected}/>}
      {page==="apiaries" && <Apiaries data={data} go={go} setSelected={setSelected}/>}
      {page==="health" && <Health data={data} go={go} setSelected={setSelected}/>}
      {page==="production" && <Production data={data} setData={setData} setToast={setToast}/>}
      {page==="history" && <History data={data}/>}
      {page==="data" && <DataPage data={data} backup={backup} restore={restore} reset={reset}/>}
      {selected && <ColonyModal colony={data.colonies.find(c=>c.id===selected)!} data={data} setData={setData} close={()=>setSelected(null)} setToast={setToast}/>}
      <button className="fab" onClick={()=>go("production")}><Plus/><span>Registrar</span></button>
      <nav className="mobileNav">
        <button className={page==="home"?"active":""} onClick={()=>go("home")}><Home/><span>Inicio</span></button>
        <button className={page==="apiaries"?"active":""} onClick={()=>go("apiaries")}><MapPin/><span>Apiarios</span></button>
        <button className="plusNav" onClick={()=>go("production")}><Plus/></button>
        <button className={page==="health"?"active":""} onClick={()=>go("health")}><ShieldCheck/><span>Sanidad</span></button>
        <button onClick={()=>setShowMore(true)}><Menu/><span>Más</span></button>
      </nav>
      {showMore&&<div className="overlay" onClick={()=>setShowMore(false)}><div className="moreSheet" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowMore(false)}><X/></button><h3>mi-apiario</h3>{[["production","Producción",Droplets],["history","Histórico",Activity],["data","Datos",Database]].map(([id,l,I]:any)=><button className="sheetItem" onClick={()=>go(id)} key={id}><I/>{l}<ArrowRight/></button>)}</div></div>}
      {toast&&<div className="toast"><Check size={17}/>{toast}</div>}
    </main>
  </div>
}

function PageHead({eyebrow,title,sub,children}:{eyebrow:string,title:string,sub:string,children?:React.ReactNode}){return <div className="pageHead"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{sub}</p></div>{children}</div>}

function HomePage({data,stats,go,setSelected}:any){
  return <section className="content">
    <div className="hero"><div><div className="season">TEMPORADA 2026</div><h1>Tu apiario,<br/><em>de un vistazo.</em></h1><p>Todo lo importante para tomar la siguiente decisión en el campo.</p></div><div className="heroBee">🐝</div></div>
    <div className="kpis">
      <Kpi icon={<MapPin/>} label="Apiarios" value={data.apiaries.length} tone="green"/>
      <Kpi icon={<Hexagon/>} label="Colonias" value={data.colonies.length} tone="honey"/>
      <Kpi icon={<ShieldCheck/>} label="Necesitan atención" value={stats.attention} tone={stats.attention?"warn":"green"}/>
      <Kpi icon={<Weight/>} label="Miel temporada" value={`${stats.honey.toFixed(1)} kg`} tone="honey"/>
    </div>
    <div className="sectionTitle"><div><span>AHORA</span><h2>Lo que requiere tu atención</h2></div><button className="linkBtn" onClick={()=>go("health")}>Ver sanidad <ArrowRight/></button></div>
    <div className="attentionGrid">{data.colonies.filter((c:Colony)=>c.status!=="good"||c.varroa==="pending").slice(0,3).map((c:Colony)=><button className={`attentionCard ${c.status}`} key={c.id} onClick={()=>setSelected(c.id)}><div className="statusIcon"><ShieldCheck/></div><div><b>{c.code}</b><span>{c.varroa==="pending"?"Control de varroa pendiente":"Revisión prioritaria"}</span></div><ArrowRight/></button>)}</div>
    <div className="sectionTitle"><div><span>EXPLOTACIÓN</span><h2>Tus apiarios</h2></div><button className="linkBtn" onClick={()=>go("apiaries")}>Ver todos <ArrowRight/></button></div>
    <div className="apiaryGrid">{data.apiaries.map((a:Apiary)=><div className="apiaryMini" key={a.id}><div className="pin"><MapPin/></div><div><b>{a.name}</b><span>{a.location}</span></div><strong>{a.colonies}<small> col.</small></strong></div>)}</div>
  </section>
}

function Kpi({icon,label,value,tone}:{icon:React.ReactNode,label:string,value:string|number,tone:string}){return <div className={`kpi ${tone}`}><div className="kpiIcon">{icon}</div><span>{label}</span><strong>{value}</strong></div>}

function Apiaries({data,go,setSelected}:any){
 return <section className="content"><PageHead eyebrow="EXPLOTACIÓN" title="Tus apiarios" sub="Cada asentamiento, sus colonias y su actividad."><button className="primary" onClick={()=>go("production")}><Plus/> Registrar</button></PageHead>
 <div className="apiaryList">{data.apiaries.map((a:Apiary)=><div className="apiaryCard" key={a.id}><div className="apiaryTop"><div className="bigIcon"><MapPin/></div><div><h2>{a.name}</h2><p><MapPin size={14}/>{a.location}</p></div><span className={`badge ${a.status}`}>{statusLabel(a.status)}</span></div><div className="miniMetrics"><div><span>Colonias</span><b>{a.colonies}</b></div><div><span>Revisión</span><b>{data.colonies.filter((c:Colony)=>c.apiaryId===a.id&&c.status!=="good").length||"—"}</b></div><div><span>Producción</span><b>{data.colonies.filter((c:Colony)=>c.apiaryId===a.id).reduce((x:number,c:Colony)=>x+c.production,0).toFixed(1)} kg</b></div></div><div className="cardFoot"><span>Actividad registrada</span><button onClick={()=>{const c=data.colonies.find((c:Colony)=>c.apiaryId===a.id); if(c)setSelected(c.id)}}>Abrir colonia <ArrowRight/></button></div></div>)}</div></section>
}

function Health({data,setSelected}:any){
 const urgent=data.colonies.filter(c=>c.status==="urgent"), attention=data.colonies.filter(c=>c.status==="attention"||c.varroa==="pending");
 return <section className="content"><PageHead eyebrow="CONTROL SANITARIO" title="Sanidad" sub="Detecta rápidamente qué necesita revisión."/>
 <div className="healthSummary"><Kpi icon={<ShieldCheck/>} label="Correctas" value={data.colonies.length-urgent.length-attention.filter(c=>c.status!=="urgent").length} tone="green"/><Kpi icon={<Bell/>} label="Atención" value={attention.length} tone="warn"/><Kpi icon={<Activity/>} label="Prioridad" value={urgent.length} tone="red"/></div>
 <div className="sectionTitle"><div><span>SEMÁFORO</span><h2>Colonias a revisar</h2></div></div>
 <div className="healthList">{[...urgent,...attention.filter(c=>c.status!=="urgent")].map(c=><button className={`healthRow ${c.status}`} key={c.id} onClick={()=>setSelected(c.id)}><div className="healthDot"/><div><b>{c.code}</b><span>{c.varroa==="pending"?"Control de varroa pendiente":"Revisión recomendada"}</span></div><small>Última: {fmt(c.lastReview)}</small><ArrowRight/></button>)}</div>
 </section>
}

function Production({data,setData,setToast}:any){
 const [form,setForm]=useState({product:"Miel",quantity:"",apiaryId:data.apiaries[0]?.id||"",colonyId:data.colonies[0]?.id||""});
 const total=data.production.filter(p=>p.product==="Miel").reduce((a,p)=>a+p.quantity,0);
 const save=()=>{const q=Number(form.quantity);if(!q||q<=0){setToast("Introduce una cantidad válida");return}setData({...data,production:[...data.production,{id:crypto.randomUUID(),date:new Date().toISOString().slice(0,10),product:form.product,quantity:q,apiaryId:form.apiaryId,colonyId:form.colonyId}]});setForm({...form,quantity:""});setToast("Producción registrada")};
 return <section className="content"><PageHead eyebrow="PRODUCCIÓN" title="Producción" sub="Registra lotes y consulta el rendimiento de tu explotación."/>
 <div className="productionHero"><div className="prodIcon"><Droplets/></div><div><span>MIEL · TEMPORADA 2026</span><strong>{total.toFixed(1)} <small>kg</small></strong></div><div className="trend">Registro local<br/><b>● Activo</b></div></div>
 <div className="formCard"><div className="formHead"><div><span>NUEVO REGISTRO</span><h2>Registrar producción</h2></div><Save/></div><div className="formGrid"><label>Producto<select value={form.product} onChange={e=>setForm({...form,product:e.target.value})}><option>Miel</option><option>Cera</option><option>Polen</option><option>Propóleo</option></select></label><label>Cantidad (kg)<input inputMode="decimal" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} placeholder="0,0"/></label><label>Apiario<select value={form.apiaryId} onChange={e=>setForm({...form,apiaryId:e.target.value})}>{data.apiaries.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label>Colonia<select value={form.colonyId} onChange={e=>setForm({...form,colonyId:e.target.value})}>{data.colonies.map(c=><option key={c.id} value={c.id}>{c.code}</option>)}</select></label></div><button className="primary wide" onClick={save}><Save/> Guardar registro</button></div>
 <div className="sectionTitle"><div><span>HISTORIAL</span><h2>Últimos registros</h2></div></div><div className="productionTable">{data.production.slice().reverse().map(p=><div className="productionRow" key={p.id}><div className="productIcon">{productIcon(p.product)}</div><div><b>{p.product}</b><span>{fmt(p.date)} · {data.apiaries.find(a=>a.id===p.apiaryId)?.name||"—"}</span></div><strong>{p.quantity.toFixed(1)} kg</strong></div>)}</div>
 </section>
}

function History({data}:any){return <section className="content"><PageHead eyebrow="TRAZABILIDAD" title="Histórico" sub="Una memoria digital de tu explotación."/><div className="historyCard"><CalendarDays/><div><span>TEMPORADA</span><h2>2026</h2><p>{data.production.length} registros de producción · {data.colonies.length} colonias</p></div></div><div className="yearStats"><Kpi icon={<Droplets/>} label="Miel" value={`${data.production.filter(p=>p.product==="Miel").reduce((a,p)=>a+p.quantity,0).toFixed(1)} kg`} tone="honey"/><Kpi icon={<Leaf/>} label="Cera" value={`${data.production.filter(p=>p.product==="Cera").reduce((a,p)=>a+p.quantity,0).toFixed(1)} kg`} tone="green"/><Kpi icon={<Hexagon/>} label="Colonias" value={data.colonies.length} tone="green"/></div></section>}

function DataPage({data,backup,restore,reset}:any){return <section className="content"><PageHead eyebrow="CONFIGURACIÓN" title="Datos" sub="Controla tus registros y tus copias de seguridad."/><div className="dataGrid"><div className="dataCard"><Database/><h2>Almacenamiento local</h2><p>Tus datos se guardan en este dispositivo. La aplicación funciona sin conexión.</p><div className="localStatus"><Check/> Almacenamiento activo</div></div><div className="dataCard"><Save/><h2>Copia de seguridad</h2><p>Exporta tus datos a un archivo JSON para conservarlos o trasladarlos.</p><button className="primary wide" onClick={backup}><Download/> Exportar datos</button><label className="secondary wide"><Upload/> Importar datos<input type="file" accept=".json,application/json" onChange={e=>e.target.files?.[0]&&restore(e.target.files[0])}/></label></div><div className="dataCard"><RefreshCw/><h2>Datos de ejemplo</h2><p>Restablece los datos de demostración para explorar la aplicación.</p><button className="secondary wide" onClick={reset}><RefreshCw/> Restaurar ejemplo</button></div></div></section>}

function ColonyModal({colony,data,setData,close,setToast}:any){
 const [notes,setNotes]=useState(colony.notes);
 const save=()=>{setData({...data,colonies:data.colonies.map((c:Colony)=>c.id===colony.id?{...c,notes}:c)});setToast("Ficha actualizada");close()};
 return <div className="overlay" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={close}><X/></button><div className="colonyHeader"><div className="colonyHex"><Hexagon/></div><div><span>FICHA DE COLONIA</span><h2>{colony.code}</h2><p>{data.apiaries.find((a:Apiary)=>a.id===colony.apiaryId)?.name}</p></div><span className={`badge ${colony.status}`}>{statusLabel(colony.status)}</span></div><div className="colonyMetrics"><div><Crown/><span>Reina</span><b>{colony.queen}</b></div><div><ShieldCheck/><span>Sanidad</span><b>{colony.varroa==="ok"?"Controlada":"Pendiente"}</b></div><div><Weight/><span>Producción</span><b>{colony.production} kg</b></div></div><div className="review"><span>ÚLTIMA REVISIÓN</span><b>{fmt(colony.lastReview)}</b><small>Próxima: {fmt(colony.nextReview)}</small></div><label className="notes">Observaciones<textarea value={notes} onChange={e=>setNotes(e.target.value)}/></label><button className="primary wide" onClick={save}><Save/> Guardar ficha</button></div></div>
}

createRoot(document.getElementById("root")!).render(<App/>);