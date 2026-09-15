/* 문장제 생성기(math/wordgen.js) — 조사 규칙·정답 양수·이름 반영·시드 결정성
   실행: node tests/test-word.js */
"use strict";
const vm=require("vm");
const U=require("./_util");
const ok=U.makeOk("test-word");
const ctx={}; vm.createContext(ctx);
vm.runInContext(U.read("math/wordgen.js"),ctx);
const { genWord, hasJong, J_eun, J_iga, J_eul, N_sub, N_top, NAMES }=ctx;

/* 1) 조사 — 받침 유무 */
ok(hasJong("책")===true&&hasJong("사과")===false&&hasJong("연필")===true,"hasJong 받침 판정");
ok(J_eun("책")==="책은"&&J_eun("사과")==="사과는","은/는");
ok(J_iga("책")==="책이"&&J_iga("사과")==="사과가","이/가");
ok(J_eul("책")==="책을"&&J_eul("사과")==="사과를","을/를");
ok(N_sub("지훈")==="지훈이가"&&N_sub("지아")==="지아가","이름 주격 이가/가");
ok(N_top("서연")==="서연이는"&&N_top("수아")==="수아는","이름 주제격 이는/는");

/* 2) 전 유형 — 정답 양수 정수, 단위 있음, 문장에 이중 공백·미치환 토큰 없음 */
let total=0;
["add","sub","mul","div","mix"].forEach(op=>{
  const ps=genWord(4242,op,60,"");
  ok(ps.length===60,op+" 60문제");
  ps.forEach(p=>{
    total++;
    ok(Number.isInteger(p.a)&&p.a>0,op+" 정답 양수 정수 아님: "+p.a+" ← "+p.q);
    ok(typeof p.u==="string"&&p.u.length>0,op+" 단위 없음: "+p.q);
    ok(/[?？]$/.test(p.q.trim())&&!/undefined|NaN|\s{2,}/.test(p.q),op+" 문장 이상: "+p.q);
  });
  for(let i=1;i<ps.length;i++) ok(ps[i].q!==ps[i-1].q,op+" 같은 문장 연속");
});

/* 3) 주인공 이름 반영 — 지정하면 모든 문장에 등장, 상대 이름은 주인공과 다름 */
/* 일부 템플릿은 이름 없이 만들어짐("사탕 12개를 한 봉지에…") — 이름이 등장하는 문장에는 반드시 주인공이 있어야 한다 */
const hero=genWord(7,"mix",40,"하준");
const named=hero.filter(p=>NAMES.some(n=>p.q.indexOf(n)>=0)||p.q.indexOf("하준")>=0);
ok(named.length>=20&&named.every(p=>p.q.indexOf("하준")>=0),"이름 나오는 문장엔 주인공 이름");
ok(NAMES.length>=10&&genWord(7,"add",30,"").every(p=>NAMES.some(n=>p.q.indexOf(n)>=0)),"이름 미지정 시 기본 이름 풀 사용");

/* 4) 시드 결정성 */
ok(JSON.stringify(genWord(11,"mix",20,""))===JSON.stringify(genWord(11,"mix",20,"")),"같은 시드 = 같은 문제");
ok(JSON.stringify(genWord(11,"mix",20,""))!==JSON.stringify(genWord(12,"mix",20,"")),"다른 시드 = 다른 문제");

ok.done("문제 "+total+"개 검산");
