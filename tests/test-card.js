/* 이름 카드(/card/) — 이름표 A4 인쇄 배선·수치 검사
   실행: node tests/test-card.js */
"use strict";
const fs=require("fs"), path=require("path");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"card/index.html"),"utf8");
let fails=0;
function ok(c,msg){ if(!c){ fails++; console.error("  ✗ "+msg); } }

/* 1) 배선 */
["btnSave","btnShare","btnLabel","labelSheet","cardCanvas","themeSeg"].forEach(id=>ok(html.includes('id="'+id+'"'),"id 누락: "+id));
ok(/track\("print_sheet",\{tool:"card-label"/.test(html),"print_sheet tool:card-label 배선");
ok(/track\("save_png",\{tool:"card"/.test(html),"save_png 배선 유지");
ok(html.includes('document.body.classList.add("plabel")'),"plabel 토글");
ok(html.includes('afterprint'),"afterprint 해제");
ok(html.includes("escHtml(nm)")&&html.includes("escHtml(sub)"),"이름·문구 이스케이프");

/* 2) 칸 수·본문 수치 일치 — rep(…,4)+rep(…,9)+rep(…,25)=38 */
ok(html.includes("true),4)")&&html.includes("false),9)")&&html.includes("false),25)"),"큰4(반이름)·중간9·작은25 생성");
ok(html.includes("38칸"),"본문 38칸 표기 (4+9+25="+(4+9+25)+")");
ok(4+9+25===38,"칸 수 합계 38");

/* 3) 시트 세로 범위 — A4 안쪽 277mm(여백 10mm) 이내 */
const sheetH = (42*2+2) + 4 + (27*3+2*2) + 4 + (15.5*5+2*4) + 1.5 + 3;
ok(sheetH<=277,"이름표 시트 세로 "+sheetH+"mm ≤ 277mm");

/* 4) SEO 반영 — title 불변 + description·FAQ에 이름표 */
ok(html.includes("<title>우리 아이 이름 한글 카드 만들기 — 이름 캘리그래피 이미지 무료 저장 | 글씨방</title>"),"title 불변");
ok(/name="description" content="[^"]*이름표/.test(html),"description에 이름표");
const lds=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
ok(lds.length===2,"JSON-LD 2블록");
let faqOk=false;
for(const m of lds){
  let obj; try{ obj=JSON.parse(m[1]); }catch(e){ ok(false,"JSON-LD 파싱 실패: "+e.message); continue; }
  if(obj["@type"]==="FAQPage") faqOk=obj.mainEntity.some(q=>q.name.includes("반 이름"));
}
ok(faqOk,"FAQ JSON-LD에 반 이름 문항");

/* 5) 홈 연결 */
const home=fs.readFileSync(path.join(root,"index.html"),"utf8");
ok(home.includes("어린이집 이름표"),"홈 이름표 칩");

if(fails){ console.error("test-card: "+fails+"건 실패"); process.exit(1); }
console.log("test-card: 통과 (이름표 38칸, 시트 "+sheetH+"mm)");
