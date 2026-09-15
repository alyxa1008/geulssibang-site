/* 오늘의 학습지(/today/) — 배선·데이터 원본 대조·연결 검사
   실행: node tests/test-today.js */
"use strict";
const vm=require("vm");
const U=require("./_util");
const ok=U.makeOk("test-today");
const html=U.read("today/index.html");

/* 1) 페이지 배선 */
["btnPrint","btnShare","btnToday","levelSeg","sheets","todayHint","date","name","pageLabel"].forEach(id=>ok(html.includes('id="'+id+'"'),"id 누락: "+id));
ok(/track\("print_sheet",\{tool:"today"/.test(html),"print_sheet tool:today 배선");
ok(html.includes("copyShareLink(encodeState())"),"공유 링크 배선");
ok((html.match(/data-level="/g)||[]).length===4,"학년 버튼 4개");
["../math/generators.js","../maze/maze-gen.js","../quiz/quiz-data.js","../quiz/quiz-gen.js","today-data.js"].forEach(s=>ok(html.includes('<script src="'+s+'">'),"생성기 로드: "+s));
ok(html.includes('<link rel="canonical" href="https://geulssibang.com/today/">'),"canonical");
ok(html.includes("ca-pub-1834921044404408"),"광고 스크립트");
ok(U.ldJson(html).length===2,"JSON-LD 2블록 파싱");
ok(!/function esc\(/.test(html),"escHtml은 common.js 것만 사용");

/* 2) 의존 함수가 실제로 존재하는지 (생성기 파일 쪽) */
const gen=U.read("math/generators.js"), mz=U.read("maze/maze-gen.js");
ok(/function mulberry32\(/.test(gen)&&/function genAll\(/.test(gen),"generators: mulberry32·genAll");
ok(/function buildGrid\(/.test(mz)&&/function carve\(/.test(mz)&&/function gridSVG\(/.test(mz),"maze-gen: buildGrid·carve·gridSVG");
ok(U.read("quiz/quiz-gen.js").includes("root.QuizGen=api"),"QuizGen 전역");
["addsub","gugudan","mul","div"].forEach(id=>ok(gen.includes('id:"'+id+'"'),"수학 토픽 존재: "+id));

/* 3) today-data.js = 급수표·낱말 페이지 원본과 일치 (다르면 node tools/gen-today-data.js) */
const ctx={}; vm.createContext(ctx);
vm.runInContext(U.read("today/today-data.js"),ctx);
const W=ctx.TODAY_WORDS, NM=ctx.TODAY_NATMAL;
for(const k of ["1-1","1-2","2-1","2-2","3"]){
  const sets=U.gsetWords(U.read("badaseugi/geupsu/"+k+"/index.html"));
  ok(JSON.stringify(sets)===JSON.stringify(W[k]),"today-data "+k+" = 급수표 원본");
  ok(sets.reduce((a,s)=>a+s.w.length,0)>=40,k+" 낱말 40개 이상");
}
const nat=[...U.read("hangul/natmal/index.html").matchAll(/data-text="([^"]+)"/g)].map(x=>x[1].split(/\s+/));
ok(JSON.stringify(nat)===JSON.stringify(NM),"today-data natmal = 원본");
const flat=s=>s.reduce((a,x)=>a.concat(x.w),[]);
[["1-1"],["2-1"],["3"]].forEach(ks=>ok(ks.reduce((a,k)=>a.concat(flat(W[k])),[]).filter(w=>w.indexOf(" ")<0&&Array.from(w).length<=4).length>=2,"따라쓰기 후보 "+ks));

/* 4) 줄 패턴 — 12칸 안에 들어가는 조합 (페이지와 같은 규칙) */
const PAT=[4,3,2,1]; const fit=n=>PAT.find(k=>k*n+(k-1)<=12);
ok(fit(1)===4&&fit(2)===4&&fit(3)===3&&fit(4)===2&&fit(5)===2,"줄 패턴: 1·2자 4묶음, 3자 3묶음, 4·5자 2묶음");
ok(html.includes('["solid","trace","empty"]'),"3자 패턴에 빈칸 포함");

/* 5) 사이트 연결 */
const w=U.siteWiring(ok,{url:"/today/", tools:'"/today/":1', home:'href="./today/"', footer:'href="/today/">오늘의 학습지'});
ok.done("푸터 "+w.footerPages+"페이지, sitemap "+w.sitemapUrls+"URL");
