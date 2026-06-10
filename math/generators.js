"use strict";
/* =============================================================
   글씨방 수학 — 문제 생성기 등록부 (math/generators.js)

   학년·유형 분류는 2022 개정 교육과정(2024~2026년 적용)
   초등 수학 '수와 연산' 단원을 따른다. 난이도 라벨의 (3-1)은
   3학년 1학기 단원이라는 뜻.

   새 유형 추가 방법:
   1) 토픽 객체를 만든다.
      { id, name, levels:[{label, t, v, per?, gen}], carry?, dan? }
        label : 난이도 선택지에 보이는 글
        t     : 학습지 자동 제목
        v     : true면 세로셈 지원
        per   : 한 장당 문제 수 (생략 시 20)
        gen   : (rnd, o) → 문제 1개. o = {noCarry, dan}
   2) MATH_GRADES의 학년군 배열에 그 객체를 넣는다.
   메뉴·난이도·제목·정답지는 이 등록 정보로 자동 구성된다.

   문제 형태: { q:[토큰...], ans:[토큰...], v?:{a,op,b} }
     N(3)       숫자(소수 포함)
     F(1,2)     분수 1/2,  F(1,2,3) 대분수 3과 1/2
     OP("+")    연산 기호
     TX("(")    그 외 문자
     v          세로셈용 두 항 (지원할 때만)
   ============================================================= */

/* ---------- 시드 난수 ---------- */
function mulberry32(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function ri(rnd,min,max){return Math.floor(rnd()*(max-min+1))+min;}

/* ---------- 토큰 ---------- */
function N(v){return {t:"n",v:v};}
function F(n,d,w){return {t:"f",n:n,d:d,w:w||0};}
function OP(v){return {t:"op",v:v};}
function TX(v){return {t:"tx",v:v};}

function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
/* n/d를 기약분수·대분수·자연수 토큰으로 정리 */
function fracTok(n,d){
  var g=gcd(n,d)||1; n/=g; d/=g;
  if(d===1) return N(n);
  if(n>d) return F(n%d,d,(n-n%d)/d);
  return F(n,d);
}
/* 두 항 문제 (세로셈 가능) */
function P2(a,op,b,ans){return {q:[N(a),OP(op),N(b)],ans:[ans],v:{a:a,op:op,b:b}};}

/* ============================ 1~2학년 ============================
   덧셈·뺄셈: 1학년 한 자리 → 2학년 받아올림 있는 두 자리 (2-1)
   곱셈구구: 2학년 2학기 */
function genAdd(rnd,lv,noCarry){
  var a,b,t,u,t1,u1,t2,u2;
  if(noCarry){
    if(lv===1){ a=ri(rnd,1,8); b=ri(rnd,1,9-a); }
    else if(lv===2){ t=ri(rnd,1,9); u=ri(rnd,0,8); a=t*10+u; b=ri(rnd,1,9-u); }
    else { t1=ri(rnd,1,8); u1=ri(rnd,0,9); t2=ri(rnd,1,9-t1); u2=ri(rnd,0,9-u1); a=t1*10+u1; b=t2*10+u2; }
  } else {
    if(lv===1){ a=ri(rnd,2,9); b=ri(rnd,2,9); }
    else if(lv===2){ a=ri(rnd,10,99); b=ri(rnd,2,9); }
    else { a=ri(rnd,10,99); b=ri(rnd,10,99); }
  }
  return P2(a,"+",b,N(a+b));
}
function genSub(rnd,lv,noBorrow){
  var a,b,t,u,t1,u1,t2,u2;
  if(noBorrow){
    if(lv===1){ a=ri(rnd,2,9); b=ri(rnd,1,a-1); }
    else if(lv===2){ t=ri(rnd,1,9); u=ri(rnd,1,9); a=t*10+u; b=ri(rnd,1,u); }
    else { t1=ri(rnd,2,9); u1=ri(rnd,1,9); t2=ri(rnd,1,t1-1); u2=ri(rnd,0,u1); a=t1*10+u1; b=t2*10+u2; }
  } else {
    if(lv===1){ a=ri(rnd,3,9); b=ri(rnd,1,a-1); }
    else if(lv===2){ a=ri(rnd,11,99); b=ri(rnd,2,9); if(b>=a)b=a-1; }
    else { a=ri(rnd,20,99); b=ri(rnd,10,a-1); }
  }
  return P2(a,"−",b,N(a-b));
}
var LV12=["1단계 — 한 자리 수 (1학년)","2단계 — 두 자리와 한 자리 (1~2학년)","3단계 — 두 자리끼리 (2학년)"];
function mkLv12(t,fn){
  return [1,2,3].map(function(lv){
    return {label:LV12[lv-1], t:t+" 연습 "+"①②③"[lv-1], v:true,
            gen:function(rnd,o){return fn(rnd,lv,o.noCarry);}};
  });
}
var T_ADD={id:"add", name:"덧셈", carry:true, levels:mkLv12("덧셈",genAdd)};
var T_SUB={id:"sub", name:"뺄셈", carry:true, levels:mkLv12("뺄셈",genSub)};
var T_ADDSUB={id:"addsub", name:"혼합", carry:true,
  levels:mkLv12("덧셈·뺄셈",function(rnd,lv,nc){ return rnd()<0.5? genAdd(rnd,lv,nc) : genSub(rnd,lv,nc); })};
var T_GUGUDAN={id:"gugudan", name:"구구단", dan:true, levels:[
  {label:"구구단 (2학년 2학기)", t:"구구단 연습", v:true, gen:function(rnd,o){
    var a=o.dan>0? o.dan : ri(rnd,2,9), b=ri(rnd,1,9);
    return P2(a,"×",b,N(a*b));
  }}
]};

/* ============================ 3~4학년 ============================
   세 자리 덧셈·뺄셈(3-1), 곱셈(3-1~4-1), 나눗셈(3-1~4-1),
   분모가 같은 분수의 덧셈·뺄셈(4-2), 소수의 덧셈·뺄셈(4-2) */
function add3(rnd){ var a=ri(rnd,100,999), b=ri(rnd,100,999); return P2(a,"+",b,N(a+b)); }
function sub3(rnd){ var a=ri(rnd,200,999), b=ri(rnd,100,a-1); return P2(a,"−",b,N(a-b)); }
var T_ADDSUB3={id:"addsub3", name:"덧셈·뺄셈", levels:[
  {label:"1단계 — 세 자리 덧셈 (3-1)", t:"세 자리 덧셈 연습", v:true, gen:add3},
  {label:"2단계 — 세 자리 뺄셈 (3-1)", t:"세 자리 뺄셈 연습", v:true, gen:sub3},
  {label:"3단계 — 덧셈·뺄셈 섞어서", t:"세 자리 덧셈·뺄셈 연습", v:true, gen:function(rnd){
    return rnd()<0.5? add3(rnd) : sub3(rnd);
  }}
]};

var T_MUL={id:"mul", name:"곱셈", levels:[
  {label:"1단계 — 두 자리 × 한 자리 (3-1)", t:"곱셈 연습 ①", v:true, gen:function(rnd){var a=ri(rnd,11,99),b=ri(rnd,2,9); return P2(a,"×",b,N(a*b));}},
  {label:"2단계 — 세 자리 × 한 자리 (3-2)", t:"곱셈 연습 ②", v:true, gen:function(rnd){var a=ri(rnd,101,999),b=ri(rnd,2,9); return P2(a,"×",b,N(a*b));}},
  {label:"3단계 — 두 자리 × 두 자리 (3-2)", t:"곱셈 연습 ③", v:true, gen:function(rnd){var a=ri(rnd,11,99),b=ri(rnd,11,99); return P2(a,"×",b,N(a*b));}},
  {label:"4단계 — 세 자리 × 두 자리 (4-1)", t:"곱셈 연습 ④", v:true, gen:function(rnd){var a=ri(rnd,101,999),b=ri(rnd,11,99); return P2(a,"×",b,N(a*b));}}
]};

function divP(a,b,q,r){
  return {q:[N(a),OP("÷"),N(b)], ans: r? [N(q),TX("…"),N(r)] : [N(q)]};
}
var T_DIV={id:"div", name:"나눗셈", levels:[
  {label:"1단계 — 곱셈구구 범위 (3-1)", t:"나눗셈 연습 ①", gen:function(rnd){
    var b=ri(rnd,2,9), q=ri(rnd,2,9); return divP(b*q,b,q,0);
  }},
  {label:"2단계 — 곱셈구구 범위, 나머지 (3-2)", t:"나눗셈 연습 ②", gen:function(rnd){
    var b=ri(rnd,3,9), q=ri(rnd,2,9), r=ri(rnd,1,b-1); return divP(b*q+r,b,q,r);
  }},
  {label:"3단계 — 두·세 자리 ÷ 한 자리 (3-2)", t:"나눗셈 연습 ③", gen:function(rnd){
    var b=ri(rnd,2,9), q=ri(rnd,11,Math.floor(999/b)); return divP(b*q,b,q,0);
  }},
  {label:"4단계 — 두·세 자리 ÷ 한 자리, 나머지 (3-2)", t:"나눗셈 연습 ④", gen:function(rnd){
    var b=ri(rnd,3,9), q=ri(rnd,11,Math.floor((999-(b-1))/b)), r=ri(rnd,1,b-1);
    return divP(b*q+r,b,q,r);
  }},
  {label:"5단계 — 두·세 자리 ÷ 두 자리 (4-1)", t:"나눗셈 연습 ⑤", gen:function(rnd){
    var b=ri(rnd,11,29), q=ri(rnd,2,Math.floor(999/b));
    if(rnd()<0.5) return divP(b*q,b,q,0);
    var r=ri(rnd,1,b-1); return divP(b*q+r,b,q,r);
  }}
]};

function fracSameAdd(rnd){
  var d=ri(rnd,3,10), n1=ri(rnd,1,d-1), n2=ri(rnd,1,d-1);
  return {q:[F(n1,d),OP("+"),F(n2,d)], ans:[fracTok(n1+n2,d)]};
}
function fracSameSub(rnd){
  var d=ri(rnd,3,10), n1=ri(rnd,2,d-1), n2=ri(rnd,1,n1-1);
  return {q:[F(n1,d),OP("−"),F(n2,d)], ans:[fracTok(n1-n2,d)]};
}
var T_FRAC_SAME={id:"fracsame", name:"분수", levels:[
  {label:"1단계 — 분모가 같은 덧셈 (4-2)", t:"분수 덧셈 연습", per:16, gen:fracSameAdd},
  {label:"2단계 — 분모가 같은 뺄셈 (4-2)", t:"분수 뺄셈 연습", per:16, gen:fracSameSub},
  {label:"3단계 — 덧셈·뺄셈 섞어서", t:"분수 연습", per:16, gen:function(rnd){
    return rnd()<0.5? fracSameAdd(rnd) : fracSameSub(rnd);
  }}
]};

/* 소수: 부동소수점 오차를 피하려고 10·100배 정수로 만들고 나눠서 표시 */
function decN(rnd,scale){
  var v=ri(rnd,scale+1,scale*10-1);
  while(v%10===0) v=ri(rnd,scale+1,scale*10-1);
  return v;
}
function decAS(rnd,scale){
  var a=decN(rnd,scale), b=decN(rnd,scale);
  if(rnd()<0.5) return P2(a/scale,"+",b/scale,N((a+b)/scale));
  if(a===b) a+=1;
  if(a<b){ var t=a; a=b; b=t; }
  return P2(a/scale,"−",b/scale,N((a-b)/scale));
}
var T_DEC_AS={id:"decas", name:"소수", levels:[
  {label:"1단계 — 소수 한 자리 덧셈·뺄셈 (4-2)", t:"소수 덧셈·뺄셈 연습 ①", v:true, gen:function(rnd){return decAS(rnd,10);}},
  {label:"2단계 — 소수 두 자리 덧셈·뺄셈 (4-2)", t:"소수 덧셈·뺄셈 연습 ②", v:true, gen:function(rnd){return decAS(rnd,100);}}
]};

/* ============================ 5~6학년 ============================
   자연수의 혼합 계산(5-1), 분모가 다른 분수의 덧셈·뺄셈(5-1),
   분수의 곱셈(5-2)·나눗셈(6-1, 6-2), 소수의 곱셈(5-2)·나눗셈(6-1, 6-2) */
function prob3(q,ans){return {q:q,ans:[N(ans)]};}
var T_MIXED={id:"mixed", name:"혼합 계산", levels:[
  {label:"1단계 — 곱셈·나눗셈 먼저 (5-1)", t:"혼합 계산 연습 ①", gen:function(rnd){
    var p=ri(rnd,0,5), b=ri(rnd,2,9), c=ri(rnd,2,9), q=ri(rnd,2,9), a;
    if(p===0){ a=ri(rnd,2,30); return prob3([N(a),OP("+"),N(b),OP("×"),N(c)], a+b*c); }
    if(p===1){ a=ri(rnd,b*c+1,b*c+30); return prob3([N(a),OP("−"),N(b),OP("×"),N(c)], a-b*c); }
    if(p===2){ a=ri(rnd,1,b*c-1); return prob3([N(b),OP("×"),N(c),OP("−"),N(a)], b*c-a); }
    if(p===3){ a=ri(rnd,2,30); return prob3([N(a),OP("+"),N(c*q),OP("÷"),N(c)], a+q); }
    if(p===4){ a=ri(rnd,q+1,q+30); return prob3([N(a),OP("−"),N(c*q),OP("÷"),N(c)], a-q); }
    a=ri(rnd,2,30); return prob3([N(c*q),OP("÷"),N(c),OP("+"),N(a)], q+a);
  }},
  {label:"2단계 — 괄호가 있는 식 (5-1)", t:"혼합 계산 연습 ②", gen:function(rnd){
    var p=ri(rnd,0,4), a,b,c,q,s;
    if(p===0){ a=ri(rnd,1,9); b=ri(rnd,1,9); c=ri(rnd,2,9);
      return prob3([TX("("),N(a),OP("+"),N(b),TX(")"),OP("×"),N(c)], (a+b)*c); }
    if(p===1){ a=ri(rnd,3,9); b=ri(rnd,1,a-1); c=ri(rnd,2,9);
      return prob3([TX("("),N(a),OP("−"),N(b),TX(")"),OP("×"),N(c)], (a-b)*c); }
    if(p===2){ a=ri(rnd,2,9); b=ri(rnd,1,9); c=ri(rnd,1,9);
      return prob3([N(a),OP("×"),TX("("),N(b),OP("+"),N(c),TX(")")], a*(b+c)); }
    if(p===3){ b=ri(rnd,1,9); c=ri(rnd,1,9); a=ri(rnd,b+c+1,b+c+20);
      return prob3([N(a),OP("−"),TX("("),N(b),OP("+"),N(c),TX(")")], a-(b+c)); }
    c=ri(rnd,2,9); q=ri(rnd,2,9); s=c*q; a=ri(rnd,1,s-1); b=s-a;
    return prob3([TX("("),N(a),OP("+"),N(b),TX(")"),OP("÷"),N(c)], q);
  }}
]};

var T_FRAC_HI={id:"fracdiff", name:"분수", levels:[
  {label:"1단계 — 분모가 다른 덧셈·뺄셈 (5-1)", t:"분수 덧셈·뺄셈 연습", per:16, gen:function(rnd){
    var d1=ri(rnd,2,9), d2=ri(rnd,2,9);
    while(d2===d1) d2=ri(rnd,2,9);
    var n1=ri(rnd,1,d1-1), n2=ri(rnd,1,d2-1);
    var add=rnd()<0.5;
    if(!add){
      if(n1*d2===n2*d1) add=true;                       /* 차가 0이면 덧셈으로 */
      else if(n1*d2<n2*d1){ var tn=n1,td=d1; n1=n2; d1=d2; n2=tn; d2=td; }
    }
    return {q:[F(n1,d1),OP(add?"+":"−"),F(n2,d2)],
            ans:[fracTok(add? n1*d2+n2*d1 : n1*d2-n2*d1, d1*d2)]};
  }},
  {label:"2단계 — 분수 × 자연수 (5-2)", t:"분수 곱셈 연습 ①", per:16, gen:function(rnd){
    var d=ri(rnd,2,9), n=ri(rnd,1,d-1), k=ri(rnd,2,9);
    return {q:[F(n,d),OP("×"),N(k)], ans:[fracTok(n*k,d)]};
  }},
  {label:"3단계 — 분수 × 분수 (5-2)", t:"분수 곱셈 연습 ②", per:16, gen:function(rnd){
    var d1=ri(rnd,2,9), n1=ri(rnd,1,d1-1), d2=ri(rnd,2,9), n2=ri(rnd,1,d2-1);
    return {q:[F(n1,d1),OP("×"),F(n2,d2)], ans:[fracTok(n1*n2,d1*d2)]};
  }},
  {label:"4단계 — 분수 ÷ 자연수 (6-1)", t:"분수 나눗셈 연습 ①", per:16, gen:function(rnd){
    var d=ri(rnd,2,9), n=ri(rnd,1,d-1), k=ri(rnd,2,9);
    return {q:[F(n,d),OP("÷"),N(k)], ans:[fracTok(n,d*k)]};
  }},
  {label:"5단계 — 분수 ÷ 분수 (6-2)", t:"분수 나눗셈 연습 ②", per:16, gen:function(rnd){
    var d1=ri(rnd,2,9), n1=ri(rnd,1,d1-1), d2=ri(rnd,2,9), n2=ri(rnd,1,d2-1);
    return {q:[F(n1,d1),OP("÷"),F(n2,d2)], ans:[fracTok(n1*d2,d1*n2)]};
  }}
]};

var T_DEC_MD={id:"decmd", name:"소수", levels:[
  {label:"1단계 — 소수 × 자연수 (5-2)", t:"소수 곱셈 연습 ①", gen:function(rnd){
    var a=decN(rnd,10), k=ri(rnd,2,9);
    return {q:[N(a/10),OP("×"),N(k)], ans:[N(a*k/10)]};
  }},
  {label:"2단계 — 소수 × 소수 (5-2)", t:"소수 곱셈 연습 ②", gen:function(rnd){
    var a=decN(rnd,10), b=decN(rnd,10);
    return {q:[N(a/10),OP("×"),N(b/10)], ans:[N(a*b/100)]};
  }},
  {label:"3단계 — 소수 ÷ 자연수 (6-1)", t:"소수 나눗셈 연습 ①", gen:function(rnd){
    var q=decN(rnd,10), k=ri(rnd,2,9);            /* 몫(소수)을 먼저 정해 나누어떨어지게 */
    return {q:[N(q*k/10),OP("÷"),N(k)], ans:[N(q/10)]};
  }},
  {label:"4단계 — 소수 ÷ 소수 (6-2)", t:"소수 나눗셈 연습 ②", gen:function(rnd){
    var b=decN(rnd,10), q=ri(rnd,2,9);            /* 몫이 자연수가 되는 (소수)÷(소수) */
    return {q:[N(b*q/10),OP("÷"),N(b/10)], ans:[N(q)]};
  }}
]};

/* ============================ 등록부 ============================ */
var MATH_GRADES=[
  {name:"1~2학년", topics:[T_ADD, T_SUB, T_ADDSUB, T_GUGUDAN]},
  {name:"3~4학년", topics:[T_ADDSUB3, T_MUL, T_DIV, T_FRAC_SAME, T_DEC_AS]},
  {name:"5~6학년", topics:[T_MIXED, T_FRAC_HI, T_DEC_MD]}
];
function findTopic(id){
  for(var g=0; g<MATH_GRADES.length; g++){
    var ts=MATH_GRADES[g].topics;
    for(var i=0; i<ts.length; i++) if(ts[i].id===id) return {grade:g, topic:ts[i]};
  }
  return {grade:0, topic:MATH_GRADES[0].topics[0]};
}
function genAll(seed, topicId, levelIdx, opts, count){
  var t=findTopic(topicId).topic;
  var lvl=t.levels[levelIdx] || t.levels[0];
  var rnd=mulberry32(seed), out=[];
  for(var i=0; i<count; i++) out.push(lvl.gen(rnd, opts));
  return out;
}
