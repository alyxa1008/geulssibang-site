/* 오늘의 학습지 낱말 풀 재추출 — 급수표(badaseugi/geupsu/*)나 natmal 낱말을 고친 뒤 실행
   실행: node tools/gen-today-data.js   → today/today-data.js 덮어씀 (tests/test-today.js가 원본과 대조) */
"use strict";
const fs=require("fs"), path=require("path");
const U=require("../tests/_util");
const geupsu={};
for(const k of ["1-1","1-2","2-1","2-2","3"]) geupsu[k]=U.gsetWords(U.read("badaseugi/geupsu/"+k+"/index.html"));
const natmal=[...U.read("hangul/natmal/index.html").matchAll(/data-text="([^"]+)"/g)].map(x=>x[1].split(/\s+/));
let s="/* 오늘의 학습지 낱말 풀 — 출처: badaseugi/geupsu/*(학기별 급수표 5급×10), hangul/natmal(주제별 첫 낱말)\n"
     +"   급수표를 고치면 `node tools/gen-today-data.js`로 다시 뽑을 것 (tests/test-today.js가 원본과 대조) */\n";
s+="var TODAY_WORDS="+JSON.stringify(geupsu)+";\n";
s+="var TODAY_NATMAL="+JSON.stringify(natmal)+";\n";
fs.writeFileSync(path.join(U.root,"today/today-data.js"),s);
const n=Object.values(geupsu).reduce((a,sets)=>a+sets.reduce((b,x)=>b+x.w.length,0),0);
console.log("today/today-data.js 갱신 — 급수표 낱말 "+n+"개, natmal "+natmal.length+"세트");
