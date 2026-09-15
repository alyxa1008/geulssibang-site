/* 오늘의 학습지(/today/) — 배선·데이터 원본 대조·연결 검사
   실행: node tests/test-today.js */
"use strict";
const fs=require("fs"), path=require("path"), vm=require("vm");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"today/index.html"),"utf8");
let fails=0;
function ok(c,msg){ if(!c){ fails++; console.error("  ✗ "+msg); } }

/* 1) 페이지 배선 */
["btnPrint","btnShare","btnToday","levelSeg","sheets","todayHint","date","name","pageLabel"].forEach(id=>ok(html.includes('id="'+id+'"'),"id 누락: "+id));
ok(/track\("print_sheet",\{tool:"today"/.test(html),"print_sheet tool:today 배선");
ok(html.includes("copyShareLink(encodeState())"),"공유 링크 배선");
ok((html.match(/data-level="/g)||[]).length===4,"학년 버튼 4개");
["../math/generators.js","../maze/maze-gen.js","../quiz/quiz-data.js","../quiz/quiz-gen.js","today-data.js"].forEach(s=>ok(html.includes('<script src="'+s+'">'),"생성기 로드: "+s));
ok(html.includes('<link rel="canonical" href="https://geulssibang.com/today/">'),"canonical");
ok(html.includes("ca-pub-1834921044404408"),"광고 스크립트");
const lds=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
ok(lds.length===2,"JSON-LD 2블록");
lds.forEach(m=>{ try{ JSON.parse(m[1]); }catch(e){ ok(false,"JSON-LD 파싱 실패: "+e.message); } });

/* 2) 의존 함수가 실제로 존재하는지 (생성기 파일 쪽) */
const gen=fs.readFileSync(path.join(root,"math/generators.js"),"utf8");
const mz=fs.readFileSync(path.join(root,"maze/maze-gen.js"),"utf8");
ok(/function mulberry32\(/.test(gen)&&/function genAll\(/.test(gen),"generators: mulberry32·genAll");
ok(/function buildGrid\(/.test(mz)&&/function carve\(/.test(mz)&&/function gridSVG\(/.test(mz),"maze-gen: buildGrid·carve·gridSVG");
ok(fs.readFileSync(path.join(root,"quiz/quiz-gen.js"),"utf8").includes("root.QuizGen=api"),"QuizGen 전역");
/* 페이지가 쓰는 토픽·단계가 등록부에 있는지 */
["addsub","gugudan","mul","div"].forEach(id=>ok(gen.includes('id:"'+id+'"'),"수학 토픽 존재: "+id));

/* 3) today-data.js = 급수표·낱말 페이지 원본과 일치 */
const ctx={}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,"today/today-data.js"),"utf8"),ctx);
const W=ctx.TODAY_WORDS, NM=ctx.TODAY_NATMAL;
for(const k of ["1-1","1-2","2-1","2-2","3"]){
  const h=fs.readFileSync(path.join(root,"badaseugi/geupsu/"+k+"/index.html"),"utf8");
  const sets=[]; const re=/<div class="gset ccard" data-title="([^"]+)">([\s\S]*?)<\/div>/g; let m;
  while((m=re.exec(h))){ const items=[...m[2].matchAll(/<li>(.*?)<\/li>/g)].map(x=>x[1].replace(/<[^>]+>/g,"").trim()); if(items.length) sets.push({t:m[1],w:items}); }
  ok(JSON.stringify(sets)===JSON.stringify(W[k]),"today-data "+k+" = 급수표 원본 (다르면 today-data.js 재추출)");
  ok(sets.reduce((a,s)=>a+s.w.length,0)>=40,k+" 낱말 40개 이상");
}
const nat=[...fs.readFileSync(path.join(root,"hangul/natmal/index.html"),"utf8").matchAll(/data-text="([^"]+)"/g)].map(x=>x[1].split(/\s+/));
ok(JSON.stringify(nat)===JSON.stringify(NM),"today-data natmal = 원본");
/* 따라쓰기 후보(공백 없고 4자 이하)가 학년마다 2개 이상 */
const flat=s=>s.reduce((a,x)=>a.concat(x.w),[]);
[["1-1"],["2-1"],["3"]].forEach(ks=>ok(ks.reduce((a,k)=>a.concat(flat(W[k])),[]).filter(w=>w.indexOf(" ")<0&&Array.from(w).length<=4).length>=2,"따라쓰기 후보 "+ks));

/* 4) 줄 패턴 — 12칸 안에 들어가는 조합 (페이지와 같은 규칙) */
const PAT=[4,3,2,1]; const fit=n=>PAT.find(k=>k*n+(k-1)<=12);
ok(fit(1)===4&&fit(2)===4&&fit(3)===3&&fit(4)===2&&fit(5)===2,"줄 패턴: 1·2자 4묶음, 3자 3묶음, 4·5자 2묶음");
ok(html.includes('["solid","trace","empty"]'),"3자 패턴에 빈칸 포함");

/* 5) 사이트 연결 */
const sm=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
ok(sm.includes("https://geulssibang.com/today/"),"sitemap");
ok(fs.readFileSync(path.join(root,"assets/common.js"),"utf8").includes('"/today/":1'),"common.js 최근 도구");
ok(fs.readFileSync(path.join(root,"index.html"),"utf8").includes('href="./today/"'),"홈 칩");
function walk(d,out){ for(const f of fs.readdirSync(d)){ const p=path.join(d,f); if(f==="node_modules"||f===".git")continue; const st=fs.statSync(p); if(st.isDirectory())walk(p,out); else if(f.endsWith(".html"))out.push(p);} return out; }
const pages=walk(root,[]);
const withFoot=pages.filter(p=>fs.readFileSync(p,"utf8").includes('href="/diary/">그림일기·원고지'));
const withToday=withFoot.filter(p=>fs.readFileSync(p,"utf8").includes('href="/today/">오늘의 학습지'));
ok(withFoot.length===withToday.length,"푸터 링크 누락: "+(withFoot.length-withToday.length)+"개");

if(fails){ console.error("test-today: "+fails+"건 실패"); process.exit(1); }
console.log("test-today: 통과 (푸터 "+withToday.length+"페이지, sitemap "+(sm.match(/<url>/g)||[]).length+"URL)");
