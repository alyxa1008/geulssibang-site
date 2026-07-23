"use strict";
/* ============================================================
   한글 낱말 미로 생성기 (순수 함수 — DOM 없음, 노드 테스트 가능)
   maze-gen.js의 buildGrid / carve / solve / mulberry32 위에서 동작.
   - 정답 길 위에 낱말 글자를 순서대로 고르게 놓고
   - 샛길(정답 아닌 칸)에 함정 글자를 뿌린다
   → 바른 길로 가야만 글자가 낱말 순서로 모인다.
   같은 시드 → 같은 미로·같은 글자 배치 (공유 링크 재현용).
   ============================================================ */

var WORD_GRID={ easy:[8,10], mid:[12,15] };   /* 쉬움 5~7세 · 보통 초등 */
/* 함정 글자 후보 — 받침 없는 기본 음절 (읽기 시작 단계 아이 기준) */
var DECOY_POOL="가나다라마바사아자차카타파하고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후";

/* 출발·도착을 뺀 경로 위에 n개 글자 칸을 고르게 배치 (겹치면 실패 → null) */
function pathLetterCells(path, n){
  var cells=[], prev=-1;
  for(var i=0;i<n;i++){
    var t=Math.round((i+1)*(path.length-1)/(n+1));
    t=Math.max(1, Math.min(path.length-2, t));
    if(path[t]===prev) return null;
    prev=path[t];
    cells.push(path[t]);
  }
  return cells;
}

/* 정답 길이 아닌 살아있는 칸에 함정 토큰 배치 (pool은 이미 정답 토큰이 제외된 상태) */
function decoyLabels(g, path, pool, count, rnd){
  var onPath={};
  path.forEach(function(c){ onPath[c]=1; });
  var cand=[];
  var n=g.cols*g.rows;
  for(var i=0;i<n;i++) if(g.alive[i] && !onPath[i]) cand.push(i);
  for(var j=cand.length-1;j>0;j--){
    var k=Math.floor(rnd()*(j+1)); var t=cand[j]; cand[j]=cand[k]; cand[k]=t;
  }
  var out=[];
  for(var m=0;m<Math.min(count,cand.length);m++)
    out.push({ c:cand[m], ch:pool[Math.floor(rnd()*pool.length)] });
  return out;
}

/* 공통 심장부: 토큰(글자든 숫자든) 목록을 정답 길에 순서대로 놓는다.
   경로가 짧으면 시드를 바꿔 다시 판다. 실패(토큰이 너무 많음) 시 null */
function buildTokenMaze(tokens, level, seed, decoyPool, decoyCount){
  var wh=WORD_GRID[level]||WORD_GRID.easy;
  var g=buildGrid(wh[0], wh[1], null);
  for(var t=0;t<40;t++){
    var s=(seed+t*7919)|0;
    var open=carve(g, s);
    var path=solve(g, open);
    if(path.length < tokens.length*2+2) continue;
    var cells=pathLetterCells(path, tokens.length);
    if(!cells) continue;
    var rnd=mulberry32(s^0x9e3779);
    var labels=cells.map(function(c,i){ return {c:c, ch:tokens[i]}; });
    return { g:g, open:open, path:path,
             labels:labels.concat(decoyLabels(g, path, decoyPool, decoyCount, rnd)) };
  }
  return null;
}

/* 낱말 하나 → 미로+글자 배치. 반환: {g, open, path, labels, word} / 낱말 길이 밖이면 null */
function buildWordMaze(word, level, seed){
  var chars=Array.from(String(word).replace(/\s+/g,""));
  if(chars.length<2 || chars.length>6) return null;
  var pool=Array.from(DECOY_POOL).filter(function(ch){ return chars.indexOf(ch)<0; });
  var m=buildTokenMaze(chars, level, seed, pool, chars.length*2);
  if(m) m.word=chars.join("");
  return m;
}

/* 숫자 미로 — kind: "c10"(1~10 수 세기) | "c20"(1~20, 항상 보통 격자) | "skip"(구구단 뛰어세기)
   함정은 수열에 없는 수라서, 길을 잘못 들면 숫자 순서가 바로 깨진다. */
function buildNumberMaze(kind, dan, level, seed){
  var tokens=[], pool=[], i;
  if(kind==="skip"){
    if(!(dan>=2 && dan<=9)) return null;
    for(i=1;i<=9;i++) tokens.push(String(dan*i));
    for(i=2;i<=dan*9+6;i++) if(i%dan!==0) pool.push(String(i));
  }else{
    var top = kind==="c20" ? 20 : 10;
    for(i=1;i<=top;i++) tokens.push(String(i));
    for(i=top+1;i<=top+12;i++) pool.push(String(i));
    if(kind==="c20") level="mid";   /* 20칸은 넓은 격자가 필요하다 */
  }
  var m=buildTokenMaze(tokens, level, seed, pool, tokens.length);
  if(m) m.tokens=tokens;
  return m;
}
