/* 상식퀴즈 검사 — 실행: node tests/test-quiz.js
   1) 문제은행 무결성 (275개·25셀×11·보기 4·인정답·금지표현·이모지)
   2) 출제 로직 성질 (급수·분야 필터, seen 제외, 모자라면 풀 재사용, 보기 섞기 보존)
   3) 주관식 채점 (인정답 변형·괄호·공백, 오답 거부)
   4) 페이지 배선 */
"use strict";
var fs=require("fs");
var path=require("path");
var ROOT=path.join(__dirname,"..");
var DATA=require(path.join(ROOT,"quiz/quiz-data.js")).QUIZ_DATA;
var G=require(path.join(ROOT,"quiz/quiz-gen.js"));
var fails=0;
function ok(c,m){ if(c)console.log("  ✓ "+m); else{fails++; console.log("  ✗ "+m);} }
function rndSeq(){ var s=42; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

console.log("1. 문제은행 무결성");
ok(DATA.length===275, "275문항 ("+DATA.length+")");
var cell={}, bad=[];
DATA.forEach(function(q,i){
  cell[q.c+q.l]=(cell[q.c+q.l]||0)+1;
  if(q.o.length!==4) bad.push(i+": 보기 "+q.o.length);
  if(new Set(q.o).size!==4) bad.push(i+": 보기 중복");
  if(!q.a || !q.a.length) bad.push(i+": 인정답 없음");
  if(!q.e) bad.push(i+": 해설 없음");
  if(!q.m) bad.push(i+": 이모지 없음");
  if(/주로|좋아하|알려진|유명한/.test(q.q)) bad.push(i+": 금지표현");
});
ok(Object.keys(cell).length===25 && Object.keys(cell).every(function(k){return cell[k]===11;}),
  "25셀 × 11문항");
ok(bad.length===0, "보기·인정답·해설·이모지·표현 전수 통과"+(bad.length?" — "+bad.slice(0,5).join("; "):""));

console.log("2. 출제 로직 성질");
var r=rndSeq();
var p1=G.pickQuestions(DATA, [], 3, 10, [], r);
ok(p1.length===10 && p1.every(function(i){return DATA[i].l===3;}), "급수 필터 (3급수만)");
var p2=G.pickQuestions(DATA, ["animal"], 5, 10, [], r);
ok(p2.length===10 && p2.every(function(i){return DATA[i].c==="animal"&&DATA[i].l===5;}), "분야+급수 필터");
var seen=p2.slice(0,8);
var p3=G.pickQuestions(DATA, ["animal"], 5, 2, seen, r);
ok(p3.every(function(i){return seen.indexOf(i)<0;}), "최근 문제(seen) 제외");
var p4=G.pickQuestions(DATA, ["animal"], 5, 10, DATA.map(function(q,i){return i;}), r);
ok(p4.length===10, "전부 봤으면 풀 재사용 (고갈 안 됨)");
var q0=DATA[0];
var ch=G.shuffledChoices(q0, r);
ok(ch.length===4 && ch.slice().sort().join()===q0.o.slice().sort().join(), "보기 섞기 — 내용 보존");
var diff=0;
for(var t=0;t<50;t++){ if(G.shuffledChoices(q0, Math.random)[0]!==q0.o[0]) diff++; }
ok(diff>10, "정답 위치가 실제로 섞임 (50회 중 "+diff+"회 이동)");

console.log("3. 주관식 채점");
var qm=DATA.filter(function(q){return q.q.indexOf("문어의 다리")>=0;})[0];
ok(G.checkAnswer(qm,"8개") && G.checkAnswer(qm," 8 ") && G.checkAnswer(qm,"여덟개"), "숫자 변형 인정");
ok(!G.checkAnswer(qm,"6개") && !G.checkAnswer(qm,"") && !G.checkAnswer(qm,"모름"), "오답·빈값 거부");
var qx=DATA.filter(function(q){return q.o[0].indexOf("(")>=0;})[0];
ok(G.checkAnswer(qx, qx.o[0].split("(")[0]), "괄호 앞부분만 써도 인정: "+qx.o[0]);
var wrongAccept=[];
DATA.forEach(function(q,i){
  q.o.slice(1).forEach(function(d){ if(G.checkAnswer(q,d)) wrongAccept.push(i+":"+d); });
});
ok(wrongAccept.length===0, "오답 보기가 정답 처리되는 문항 0"+(wrongAccept.length?" — "+wrongAccept.join(", "):""));

console.log("4. 페이지 배선");
var src=fs.readFileSync(path.join(ROOT,"quiz/index.html"),"utf8");
ok(src.indexOf('src="quiz-data.js"')>-1 && src.indexOf('src="quiz-gen.js"')>-1, "데이터·로직 모듈 로드");
ok(/QuizGen\.pickQuestions/.test(src) && /QuizGen\.checkAnswer/.test(src), "페이지가 순수 모듈 사용");
ok(/gb_quiz_seen/.test(src), "최근 문제 기억(localStorage)");
ok(/exam_start/.test(src) && /quiz_done/.test(src) && /print_sheet/.test(src), "GA 이벤트 3종");
ok(/pc-cert/.test(src) && /pc-sheet/.test(src), "상장·시험지 인쇄 분리");

console.log(fails ? "\n실패 "+fails+"건" : "\n전부 통과");
process.exit(fails?1:0);
