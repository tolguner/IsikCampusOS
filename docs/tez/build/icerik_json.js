// Markdown bölümlerini Word COM doldurucusu için JSON'a çevirir.
const fs = require("fs"), path = require("path");
const TEZ = path.join(__dirname, ".."), DIAG = path.join(__dirname, "diagrams");

function deLatex(s){return s
 .replace(/\\sum_\{([^}]*)\}\^\{([^}]*)\}/g,"Σ($1..$2) ").replace(/\\sum/g,"Σ")
 .replace(/\\in/g,"∈").replace(/\\cap/g,"∩").replace(/\\cup/g,"∪").replace(/\\le/g,"≤")
 .replace(/\\ge/g,"≥").replace(/\\times/g,"×").replace(/\\cdot/g,"·").replace(/\\beta/g,"β")
 .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g,"($1)/($2)").replace(/\\text\{([^}]*)\}/g,"$1")
 .replace(/\\dots|\\ldots/g,"…").replace(/\\,/g," ").replace(/\\\\/g," ")
 .replace(/\\[a-zA-Z]+/g,"").replace(/[_^]\{([^}]*)\}/g,"$1").replace(/[_^]([a-zA-Z0-9])/g,"$1")
 .replace(/[{}]/g,"");}
// inline işaretleri düz metne indir (bold/italic/code/$..$)
function plain(t){return deLatex(t
 .replace(/\*\*([^*]+)\*\*/g,"$1").replace(/\*([^*]+)\*/g,"$1")
 .replace(/`([^`]+)`/g,"$1").replace(/\$([^$]+)\$/g,"$1")).trim();}

function hlevel(t){
 if(/^BÖLÜM\s+\d+/i.test(t))return 1;
 const m=t.match(/^(\d+(?:\.\d+)*)\.?\s/);
 if(m){const s=m[1].split(".").length; return s>=3?5:(s===2?3:1);}
 return 1;
}

function parse(file){
 const lines=fs.readFileSync(file,"utf8").split(/\r?\n/);
 const out=[]; let i=0, pend=null;
 while(i<lines.length){
  let t=lines[i].trim();
  if(t===""||t==="---"){i++;continue;}
  const hm=t.match(/^#{1,6}\s+(.*)/);
  if(hm){const txt=plain(hm[1]); out.push({k:"h",lv:hlevel(txt),t:txt}); i++; continue;}
  if(t.startsWith("```")){i++; while(i<lines.length&&!lines[i].trim().startsWith("```"))i++; i++; continue;}
  if(t.startsWith(">")){
   const q=t.replace(/^>\s?/,"");
   let fm=q.match(/\*\*\[ŞEKİL\s+([\d.]+)\s*—\s*([^\]]+)\]\*\*/);
   if(fm){const num=fm[1].trim(); const img=path.join(DIAG,`sekil_${num.replace(/\./g,"_")}.png`);
     out.push({k:"fig",num,title:plain(fm[2]),img:fs.existsSync(img)?img:null}); i++; continue;}
   let tm=q.match(/\*\*\[TABLO\s+([\d.]+)\s*—\s*([^\]]+)\]\*\*/);
   if(tm){pend={num:tm[1].trim(),title:plain(tm[2])}; i++; continue;}
   if(/yazım rehberi|Önerilen:/i.test(q)){i++; continue;}
   out.push({k:"note",t:plain(q.replace(/^\*\*Not[^:]*:\*\*\s*/i,"").replace(/^\*\*([^*]+)\*\*/,"$1"))}); i++; continue;
  }
  if(t.startsWith("|")){
   const rows=[]; while(i<lines.length&&lines[i].trim().startsWith("|")){rows.push(lines[i].trim()); i++;}
   const data=rows.filter(r=>!/^\|[\s|:-]+\|$/.test(r)).map(r=>r.replace(/^\||\|$/g,"").split("|").map(c=>plain(c)));
   out.push({k:"tbl",rows:data,cap:pend}); pend=null; continue;
  }
  if(/^[-*]\s+/.test(t)){out.push({k:"li",t:plain(t.replace(/^[-*]\s+/,""))}); i++; continue;}
  const nm=t.match(/^(\d+)\.\s+(.*)/);
  if(nm){out.push({k:"np",t:nm[1]+".  "+plain(nm[2])}); i++; continue;}
  if(t.startsWith("$$")){
   let eq=t.replace(/\$\$/g,"");
   if(t==="$$"){eq=""; i++; while(i<lines.length&&lines[i].trim()!=="$$"){eq+=lines[i]+" "; i++;}}
   out.push({k:"eq",t:deLatex(eq).trim()}); i++; continue;
  }
  out.push({k:"p",t:plain(t)}); i++;
 }
 return out;
}

// --- ön kısımlar ---
function onSection(blocks, startH, stopH){
 // startH ile eşleşen h'den sonra, stopH'a kadar p/li toplar
 const res=[]; let on=false;
 for(const b of blocks){
  if(b.k==="h"){ if(new RegExp(startH,"i").test(b.t)){on=true;continue;} if(on&&stopH&&new RegExp(stopH,"i").test(b.t))break; if(on)continue; }
  if(on&&(b.k==="p"||b.k==="li"))res.push(b.t);
 }
 return res;
}
const oz=parse(path.join(TEZ,"ozet_abstract.md"));
const ozTR=onSection(oz,"^ÖZET$","^ABSTRACT$").filter(x=>!/^Anahtar Kelimeler/i.test(x));
const ozKW=(oz.find(b=>b.k==="p"&&/^Anahtar Kelimeler/i.test(b.t))||{}).t||"";
const enAB=onSection(oz,"^ABSTRACT$",null).filter(x=>!/^Keywords/i.test(x));
const enKW=(oz.find(b=>b.k==="p"&&/^Keywords/i.test(b.t))||{}).t||"";

const tk=parse(path.join(TEZ,"on-kisimlar.md"));
const tesekkur=onSection(tk,"^TEŞEKKÜR$",null);

const ks=parse(path.join(TEZ,"kisaltmalar.md"));
const kisalt=(ks.find(b=>b.k==="tbl")||{rows:[]}).rows.filter(r=>!/Kısaltma|Açılım/i.test(r[0]));

// --- gövde ---
let govde=[];
["bolum1_giris","bolum2_literatur_taramasi","bolum3_yontem","bolum4_gelistirme","bolum5_degerlendirme","bolum6_sonuc","kaynakca"]
 .forEach(f=>{ govde=govde.concat(parse(path.join(TEZ,f+".md"))); });

const result={
 baslik:"IsikCampusOS: Bütünleşik Bir Akıllı Kampüs Platformu",
 altbaslik:"Üniversite İçi Sosyal ve Pratik Süreçlerin Mikroservis Mimarisi Tabanlı Bir Süper-Uygulama ile Bütünleştirilmesi",
 ad:"Tolga Olguner", ogrNo:"23YÖBİ1053", danisman:"Dr. Şahin Aydın", tarih:"Haziran 2026",
 adanan:"Her zaman iyi bir insan olma felsefesiyle beni yetiştiren aileme…",
 ozetTR:ozTR, ozetKW:ozKW, abstractEN:enAB, abstractKW:enKW,
 tesekkur, kisalt, govde
};
fs.writeFileSync(path.join(__dirname,"icerik.json"), JSON.stringify(result,null,1),"utf8");
console.log("icerik.json yazıldı. Gövde blok:",govde.length,"| Özet p:",ozTR.length,"| Abstract p:",enAB.length,"| Teşekkür p:",tesekkur.length,"| Kısaltma:",kisalt.length);
