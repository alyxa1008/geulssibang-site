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

/* ---- 숫자 미로 ---- */
function collectTokens(m){
  const at={};
  m.labels.forEach(L=>{ at[L.c]=L.ch; });
  return m.path.map(c=>at[c]).filter(Boolean);
}
{
  const m=buildNumberMaze("c10",0,"easy",42);
  ok("수 세기 1~10: 길에서 만나는 수 = 1..10", JSON.stringify(collectTokens(m))===JSON.stringify(["1","2","3","4","5","6","7","8","9","10"]));
  const onPath=new Set(m.path);
  const decoys=m.labels.slice(10);
  ok("수 세기 함정 10개, 전부 길 밖·11 이상", decoys.length===10 && decoys.every(L=>!onPath.has(L.c) && +L.ch>=11));
}
{
  const m=buildNumberMaze("c20",0,"easy",7);
  ok("1~20은 자동으로 넓은 격자(12×15)", m && m.g.cols===12 && m.g.rows===15);
  ok("1~20 순서 정확", collectTokens(m).join(",")==="1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20");
}
{
  const m=buildNumberMaze("skip",7,"mid",99);
  ok("7단 뛰어세기: 7,14,…,63", collectTokens(m).join(",")==="7,14,21,28,35,42,49,56,63");
  const decoys=m.labels.slice(9);
  ok("뛰어세기 함정은 7의 배수가 아님", decoys.every(L=>(+L.ch)%7!==0));
}
ok("잘못된 단 → null", buildNumberMaze("skip",1,"easy",1)===null && buildNumberMaze("skip",10,"easy",1)===null);
{
  const a=buildNumberMaze("skip",3,"easy",5), b=buildNumberMaze("skip",3,"easy",5);
  ok("숫자 미로 같은 시드 재현", JSON.stringify(a.labels)===JSON.stringify(b.labels));
  const svg=gridSVG(a.g,a.open,null,{labels:a.labels,bold:true});
  ok("두 자리 수는 작은 글씨(4.6)", svg.includes('font-size="4.6"') && svg.includes(">12<"));
}

/* ---- labels 없으면 기존 gridSVG 출력 불변 (기존 미로 재현 보증) ---- */
{
  const g=buildGrid(12,15,null), open=carve(g,31337), path=solve(g,open);
  const plain=gridSVG(g,open,path);
  ok("labels 미사용 시 <text> 추가 없음 (출발·도착 표기 2개뿐)", (plain.match(/<text/g)||[]).length===2);
}

console.log(fail? "🔴 "+fail+"건 실패" : "🟢 전체 통과");
process.exit(fail?1:0);
