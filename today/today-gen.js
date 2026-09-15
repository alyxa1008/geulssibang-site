"use strict";
/* 오늘의 학습지 생성기 — 순수 함수(DOM 없음). 같은 (level, date)면 항상 같은 학습지(날짜가 시드)
   build(state) : state={level:kids|g1|g2|g3, date:"YYYY-MM-DD", name} → .sheet HTML 문자열
   의존(전역): mulberry32·genAll(math/generators.js), buildGrid·carve·gridSVG(maze/maze-gen.js),
              QuizGen·QUIZ_DATA(quiz/), TODAY_WORDS·TODAY_NATMAL(today-data.js), escHtml(common.js) */
var LEVELS_T={ kids:{name:"5~6세", quiz:1}, g1:{name:"1학년", quiz:1}, g2:{name:"2학년", quiz:2}, g3:{name:"3학년", quiz:3} };
var LEVEL_IDX={ kids:0, g1:1, g2:2, g3:3 };
var DOW=["일","월","화","수","목","금","토"];
var JA=["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
var MO=["ㅏ","ㅑ","ㅓ","ㅕ","ㅗ","ㅛ","ㅜ","ㅠ","ㅡ","ㅣ"];
var KIDS_ICONS=[{s:"🐰",e:"🥕"},{s:"🐶",e:"🦴"},{s:"🐝",e:"🌷"},{s:"🚗",e:"🏠"},{s:"🦖",e:"🍖"},{s:"🚀",e:"🌙"},{s:"⛵",e:"🏝️"}];
var COUNT_OBJ=["🍎","🍓","🐟","⭐","🌸","🚗","🐥","🍪"];
var MAX_CELLS=12;

function parseDate(s){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||""); if(!m) return null; var d=new Date(+m[1],+m[2]-1,+m[3]); return isNaN(d)?null:d; }
function dateNum(s){ return +s.replace(/-/g,""); }
function pick(rnd,arr){ return arr[Math.floor(rnd()*arr.length)]; }
function pickN(rnd,arr,n){
  var a=arr.slice(), out=[];
  while(a.length && out.length<n) out.push(a.splice(Math.floor(rnd()*a.length),1)[0]);
  return out;
}
/* 학기: 3~8월 1학기, 9~2월 2학기 (2학기엔 1학기 풀도 섞어 복습) */
function semester(month){ return (month>=3&&month<=8) ? 1 : 2; }
function wordPool(level,month){
  if(level==="kids") return TODAY_NATMAL[0].concat(TODAY_NATMAL[1]);
  if(level==="g3") return flat(TODAY_WORDS["3"]);
  var g=level==="g1"?"1":"2";
  var pool=flat(TODAY_WORDS[g+"-1"]);
  if(semester(month)===2) pool=pool.concat(flat(TODAY_WORDS[g+"-2"]));
  return pool;
}
function poolLabel(level,month){
  if(level==="kids") return "받침 없는 낱말·자음·모음";
  if(level==="g3") return "3학년 급수표";
  var g=level==="g1"?"1":"2";
  return semester(month)===2 ? g+"학년 2학기 급수표 + 1학기 복습" : g+"학년 1학기 급수표";
}
function flat(sets){ var out=[]; sets.forEach(function(s){ out=out.concat(s.w); }); return out; }
function traceWords(pool,maxLen){ return pool.filter(function(w){ return w.indexOf(" ")<0 && Array.from(w).length<=maxLen; }); }

/* ---------- 따라쓰기 줄: 본보기 → 흐린 글자 → 빈칸, 12칸 안에서 채움 ---------- */
var ROW_PATTERNS=[["solid","trace","trace","empty"],["solid","trace","empty"],["solid","trace"],["solid"]];
function rowPattern(n){
  for(var i=0;i<ROW_PATTERNS.length;i++){ var k=ROW_PATTERNS[i].length; if(k*n+(k-1)<=MAX_CELLS) return ROW_PATTERNS[i]; }
  return ["solid"];
}
function traceRow(word,guide){
  var cs=Array.from(word), parts=[];
  rowPattern(cs.length).forEach(function(kind){
    if(parts.length) parts.push({kind:"gap"});
    cs.forEach(function(c){ parts.push({kind:kind, ch:kind==="empty"?"":c}); });
  });
  var h='<div class="row">';
  parts.forEach(function(p){
    if(p.kind==="gap"){ h+='<div class="cell" style="border-color:transparent"></div>'; return; }
    h+='<div class="cell '+p.kind+(guide&&p.kind!=="gap"?" guide":"")+'">'+(p.ch?'<span>'+escHtml(p.ch)+'</span>':'')+'</div>';
  });
  return h+'</div>';
}

/* ---------- 수학 ---------- */
function tokText(toks){
  return toks.map(function(t){
    if(t.t==="f") return (t.w?t.w+" ":"")+t.n+"/"+t.d;
    return t.v;
  }).join(" ");
}
function mathProblems(rnd,level,month){
  var seed=Math.floor(rnd()*1e9)+1, list=[];
  function add(topic,lv,opts,n){ genAll(seed+list.length*7,topic,lv,opts||{},n).forEach(function(p){ list.push(p); }); }
  if(level==="g1"){
    if(semester(month)===1) add("addsub",0,{noCarry:true},8);
    else { add("addsub",0,{noCarry:false},4); add("addsub",1,{noCarry:true},4); }
  }else if(level==="g2"){
    if(semester(month)===1) add("addsub",2,{noCarry:false},8);
    else { add("addsub",2,{noCarry:false},4); add("gugudan",0,{dan:0},4); }
  }else{
    add("mul",0,{},4); add("div",0,{},4);
  }
  return list;
}
function countProblems(rnd){
  var out=[];
  for(var i=0;i<3;i++){ var n=2+Math.floor(rnd()*9); out.push({obj:pick(rnd,COUNT_OBJ), n:n}); }
  return out;
}

/* ---------- 한 장 ---------- */
function build(state){
  var d=parseDate(state.date)||new Date();
  var month=d.getMonth()+1, dow=d.getDay();
  var rnd=mulberry32(dateNum(state.date)*4+LEVEL_IDX[state.level]);
  var L=LEVELS_T[state.level], lv=state.level, keys=[];
  var pool=wordPool(lv,month);
  var guide=(lv==="kids"||lv==="g1");
  var h='<div class="sheet tsheet">';

  /* 머리 */
  h+='<div class="sheet-head"><div class="sheet-title"><span class="deco">📅</span>오늘의 학습지 <small style="font-size:4.2mm;color:var(--ink-soft)">'+(month)+'월 '+d.getDate()+'일 '+DOW[dow]+'요일 · '+L.name+'</small></div>'
    +'<div class="sheet-meta">이름 <span class="blank">'+(state.name?'<b style="font-weight:400;color:var(--ink)">'+escHtml(state.name)+'</b>':'')+'</span><br>다 했어요 <span class="tstars">☆☆☆</span></div></div>';

  /* ① 따라쓰기 */
  var rowsHtml="";
  if(lv==="kids"){
    rowsHtml=traceRow(pick(rnd,JA),true)+traceRow(pick(rnd,MO),true);
  }else{
    var tw=pickN(rnd,traceWords(pool,lv==="g3"?5:4),2);
    rowsHtml=tw.map(function(w){ return traceRow(w,guide); }).join("");
  }
  h+='<div class="tblk"><p class="tlab">✎ '+(lv==="kids"?"자음·모음 따라쓰기":"낱말 따라쓰기")+'<small>진한 글자를 보고, 흐린 글자를 따라 쓰고, 빈칸에는 혼자 써 보세요</small></p><div class="trows">'+rowsHtml+'</div></div>';

  /* ② 수학 + 미로 */
  var mathHtml="";
  if(lv==="kids"){
    var cp=countProblems(rnd);
    mathHtml='<ol class="tcount">'+cp.map(function(p,i){
      var objs=""; for(var k=0;k<p.n;k++) objs+=p.obj;
      return '<li><b>'+(i+1)+'</b>몇 개일까요? <span class="obj">'+objs+'</span><span class="tbox"></span> 개</li>';
    }).join("")+'</ol>';
    keys.push("수 세기: "+cp.map(function(p){ return p.n; }).join(", "));
  }else{
    var mp=mathProblems(rnd,lv,month);
    mathHtml='<ol>'+mp.map(function(p,i){ return '<li><b>'+(i+1)+'</b>'+escHtml(tokText(p.q))+' = <span class="tbox"></span></li>'; }).join("")+'</ol>';
    keys.push("수학: "+mp.map(function(p){ return tokText(p.ans); }).join(", "));
  }
  var g = lv==="kids" ? buildGrid(6,7,null) : lv==="g1" ? buildGrid(8,10,null) : buildGrid(12,15,null);
  var open=carve(g, Math.floor(rnd()*1e8)+1);
  var icons = (lv==="kids"||lv==="g1") ? KIDS_ICONS[dow] : null;
  var mazeSvg=gridSVG(g,open,null, icons ? {icons:icons, bold:lv==="kids"} : null);
  h+='<div class="tblk trow2"><div class="tmath"><p class="tlab">✚ '+(lv==="kids"?"수 세기":"수학")+'<small>'+(lv==="kids"?"몇 개인지 세어 보고 칸에 숫자를 쓰세요":"답을 칸에 쓰세요")+'</small></p>'+mathHtml+'</div>'
    +'<div class="tmaze"><p class="tlab">🌀 미로<small>'+(icons?icons.s+"→"+icons.e:"출발 → 도착")+'</small></p>'+mazeSvg+'</div></div>';

  /* ③ 받아쓰기 / 숫자 따라쓰기 */
  if(lv==="kids"){
    var nums=pickN(rnd,["1","2","3","4","5","6","7","8","9","10"],2);
    h+='<div class="tblk tfill"><p class="tlab">🔢 숫자 따라쓰기<small>오늘의 숫자 '+nums.join(" · ")+'</small></p><div class="trows">'+nums.map(function(n){ return traceRow(n,true); }).join("")+'</div></div>';
  }else{
    var dw=pickN(rnd,pool,5);
    h+='<div class="tblk tfill"><p class="tlab">🔊 받아쓰기<small>부모님이 불러 주시면 받아 쓰세요 · 정답은 맨 아래 뒤집힌 줄에 있어요</small></p><ol class="tdict">'+dw.map(function(w,i){ return '<li>'+(i+1)+'.</li>'; }).join("")+'</ol></div>';
    keys.push("받아쓰기: "+dw.map(function(w,i){ return (i+1)+" "+w; }).join("  "));
  }

  /* ④ 상식 한 문제 */
  var qi=QuizGen.pickQuestions(QUIZ_DATA,[],L.quiz,1,[],rnd)[0];
  var q=QUIZ_DATA[qi], ch=QuizGen.shuffle(q.o.slice(),rnd), ansIdx=ch.indexOf(q.o[0]);
  var circ=["①","②","③","④"];
  h+='<div class="tblk tquiz"><p class="tlab">💡 오늘의 상식<small>'+(lv==="kids"?"부모님이 읽어 주시면 맞는 답을 골라 보세요":"맞는 답에 ○ 하세요")+'</small></p><p>'+escHtml(q.q)+'</p><div class="ch">'+ch.map(function(c,i){ return '<span>'+circ[i]+' '+escHtml(c)+'</span>'; }).join("")+'</div></div>';
  keys.push("상식: "+circ[ansIdx]+" "+q.o[0]+" — "+q.e);

  /* 정답 (뒤집어 인쇄) + 꼬리 */
  h+='<div class="tkey">🔑 정답 — '+keys.map(escHtml).join(" · ")+'</div>';
  h+='<div class="sheet-foot"><span>글씨방 · 오늘의 학습지 · geulssibang.com/today/</span><span>'+escHtml(state.date)+' · '+L.name+'</span></div>';
  return h+'</div>';
}

