/* 테스트 공용 헬퍼 — 저장소 읽기·HTML 순회·검증 카운터·급수표 추출·사이트 연결 검사
   사용: const U=require("./_util"); const ok=U.makeOk("test-x"); … ok.done("부가 정보"); */
"use strict";
const fs=require("fs"), path=require("path");
const root=path.join(__dirname,"..");

function read(rel){ return fs.readFileSync(path.join(root,rel),"utf8"); }

/* 저장소의 모든 HTML 경로 (node_modules·.git 제외) */
function walk(d,out){
  for(const f of fs.readdirSync(d)){
    if(f==="node_modules"||f===".git") continue;
    const p=path.join(d,f);
    if(fs.statSync(p).isDirectory()) walk(p,out); else if(f.endsWith(".html")) out.push(p);
  }
  return out;
}
function htmlPages(){ return walk(root,[]); }

/* 실패를 세는 ok(cond,msg). ok.done()이 요약 출력 + 실패 시 종료 코드 1 */
function makeOk(label){
  let fails=0;
  function ok(c,msg){ if(!c){ fails++; console.error("  ✗ "+msg); } }
  ok.done=function(extra){
    if(fails){ console.error(label+": "+fails+"건 실패"); process.exit(1); }
    console.log(label+": 통과"+(extra?" ("+extra+")":""));
  };
  return ok;
}

/* 페이지의 JSON-LD 블록 전부 파싱 (깨진 JSON이면 throw) */
function ldJson(html){
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
}

/* 급수표 페이지의 .gset 카드 → [{t:제목, w:[낱말…]}] — common.js wireDeepLinks·today-data와 같은 원천 */
function gsetWords(html){
  const sets=[]; const re=/<div class="gset ccard" data-title="([^"]+)">([\s\S]*?)<\/div>/g; let m;
  while((m=re.exec(html))){
    const items=[...m[2].matchAll(/<li>(.*?)<\/li>/g)].map(x=>x[1].replace(/<[^>]+>/g,"").trim());
    if(items.length) sets.push({t:m[1],w:items});
  }
  return sets;
}

/* 새 도구의 사이트 연결 — sitemap·common.js TOOLS·홈 칩·전 페이지 푸터
   o={url:"/x/", tools:'"/x/":1', home:'href="./x/"', footer:'href="/x/">이름'} */
const FOOTER_ANCHOR='href="/card/">이름 카드';
function siteWiring(ok,o){
  const sm=read("sitemap.xml");
  ok(sm.includes("https://geulssibang.com"+o.url),"sitemap");
  if(o.tools) ok(read("assets/common.js").includes(o.tools),"common.js 최근 도구");
  if(o.home) ok(read("index.html").includes(o.home),"홈 칩");
  const pages=htmlPages().map(p=>fs.readFileSync(p,"utf8"));
  const withFoot=pages.filter(h=>h.includes(FOOTER_ANCHOR));
  const withX=withFoot.filter(h=>h.includes(o.footer));
  ok(withFoot.length===withX.length,"푸터 링크 누락: "+(withFoot.length-withX.length)+"개");
  return { footerPages:withX.length, sitemapUrls:(sm.match(/<url>/g)||[]).length };
}

module.exports={ root, read, walk, htmlPages, makeOk, ldJson, gsetWords, siteWiring };
