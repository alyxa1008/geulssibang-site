"use strict";
/* =============================================================
   글씨방 수학 문장제(서술형) 생성기 — math/wordgen.js

   자연스러운 한국어가 핵심.
   - 조사는 받침을 판별해 자동 선택(은/는, 이/가, 을/를).
   - 이름은 받침 있으면 '이'를 붙인다(지훈이는 / 지아는).
   - 연산별로 여러 문장 패턴을 두어 반복감을 줄인다.
   - 답은 항상 자연수(뺄셈은 음수 없음, 나눗셈은 나누어떨어짐).

   주인공 이름(hero)을 넘기면 문제의 주인공으로 쓰고,
   두 사람이 필요한 문제는 나머지 한 명을 자동으로 채운다.

   genWord(seed, op, count, hero) → [{q:"문장", a:정답, u:"단위"} …]
     op: "add" | "sub" | "mul" | "div" | "mix"
     hero: 주인공 이름(빈 문자열이면 랜덤)
   ============================================================= */

function wpRnd(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function wpi(r,a,b){return Math.floor(r()*(b-a+1))+a;}
function wpick(r,arr){return arr[Math.floor(r()*arr.length)];}

/* ---------- 한국어 조사 ---------- */
function hasJong(s){var c=s.charCodeAt(s.length-1)-0xAC00;return c>=0 && c<11172 && (c%28)!==0;}
function J_eun(s){return s+(hasJong(s)?"은":"는");}   /* 은/는 */
function J_iga(s){return s+(hasJong(s)?"이":"가");}   /* 이/가 */
function J_eul(s){return s+(hasJong(s)?"을":"를");}   /* 을/를 */
/* 이름 전용 — 받침 있으면 '이' 삽입 */
function N_top(n){return hasJong(n)?n+"이는":n+"는";}
function N_sub(n){return hasJong(n)?n+"이가":n+"가";}
function N_boda(n){return hasJong(n)?n+"이보다":n+"보다";}
function N_uiy(n){return hasJong(n)?n+"이의":n+"의";}

/* ---------- 소재 ---------- */
var NAMES=["지훈","서연","민준","지아","하준","수아","도윤","예은","시우","유나","준서","서윤","지우","하은","은우","다은","채원","지호"];
/* k: 사물 종류 — food(먹을 수 있음) / use(문구·소모품) / toy(장난감·물건).
   '덜어내는' 동사를 종류에 맞게 골라 "연필을 먹었어요" 같은 어색함을 막는다. */
var OBJS=[{n:"사탕",u:"개",k:"food"},{n:"구슬",u:"개",k:"toy"},{n:"딱지",u:"장",k:"toy"},{n:"색종이",u:"장",k:"use"},{n:"공책",u:"권",k:"use"},{n:"연필",u:"자루",k:"use"},{n:"스티커",u:"장",k:"use"},{n:"초콜릿",u:"개",k:"food"},{n:"젤리",u:"개",k:"food"},{n:"쿠키",u:"개",k:"food"},{n:"풍선",u:"개",k:"toy"},{n:"색연필",u:"자루",k:"use"},{n:"블록",u:"개",k:"toy"},{n:"단추",u:"개",k:"toy"}];
var FRUITS=[{n:"사과",u:"개"},{n:"배",u:"개"},{n:"귤",u:"개"},{n:"감",u:"개"},{n:"토마토",u:"개"},{n:"키위",u:"개"}];
var GRP=["봉지","상자","바구니","묶음"];
/* 종류별 '덜어내는' 동사 (남은 개수 묻는 뺄셈용) */
var LOSE={food:["먹었어요"], use:["사용했어요","잃어버렸어요"], toy:["잃어버렸어요","친구에게 주었어요"]};

function twoObj(r,arr){var a=wpick(r,arr),b=wpick(r,arr),n=0;while(b.n===a.n&&n++<8)b=wpick(r,arr);return [a,b];}
function otherName(r,not){var x=wpick(r,NAMES),n=0;while(x===not&&n++<8)x=wpick(r,NAMES);return x;}

/* 각 템플릿은 (r, N) 을 받는다. N.a = 주인공, N.b = 상대 */

/* ---------- 덧셈 ---------- */
var ADD=[
  function(r,N){var o=wpick(r,OBJS),a=wpi(r,6,40),b=wpi(r,3,35),v=wpick(r,["샀어요","받았어요","모았어요"]);
    return {q:N_top(N.a)+" "+o.n+" "+J_eul(a+o.u)+" 가지고 있었어요. "+J_eul(b+o.u)+" 더 "+v+". "+J_eun(o.n)+" 모두 몇 "+o.u+"일까요?", a:a+b, u:o.u};},
  function(r,N){var o=wpick(r,OBJS),a=wpi(r,5,35),b=wpi(r,5,35);
    return {q:N_top(N.a)+" "+o.n+" "+J_eul(a+o.u)+" 가지고 있고, "+N_top(N.b)+" "+J_eul(b+o.u)+" 가지고 있어요. 두 사람의 "+J_eun(o.n)+" 모두 몇 "+o.u+"일까요?", a:a+b, u:o.u};},
  function(r,N){var o=wpick(r,OBJS),a=wpi(r,5,30),b=wpi(r,2,15);
    return {q:N_top(N.b)+" "+o.n+" "+J_eul(a+o.u)+" 가지고 있어요. "+N_top(N.a)+" "+N_boda(N.b)+" "+b+o.u+" 더 많이 가지고 있어요. "+N_uiy(N.a)+" "+J_eun(o.n)+" 몇 "+o.u+"일까요?", a:a+b, u:o.u};}
];

/* ---------- 뺄셈 ---------- */
var SUB=[
  function(r,N){var o=wpick(r,OBJS),a=wpi(r,12,45),b=wpi(r,3,a-3);
    return {q:N_top(N.a)+" "+o.n+" "+J_eul(a+o.u)+" 가지고 있었어요. 친구에게 "+J_eul(b+o.u)+" 주었어요. 남은 "+J_eun(o.n)+" 몇 "+o.u+"일까요?", a:a-b, u:o.u};},
  function(r,N){var o=wpick(r,OBJS),a=wpi(r,10,40),b=wpi(r,2,a-2),v=wpick(r,LOSE[o.k]);
    return {q:N_top(N.a)+" "+o.n+" "+a+o.u+" 중에서 "+J_eul(b+o.u)+" "+v+". 남은 "+J_eun(o.n)+" 몇 "+o.u+"일까요?", a:a-b, u:o.u};},
  function(r){var ff=twoObj(r,FRUITS),a=wpi(r,14,40),b=wpi(r,4,a-4);
    return {q:ff[0].n+" "+a+"개, "+ff[1].n+" "+b+"개가 있어요. "+J_eun(ff[0].n)+" "+ff[1].n+"보다 몇 개 더 많을까요?", a:a-b, u:"개"};}
];

/* ---------- 곱셈 (구구단 범위) ---------- */
var MUL=[
  function(r){var o=wpick(r,OBJS),g=wpick(r,GRP),a=wpi(r,2,9),b=wpi(r,2,9);
    return {q:"한 "+g+"에 "+J_iga(o.n)+" "+a+o.u+"씩 들어 있어요. "+b+g+"에 든 "+J_eun(o.n)+" 모두 몇 "+o.u+"일까요?", a:a*b, u:o.u};},
  function(r,N){var o=wpick(r,OBJS),a=wpi(r,2,9),b=wpi(r,2,9);
    return {q:N_top(N.a)+" 친구 "+b+"명에게 "+o.n+" "+a+o.u+"씩 나누어 주려고 해요. 필요한 "+J_eun(o.n)+" 모두 몇 "+o.u+"일까요?", a:a*b, u:o.u};},
  function(r){var o=wpick(r,OBJS),a=wpi(r,2,9),b=wpi(r,2,9);
    return {q:o.n+" "+a+o.u+"짜리 묶음이 "+b+"개 있어요. "+J_eun(o.n)+" 모두 몇 "+o.u+"일까요?", a:a*b, u:o.u};}
];

/* ---------- 나눗셈 (나누어떨어짐) ---------- */
var DIV=[
  function(r,N){var o=wpick(r,OBJS),per=wpi(r,2,9),q=wpi(r,2,9),tot=per*q;
    return {q:N_sub(N.a)+" "+o.n+" "+J_eul(tot+o.u)+" 친구 "+(q-1)+"명과 똑같이 나누어 가지려고 해요. 한 명이 몇 "+o.u+"씩 가지면 될까요?", a:per, u:o.u};},
  function(r){var o=wpick(r,OBJS),g=wpick(r,GRP),per=wpi(r,2,9),q=wpi(r,2,9),tot=per*q;
    return {q:o.n+" "+J_eul(tot+o.u)+" 한 "+g+"에 "+per+o.u+"씩 담으려고 해요. "+J_eun(g)+" 모두 몇 "+g+" 필요할까요?", a:q, u:g};},
  function(r){var o=wpick(r,OBJS),per=wpi(r,2,9),q=wpi(r,2,9),tot=per*q;
    return {q:o.n+" "+J_eul(tot+o.u)+" 한 사람에게 "+per+o.u+"씩 나누어 주면 몇 명에게 줄 수 있을까요?", a:q, u:"명"};}
];

var WP_OPS={add:ADD, sub:SUB, mul:MUL, div:DIV};
var WP_NAMES={add:"덧셈", sub:"뺄셈", mul:"곱셈", div:"나눗셈", mix:"덧셈·뺄셈·곱셈·나눗셈"};

function genWord(seed, op, count, hero){
  var r=wpRnd(seed), out=[], keys=["add","sub","mul","div"], lastQ="";
  hero=(hero||"").trim();
  for(var i=0;i<count;i++){
    var useOp = op==="mix" ? wpick(r,keys) : op;
    var gens = WP_OPS[useOp];
    var N = hero ? {a:hero, b:otherName(r,hero)} : (function(){var t=[wpick(r,NAMES),0]; t[1]=otherName(r,t[0]); return {a:t[0], b:t[1]};})();
    var p, tries=0;
    do { p = wpick(r,gens)(r,N); tries++; } while(p.q===lastQ && tries<5);
    lastQ=p.q;
    out.push(p);
  }
  return out;
}
