"use strict";
/* ============================================================
   한글 따라쓰기 생성기 (순수 함수 — DOM 없음, 노드 테스트 가능)
   - buildRowsChar : '한 글자씩' — 글자마다 본보기+따라쓰기+빈칸 한 줄
   - buildRowsLine : '단어·문장 반복' — 본보기 줄+따라쓰기 줄+혼자쓰기 줄 블록
   - paginate      : 페이지 줄 수 단위로 자르기 (빌더가 배수를 보장)
   - traceColor    : 흐린 글자 색 (색 × 농도)
   모든 빌더는 (페이지 줄 수의 배수)만큼 줄을 돌려주므로
   격자가 항상 페이지 전체를 채운다. 남는 줄은 빈 연습 줄.
   row = {ch, kind} 배열, kind: solid | trace | empty | gap
   ============================================================ */

var SIZES = { big:{cell:22, cols:8, rows:9}, mid:{cell:18, cols:10, rows:11}, small:{cell:15, cols:12, rows:13} };
/* 인쇄했을 때 덧쓰기 좋은 농도로 맞춘 색 — 화면보다 프린터에서 옅게 나오는 걸 감안해 진한 쪽으로 */
var INKS = {
  gray:{ light:"#d6dade", mid:"#c3c8ce", dark:"#9aa2ac" },
  blue:{ light:"#cfe1f6", mid:"#b9cfec", dark:"#8fb1dd" },
  red: { light:"#f7d9d9", mid:"#eebfbf", dark:"#dd9c9c" }
};
function traceColor(inkName, fade){ var ink=INKS[inkName]||INKS.gray; return ink[fade]||ink.mid; }

/* 공백을 뺀 글자들을 입력 순서대로, 중복 없이 */
function uniqueChars(text){
  var seen={}, out=[];
  Array.from(text.replace(/\s+/g,"")).forEach(function(c){ if(!seen[c]){seen[c]=1; out.push(c);} });
  return out;
}

function charRow(c,cfg,emptyCells){
  var row=[], traceCount = cfg.cols - 1 - emptyCells;
  if(traceCount < 1) traceCount = 1;
  row.push({ch:c, kind:"solid"});
  for(var i=0;i<traceCount;i++) row.push({ch:c, kind:"trace"});
  while(row.length<cfg.cols) row.push({ch:"", kind:"empty"});
  return row;
}
function blankRow(cfg){
  var row=[];
  for(var i=0;i<cfg.cols;i++) row.push({ch:"", kind:"empty"});
  return row;
}
function blankPage(cfg){
  var rows=[];
  for(var i=0;i<cfg.rows;i++) rows.push(blankRow(cfg));
  return rows;
}
function buildRowsChar(text, size, emptyCells){
  var cfg=SIZES[size], cs=uniqueChars(text), rows=[];
  if(!cs.length) return blankPage(cfg);
  /* 필요한 페이지 수를 먼저 정하고, 글자마다 같은 줄 수(per)를 배분 */
  var total=Math.ceil(cs.length/cfg.rows)*cfg.rows;
  var per=Math.max(1, Math.floor(total/cs.length));
  cs.forEach(function(c){
    for(var k=0;k<per;k++) rows.push(charRow(c,cfg,emptyCells));
  });
  while(rows.length<total) rows.push(blankRow(cfg));
  return rows;
}
function buildRowsLine(text, size, traceRows, emptyRows){
  var cfg=SIZES[size];
  // 단어 단위로 줄을 채워서, 단어가 줄 끝에서 잘리지 않게 한다
  var words=text.replace(/\r?\n/g," ").trim().split(/\s+/).filter(Boolean);
  if(!words.length) return blankPage(cfg);
  var lines=[], cur=[];
  words.forEach(function(w){
    var wc=Array.from(w);
    // a word longer than one line has to be split anyway
    while(wc.length>cfg.cols){
      if(cur.length){ lines.push(cur); cur=[]; }
      lines.push(wc.slice(0,cfg.cols));
      wc=wc.slice(cfg.cols);
    }
    if(!wc.length) return;
    if(cur.length && cur.length+1+wc.length>cfg.cols){ lines.push(cur); cur=[]; }
    if(cur.length) cur.push(" ");
    cur=cur.concat(wc);
  });
  if(cur.length) lines.push(cur);
  /* 한 줄짜리 짧은 입력(이름 등)은 오른쪽이 비지 않도록 줄 폭에 맞춰 반복해 채운다
     예: "김하준"(3칸) → "김하준 김하준"(7칸). 두 칸 이상 남으면 한 번 더 반복. */
  if(lines.length===1 && lines[0].length){
    var unit=lines[0].slice(), filled=unit.slice();
    while(filled.length + 1 + unit.length <= cfg.cols){ filled.push(" "); filled=filled.concat(unit); }
    lines=[filled];
  }
  // one block = solid lines + trace lines + empty lines
  function makeBlock(){
    var block=[];
    lines.forEach(function(L){ block.push(L.map(function(c){return {ch:c, kind:c===" "?"gap":"solid"};})); });
    for(var t=0;t<traceRows;t++)
      lines.forEach(function(L){ block.push(L.map(function(c){return {ch:c, kind:c===" "?"gap":"trace"};})); });
    for(var e=0;e<emptyRows;e++)
      lines.forEach(function(L){ block.push(L.map(function(c){return {ch:"", kind:c===" "?"gap":"empty"};})); });
    return block;
  }
  /* 필요한 페이지 수만큼 블록을 반복하고, 남는 줄은 빈 연습 줄로 채운다 */
  var block=makeBlock();
  if(!block.length) return blankPage(cfg);
  var total=Math.ceil(block.length/cfg.rows)*cfg.rows;
  var rows=block.slice();
  while(rows.length + block.length <= total) rows = rows.concat(block);
  /* 남는 줄은 전체 폭(blankRow) 대신 글자 폭에 맞춘 빈 연습 줄로 채운다
     (이름처럼 짧은 단어일 때 8칸짜리 빈 줄이 어긋나 보이는 문제 방지) */
  var emptyLines=lines.map(function(L){ return L.map(function(c){ return {ch:"", kind:c===" "?"gap":"empty"}; }); });
  for(var pi=0; rows.length<total; pi++) rows.push(emptyLines[pi % emptyLines.length]);
  return rows;
}
/* 상태 객체({text,mode,size,emptyCells,traceRows,emptyRows}) → 줄 배열 */
function buildRows(st){
  return st.mode==="char"
    ? buildRowsChar(st.text, st.size, st.emptyCells)
    : buildRowsLine(st.text, st.size, st.traceRows, st.emptyRows);
}
/* 페이지 줄 수 단위로 자르기 */
function paginate(rows, cfg){
  var pages=[];
  for(var i=0;i<rows.length;i+=cfg.rows) pages.push(rows.slice(i,i+cfg.rows));
  return pages;
}
