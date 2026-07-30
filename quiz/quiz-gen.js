/* 상식퀴즈 출제·채점 로직 (순수 모듈 — DOM 없음, tests/test-quiz.js로 검증)
   데이터는 quiz-data.js의 QUIZ_DATA: {c 분야, l 급수, q 문제, o 보기(0=정답), a 인정답, e 해설, m 이모지} */
(function(root){
"use strict";

function shuffle(arr, rnd){
  var a=arr.slice();
  for(var i=a.length-1;i>0;i--){
    var j=Math.floor(rnd()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t;
  }
  return a;
}

/* 출제: 급수(+분야 필터) 풀에서 '최근 나온 문제(seen)'를 뺀 뒤 랜덤으로 count개.
   남은 새 문제가 모자라면 풀 전체에서 다시 뽑는다(한 바퀴 돈 것). 반환: 데이터 인덱스 배열 */
function pickQuestions(data, cats, level, count, seen, rnd){
  rnd=rnd||Math.random; seen=seen||[];
  var pool=[];
  data.forEach(function(q,i){
    if(q.l===level && (!cats.length || cats.indexOf(q.c)>=0)) pool.push(i);
  });
  var unseen=pool.filter(function(i){ return seen.indexOf(i)<0; });
  var base=unseen.length>=Math.min(count,pool.length) ? unseen : pool;
  return shuffle(base, rnd).slice(0, Math.min(count, base.length));
}

/* 보기 섞기 — 정답(o[0])의 위치를 감춘다 */
function shuffledChoices(q, rnd){
  return shuffle(q.o, rnd||Math.random);
}

/* 주관식 채점 — 공백·문장부호를 지운 뒤, 정답과 인정답 변형 목록에 정확히 일치해야 정답.
   "크리스마스(성탄절)" 같은 괄호 표기는 괄호 안팎을 각각 인정한다. */
function normAns(s){
  return String(s).toLowerCase().replace(/[\s.·,~!?'"()（）]/g,"");
}
function answerSet(q){
  var cands=[q.o[0]].concat(String(q.o[0]).split(/[()]/)).concat(q.a||[]);
  var set=[];
  cands.forEach(function(c){
    var n=normAns(c);
    if(n && set.indexOf(n)<0) set.push(n);
  });
  return set;
}
function checkAnswer(q, input){
  var v=normAns(input);
  if(!v) return false;
  return answerSet(q).indexOf(v)>=0;
}

/* 채점 집계 */
function grade(results){
  var score=0, wrong=[];
  results.forEach(function(r){ if(r.ok) score++; else wrong.push(r); });
  return { score:score, total:results.length, wrong:wrong };
}

var api={ pickQuestions:pickQuestions, shuffledChoices:shuffledChoices,
          checkAnswer:checkAnswer, answerSet:answerSet, grade:grade };
if(typeof module!=="undefined") module.exports=api;
else root.QuizGen=api;
})(this);
