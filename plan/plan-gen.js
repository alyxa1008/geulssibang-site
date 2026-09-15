"use strict";
/* 생활계획표 생성기 — 순수 함수(DOM 없음): 테마·장식 SVG·시간 계산·원형 계획표 SVG 문자열
   buildSVG(state) : state={title, items:[[시작칸,끝칸,활동명]…], theme} → <svg> 문자열 (칸=30분, 하루 48칸)
   페이지(index.html)는 렌더·컨트롤만 담당. escHtml은 common.js */
var PALETTE=["#cfe0f5","#fde2b8","#f9d5d3","#d6ecc9","#fbf3c0","#cfe7e3","#e0d5f0","#f3d7ea","#dde3e9","#e8dcc8"];
var MAXROWS=10;

/* ---------- 배경 테마 ----------
   인쇄물이므로 사진 대신 잉크 부담 없는 연한 벡터 장식:
   bg(바탕색) + pal(조각 팔레트) + deco(상·하단 장식 SVG) */
function decoWaves(){ /* 하단 파도 두 줄 */
  var w1="M0 1376", w2="M0 1394";
  for(var x=0;x<1000;x+=50){ w1+=" q25 -18 50 0"; w2+=" q25 -14 50 0"; }
  return '<path d="'+w1+'" fill="none" stroke="#7ec8e3" stroke-width="5" stroke-linecap="round"/>'
       + '<path d="'+w2+'" fill="none" stroke="#b3e0f0" stroke-width="4" stroke-linecap="round"/>';
}
function decoSun(){ /* 우상단 해 */
  var s='<circle cx="905" cy="82" r="30" fill="#ffd166"/>';
  for(var i=0;i<8;i++){ var a=i*Math.PI/4, x1=905+Math.cos(a)*40, y1=82+Math.sin(a)*40, x2=905+Math.cos(a)*54, y2=82+Math.sin(a)*54;
    s+='<line x1="'+x1.toFixed(0)+'" y1="'+y1.toFixed(0)+'" x2="'+x2.toFixed(0)+'" y2="'+y2.toFixed(0)+'" stroke="#ffd166" stroke-width="5" stroke-linecap="round"/>'; }
  return s;
}
function decoStars(){ /* 우상단 달 + 별들 */
  var s='<circle cx="905" cy="80" r="28" fill="#f5d76e"/><circle cx="893" cy="72" r="24" fill="#f6f5fc"/>';
  [[80,45],[150,80],[820,120],[60,1385],[940,1390],[500,25],[720,50],[260,1395]].forEach(function(p){
    s+='<path d="M'+p[0]+' '+(p[1]-9)+' l2.5 6.5 6.5 2.5 -6.5 2.5 -2.5 6.5 -2.5 -6.5 -6.5 -2.5 6.5 -2.5 z" fill="#b9a7e6"/>';
  });
  return s;
}
function decoSport(){ /* 상단 만국기 + 하단 잔디·공 */
  var cols=["#f9a15f","#7fb1a0","#f2c063","#cfe0f5","#e4573d"], s='<line x1="0" y1="18" x2="1000" y2="18" stroke="#c9cdd2" stroke-width="3"/>';
  for(var i=0;i<10;i++){ var x=30+i*100; s+='<path d="M'+x+' 20 l22 32 22 -32 z" fill="'+cols[i%5]+'"/>'; }
  s+='<rect y="1390" width="1000" height="24" fill="#cdeab3"/>';
  s+='<circle cx="72" cy="1382" r="24" fill="#fff" stroke="#e4573d" stroke-width="4"/><path d="M48 1382 h48 M72 1358 v48" stroke="#e4573d" stroke-width="3"/>';
  return s;
}
function decoSnow(){ /* 눈송이 흩뿌리기 + 좌하단 눈사람 */
  var s="";
  [[90,50,11],[210,95,8],[520,30,9],[700,70,12],[880,45,10],[950,120,8],[60,1360,9],[320,1395,8],[620,1385,10],[900,1370,9]].forEach(function(p){
    var x=p[0],y=p[1],r=p[2];
    for(var i=0;i<3;i++){ var a=i*Math.PI/3;
      s+='<line x1="'+(x-Math.cos(a)*r).toFixed(1)+'" y1="'+(y-Math.sin(a)*r).toFixed(1)+'" x2="'+(x+Math.cos(a)*r).toFixed(1)+'" y2="'+(y+Math.sin(a)*r).toFixed(1)+'" stroke="#a8c6e0" stroke-width="2.5" stroke-linecap="round"/>'; }
  });
  /* 눈사람 (좌하단) */
  s+='<circle cx="80" cy="1385" r="22" fill="#fff" stroke="#a8c6e0" stroke-width="3"/>'
   +'<circle cx="80" cy="1352" r="15" fill="#fff" stroke="#a8c6e0" stroke-width="3"/>'
   +'<circle cx="75" cy="1349" r="2" fill="#5b6470"/><circle cx="85" cy="1349" r="2" fill="#5b6470"/>'
   +'<rect x="68" y="1330" width="24" height="6" rx="2" fill="#e4573d"/><rect x="73" y="1318" width="14" height="14" rx="2" fill="#e4573d"/>';
  return s;
}
var THEMES={
  basic:{ bg:"#ffffff", pal:PALETTE, deco:function(){return "";} },
  sea:{ bg:"#f0f9fd", pal:["#bfe3f2","#ffe3b3","#cdeae4","#f9d5d3","#fbf3c0","#a8d8ea","#e0d5f0","#d6ecc9","#dde8ee","#eadfce"], deco:function(){return decoSun()+decoWaves();} },
  night:{ bg:"#f6f5fc", pal:["#dcd6f0","#f2e2c9","#cfd8f0","#efd9e5","#f5ecd0","#d4e0f5","#e3d1ea","#e6e2f5","#dfe3ee","#e8def0"], deco:decoStars },
  sport:{ bg:"#f7fbf3", pal:["#d6ecc9","#ffe3b3","#f9d5d3","#cfe0f5","#fbf3c0","#cfe7e3","#f8dcc0","#e0d5f0","#e2eecd","#f3d7ea"], deco:decoSport },
  winter:{ bg:"#f4f9fc", pal:["#d3e6f5","#eef4fa","#f9d5d3","#dcd6f0","#cfe7e3","#ffe3b3","#dde8ee","#e6eef7","#f3d7ea","#e0ecf5"], deco:decoSnow }
};

function fmt(i){ var h=Math.floor(i/2), m=i%2?"30":"00"; return (h<10?"0":"")+h+":"+m; }
function span(s,e){ return (e-s+48)%48; }

/* ---------- SVG 계획표 ---------- */
function polar(cx,cy,r,units){ var a=(units*7.5-90)*Math.PI/180; return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; }
function segPath(cx,cy,r,s,e){
  var sp=span(s,e); if(sp===0) return "";
  var p0=polar(cx,cy,r,s), p1=polar(cx,cy,r,s+sp);
  var large=sp*7.5>180?1:0;
  return "M"+cx+" "+cy+" L"+p0[0].toFixed(1)+" "+p0[1].toFixed(1)+
         " A"+r+" "+r+" 0 "+large+" 1 "+p1[0].toFixed(1)+" "+p1[1].toFixed(1)+" Z";
}
function buildSVG(state){
  var cx=500, cy=690, r=390;
  var title=state.title.trim() || "나의 여름방학 생활계획표";
  /* 긴 제목은 폭(880px)에 맞게 글자 크기 자동 축소 */
  var tfs=Math.min(52, Math.floor(860/(title.length+1)));
  var th=THEMES[state.theme]||THEMES.basic;
  var s='<svg id="planSvg" viewBox="0 0 1000 1414" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">';
  s+='<rect width="1000" height="1414" fill="'+th.bg+'"/>';
  s+=th.deco();
  s+='<text x="500" y="100" text-anchor="middle" font-family="Jua,\'Gowun Dodum\',sans-serif" font-size="'+tfs+'" fill="#2b3038">⏰ '+escHtml(title)+'</text>';
  s+='<line x1="80" y1="140" x2="920" y2="140" stroke="#2b3038" stroke-width="3"/>';
  /* 조각 */
  var items=state.items.filter(function(it){return span(it[0],it[1])>0;});
  items.forEach(function(it,i){
    s+='<path d="'+segPath(cx,cy,r,it[0],it[1])+'" fill="'+th.pal[i%th.pal.length]+'" stroke="#fff" stroke-width="3"/>';
  });
  /* 바깥 원 + 시간 눈금 */
  s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#2b3038" stroke-width="3"/>';
  for(var u=0;u<48;u++){
    var inner=polar(cx,cy,u%2===0?r-16:r-9,u), outer=polar(cx,cy,r,u);
    s+='<line x1="'+inner[0].toFixed(1)+'" y1="'+inner[1].toFixed(1)+'" x2="'+outer[0].toFixed(1)+'" y2="'+outer[1].toFixed(1)+'" stroke="#5b6470" stroke-width="'+(u%2===0?2:1)+'"/>';
    if(u%2===0){
      var tp=polar(cx,cy,r+30,u), hour=u/2;
      s+='<text x="'+tp[0].toFixed(1)+'" y="'+(tp[1]+9).toFixed(1)+'" text-anchor="middle" font-family="\'Gowun Dodum\',sans-serif" font-size="24" fill="#5b6470">'+hour+'</text>';
    }
  }
  /* 조각 라벨 (1시간 이상만 안쪽에).
     위치는 부채꼴 무게중심 반지름 (2/3)·r·sin(θ/2)/(θ/2) — 넓은 조각(잠 등)일수록
     안쪽에 찍혀야 시각적 가운데가 된다. 좁은 조각은 자연히 0.66r 근처 */
  items.forEach(function(it){
    var sp=span(it[0],it[1]); if(sp<2) return;
    var half=(sp*7.5/2)*Math.PI/180;
    var lr=r*(2/3)*(Math.sin(half)/half);
    var mid=it[0]+sp/2, lp=polar(cx,cy,lr,mid);
    var fs=sp>=4?30:24;
    s+='<text x="'+lp[0].toFixed(1)+'" y="'+lp[1].toFixed(1)+'" text-anchor="middle" font-family="\'Gowun Dodum\',sans-serif" font-size="'+fs+'" fill="#2b3038">'+escHtml(it[2])+'</text>';
  });
  /* 범례 (시작 시각 순) */
  var sorted=items.slice().sort(function(a,b){return a[0]-b[0];});
  var lx0=110, lx1=530, ly=1180;
  s+='<line x1="80" y1="1150" x2="920" y2="1150" stroke="#e3e6ea" stroke-width="2"/>';
  sorted.forEach(function(it,i){
    var col=i%2, row=Math.floor(i/2);
    var x=col===0?lx0:lx1, y=ly+row*42;
    var ci=items.indexOf(it);
    s+='<rect x="'+x+'" y="'+(y-20)+'" width="26" height="26" rx="6" fill="'+th.pal[ci%th.pal.length]+'" stroke="#c9cdd2"/>';
    s+='<text x="'+(x+38)+'" y="'+y+'" font-family="\'Gowun Dodum\',sans-serif" font-size="24" fill="#2b3038">'+fmt(it[0])+'~'+fmt(it[1])+'  '+escHtml(it[2])+'</text>';
  });
  s+='<text x="920" y="1395" text-anchor="end" font-family="\'Gowun Dodum\',sans-serif" font-size="20" fill="#9aa1a9">글씨방 · geulssibang.com</text>';
  s+='</svg>';
  return s;
}
