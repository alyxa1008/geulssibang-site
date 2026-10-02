/* 상식퀴즈 문제 모음(/quiz/list/) — 생성기 결과 = 파일, 수록 문항 = 문제은행, 딥링크·연결
   실행: node tests/test-quiz-list.js   (문제은행을 고쳤으면 먼저 node tools/gen-quiz-list.js) */
"use strict";
const U=require("./_util");
const G=require("../tools/gen-quiz-list");
const ok=U.makeOk("test-quiz-list");
const html=U.read("quiz/list/index.html");

/* 1) 파일이 생성기 출력과 같다 — 문제은행·틀이 바뀌면 재생성 필요 */
ok(G.build()===html,"quiz/list/index.html = tools/gen-quiz-list.js 출력 (다르면 재생성)");

/* 2) 수록 문항 — 100문제, 칸마다 4개, 문제·정답·해설이 문제은행 그대로 */
const data=G.loadData(), items=G.pickItems(data);
ok(items.length===100&&(html.match(/<li>/g)||[]).length===100,"100문제");
G.CATS.forEach(c=>{ for(let l=1;l<=5;l++) ok(items.filter(q=>q.c===c.id&&q.l===l).length===G.PER_CELL,c.id+" "+l+"급수 "+G.PER_CELL+"문제"); });
const dec=s=>s.replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
const lis=[...html.matchAll(/<li>(\S+) (.*?) <span class="qa"><b>(.*?)<\/b> — (.*?)<\/span><\/li>/g)].map(m=>({q:dec(m[2]),a:dec(m[3]),e:dec(m[4])}));
ok(lis.length===100,"문항 100개 파싱");
lis.forEach(x=>{ const src=data.find(d=>d.q===x.q); ok(!!src&&src.o[0]===x.a&&src.e===x.e,"문제은행과 다름: "+x.q); });
ok(new Set(lis.map(x=>x.q)).size===100,"중복 문제 없음");

/* 3) 퀴즈 도구 딥링크 — v1 [1, 분야, 급수, choice, 10, 1] */
const links=[...html.matchAll(/href="\.\.\/#s=([^"]+)"/g)].map(m=>JSON.parse(Buffer.from(decodeURIComponent(m[1]),"base64").toString("utf8")));
ok(links.length===5&&links.every((a,i)=>a[0]===1&&a[1]===G.CATS[i].id&&a[2]===2&&a[3]==="choice"),"분야별 퀴즈 딥링크 5개");
ok(/JSON\.stringify\(\[1, state\.cats\.join\(","\), state\.level, state\.mode, state\.think, state\.voice\?1:0\]\)/.test(U.read("quiz/index.html")),"퀴즈 encodeState 6칸 그대로 (바뀌면 gen-quiz-list.js quizHash도)");

/* 4) 페이지 요건 */
ok(html.includes('<link rel="canonical" href="https://geulssibang.com/quiz/list/">'),"canonical");
ok(html.includes("ca-pub-1834921044404408"),"광고 스크립트");
const ld=U.ldJson(html);
ok(ld.length===2&&ld.some(o=>o["@type"]==="Article")&&ld.some(o=>o["@type"]==="FAQPage"&&o.mainEntity.length===4),"JSON-LD Article + FAQ 4");
ok(html.includes('printWith("plist",{tool:"quiz-list"})')&&html.includes('id="btnHide"'),"인쇄·정답 가리기 배선");
["animal","science","korea","world","life"].forEach(id=>ok(html.includes('id="'+id+'"')&&html.includes('href="#'+id+'"'),"분야 앵커: "+id));

/* 5) 연결 */
ok(U.read("sitemap.xml").includes("https://geulssibang.com/quiz/list/"),"sitemap");
ok(U.read("quiz/index.html").includes('href="list/"')&&U.read("quiz/tips/index.html").includes('href="../list/"'),"퀴즈 도구·가이드 → 모음 링크");
ok(U.read("index.html").includes('href="./quiz/list/"'),"홈 칩");
ok.done("100문제, 문제은행 "+data.length+"개 중");
