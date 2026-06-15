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

/* 실사용 기기에서 나는 JS 에러를 GA4로 보고 — 기기별 문제 파악용 */
window.addEventListener("error", function(e){
  track("js_error", {
    message: String(e.message||"").slice(0,140),
    where: (e.filename||"").split("/").slice(-2).join("/")+":"+(e.lineno||0)
  });
});
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

/* ===== PNG 저장 (프린터 없는 모바일 사용자용) ===== */
/* canvas를 PNG 파일로 내려받기 */
function savePNG(canvas, name){
  canvas.toBlob(function(blob){
    if(!blob){ showToast("저장에 실패했어요. 다시 시도해 주세요"); return; }
    var a=el("a");
    a.href=URL.createObjectURL(blob); a.download=name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
  }, "image/png");
}
/* SVG 요소를 PNG로 저장 (미로처럼 SVG로 그린 시트용).
   outW = 출력 가로 px, 세로는 viewBox 비율로 자동. 흰 배경을 깔아 저장한다. */
function svgToPNG(svgEl, outW, name, done){
  var vb=(svgEl.getAttribute("viewBox")||"0 0 1 1").split(/[\s,]+/).map(Number);
  var ratio=(vb[3]||1)/(vb[2]||1), outH=Math.round(outW*ratio);
  var clone=svgEl.cloneNode(true);
  clone.setAttribute("width",outW); clone.setAttribute("height",outH);
  var xml=new XMLSerializer().serializeToString(clone);
  var url="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(xml);
  var img=new Image();
  img.onload=function(){
    var c=el("canvas"); c.width=outW; c.height=outH;
    var x=c.getContext("2d");
    x.fillStyle="#fff"; x.fillRect(0,0,outW,outH);
    x.drawImage(img,0,0,outW,outH);
    savePNG(c,name); if(done) done();
  };
  img.onerror=function(){ if(done) done(true); else showToast("저장에 실패했어요"); };
  img.src=url;
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
