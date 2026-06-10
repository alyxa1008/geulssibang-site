/* ============================================================
   글씨방 공통 유틸리티
   - 모든 도구 페이지가 공유합니다. 페이지의 메인 스크립트보다
     먼저 로드되어야 합니다.
   ============================================================ */
"use strict";

/* DOM 요소 생성 */
function el(tag, cls){ var d=document.createElement(tag); if(cls) d.className=cls; return d; }

/* 한글 안전 base64 인코딩/디코딩 (공유 링크용) */
function b64e(str){ return btoa(unescape(encodeURIComponent(str))); }
function b64d(str){ return decodeURIComponent(escape(atob(str))); }

/* GA4 이벤트 전송 (분석 스크립트가 없거나 차단되면 조용히 무시) */
function track(name, params){
  if(typeof gtag==="function") gtag("event", name, params||{});
}
/* 현재 페이지의 도구 이름 (이벤트 라벨용): /hangul/ → "hangul", 홈 → "home" */
function toolName(){
  return location.pathname.split("/").filter(Boolean)[0]||"home";
}

/* 현재 상태가 담긴 공유 링크를 클립보드에 복사 (실패 시 수동 복사 안내) */
function copyShareLink(encoded){
  track("share_link", {tool: toolName()});
  var hash="s="+encodeURIComponent(encoded);
  var url=location.origin+location.pathname+"#"+hash;
  navigator.clipboard.writeText(url).then(function(){
    location.hash=hash;
    showToast("링크가 복사되었습니다");
  }).catch(function(){ prompt("이 링크를 복사하세요:",url); });
}

/* 하단 토스트 알림 */
function showToast(msg){
  var t=document.getElementById("toast");
  if(!t) return;
  if(msg) t.textContent=msg;
  t.classList.add("show");
  setTimeout(function(){ t.classList.remove("show"); }, 1800);
}

/* A4 시트 미리보기를 화면 폭에 맞게 축소 */
function fitScale(){
  var zone=document.querySelector(".preview-zone");
  if(!zone) return;
  var mm=3.7795275591, sheetW=210*mm;
  var s=Math.min(1, zone.clientWidth/sheetW);
  document.querySelectorAll(".sheet-scale").forEach(function(w){
    w.style.transform="scale("+s+")";
    w.style.height=(297*mm*s)+"px";
    w.style.width=(210*mm*s)+"px";
  });
}
