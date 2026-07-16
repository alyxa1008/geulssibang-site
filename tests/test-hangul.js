const fs=require("fs");
eval(fs.readFileSync("hangul/hangul-gen.js","utf8").replace(/"use strict";/,""));

let fail=0;
function ok(name,cond){ console.log((cond?"✅":"❌")+" "+name); if(!cond)fail++; }

/* ---- traceColor: 색×농도 매핑과 폴백 ---- */
ok("traceColor 회색 보통", traceColor("gray","mid")==="#c3c8ce");
ok("traceColor 파랑 진하게", traceColor("blue","dark")==="#8fb1dd");
ok("traceColor 없는 색 → 회색 폴백", traceColor("green","mid")==="#c3c8ce");
ok("traceColor 없는 농도 → 보통 폴백", traceColor("red","x")==="#eebfbf");

/* ---- uniqueChars: 공백 제거·중복 제거·입력 순서 유지 ---- */
ok("uniqueChars 중복·공백", uniqueChars("가 가나\n다가").join("")==="가나다");

/* ---- char 모드: 줄 구조 ---- */
(function(){
  const rows=buildRowsChar("가나다라마바사","mid",3), cfg=SIZES.mid;
  ok("char 전체 줄 수 = 페이지 배수", rows.length%cfg.rows===0);
  ok("char 모든 줄 폭 = cols", rows.every(r=>r.length===cfg.cols));
  const first=rows[0];
  ok("char 첫 칸은 본보기", first[0].kind==="solid" && first[0].ch==="가");
  ok("char 따라쓰기 칸 수 = cols-1-빈칸", first.filter(c=>c.kind==="trace").length===cfg.cols-1-3);
  ok("char 빈칸 수 = 설정값", first.filter(c=>c.kind==="empty").length===3);
})();
(function(){
  const rows=buildRowsChar("가","big",7), cfg=SIZES.big; // cols 8: 7칸 비우면 trace 최소 1 보장
  ok("char 따라쓰기 최소 1칸 보장", rows[0].filter(c=>c.kind==="trace").length>=1);
})();
(function(){
  const text="가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호"; // 42자
  const rows=buildRowsChar(text,"small",2), cfg=SIZES.small;
  ok("char 다중 페이지 줄 수 = 배수", rows.length%cfg.rows===0 && rows.length>cfg.rows);
  const perChar={}; rows.forEach(r=>{ if(r[0].kind==="solid") perChar[r[0].ch]=(perChar[r[0].ch]||0)+1; });
  const counts=[...new Set(Object.values(perChar))];
  ok("char 글자별 줄 수 균등 배분", counts.length===1);
})();
(function(){
  const rows=buildRowsChar("","mid",3), cfg=SIZES.mid;
  ok("char 빈 입력 → 빈 페이지 1장", rows.length===cfg.rows && rows.every(r=>r.every(c=>c.kind==="empty")));
})();

/* ---- line 모드: 블록 구조와 반복 채움 ---- */
(function(){
  const rows=buildRowsLine("김하준","mid",2,1), cfg=SIZES.mid;
  ok("line 전체 줄 수 = 페이지 배수", rows.length%cfg.rows===0);
  const solid=rows[0].filter(c=>c.kind==="solid").map(c=>c.ch).join("");
  ok("line 짧은 이름 반복 채움 (김하준 김하준)", solid==="김하준김하준");
  ok("line 반복 사이 gap 칸", rows[0].some(c=>c.kind==="gap"));
  ok("line 본보기(1)+따라쓰기(2)+혼자(1) 블록", rows[1].every(c=>c.kind==="trace"||c.kind==="gap")
      && rows[2].every(c=>c.kind==="trace"||c.kind==="gap")
      && rows[3].every(c=>c.kind==="empty"||c.kind==="gap"));
})();
(function(){
  const rows=buildRowsLine("토끼가 깡충깡충 뛰어요","big",1,0), cfg=SIZES.big; // cols 8
  const line1=rows[0].map(c=>c.ch).join("");
  ok("line 단어가 줄 끝에서 안 잘림", line1==="토끼가 깡충깡충" || !line1.includes("깡")
     ? line1==="토끼가 깡충깡충" : false);
  ok("line 줄 폭이 cols 이하", rows.every(r=>r.length<=cfg.cols));
})();
(function(){
  const long="가나다라마바사아자차카타파하가나다"; // 17자 > mid cols 10
  const rows=buildRowsLine(long,"mid",1,0);
  const s1=rows[0].filter(c=>c.kind==="solid").length;
  ok("line 칸수 초과 단어는 분할", s1===10 && rows[1].filter(c=>c.kind==="solid").length===7);
})();
(function(){
  const rows=buildRowsLine("  \n ","mid",2,1), cfg=SIZES.mid;
  ok("line 공백만 입력 → 빈 페이지", rows.length===cfg.rows && rows.every(r=>r.every(c=>c.kind==="empty")));
})();

/* ---- paginate ---- */
(function(){
  const cfg=SIZES.small;
  const rows=buildRowsChar("가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호","small",2);
  const pages=paginate(rows,cfg);
  ok("paginate 모든 페이지가 꽉 참", pages.every(p=>p.length===cfg.rows));
  ok("paginate 줄 유실 없음", pages.reduce((n,p)=>n+p.length,0)===rows.length);
})();

console.log(fail? "\n🔴 실패 "+fail+"건" : "\n🟢 전체 통과");
process.exit(fail?1:0);
