/* 공유 링크(#s=) 포맷 규약 — 모든 도구가 첫 칸에 버전 정수, 로더는 버전 없는 옛 링크도 받음,
   페이지 밖에서 링크를 만드는 곳(common.js wireDeepLinks·card)의 칸 수가 주인 페이지 encodeState와 같아야 함
   실행: node tests/test-share.js */
"use strict";
const U=require("./_util");
const ok=U.makeOk("test-share");

/* JSON.stringify([ … ]) 안의 최상위 칸 수 (괄호·문자열 안 쉼표는 세지 않음) */
function fieldCount(src){
  let depth=0, n=1, inStr=null;
  for(let i=0;i<src.length;i++){
    const c=src[i];
    if(inStr){ if(c==="\\") i++; else if(c===inStr) inStr=null; continue; }
    if(c==='"'||c==="'") inStr=c;
    else if("([{".includes(c)) depth++;
    else if(")]}".includes(c)) depth--;
    else if(c===","&&depth===0) n++;
  }
  return n;
}
function encodeArray(html,fnName){
  const m=new RegExp("function "+(fnName||"encodeState")+"\\(\\)\\{[\\s\\S]*?JSON\\.stringify\\(\\[([\\s\\S]*?)\\]\\)\\)").exec(html);
  return m ? m[1] : null;
}

/* 1) 모든 공유 도구: 첫 칸 버전 정수 + 로더 버전 가드 */
const TOOLS={
  "hangul/index.html":1, "badaseugi/index.html":1, "maze/index.html":1, "maze/hangul/index.html":1, "maze/suja/index.html":1,
  "card/index.html":1, "diary/index.html":1, "hangul/chart/index.html":1, "today/index.html":1, "quiz/index.html":1,
  "gugudan/index.html":1, "math/index.html":2, "math/word/index.html":3, "plan/index.html":2
};
const enc={};
for(const [p,v] of Object.entries(TOOLS)){
  const html=U.read(p), arr=encodeArray(html);
  ok(arr!==null,p+" encodeState 배열 못 찾음");
  if(!arr) continue;
  ok(arr.trim().startsWith(v+","),p+" encodeState 첫 칸이 버전 "+v+" 아님: "+arr.slice(0,30));
  enc[p]=fieldCount(arr);
  ok(/a\[0\]!==\d|a\[0\]===\d|typeof a\[0\]==="number"/.test(html),p+" loadFromHash에 버전 검사 없음");
}

/* 2) 페이지 밖 생성자 = 주인 페이지 칸 수 */
const common=U.read("assets/common.js");
const pick=(src,re)=>{ const m=re.exec(src); return m?fieldCount(m[1]):null; };
ok(pick(common,/var st=\[([\s\S]*?)\];\s*setDeepLink\(b, st\);\s*\}\);\s*\/\* 수학/)===enc["hangul/index.html"],"wireDeepLinks 한글 payload 칸 수 = hangul encodeState ("+enc["hangul/index.html"]+")");
ok(pick(common,/var payload=\[([\s\S]*?)\];/)===enc["badaseugi/index.html"],"wireDeepLinks 받아쓰기 payload 칸 수 = badaseugi encodeState ("+enc["badaseugi/index.html"]+")");
ok(pick(common,/var mp=\[([\s\S]*?)\];/)===enc["maze/hangul/index.html"],"wireDeepLinks 낱말미로 payload 칸 수 = maze/hangul encodeState ("+enc["maze/hangul/index.html"]+")");
ok(pick(U.read("card/index.html"),/var payload=\[([\s\S]*?)\];/)===enc["hangul/index.html"],"card → hangul payload 칸 수 = hangul encodeState");

ok.done(Object.keys(TOOLS).length+"도구 포맷 확인");
