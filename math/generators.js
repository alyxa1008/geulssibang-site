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
  return {q:[N(a),OP("÷"),N(b)], ans: r? [N(q),TX("…"),N(r)] : [N(q)], v:{a:a,op:"÷",b:b}};   /* v: 세로셈(장제법) */
}
var T_DIV={id:"div", name:"나눗셈", levels:[
  {label:"1단계 — 곱셈구구 범위 (3-1)", t:"나눗셈 연습 ①", v:true, gen:function(rnd){
    var b=ri(rnd,2,9), q=ri(rnd,2,9); return divP(b*q,b,q,0);
  }},
  {label:"2단계 — 곱셈구구 범위, 나머지 (3-2)", t:"나눗셈 연습 ②", v:true, gen:function(rnd){
    var b=ri(rnd,3,9), q=ri(rnd,2,9), r=ri(rnd,1,b-1); return divP(b*q+r,b,q,r);
  }},
  {label:"3단계 — 두·세 자리 ÷ 한 자리 (3-2)", t:"나눗셈 연습 ③", v:true, gen:function(rnd){
    var b=ri(rnd,2,9), q=ri(rnd,11,Math.floor(999/b)); return divP(b*q,b,q,0);
  }},
  {label:"4단계 — 두·세 자리 ÷ 한 자리, 나머지 (3-2)", t:"나눗셈 연습 ④", v:true, gen:function(rnd){
    var b=ri(rnd,3,9), q=ri(rnd,11,Math.floor((999-(b-1))/b)), r=ri(rnd,1,b-1);
    return divP(b*q+r,b,q,r);
  }},
  {label:"5단계 — 두·세 자리 ÷ 두 자리 (4-1)", t:"나눗셈 연습 ⑤", v:true, gen:function(rnd){
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


/* ============================ 6학년 ============================
   원의 둘레와 넓이(6-1), 비와 비율(6-1), 비례식과 비례배분(6-2)
   글 문제 형태: { q, ans, txt:true, fig?:{kind:"circle", r|d, label}, chk:{검산용 원값} }
     txt : 가로셈의 '=' 대신 답 칸만 (세로셈 없음)
     fig : 페이지가 그림으로 그린다 (SVG·이미지 저장)
     chk : 테스트가 정답을 다시 계산해 대조한다 */
function round2(v){ return Math.round(v*100)/100; }
/* 수 뒤 조사 — 마지막 숫자 읽기의 받침(영·일·삼·육·칠·팔 = 받침 있음) */
function eulReul(n){ var d=String(n).slice(-1); return "013678".indexOf(d)>=0 ? "을" : "를"; }
var CIRCLE_R=[2,3,4,5,6,7,8,9,10,12,15,20];
function circleProb(rnd, what, pi){
  var r=CIRCLE_R[ri(rnd,0,CIRCLE_R.length-1)], byD=rnd()<0.4, d=r*2;
  var given = byD ? "지름이 "+d+"cm" : "반지름이 "+r+"cm";
  var ans = what==="둘레" ? round2(d*pi) : round2(r*r*pi);
  return { q:[TX(given+"인 원의 "+what+"는? (원주율: "+pi+")")], ans:[N(ans), TX(what==="둘레"?"cm":"cm²")],
           txt:true, fig:{kind:"circle", r:r, show: byD?"d":"r", label:(byD?d:r)+"cm"}, chk:{what:what, r:r, pi:pi, ans:ans} };
}
var T_CIRCLE={id:"circle", name:"원", levels:[
  {label:"1단계 — 원의 둘레 (6-1, 원주율 3.14)", t:"원의 둘레 구하기", per:8, gen:function(rnd){ return circleProb(rnd,"둘레",3.14); }},
  {label:"2단계 — 원의 넓이 (6-1, 원주율 3.14)", t:"원의 넓이 구하기", per:8, gen:function(rnd){ return circleProb(rnd,"넓이",3.14); }},
  {label:"3단계 — 둘레·넓이 섞어서 (원주율 3으로 어림)", t:"원의 둘레와 넓이", per:8, gen:function(rnd){ return circleProb(rnd, rnd()<0.5?"둘레":"넓이", 3); }},
  {label:"4단계 — 거꾸로 구하기 (둘레→지름·반지름, 넓이→반지름, 원주율 구하기)", t:"원 거꾸로 구하기", per:8, gen:function(rnd){
    var r=CIRCLE_R[ri(rnd,0,CIRCLE_R.length-1)], d=r*2, pi=3.14, kind=ri(rnd,0,3);
    var C=round2(d*pi), A=round2(r*r*pi);
    if(kind===0) return { q:[TX("둘레가 "+C+"cm인 원의 지름은? (원주율: 3.14)")], ans:[N(d),TX("cm")], txt:true, fig:{kind:"circle", show:"c", label:"둘레 "+C+"cm"}, chk:{inv:"d", r:r, pi:pi, ans:d} };
    if(kind===1) return { q:[TX("둘레가 "+C+"cm인 원의 반지름은? (원주율: 3.14)")], ans:[N(r),TX("cm")], txt:true, fig:{kind:"circle", show:"c", label:"둘레 "+C+"cm"}, chk:{inv:"r", r:r, pi:pi, ans:r} };
    if(kind===2) return { q:[TX("넓이가 "+A+"cm²인 원의 반지름은? (원주율: 3.14)")], ans:[N(r),TX("cm")], txt:true, fig:{kind:"circle", show:"a", label:"넓이 "+A+"cm²"}, chk:{inv:"ra", r:r, pi:pi, ans:r} };
    return { q:[TX("지름이 "+d+"cm인 원의 둘레를 재었더니 "+C+"cm였습니다. (원의 둘레)÷(지름)은?")], ans:[N(pi)], txt:true, fig:{kind:"circle", show:"d", label:d+"cm"}, chk:{inv:"pi", r:r, pi:pi, ans:pi} };
  }}
]};

var T_RATIO={id:"ratio", name:"비와 비율", levels:[
  {label:"1단계 — 비를 비율(분수)로 (6-1)", t:"비와 비율 연습 ①", per:16, gen:function(rnd){
    var b=ri(rnd,2,12), a=ri(rnd,1,b*2); if(a===b) a=b+1;
    return { q:[TX("비 "+a+" : "+b+"의 비율을 분수로 나타내면?")], ans:[fracTok(a,b)], txt:true, chk:{a:a,b:b} };
  }},
  {label:"2단계 — 비율을 백분율로 (6-1)", t:"비와 비율 연습 ②", per:16, gen:function(rnd){
    if(rnd()<0.5){ var v=ri(rnd,1,99); return { q:[TX("비율 0."+(v<10?"0":"")+v+eulReul(v)+" 백분율로 나타내면?")], ans:[N(v),TX("%")], txt:true, chk:{dec:v/100, pct:v} }; }
    var ds=[2,4,5,10,20,25,50], d=ds[ri(rnd,0,ds.length-1)], n=ri(rnd,1,d-1);
    return { q:[TX("비율 "), F(n,d), TX(eulReul(n)+" 백분율로 나타내면?")], ans:[N(n*100/d),TX("%")], txt:true, chk:{n:n,d:d,pct:n*100/d} };
  }},
  {label:"3단계 — 백분율 계산 (6-1)", t:"비와 비율 연습 ③", per:16, gen:function(rnd){
    var ps=[5,10,20,25,30,40,50,60,75,80], p=ps[ri(rnd,0,ps.length-1)], base=ri(rnd,1,20)*20;
    var ans=base*p/100;
    return { q:[TX(base+"의 "+p+"%는?")], ans:[N(ans)], txt:true, chk:{base:base,p:p,ans:ans} };
  }},
  {label:"4단계 — 비율을 소수로 (6-1)", t:"비와 비율 연습 ④", per:16, gen:function(rnd){
    var bs=[2,4,5,10,20,25,50], b=bs[ri(rnd,0,bs.length-1)], a=ri(rnd,1,b*2); if(a===b) a=b+1;
    var dec=Math.round(a/b*100)/100;
    return { q:[TX("비 "+a+" : "+b+"의 비율을 소수로 나타내면?")], ans:[N(dec)], txt:true, chk:{a:a,b:b,dec2:dec} };
  }},
  {label:"5단계 — 백분율 문장제 (할인·전체의 몇 %·정답률)", t:"비와 비율 문장제", per:12, gen:function(rnd){
    var k=ri(rnd,0,2);
    if(k===0){ var ps=[10,20,25,30,40,50], p=ps[ri(rnd,0,ps.length-1)], price=ri(rnd,2,40)*500; var off=price*p/100;
      return { q:[TX("정가가 "+price+"원인 물건을 "+p+"% 할인하면 할인 금액은 얼마일까요?")], ans:[N(off),TX("원")], txt:true, chk:{word:"disc", base:price, p:p, ans:off} }; }
    if(k===1){ var ps2=[10,20,25,30,40,50,60,75], p2=ps2[ri(rnd,0,ps2.length-1)], all=ri(rnd,2,25)*20; var cnt=all*p2/100;
      return { q:[TX("전교생 "+all+"명 중 "+p2+"%가 안경을 씁니다. 안경을 쓰는 학생은 몇 명일까요?")], ans:[N(cnt),TX("명")], txt:true, chk:{word:"part", base:all, p:p2, ans:cnt} }; }
    var tot=[10,20,25,40,50][ri(rnd,0,4)], hit=ri(rnd,1,tot-1); while((hit*100)%tot!==0) hit=ri(rnd,1,tot-1);
    return { q:[TX(tot+"문제 중 "+hit+"문제를 맞혔습니다. 정답률은 몇 %일까요?")], ans:[N(hit*100/tot),TX("%")], txt:true, chk:{word:"rate", tot:tot, hit:hit, ans:hit*100/tot} };
  }}
]};

var T_PROP={id:"prop", name:"비례식", levels:[
  {label:"1단계 — 비례식에서 □ 구하기 (6-2)", t:"비례식 연습 ①", per:16, gen:function(rnd){
    var a=ri(rnd,1,9), b=ri(rnd,1,9); if(a===b) b=a+1; var k=ri(rnd,2,9), pos=ri(rnd,0,1);
    var q = pos===0 ? a+" : "+b+" = "+(a*k)+" : □" : a+" : "+b+" = □ : "+(b*k);
    return { q:[TX(q+"   □ = ?")], ans:[N(pos===0?b*k:a*k)], txt:true, chk:{a:a,b:b,k:k,pos:pos} };
  }},
  {label:"2단계 — 비례배분 (6-2)", t:"비례배분 연습", per:12, gen:function(rnd){
    var a=ri(rnd,1,5), b=ri(rnd,1,5); if(a===b) b=a+1; var k=ri(rnd,2,12), total=(a+b)*k;
    return { q:[TX(total+eulReul(total)+" "+a+" : "+b+"로 비례배분하면? (두 수)")], ans:[N(a*k),TX(","),N(b*k)], txt:true, chk:{a:a,b:b,total:total} };
  }},
  {label:"3단계 — 간단한 자연수의 비로 나타내기 (6-2)", t:"비례식 연습 ②", per:16, gen:function(rnd){
    var a=ri(rnd,1,9), b=ri(rnd,1,9); if(a===b) b=a+1; var g0=gcd(a,b); a/=g0; b/=g0; var k=ri(rnd,2,12);
    return { q:[TX((a*k)+" : "+(b*k)+eulReul(b*k)+" 가장 간단한 자연수의 비로 나타내면?")], ans:[N(a),TX(":"),N(b)], txt:true, chk:{a:a,b:b,k:k} };
  }},
  {label:"4단계 — 소수·분수의 비를 자연수의 비로 (6-2)", t:"비례식 연습 ③", per:12, gen:function(rnd){
    var a=ri(rnd,1,9), b=ri(rnd,1,9); if(a===b) b=a+1; var g0=gcd(a,b); a/=g0; b/=g0;
    if(rnd()<0.5){ var k=ri(rnd,1,3); var da=a*k, db=b*k;   /* 소수 비: 0.(da) : 0.(db) — 양쪽에 10을 곱하면 자연수 비 */
      if(da>9||db>9){ da=a; db=b; }
      return { q:[TX("0."+da+" : 0."+db+eulReul(db)+" 가장 간단한 자연수의 비로 나타내면?")], ans:[N(a),TX(":"),N(b)], txt:true, chk:{a:a,b:b,decRatio:true} }; }
    var d=ri(rnd,2,9);   /* 분수 비: a/d : b/d → a : b (분모 같음) */
    return { q:[F(a,d),TX(" : "),F(b,d),TX(eulReul(b)+" 가장 간단한 자연수의 비로 나타내면?")], ans:[N(a),TX(":"),N(b)], txt:true, chk:{a:a,b:b,frac:true} };
  }},
  {label:"5단계 — 비례식·비례배분 문장제 (6-2)", t:"비례식 문장제", per:12, gen:function(rnd){
    var k=ri(rnd,0,2);
    if(k===0){ var n1=ri(rnd,2,5), unit=ri(rnd,2,8)*100, n2=n1+ri(rnd,1,6);   /* 연필 3자루에 1200원 → 7자루는? */
      return { q:[TX("연필 "+n1+"자루에 "+(n1*unit)+"원입니다. 같은 연필 "+n2+"자루는 얼마일까요?")], ans:[N(n2*unit),TX("원")], txt:true, chk:{word:"unit", n1:n1, unit:unit, n2:n2, ans:n2*unit} }; }
    if(k===1){ var a=ri(rnd,1,5), b=ri(rnd,1,5); if(a===b) b=a+1; var m=ri(rnd,2,6);   /* 밀가루 2컵 : 설탕 3컵 → 설탕 9컵이면 밀가루? */
      return { q:[TX("밀가루와 설탕을 "+a+" : "+b+"로 섞습니다. 설탕을 "+(b*m)+"컵 넣으면 밀가루는 몇 컵 넣어야 할까요?")], ans:[N(a*m),TX("컵")], txt:true, chk:{word:"mix", a:a, b:b, m:m, ans:a*m} }; }
    var a2=ri(rnd,1,5), b2=ri(rnd,1,5); if(a2===b2) b2=a2+1; var m2=ri(rnd,2,10), total=(a2+b2)*m2;   /* 사탕 30개를 3:2로 → 형은? */
    return { q:[TX("사탕 "+total+"개를 형과 동생이 "+a2+" : "+b2+"로 나누어 가지면 형은 몇 개를 가질까요?")], ans:[N(a2*m2),TX("개")], txt:true, chk:{word:"share", a:a2, b:b2, total:total, ans:a2*m2} };
  }}
]};

/* ============================ 등록부 ============================ */
var MATH_GRADES=[
  {name:"1~2학년", topics:[T_ADD, T_SUB, T_ADDSUB, T_GUGUDAN]},
  {name:"3~4학년", topics:[T_ADDSUB3, T_MUL, T_DIV, T_FRAC_SAME, T_DEC_AS]},
  {name:"5~6학년", topics:[T_MIXED, T_FRAC_HI, T_DEC_MD, T_CIRCLE, T_RATIO, T_PROP]}
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
