const fs=require("fs");
eval(fs.readFileSync("maze/maze-gen.js","utf8").replace(/"use strict";/,""));

let fail=0;
function ok(name,cond){ console.log((cond?"✅":"❌")+" "+name); if(!cond)fail++; }

/* ---- 기존 알고리즘 재현 검증 (구 공유링크 하위호환) ---- */
const OPP=[2,3,0,1];
function oldGenMaze(seed, cols, rows){
  var rnd=mulberry32(seed), n=cols*rows;
  var W=[], visited=[];
  for(var i=0;i<n;i++){ W.push(15); visited.push(false); }
  var stack=[0]; visited[0]=true;
  while(stack.length){
    var cur=stack[stack.length-1], x=cur%cols, y=(cur-x)/cols, dirs=[];
    for(var d=0;d<4;d++){
      var nx=x+DX[d], ny=y+DY[d];
      if(nx>=0&&nx<cols&&ny>=0&&ny<rows&&!visited[ny*cols+nx]) dirs.push(d);
    }
    if(!dirs.length){ stack.pop(); continue; }
    var pick=dirs[Math.floor(rnd()*dirs.length)];
    var nxt=(y+DY[pick])*cols+(x+DX[pick]);
    W[cur]&=~(1<<pick); W[nxt]&=~(1<<OPP[pick]);
    visited[nxt]=true; stack.push(nxt);
  }
  return W;
}
function sameAsOld(seed, cols, rows){
  const W=oldGenMaze(seed,cols,rows);
  const g=buildGrid(cols,rows,null), open=carve(g,seed);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const c=y*cols+x;
    if(x<cols-1){ // 오른쪽 벽: 비트2 닫힘 == open 없음
      const o=!!open[ekey(c,c+1)], oldOpen=!(W[c]&2);
      if(o!==oldOpen) return false;
    }
    if(y<rows-1){
      const o=!!open[ekey(c,c+cols)], oldOpen=!(W[c]&4);
      if(o!==oldOpen) return false;
    }
  }
  return true;
}
ok("구 알고리즘과 동일 (12×15, 시드 3종)", [7,12345678,99999].every(s=>sameAsOld(s,12,15)));
ok("구 알고리즘과 동일 (17×21)", sameAsOld(424242,17,21));

/* ---- 경로 검증 헬퍼 ---- */
function validPath(g, open){
  const path=solve(g, open);
  if(path[0]!==g.start||path[path.length-1]!==g.end) return false;
  for(let i=1;i<path.length;i++){
    if(!g.adj[path[i-1]].includes(path[i])) return false;
    if(!open[ekey(path[i-1],path[i])]) return false;
  }
  return path.length;
}

/* ---- 사각 전체 레벨 ---- */
[[6,7],[8,10],[12,15],[17,21]].forEach(([c,r])=>{
  const g=buildGrid(c,r,null);
  ok(`네모 ${c}×${r}: 경로 존재·유효`, [1,2,3].every(s=>validPath(g,carve(g,s*1111))>0));
});

/* ---- 마스크 ASCII 미리보기 + 검증 ---- */
function preview(name, g){
  console.log("--- "+name+" ---");
  for(let y=0;y<g.rows;y++){
    let line="";
    for(let x=0;x<g.cols;x++) line+=g.alive[y*g.cols+x]?"█":"·";
    console.log(line);
  }
  const aliveN=g.alive.filter(Boolean).length;
  console.log("칸수:", aliveN, "start:", g.start, "end:", g.end);
  return aliveN;
}
const HEART=[[13,12],[17,16],[22,20]], STAR=[[15,15],[19,19],[25,25]];
HEART.forEach(([c,r],i)=>{
  const g=buildGrid(c,r,heartMask(c,r));
  const n=preview("하트 "+c+"×"+r, g);
  ok(`하트 ${c}×${r}: 칸수 충분+경로 유효`, n>c*r*0.4 && [5,77,901].every(s=>validPath(g,carve(g,s))>0));
});
STAR.forEach(([c,r],i)=>{
  const g=buildGrid(c,r,starMask(c,r));
  const n=preview("별 "+c+"×"+r, g);
  ok(`별 ${c}×${r}: 칸수 충분+경로 유효`, n>c*r*0.22 && [5,77,901].every(s=>validPath(g,carve(g,s))>0));
});

/* ---- 원형 ---- */
[5,7,9].forEach(R=>{
  const g=buildCircle(R);
  console.log("원형 R="+R+" counts:", g.counts.join(","), "총", g.n, "칸");
  ok(`원형 ${R}고리: 경로 유효 (시드 3종)`, [11,222,3333].every(s=>validPath(g,carve(g,s))>0));
  // 모든 칸 방문(신장트리) → 열린 간선 수 = n-1
  const open=carve(g,42);
  ok(`원형 ${R}고리: 신장 트리 (간선 ${g.n-1})`, Object.keys(open).length===g.n-1);
});

/* ---- SVG 산출 검사 ---- */
function svgOk(s){ return s.indexOf("NaN")<0 && s.indexOf("undefined")<0 && s.startsWith("<svg") && s.endsWith("</svg>"); }
{
  const g=buildGrid(6,7,null), open=carve(g,7);
  ok("유아 SVG (아이콘·경로)", svgOk(gridSVG(g,open,solve(g,open),{icons:{s:"🐰",e:"🥕"},bold:true})));
  // 테마 아이콘은 굵기와 독립 — 일반 난이도에 아이콘만 붙이면 벽 굵기는 그대로 1.7
  const gm=buildGrid(12,15,null), om=carve(gm,7);
  const deco=gridSVG(gm,om,null,{icons:{s:"🦖",e:"🍖"}});
  ok("일반 난이도 + 테마 아이콘 (얇은 벽 유지)", svgOk(deco) && deco.includes("🦖") && deco.includes('stroke-width="1.7"'));
  ok("유아 bold 벽 굵기 2.6 유지", gridSVG(g,open,null,{icons:{s:"🐰",e:"🥕"},bold:true}).includes('stroke-width="2.6"'));
  const gh=buildGrid(16,15,heartMask(16,15)), oh=carve(gh,7);
  ok("하트 SVG", svgOk(gridSVG(gh,oh,solve(gh,oh))));
  const gc=buildCircle(7), oc=carve(gc,7);
  ok("원형 SVG (경로)", svgOk(circleSVG(gc,oc,solve(gc,oc))));
  ok("원형 SVG (문제지)", svgOk(circleSVG(gc,oc,null)));
}

console.log(fail? "🔴 "+fail+"건 실패" : "🟢 전체 통과");
process.exit(fail?1:0);
