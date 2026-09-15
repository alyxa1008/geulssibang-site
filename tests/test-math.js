/* 수학 문제 생성기(math/generators.js) — 전 토픽·전 단계 불변식 + 시드 결정성
   실행: node tests/test-math.js
   검사: 식을 실제로 계산해 정답과 일치, 뺄셈 음수 없음, 나머지 < 나누는 수, 받아올림 없음 옵션이 자릿수마다 진짜 없음,
         구구단 범위, 소수 자릿수, 분수 분모 0 아님, 같은 시드 = 같은 출력 */
"use strict";
const vm=require("vm");
const U=require("./_util");
const ok=U.makeOk("test-math");
const ctx={}; vm.createContext(ctx);
vm.runInContext(U.read("math/generators.js"),ctx);
const { MATH_GRADES, genAll }=ctx;

/* 토큰 → 숫자값 (분수는 대분수 포함), 문제 식은 JS 식으로 바꿔 계산 */
function tokVal(t){ return t.t==="f" ? (t.w||0)+t.n/t.d : +t.v; }
function ansVal(ans){
  if(ans.length===3&&ans[1].t==="tx") return { q:tokVal(ans[0]), r:tokVal(ans[2]) };   /* 몫 … 나머지 */
  return { q:tokVal(ans[0]) };
}
function evalQ(q){
  const expr=q.map(t=>{
    if(t.t==="n") return "("+t.v+")";
    if(t.t==="f") return "("+((t.w||0)+"+"+t.n+"/"+t.d)+")";
    if(t.t==="op") return {"+":"+","−":"-","×":"*","÷":"/"}[t.v];
    if(t.t==="tx") return t.v;
    throw new Error("unknown token "+JSON.stringify(t));
  }).join("");
  return Function("return "+expr)();
}
const digits=n=>String(n).split("").reverse().map(Number);
function noCarryAdd(a,b){ const da=digits(a), db=digits(b); return da.every((d,i)=>d+(db[i]||0)<=9)&&db.every((d,i)=>d+(da[i]||0)<=9); }
function noBorrowSub(a,b){ const da=digits(a), db=digits(b); return db.every((d,i)=>(da[i]||0)>=d); }

let total=0;
MATH_GRADES.forEach(g=>g.topics.forEach(t=>t.levels.forEach((lv,li)=>{
  const tag=t.id+"["+li+"]";
  const ps=genAll(12345,t.id,li,{noCarry:false,dan:0},40);
  ok(ps.length===40,tag+" 40문제 생성");
  ps.forEach(p=>{
    total++;
    const a=ansVal(p.ans);
    const v=evalQ(p.q);
    if(a.r!==undefined){
      const div=tokVal(p.q[2]);
      ok(tokVal(p.q[0])===div*a.q+a.r&&a.r<div&&a.r>0,tag+" 나머지 검산: "+JSON.stringify(p.q));
    }else{
      ok(Math.abs(v-a.q)<1e-9,tag+" 식≠정답: "+JSON.stringify(p.q)+" → "+a.q+" (계산 "+v+")");
    }
    ok(a.q>=0,tag+" 정답 음수: "+JSON.stringify(p.q));
    p.q.concat(p.ans).forEach(tk=>{
      if(tk.t==="f") ok(tk.d>0&&tk.n>=0,tag+" 분수 분모/분자 이상: "+JSON.stringify(tk));
      if(tk.t==="n") ok(Number.isFinite(tk.v)&&/^-?\d+(\.\d{1,2})?$/.test(String(tk.v)),tag+" 숫자 표기 이상(소수 3자리+): "+tk.v);
    });
  });
})));

/* 받아올림·받아내림 없음 옵션 — 1~2학년 3단계 전부 자릿수마다 검사 */
["add","sub","addsub"].forEach(id=>[0,1,2].forEach(li=>{
  genAll(777,id,li,{noCarry:true},60).forEach(p=>{
    const a=tokVal(p.q[0]), b=tokVal(p.q[2]), op=p.q[1].v;
    if(op==="+") ok(noCarryAdd(a,b),id+"["+li+"] 받아올림 발생: "+a+"+"+b);
    else ok(noBorrowSub(a,b)&&a>b,id+"["+li+"] 받아내림/음수: "+a+"−"+b);
  });
}));

/* 구구단 — 범위와 단 고정 */
genAll(5,"gugudan",0,{dan:0},50).forEach(p=>{ const a=tokVal(p.q[0]), b=tokVal(p.q[2]); ok(a>=2&&a<=9&&b>=1&&b<=9&&tokVal(p.ans[0])===a*b,"구구단 범위: "+a+"×"+b); });
ok(genAll(5,"gugudan",0,{dan:7},30).every(p=>tokVal(p.q[0])===7),"구구단 dan:7 고정");

/* 시드 결정성 */
const s1=JSON.stringify(genAll(99,"addsub",1,{noCarry:false},20)), s2=JSON.stringify(genAll(99,"addsub",1,{noCarry:false},20)), s3=JSON.stringify(genAll(100,"addsub",1,{noCarry:false},20));
ok(s1===s2,"같은 시드 = 같은 문제");
ok(s1!==s3,"다른 시드 = 다른 문제");
ok(ctx.findTopic("없는유형").topic.id==="add","모르는 유형은 덧셈으로 폴백");

ok.done("토픽 "+MATH_GRADES.reduce((n,g)=>n+g.topics.length,0)+"종, 문제 "+total+"개 검산");
