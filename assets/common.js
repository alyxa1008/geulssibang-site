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
/* ----- A4 PNG 시트 공통 틀 (한글·수학·받아쓰기가 공유) ----- */
var PNG_MM=1240/210;  // A4 가로 1240px 기준 px/mm
/* 흰 A4 캔버스 + 컨텍스트 생성 */
function pngSheet(){
  var W=1240,H=Math.round(297*PNG_MM),c=el("canvas"); c.width=W; c.height=H;
  var x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,W,H);
  return {canvas:c, x:x, W:W, H:H};
}
/* 머리글: 제목 + 우측 메타(이름/날짜 등) + 구분선. 본문 시작 y(headY) 반환.
   o = {x, L, R, T, deco, title, meta:[문자열…]} (meta 1개면 중앙, 2개면 위아래) */
function pngHeader(o){
  var x=o.x, M=PNG_MM;
  x.fillStyle="#2b3038"; x.textBaseline="alphabetic"; x.textAlign="left";
  x.font='400 '+Math.round(8*M)+'px "Jua"';
  x.fillText(o.deco+" "+o.title, o.L, o.T+8*M);
  x.font='400 '+Math.round(3.6*M)+'px "Gowun Dodum"'; x.fillStyle="#5b6470"; x.textAlign="right";
  var meta=o.meta||[];
  meta.forEach(function(line,i){
    var y = meta.length===1 ? o.T+6*M : o.T+(3.4+i*4.8)*M;
    x.fillText(line, o.R, y);
  });
  x.textAlign="left";
  var headY=o.T+11*M;
  x.strokeStyle="#2b3038"; x.lineWidth=2.5; x.beginPath(); x.moveTo(o.L,headY); x.lineTo(o.R,headY); x.stroke();
  return headY;
}
/* 바닥글: 구분선 + 좌측 워터마크 + 우측 페이지번호. o={x,L,R,H,left,pageNo,pageTotal} */
function pngFooter(o){
  var x=o.x, M=PNG_MM, footY=o.H-9*M;
  x.strokeStyle="#e3e6ea"; x.lineWidth=1; x.beginPath(); x.moveTo(o.L,footY); x.lineTo(o.R,footY); x.stroke();
  x.fillStyle="#9aa1a9"; x.font='400 '+Math.round(3*M)+'px "Gowun Dodum"'; x.textAlign="left";
  x.fillText(o.left, o.L, footY+4.5*M);
  x.textAlign="right"; x.fillText(o.pageNo+" / "+o.pageTotal, o.R, footY+4.5*M); x.textAlign="left";
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

/* ===== 한국어 음성(TTS) — 받아쓰기·화면 손글씨 공유 ===== */
var __koVoice=null;
function __pickKoVoice(){
  if(!window.speechSynthesis) return;
  var vs=speechSynthesis.getVoices().filter(function(v){return /^ko/i.test(v.lang);});
  __koVoice=vs[0]||null;
}
if(typeof window!=="undefined" && window.speechSynthesis){ __pickKoVoice(); speechSynthesis.onvoiceschanged=__pickKoVoice; }
function koVoice(){ return __koVoice; }
/* 음성 목록은 로드됐는데 한국어 음성만 없는 기기인지 (조용히 실패하는 경우 대비) */
function koVoiceMissing(){ return !!(window.speechSynthesis && speechSynthesis.getVoices().length>0 && !__koVoice); }
/* 한 번 읽기 (단순 버전). 성공 시 true */
function speakKo(text, rate){
  if(!window.speechSynthesis) return false;
  speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);
  u.lang="ko-KR"; if(__koVoice) u.voice=__koVoice; u.rate=rate||0.85;
  speechSynthesis.speak(u);
  return true;
}

/* 하단 토스트 알림 — 연속 호출 시 이전 타이머를 지워 새 토스트가 1.8초를 온전히 산다 */
var __toastTimer=null;
function showToast(msg){
  var t=document.getElementById("toast");
  if(!t) return;
  if(msg) t.textContent=msg;
  t.classList.add("show");
  if(__toastTimer) clearTimeout(__toastTimer);
  __toastTimer=setTimeout(function(){ t.classList.remove("show"); __toastTimer=null; }, 1800);
}

/* ===== 랜딩 페이지 딥링크 =====
   .gobtn의 data 속성으로 도구 상태 해시(#s=)를 만들어 붙인다.
   버튼에 이미 있는 href(도구 경로)를 그대로 쓰므로 페이지 깊이와 무관.
   새 랜딩 페이지는 마크업만 만들면 되고 스크립트 복사가 필요 없다. */
function wireDeepLinks(){
  /* 한글 도구형: [텍스트, 모드, 폰트, 크기, 빈칸수, 따라쓰기줄, 빈줄, 안내선, 제목, 농도, 색] */
  document.querySelectorAll(".gobtn[data-text]").forEach(function(b){
    var st=[b.getAttribute("data-text"), b.getAttribute("data-mode")||"char", b.getAttribute("data-font")||"f-gowun",
            b.getAttribute("data-size")||"big", 3, 2, 1, 1, b.getAttribute("data-title")||"", "mid", b.getAttribute("data-ink")||"gray"];
    b.href=b.getAttribute("href")+"#s="+encodeURIComponent(b64e(JSON.stringify(st)));
  });
  /* 수학 도구형 v2: [2, 유형, 난이도, 받아올림없음, 단, 형식, 장수, 정답지, 제목, 시드0=열 때마다 새 문제] */
  document.querySelectorAll(".gobtn[data-topic]").forEach(function(b){
    var st=[2, b.getAttribute("data-topic"), +(b.getAttribute("data-level")||0), 0,
            +(b.getAttribute("data-dan")||0), "v", 1, 1, b.getAttribute("data-title")||"", 0];
    b.href=b.getAttribute("href")+"#s="+encodeURIComponent(b64e(JSON.stringify(st)));
  });
  /* 구구단 시험형: [1, 단문자열, 문제수, 순서, 답방식, 생각시간, 소리] */
  document.querySelectorAll(".gobtn[data-quiz-dan]").forEach(function(b){
    var st=[1, b.getAttribute("data-quiz-dan"), +(b.getAttribute("data-quiz-n")||10), "mix", "speak", 5, 1];
    b.href=b.getAttribute("href")+"#s="+encodeURIComponent(b64e(JSON.stringify(st)));
  });
  /* 받아쓰기 급수 카드형: .gset[data-title]의 li 목록 → [단어들, 읽기횟수, 사이시간, 속도, 제목, 정답지] */
  document.querySelectorAll(".gset[data-title]").forEach(function(box){
    var btn=box.querySelector(".gobtn"); if(!btn) return;
    var words=Array.prototype.map.call(box.querySelectorAll("li"), function(li){ return li.textContent.trim(); });
    var payload=[words.join("\n"), 2, 12, 0.85, box.getAttribute("data-title"), 1];
    btn.href=btn.getAttribute("href")+"#s="+encodeURIComponent(b64e(JSON.stringify(payload)));
  });
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

/* 로드 시 자동 실행 — common.js는 body 끝에서 로드되므로 DOM이 준비돼 있다.
   해당 버튼이 없는 페이지에서는 아무 일도 하지 않는다. */
wireDeepLinks();
