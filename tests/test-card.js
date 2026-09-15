/* 이름 카드(/card/) — 이름표 A4 인쇄 배선·수치 검사
   실행: node tests/test-card.js */
"use strict";
const U=require("./_util");
const ok=U.makeOk("test-card");
const html=U.read("card/index.html");

/* 1) 배선 */
["btnSave","btnShare","btnLabel","labelSheet","cardCanvas","themeSeg"].forEach(id=>ok(html.includes('id="'+id+'"'),"id 누락: "+id));
ok(/printWith\("plabel", \{tool:"card-label"/.test(html),"이름표 인쇄 = printWith(plabel) + GA card-label");
ok(/track\("save_png",\{tool:"card"/.test(html),"save_png 배선 유지");
ok(html.includes("escHtml(nm)")&&html.includes("escHtml(sub)"),"이름·문구 이스케이프");
ok(!/function escHtml\(/.test(html),"escHtml은 common.js 것만 사용");

/* 2) 칸 수·본문 수치 일치 — rep(…,4)+rep(…,9)+rep(…,25)=38 */
ok(html.includes("true),4)")&&html.includes("false),9)")&&html.includes("false),25)"),"큰4(반이름)·중간9·작은25 생성");
ok(html.includes("38칸"),"본문 38칸 표기 (4+9+25="+(4+9+25)+")");

/* 3) 시트 세로 범위 — A4 안쪽 277mm(여백 10mm) 이내 */
const sheetH = (42*2+2) + 4 + (27*3+2*2) + 4 + (15.5*5+2*4) + 1.5 + 3;
ok(sheetH<=277,"이름표 시트 세로 "+sheetH+"mm ≤ 277mm");

/* 4) SEO 반영 — title 불변 + description·FAQ에 이름표 */
ok(html.includes("<title>우리 아이 이름 한글 카드 만들기 — 이름 캘리그래피 이미지 무료 저장 | 글씨방</title>"),"title 불변");
ok(/name="description" content="[^"]*이름표/.test(html),"description에 이름표");
const ld=U.ldJson(html);
ok(ld.length===2,"JSON-LD 2블록");
ok(ld.some(o=>o["@type"]==="FAQPage"&&o.mainEntity.some(q=>q.name.includes("반 이름"))),"FAQ JSON-LD에 반 이름 문항");

/* 5) 홈 연결 */
ok(U.read("index.html").includes("어린이집 이름표"),"홈 이름표 칩");
ok.done("이름표 38칸, 시트 "+sheetH+"mm");
