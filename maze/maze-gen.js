"use strict";
/* ============================================================
   미로 생성기 (순수 함수 — DOM 없음, 노드 테스트 가능)
   - buildGrid  : 사각 격자 (마스크 함수로 하트·별 모양 지원)
   - buildCircle: 원형(극좌표) 격자
   - carve      : 재귀 백트래커로 벽 허물기 (열린 벽 = 간선 집합)
   - solve      : 너비 우선 탐색 정답 경로
   - gridSVG / circleSVG : 도안 그리기
   같은 시드 → 같은 미로 (공유 링크 재현용).
   ============================================================ */

/* 시드 난수 */
function mulberry32(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

var DX=[0,1,0,-1], DY=[-1,0,1,0]; /* 위, 오른쪽, 아래, 왼쪽 */

function ekey(a,b){ return a<b ? a+"-"+b : b+"-"+a; }

/* ---------- 사각 격자 (마스크 지원) ---------- */
/* maskFn(x,y)가 false인 칸은 미로에서 제외.
   구멍이 여러 조각으로 나뉘면 가장 큰 조각만 남겨 항상 풀 수 있게 한다. */
function biggestComponent(alive, cols, rows){
  var n=cols*rows, comp=[], best=-1, bestSize=0, nc=0, i;
  for(i=0;i<n;i++) comp.push(-1);
  for(i=0;i<n;i++){
    if(!alive[i]||comp[i]>=0) continue;
    var q=[i], size=0; comp[i]=nc;
    while(q.length){
      var c=q.pop(); size++;
      var x=c%cols, y=(c-x)/cols;
      for(var d=0;d<4;d++){
        var nx=x+DX[d], ny=y+DY[d];
        if(nx<0||nx>=cols||ny<0||ny>=rows) continue;
        var nb=ny*cols+nx;
        if(alive[nb]&&comp[nb]<0){ comp[nb]=nc; q.push(nb); }
      }
    }
    if(size>bestSize){ bestSize=size; best=nc; }
    nc++;
  }
  for(i=0;i<n;i++) if(alive[i]&&comp[i]!==best) alive[i]=false;
}

function buildGrid(cols, rows, maskFn){
  var n=cols*rows, alive=[], i;
  for(var y=0;y<rows;y++)for(var x=0;x<cols;x++)
    alive.push(maskFn ? !!maskFn(x,y) : true);
  if(maskFn) biggestComponent(alive, cols, rows);
  var adj=[];
  for(i=0;i<n;i++) adj.push([]);
  for(var y2=0;y2<rows;y2++)for(var x2=0;x2<cols;x2++){
    var c=y2*cols+x2;
    if(!alive[c]) continue;
    for(var d=0;d<4;d++){           /* 위→오른쪽→아래→왼쪽 순서 고정 (기존 링크 재현) */
      var nx=x2+DX[d], ny=y2+DY[d];
      if(nx<0||nx>=cols||ny<0||ny>=rows) continue;
      var nb=ny*cols+nx;
      if(alive[nb]) adj[c].push(nb);
    }
  }
  var start=-1, end=-1;
  for(i=0;i<n;i++) if(alive[i]){ if(start<0) start=i; end=i; }
  return { kind:"grid", cols:cols, rows:rows, alive:alive, adj:adj, start:start, end:end };
}

/* ---------- 모양 마스크 ---------- */
/* 하트: (x²+y²-1)³ - x²y³ ≤ 0 */
function heartMask(cols, rows){
  return function(cx, cy){
    var x=((cx+0.5)/cols*2-1)*1.22;
    var y=(1-(cy+0.5)/rows*2)*1.20+0.12;
    var a=x*x+y*y-1;
    return a*a*a - x*x*y*y*y <= 0;
  };
}
/* 별: 꼭짓점 위 방향 오각별 폴리곤 내부 판정 */
function starMask(cols, rows){
  var pts=[];
  for(var k=0;k<5;k++){
    var aO=-Math.PI/2 + k*2*Math.PI/5;
    var aI=aO + Math.PI/5;
    pts.push([Math.cos(aO), Math.sin(aO)]);
    pts.push([0.5*Math.cos(aI), 0.5*Math.sin(aI)]);
  }
  return function(cx, cy){
    var x=((cx+0.5)/cols*2-1)*1.02;
    var y=((cy+0.5)/rows*2-1)*0.97-0.095;
    var inside=false;
    for(var i=0,j=pts.length-1;i<pts.length;j=i++){
      var xi=pts[i][0], yi=pts[i][1], xj=pts[j][0], yj=pts[j][1];
      if((yi>y)!==(yj>y) && x < (xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
    }
    return inside;
  };
}

/* ---------- 원형(극좌표) 격자 ---------- */
/* 중심 1칸 + 바깥으로 고리. 고리가 커지면 칸 수를 2배로 늘려 칸 폭을 비슷하게 유지. */
function buildCircle(rings){
  var counts=[1], r;
  for(r=1;r<rings;r++){
    var prev=counts[r-1];
    counts.push(r===1 ? 8 : (2*Math.PI*r/prev > 1.7 ? prev*2 : prev));
  }
  var off=[0];
  for(r=1;r<rings;r++) off.push(off[r-1]+counts[r-1]);
  var n=off[rings-1]+counts[rings-1];
  function id(ri,i){ return off[ri]+i; }
  var adj=[], i;
  for(i=0;i<n;i++) adj.push([]);
  for(r=1;r<rings;r++){
    for(i=0;i<counts[r];i++){
      var c=id(r,i);
      if(counts[r]>1){
        var cw=id(r,(i+1)%counts[r]), ccw=id(r,(i-1+counts[r])%counts[r]);
        adj[c].push(cw);
        if(ccw!==cw) adj[c].push(ccw);
      }
      var p = r===1 ? 0 : id(r-1, Math.floor(i*counts[r-1]/counts[r]));
      adj[c].push(p); adj[p].push(c);
    }
  }
  return { kind:"circle", rings:rings, counts:counts, off:off, id:id, n:n, adj:adj,
           start:0, end:id(rings-1, Math.floor(counts[rings-1]/2)) };
}

/* ---------- 벽 허물기 (재귀 백트래커) ---------- */
/* 모든 칸을 한 번씩 방문하므로 출발→도착 경로가 정확히 하나 존재. */
function carve(g, seed){
  var rnd=mulberry32(seed), open={}, visited={}, stack=[g.start];
  visited[g.start]=true;
  while(stack.length){
    var cur=stack[stack.length-1], nbs=[];
    for(var k=0;k<g.adj[cur].length;k++)
      if(!visited[g.adj[cur][k]]) nbs.push(g.adj[cur][k]);
    if(!nbs.length){ stack.pop(); continue; }
    var nxt=nbs[Math.floor(rnd()*nbs.length)];
    open[ekey(cur,nxt)]=1;
    visited[nxt]=true; stack.push(nxt);
  }
  return open;
}

/* ---------- 정답 경로 (너비 우선 탐색) ---------- */
function solve(g, open){
  var prev={}, q=[g.start];
  prev[g.start]=g.start;
  while(q.length){
    var c=q.shift();
    if(c===g.end) break;
    for(var k=0;k<g.adj[c].length;k++){
      var nb=g.adj[c][k];
      if(open[ekey(c,nb)] && prev[nb]===undefined){ prev[nb]=c; q.push(nb); }
    }
  }
  var path=[], c2=g.end;
  while(c2!==g.start){ path.push(c2); c2=prev[c2]; }
  path.push(g.start);
  return path.reverse();
}

/* ---------- 사각/모양 미로 SVG ---------- */
/* opts.icons = {s:출발 이모지, e:도착 이모지} — 테마 장식
   opts.bold  = 유아용 굵은 선 (테마와 독립 — 일반 난이도도 아이콘만 붙일 수 있다) */
function gridSVG(g, open, path, opts){
  opts=opts||{};
  var u=10, cols=g.cols, rows=g.rows, w=cols*u, h=rows*u, seg=[];
  var sx=g.start%cols, sy=(g.start-sx)/cols;
  var ex=g.end%cols,   ey=(g.end-ex)/cols;
  for(var y=0;y<rows;y++)for(var x=0;x<cols;x++){
    var c=y*cols+x;
    if(!g.alive[c]) continue;
    var X=x*u, Y=y*u;
    var up   = y>0        && g.alive[c-cols];
    var left = x>0        && g.alive[c-1];
    var right= x<cols-1   && g.alive[c+1];
    var down = y<rows-1   && g.alive[c+cols];
    if(!up){ if(c!==g.start) seg.push("M"+X+" "+Y+"h"+u); }
    else if(!open[ekey(c,c-cols)]) seg.push("M"+X+" "+Y+"h"+u);
    if(!left) seg.push("M"+X+" "+Y+"v"+u);
    else if(!open[ekey(c,c-1)]) seg.push("M"+X+" "+Y+"v"+u);
    if(!right) seg.push("M"+(X+u)+" "+Y+"v"+u);
    if(!down){ if(c!==g.end) seg.push("M"+X+" "+(Y+u)+"h"+u); }
  }
  var padT=opts.icons?16:11, padB=opts.icons?17:12;
  var s='<svg viewBox="-2 '+(-padT)+' '+(w+4)+' '+(h+padT+padB)+'" xmlns="http://www.w3.org/2000/svg">';
  if(opts.icons){
    s+='<text x="'+(sx*u+u/2)+'" y="'+(sy*u-3)+'" font-size="12" text-anchor="middle">'+opts.icons.s+'</text>';
    s+='<text x="'+(ex*u+u/2)+'" y="'+((ey+1)*u+13)+'" font-size="12" text-anchor="middle">'+opts.icons.e+'</text>';
  }else{
    s+='<text x="'+(sx*u+u/2)+'" y="'+(sy*u-4)+'" font-size="5.5" text-anchor="middle" fill="#2b3038">▼ 출발</text>';
    s+='<text x="'+(ex*u+u/2)+'" y="'+((ey+1)*u+8)+'" font-size="5.5" text-anchor="middle" fill="#e4573d">도착 ★</text>';
  }
  if(path){
    var pts=[(sx*u+u/2)+","+(sy*u-2)];
    for(var i=0;i<path.length;i++){
      var px=path[i]%cols, py=(path[i]-px)/cols;
      pts.push((px*u+u/2)+","+(py*u+u/2));
    }
    pts.push((ex*u+u/2)+","+((ey+1)*u+2));
    s+='<polyline points="'+pts.join(" ")+'" fill="none" stroke="#e4573d" stroke-width="'+(opts.bold?3:2.4)+'" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>';
  }
  s+='<path d="'+seg.join("")+'" stroke="#2b3038" stroke-width="'+(opts.bold?2.6:1.7)+'" stroke-linecap="round" fill="none"/>';
  return s+'</svg>';
}

/* ---------- 원형 미로 SVG ---------- */
function circleSVG(g, open, path){
  var u=10, R=g.rings, rad=R*u, seg=[];
  function px(radius,t){ return (radius*Math.cos(t)).toFixed(2); }
  function py(radius,t){ return (radius*Math.sin(t)).toFixed(2); }
  function arc(radius,t1,t2){
    seg.push("M"+px(radius,t1)+" "+py(radius,t1)+"A"+radius+" "+radius+" 0 0 1 "+px(radius,t2)+" "+py(radius,t2));
  }
  function ray(t,r1,r2){
    seg.push("M"+px(r1,t)+" "+py(r1,t)+"L"+px(r2,t)+" "+py(r2,t));
  }
  var endTheta=0;
  for(var r=1;r<R;r++){
    var c=g.counts[r], step=2*Math.PI/c;
    for(var i=0;i<c;i++){
      var cell=g.id(r,i), t1=-Math.PI/2+i*step, t2=t1+step;
      var p = r===1 ? 0 : g.id(r-1, Math.floor(i*g.counts[r-1]/c));
      if(!open[ekey(cell,p)]) arc(r*u, t1, t2);
      if(c>1){
        var cw=g.id(r,(i+1)%c);
        if(!open[ekey(cell,cw)]) ray(t2, r*u, (r+1)*u);
      }
      if(r===R-1){
        if(cell!==g.end) arc(rad, t1, t2);
        else endTheta=(t1+t2)/2;
      }
    }
  }
  var m=6, extra=12;
  var s='<svg viewBox="'+(-(rad+m))+' '+(-(rad+m))+' '+(2*(rad+m))+' '+(2*(rad+m)+extra)+'" xmlns="http://www.w3.org/2000/svg">';
  s+='<text x="0" y="2" font-size="4.6" text-anchor="middle" fill="#2b3038">출발</text>';
  s+='<text x="'+px(rad+7,endTheta)+'" y="'+(+py(rad+7,endTheta)+2)+'" font-size="5.5" text-anchor="middle" fill="#e4573d">★</text>';
  if(path){
    var pts=["0,0"];
    for(var k=0;k<path.length;k++){
      var cid=path[k];
      if(cid===0){ pts.push("0,0"); continue; }
      var rr=1; while(rr+1<R && g.off[rr+1]<=cid) rr++;
      var ii=cid-g.off[rr], tm=-Math.PI/2+(ii+0.5)*2*Math.PI/g.counts[rr];
      pts.push(px((rr+0.5)*u,tm)+","+py((rr+0.5)*u,tm));
    }
    pts.push(px(rad+4,endTheta)+","+py(rad+4,endTheta));
    s+='<polyline points="'+pts.join(" ")+'" fill="none" stroke="#e4573d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>';
  }
  s+='<path d="'+seg.join("")+'" stroke="#2b3038" stroke-width="1.7" stroke-linecap="round" fill="none"/>';
  return s+'</svg>';
}
