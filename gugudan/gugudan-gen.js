"use strict";
/* ============================================================
   구구단 시험 생성기 (순수 함수 — DOM 없음, 노드 테스트 가능)
   - buildQuestions : 단 목록 → 문제 배열 (mix면 셔플, count로 자름)
   - grade          : 결과 배열 → 점수·오답·약한 단
   - buildChoices   : 사지선다 보기 — 오답은 실제로 헷갈리는 값에서
                      (같은 단 옆 문제, 옆 단 같은 곱수, ±한 묶음, ±1)
   - askText        : 문제 읽기 문장 (은/는 조사 처리)
   rnd 인자를 주면 같은 시드 → 같은 결과 (테스트용).
   ============================================================ */

function shuffleInPlace(arr, rnd){
  for(var i=arr.length-1;i>0;i--){ var j=Math.floor((rnd?rnd():Math.random())*(i+1)); var t=arr[i]; arr[i]=arr[j]; arr[j]=t; }
  return arr;
}
function buildQuestions(dans, count, order, rnd){
  var pool=[];
  dans.forEach(function(d){ for(var b=1;b<=9;b++) pool.push({a:d,b:b,ans:d*b}); });
  if(order==="mix"){
    /* ×1은 너무 쉬워 시험 가치가 낮다 — 섞기 모드에선 ×1을 풀 맨 뒤로 보내
       문제 수 제한(10·20)에 자연히 밀려나게 한다. 고른 단이 적어 문제가
       모자랄 때만 ×1이 채워지고, '전체 문제'(count 0)에는 그대로 다 나온다. */
    var main=shuffleInPlace(pool.filter(function(q){return q.b!==1;}), rnd);
    var ones=shuffleInPlace(pool.filter(function(q){return q.b===1;}), rnd);
    pool=main.concat(ones);
  }
  return count>0 ? pool.slice(0,count) : pool;
}
function grade(results){
  var wrong=results.filter(function(r){ return !r.ok; });
  var byDan={};
  wrong.forEach(function(r){ (byDan[r.a]=byDan[r.a]||[]).push(r); });
  return { score:results.length-wrong.length, total:results.length, wrong:wrong,
           wrongDans:Object.keys(byDan).map(Number).sort(function(x,y){return x-y;}) };
}
function buildChoices(q, rnd){
  var set=[q.ans];
  var cand=[ q.a*(q.b+1), q.a*(q.b-1), (q.a+1)*q.b, (q.a-1)*q.b,
             q.ans+q.a, q.ans-q.a, q.ans+1, q.ans-1 ];
  for(var i=cand.length-1;i>0;i--){ var j=Math.floor((rnd?rnd():Math.random())*(i+1)); var t=cand[i]; cand[i]=cand[j]; cand[j]=t; }
  cand.forEach(function(v){ if(set.length<4 && v>0 && set.indexOf(v)<0) set.push(v); });
  var f=2; while(set.length<4){ if(set.indexOf(q.ans+f)<0) set.push(q.ans+f); f++; }
  for(var i2=set.length-1;i2>0;i2--){ var j2=Math.floor((rnd?rnd():Math.random())*(i2+1)); var t2=set[i2]; set[i2]=set[j2]; set[j2]=t2; }
  return set;
}
/* 수 뒤 조사 — 한자어 수사 중 받침 있는 일·삼·육·칠·팔은 '은', 나머지는 '는' */
function askText(q){ return q.a+" 곱하기 "+q.b+([1,3,6,7,8].indexOf(q.b)>=0?"은?":"는?"); }
