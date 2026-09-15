"use strict";
/* 받아쓰기 순수 모듈(DOM 없음) — 낱말 파싱·페이지 배분·서수 읽기·자연 음성 클립 판정
   페이지(index.html)는 시험 진행·렌더·컨트롤만. voice/manifest.js(GB_VOICE)보다 뒤에 로드 */
var MAXQ=20, PER_PAGE=10;

function parseWords(text){
  return text.split(/\r?\n/).map(function(s){return s.trim();}).filter(Boolean).slice(0,MAXQ);
}
/* n문제를 장당 PER_PAGE 이하로, 마지막 장에 한두 줄만 남지 않게 균등 배분 (예: 11문제 → 6+5) */
function paginateExam(n){
  var qPages=Math.max(1, Math.ceil(n/PER_PAGE));
  return { qPages:qPages, perPage:Math.ceil(n/qPages) };
}
/* TTS가 "1번"을 횟수(한 번)로 읽어 어색함 → 서수(첫 번째)로 불러준다 */
var ORD_KO=["첫","두","세","네","다섯","여섯","일곱","여덟","아홉","열",
            "열한","열두","열세","열네","열다섯","열여섯","열일곱","열여덟","열아홉","스무"];
function ordinalKo(n){ return (ORD_KO[n-1]||n)+" 번째"; }

/* 자연 음성 클립 — 시험의 모든 단어+번호에 클립이 있을 때만 파일 모드(한 시험 안에서 목소리가 섞이지 않게) */
var VOICE_MAP=(typeof GB_VOICE!=="undefined")?GB_VOICE:{};
function clipId(text){ return VOICE_MAP[text]||null; }
function allClipsReady(words){
  if(!words.length) return false;
  for(var i=0;i<words.length;i++){
    if(!clipId(words[i]) || !clipId(ordinalKo(i+1))) return false;
  }
  return true;
}
