const fs=require("fs");
eval(fs.readFileSync("maze/maze-gen.js","utf8").replace(/"use strict";/,""));
eval(fs.readFileSync("maze/maze-word-gen.js","utf8").replace(/"use strict";/,""));

let fail=0;
function ok(name,cond){ console.log((cond?"✅":"❌")+" "+name); if(!cond)fail++; }

/* ---- 핵심 성질: 정답 길을 따라가면 글자가 낱말 순서로 모인다 ---- */
function collectAlongPath(m){
  const at={};
  m.labels.forEach(L=>{ at[L.c]=L.ch; });
  return m.path.map(c=>at[c]).filter(Boolean).join("");
}
["사과","코끼리","비행기","아이스크림","호랑나비꽃"].forEach(w=>{
  const m=buildWordMaze(w,"easy",12345);
  ok(`쉬움 "${w}": 길에서 모은 글자 = 낱말`, m && collectAlongPath(m)===w);
});
["강아지","자동차"].forEach(w=>{
  const m=buildWordMaze(w,"mid",777);
  ok(`보통 "${w}": 길에서 모은 글자 = 낱말`, m && collectAlongPath(m)===w);
});

/* ---- 함정 글자: 길 밖에만 있고, 낱말에 든 글자는 안 쓴다 ---- */
{
  const m=buildWordMaze("코끼리","easy",42);
  const onPath=new Set(m.path);
  const decoys=m.labels.slice(3);
  ok("함정 글자 6개 (낱말×2)", decoys.length===6);
  ok("함정 글자는 전부 길 밖", decoys.every(L=>!onPath.has(L.c)));
  ok("함정에 낱말 글자 없음", decoys.every(L=>"코끼리".indexOf(L.ch)<0));
  ok("함정 칸 중복 없음", new Set(decoys.map(L=>L.c)).size===decoys.length);
  ok("글자 칸은 출발·도착 아님", m.labels.every(L=>L.c!==m.g.start && L.c!==m.g.end));
}

/* ---- 재현성: 같은 시드 → 같은 배치 ---- */
{
  const a=buildWordMaze("바나나","easy",999), b=buildWordMaze("바나나","easy",999);
  ok("같은 시드 → 같은 미로·배치", JSON.stringify(a.labels)===JSON.stringify(b.labels));
  const c=buildWordMaze("바나나","easy",1000);
  ok("다른 시드 → 다른 배치", JSON.stringify(a.labels)!==JSON.stringify(c.labels));
}

/* ---- 입력 검증 ---- */
ok("1글자 → null", buildWordMaze("물","easy",1)===null);
ok("7글자 → null", buildWordMaze("가나다라마바사","easy",1)===null);
ok("공백 섞인 낱말 정리", collectAlongPath(buildWordMaze("사 과","easy",5))==="사과");

/* ---- SVG: 글자 포함 + 유효 ---- */
{
  const m=buildWordMaze("포도","easy",7);
  const svg=gridSVG(m.g, m.open, null, {labels:m.labels, bold:true});
  ok("SVG에 낱말 글자 포함", svg.includes(">포</text>") && svg.includes(">도</text>"));
  ok("SVG 유효", svg.startsWith("<svg") && svg.endsWith("</svg>") && !svg.includes("NaN") && !svg.includes("undefined"));
  const ans=gridSVG(m.g, m.open, m.path, {labels:m.labels, bold:true});
  ok("정답 SVG에 경로선 포함", ans.includes("<polyline"));
}

/* ---- labels 없으면 기존 gridSVG 출력 불변 (기존 미로 재현 보증) ---- */
{
  const g=buildGrid(12,15,null), open=carve(g,31337), path=solve(g,open);
  const plain=gridSVG(g,open,path);
  ok("labels 미사용 시 <text> 추가 없음 (출발·도착 표기 2개뿐)", (plain.match(/<text/g)||[]).length===2);
}

console.log(fail? "🔴 "+fail+"건 실패" : "🟢 전체 통과");
process.exit(fail?1:0);
