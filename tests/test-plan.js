/* 생활계획표 순수 모듈(plan/plan-gen.js) — 시간 계산·부채꼴·SVG 결정성·이스케이프
   실행: node tests/test-plan.js */
"use strict";
const vm=require("vm");
const U=require("./_util");
const ok=U.makeOk("test-plan");
const ctx={ escHtml:s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;") };
vm.createContext(ctx);
vm.runInContext(U.read("plan/plan-gen.js"),ctx);
const { fmt, span, polar, segPath, buildSVG, THEMES, PALETTE, MAXROWS }=ctx;

/* 1) 시간 칸(30분 단위, 하루 48칸) */
ok(fmt(0)==="00:00"&&fmt(1)==="00:30"&&fmt(13)==="06:30"&&fmt(47)==="23:30","fmt 칸→시각");
ok(span(2,6)===4&&span(46,2)===4&&span(5,5)===0,"span 자정 넘김·0 처리");
const p=polar(500,690,390,0); ok(Math.abs(p[0]-500)<1e-9&&Math.abs(p[1]-300)<1e-9,"polar 0칸 = 12시 방향");
ok(segPath(500,690,390,5,5)===""&&/^M500 690 L.* A390 390 0 0 1 .* Z$/.test(segPath(500,690,390,0,4)),"segPath 빈 조각·작은 호");
ok(/ A390 390 0 1 1 /.test(segPath(500,690,390,0,30)),"12시간 초과 조각은 큰 호");

/* 2) 테마·팔레트 */
ok(Object.keys(THEMES).length===5&&PALETTE.length===10&&MAXROWS===10,"테마 5·팔레트 10·최대 10줄");
Object.keys(THEMES).forEach(k=>ok(THEMES[k].pal.length===10&&typeof THEMES[k].deco()==="string","테마 "+k+" 구성"));

/* 3) SVG — 결정성·내용·이스케이프 */
const st={ title:"나의 계획표 <b>", items:[[14,16,"아침 & 세수"],[16,24,"공부"],[44,14,"잠"]], theme:"sea" };
const a=buildSVG(st), b=buildSVG(JSON.parse(JSON.stringify(st)));
ok(a===b,"같은 상태 = 같은 SVG");
ok(a.indexOf("&lt;b&gt;")>=0&&a.indexOf("<b>")<0&&a.indexOf("아침 &amp; 세수")>=0,"제목·활동명 이스케이프");
ok((a.match(/<path d="M500 690/g)||[]).length===3,"조각 3개");
ok((a.match(/font-size="24" fill="#5b6470">\d+<\/text>/g)||[]).length===24,"시간 눈금 0~23");
ok(a.indexOf('fill="'+THEMES.sea.bg+'"')>=0&&a.indexOf("#ffd166")>=0,"바다 테마 배경·해 장식");
ok(buildSVG({title:"",items:[],theme:"없는테마"}).indexOf("나의 여름방학 생활계획표")>=0,"빈 제목·모르는 테마 폴백");
ok(buildSVG({title:"가".repeat(40),items:[],theme:"basic"}).indexOf('font-size="20"')>=0,"긴 제목 글자 축소");

ok.done();
