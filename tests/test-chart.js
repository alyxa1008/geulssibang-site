/* 한글 자음모음표(/hangul/chart/) — 배선·데이터·연결 검사
   실행: node tests/test-chart.js */
"use strict";
const U=require("./_util");
const ok=U.makeOk("test-chart");
const html=U.read("hangul/chart/index.html");

/* 1) 페이지 배선 */
["btnPrint","btnShare","btnReset","kindSeg","sheets","chartHint","pageLabel","namesField","names"].forEach(id=>ok(html.includes('id="'+id+'"'),"id 누락: "+id));
ok(/track\("print_sheet",\{tool:"chart"/.test(html),"print_sheet tool:chart 배선");
ok(html.includes("copyShareLink(encodeState())"),"공유 링크 배선");
ok((html.match(/data-kind="/g)||[]).length===3,"표 종류 버튼 3개");
ok(html.includes('<link rel="canonical" href="https://geulssibang.com/hangul/chart/">'),"canonical");
ok(html.includes("ca-pub-1834921044404408"),"광고 스크립트");
const ld=U.ldJson(html);
ok(ld.some(o=>o["@type"]==="FAQPage")&&ld.some(o=>o["@type"]==="WebApplication"),"FAQ·WebApplication JSON-LD");

/* 2) 자모 데이터 — 개수·이름 검산 */
["기역","니은","디귿","리을","미음","비읍","시옷","이응","지읒","치읓","키읔","티읕","피읖","히읗"].forEach(n=>ok(html.includes('"'+n+'"'),"자음 이름 누락: "+n));
["쌍기역","쌍디귿","쌍비읍","쌍시옷","쌍지읒"].forEach(n=>ok(html.includes('"'+n+'"'),"쌍자음 이름 누락: "+n));
["아","야","어","여","오","요","우","유","으","이"].forEach(n=>ok(html.includes('"'+n+'"'),"모음 이름 누락: "+n));
ok(html.includes('["ㅐ","애"]'),"복합 모음 데이터");
/* 음절 조합 공식 검산 — 페이지와 같은 인덱스로 가·히·냐 재현 */
const CHOI=[0,2,3,5,6,7,9,11,12,14,15,16,17,18], JUNGI=[0,2,4,6,8,12,13,17,18,20];
const syll=(c,v)=>String.fromCharCode(0xAC00+(CHOI[c]*21+JUNGI[v])*28);
ok(syll(0,0)==="가"&&syll(13,9)==="히"&&syll(1,1)==="냐","음절 조합 공식 (가·히·냐)");
ok(html.includes("CHOI=[0,2,3,5,6,7,9,11,12,14,15,16,17,18]"),"페이지 초성 인덱스 = 검산값");
ok(html.includes("JUNGI=[0,2,4,6,8,12,13,17,18,20]"),"페이지 중성 인덱스 = 검산값");
ok(html.includes("24자")&&html.includes("40자")&&html.includes("140칸"),"본문 24자·40자·140칸");

/* 3) 레이아웃 — 세 표 모두 A4 그리기 영역(Y≤270) 안 */
ok(33+2*50+13+4+2*50<=270,"기본표 세로 범위");
ok(28+3*34+10+3+3*34<=270,"전체표 세로 범위");
ok(17+15*16.8<=270,"음절표 세로 범위 (헤더+14줄)");

/* 4) 사이트 연결 */
ok(U.read("hangul/jamo/index.html").includes('href="../chart/"'),"jamo → chart 연결");
ok(U.read("hangul/order/index.html").includes('href="../chart/"'),"order → chart 연결");
const w=U.siteWiring(ok,{url:"/hangul/chart/", tools:'"/hangul/chart/":1', home:'href="./hangul/chart/"', footer:'href="/hangul/chart/">자음모음표·음절표'});
ok.done("푸터 "+w.footerPages+"페이지, sitemap "+w.sitemapUrls+"URL");
