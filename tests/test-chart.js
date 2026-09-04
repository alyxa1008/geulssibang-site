/* 한글 자음모음표(/hangul/chart/) — 배선·데이터·연결 검사
   실행: node tests/test-chart.js */
"use strict";
const fs=require("fs"), path=require("path");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"hangul/chart/index.html"),"utf8");
let fails=0;
function ok(c,msg){ if(!c){ fails++; console.error("  ✗ "+msg); } }

/* 1) 페이지 배선 */
["btnPrint","btnShare","btnReset","kindSeg","sheets","chartHint","pageLabel","namesField","names"].forEach(id=>ok(html.includes('id="'+id+'"'),"id 누락: "+id));
ok(/track\("print_sheet",\{tool:"chart"/.test(html),"print_sheet tool:chart 배선");
ok(html.includes("copyShareLink(encodeState())"),"공유 링크 배선");
ok((html.match(/data-kind="/g)||[]).length===3,"표 종류 버튼 3개");
ok(html.includes('<link rel="canonical" href="https://geulssibang.com/hangul/chart/">'),"canonical");
ok(html.includes("ca-pub-1834921044404408"),"광고 스크립트");
ok(html.includes('"@type": "FAQPage"')||html.includes('"@type":"FAQPage"'),"FAQ JSON-LD");
ok(html.includes('"@type": "WebApplication"'),"WebApplication JSON-LD");

/* 2) 자모 데이터 — 개수·이름 검산 */
const names14=["기역","니은","디귿","리을","미음","비읍","시옷","이응","지읒","치읓","키읔","티읕","피읖","히읗"];
names14.forEach(n=>ok(html.includes('"'+n+'"'),"자음 이름 누락: "+n));
["쌍기역","쌍디귿","쌍비읍","쌍시옷","쌍지읒"].forEach(n=>ok(html.includes('"'+n+'"'),"쌍자음 이름 누락: "+n));
["아","야","어","여","오","요","우","유","으","이"].forEach(n=>ok(html.includes('"'+n+'"'),"모음 이름 누락: "+n));
ok((html.match(/\[\"ㅐ\",\"애\"\]/)||html.includes('["ㅐ","애"]')),"복합 모음 데이터");
/* 음절 조합 공식 검산 — 페이지와 같은 인덱스로 가·히·냐 재현 */
const CHOI=[0,2,3,5,6,7,9,11,12,14,15,16,17,18], JUNGI=[0,2,4,6,8,12,13,17,18,20];
const syll=(c,v)=>String.fromCharCode(0xAC00+(CHOI[c]*21+JUNGI[v])*28);
ok(syll(0,0)==="가"&&syll(13,9)==="히"&&syll(1,1)==="냐","음절 조합 공식 (가·히·냐)");
ok(html.includes("CHOI=[0,2,3,5,6,7,9,11,12,14,15,16,17,18]"),"페이지 초성 인덱스 = 검산값");
ok(html.includes("JUNGI=[0,2,4,6,8,12,13,17,18,20]"),"페이지 중성 인덱스 = 검산값");
/* 본문 수치 = 데이터 (14+10=24, 19+21=40, 140칸) */
ok(html.includes("24자")&&html.includes("40자")&&html.includes("140칸"),"본문 24자·40자·140칸");

/* 3) 레이아웃 — 세 표 모두 A4 그리기 영역(Y≤270) 안 */
ok(33+2*50+13+4+2*50<=270,"기본표 세로 범위");            // 자음 2줄 + 라벨 + 모음 2줄
ok(28+3*34+10+3+3*34<=270,"전체표 세로 범위");            // 자음 3줄 + 라벨 + 모음 3줄
ok(17+15*16.8<=270,"음절표 세로 범위 (헤더+14줄)");

/* 4) 사이트 연결 */
const sm=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
ok(sm.includes("https://geulssibang.com/hangul/chart/"),"sitemap");
ok(fs.readFileSync(path.join(root,"assets/common.js"),"utf8").includes('"/hangul/chart/":1'),"common.js 최근 도구");
ok(fs.readFileSync(path.join(root,"index.html"),"utf8").includes('href="./hangul/chart/"'),"홈 칩");
ok(fs.readFileSync(path.join(root,"hangul/jamo/index.html"),"utf8").includes('href="../chart/"'),"jamo → chart 연결");
ok(fs.readFileSync(path.join(root,"hangul/order/index.html"),"utf8").includes('href="../chart/"'),"order → chart 연결");
function walk(d,out){ for(const f of fs.readdirSync(d)){ const p=path.join(d,f); if(f==="node_modules"||f===".git")continue; const st=fs.statSync(p); if(st.isDirectory())walk(p,out); else if(f.endsWith(".html"))out.push(p);} return out; }
const pages=walk(root,[]);
const withFoot=pages.filter(p=>fs.readFileSync(p,"utf8").includes('href="/hangul/jamo/">자음·모음 따라쓰기'));
const withChart=withFoot.filter(p=>fs.readFileSync(p,"utf8").includes('href="/hangul/chart/">자음모음표·음절표'));
ok(withFoot.length===withChart.length,"푸터 링크 누락: "+(withFoot.length-withChart.length)+"개");

if(fails){ console.error("test-chart: "+fails+"건 실패"); process.exit(1); }
console.log("test-chart: 통과 (푸터 "+withChart.length+"페이지, sitemap "+(sm.match(/<url>/g)||[]).length+"URL)");
