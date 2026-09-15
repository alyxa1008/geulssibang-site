/* 그림일기·원고지 양식(/diary/) — 배선·연결 검사
   실행: node tests/test-diary.js */
"use strict";
const U=require("./_util");
const ok=U.makeOk("test-diary");
const html=U.read("diary/index.html");

/* 1) 페이지 배선 */
["btnPrint","btnShare","btnReset","presetSeg","sheets","diaryHint","pageLabel","colsField"].forEach(id=>ok(html.includes('id="'+id+'"'),"id 누락: "+id));
ok(/track\("print_sheet",\{tool:"diary"/.test(html),"print_sheet tool:diary 배선");
ok(html.includes("copyShareLink(encodeState())"),"공유 링크 배선");
ok((html.match(/data-preset="/g)||[]).length===4,"프리셋 버튼 4개");
["grade1","wongoji","mood","line"].forEach(k=>ok(html.includes(k+":{"),"PRESETS."+k));
ok(html.includes('<link rel="canonical" href="https://geulssibang.com/diary/">'),"canonical");
ok(html.includes("ca-pub-1834921044404408"),"광고 스크립트");
ok(U.ldJson(html).some(o=>o["@type"]==="FAQPage"),"FAQ JSON-LD");

/* 2) 격자 계산 재현 — 페이지 상수와 같은 식으로 줄 수 검산 */
const W=186, Y0=4, Y1=270, PIC={none:0,mid:78,big:105};
function rows(o){ let y=Y0; if(o.header)y+=11; if(o.title||o.name)y+=11; if(o.mood)y+=11; if(PIC[o.pic])y+=PIC[o.pic]+4; return Math.floor((Y1-y)/(W/o.cols)); }
ok(rows({header:1,title:1,pic:"mid",cols:10})===8,"1학년 그림일기 8줄");
ok(rows({title:1,pic:"none",cols:20})===27,"원고지 27줄");
ok(html.includes("27줄")&&html.includes("540자"),"본문 원고지 줄·자 수 = 계산값");
ok(rows({header:1,title:1,mood:1,pic:"big",cols:10})>=3,"최대 헤더+큰 그림에서도 3줄 이상");

/* 3) 사이트 연결 */
const w=U.siteWiring(ok,{url:"/diary/", tools:'"/diary/":1', home:'href="./diary/"', footer:'href="/diary/">그림일기·원고지'});
ok.done("푸터 "+w.footerPages+"페이지, sitemap "+w.sitemapUrls+"URL");
