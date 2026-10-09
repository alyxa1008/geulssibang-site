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


/* 글 문제 검산 — 원(둘레·넓이), 비와 비율, 비례식·비례배분 */
const fval=tk=>tk.t==="f"?(tk.w||0)+tk.n/tk.d:+tk.v;
function checkText(tag,p){
  const c=p.chk, q=p.q.map(tk=>tk.t==="f"?tk.n+"/"+tk.d:tk.v).join("");
  /* 조사 검사: 분수는 'd분의 n'으로 읽혀 끝소리가 분자 — 분수를 분자로 바꿔 마지막 숫자의 받침 규칙(0·1·3·6·7·8 → 을)을 본다 */
  const qr=p.q.map(tk=>tk.t==="f"?String(tk.n):tk.v).join("");
  ok(!/을\(를\)|[0-9]를 |[0-9]을 /.test(qr.replace(/[013678]을 /g,"").replace(/[2459]를 /g,"")),tag+" 조사 을/를: "+q);
  if(c.what){ const exp=Math.round((c.what==="둘레"?2*c.r*c.pi:c.r*c.r*c.pi)*100)/100; ok(fval(p.ans[0])===exp&&c.ans===exp&&p.fig&&p.fig.kind==="circle"&&/cm/.test(p.ans[1].v),tag+" 원 "+c.what+" r="+c.r+" pi="+c.pi+" → "+exp); return; }
  if(c.pct!==undefined){ ok(fval(p.ans[0])===c.pct&&p.ans[1].v==="%"&&Number.isInteger(c.pct)===(c.dec!==undefined||true),tag+" 백분율 "+c.pct); return; }
  if(c.base){ ok(fval(p.ans[0])===c.base*c.p/100&&Number.isInteger(c.base*c.p/100),tag+" 백분율 계산 "+c.base+"의 "+c.p+"%"); return; }
  if(c.total){ const x=fval(p.ans[0]), y=fval(p.ans[2]); ok(x+y===c.total&&x*c.b===y*c.a&&Number.isInteger(x)&&Number.isInteger(y),tag+" 비례배분 "+c.total+" → "+x+","+y); return; }
  if(c.k&&c.pos!==undefined){ ok(fval(p.ans[0])===(c.pos===0?c.b*c.k:c.a*c.k),tag+" 비례식 □"); return; }
  if(c.k){ const g=(a,b)=>b?g(b,a%b):a; ok(g(c.a,c.b)===1&&fval(p.ans[0])===c.a&&fval(p.ans[2])===c.b,tag+" 간단한 비 "+c.a+":"+c.b); return; }
  if(c.b){ ok(Math.abs(fval(p.ans[0])-c.a/c.b)<1e-9,tag+" 비→분수 "+c.a+":"+c.b); return; }
  ok(false,tag+" 알 수 없는 글 문제: "+q);
}

let total=0;
MATH_GRADES.forEach(g=>g.topics.forEach(t=>t.levels.forEach((lv,li)=>{
  const tag=t.id+"["+li+"]";
  const ps=genAll(12345,t.id,li,{noCarry:false,dan:0},40);
  ok(ps.length===40,tag+" 40문제 생성");
  ps.forEach(p=>{
    total++;
    if(p.txt){ checkText(tag,p); return; }   /* 6학년 글 문제: 생성기가 남긴 chk로 검산 */
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

ok(MATH_GRADES[2].topics.map(t=>t.id).join()==="mixed,fracdiff,decmd,circle,ratio,prop","5~6학년 탭에 원·비와 비율·비례식");
ok.done("토픽 "+MATH_GRADES.reduce((n,g)=>n+g.topics.length,0)+"종, 문제 "+total+"개 검산");
