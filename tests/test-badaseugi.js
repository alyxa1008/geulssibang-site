/* 받아쓰기 순수 모듈(badaseugi/badaseugi-gen.js) — 낱말 파싱·페이지 배분·서수·클립 판정
   실행: node tests/test-badaseugi.js */
"use strict";
const vm=require("vm");
const U=require("./_util");
const ok=U.makeOk("test-badaseugi");
const ctx={}; vm.createContext(ctx);
vm.runInContext(U.read("badaseugi/voice/manifest.js"),ctx);
vm.runInContext(U.read("badaseugi/badaseugi-gen.js"),ctx);
const { parseWords, paginateExam, ordinalKo, allClipsReady, clipId, MAXQ, PER_PAGE }=ctx;

/* 1) 낱말 파싱 — 공백 정리·빈 줄 제거·최대 20개 */
ok(JSON.stringify(parseWords(" 나무 \r\n\n바다\n  \n하늘 높이 "))==='["나무","바다","하늘 높이"]',"파싱: 트림·빈 줄 제거·CRLF");
ok(parseWords(Array.from({length:30},(_,i)=>"w"+i).join("\n")).length===MAXQ&&MAXQ===20,"최대 20개");
ok(parseWords("").length===0,"빈 입력 → 0개");

/* 2) 페이지 배분 — 장당 10 이하, 마지막 장에 한두 줄만 남지 않게 균등 */
const pg=n=>paginateExam(n);
ok(PER_PAGE===10,"PER_PAGE 10");
ok(pg(0).qPages===1&&pg(1).qPages===1&&pg(10).qPages===1&&pg(10).perPage===10,"0·1·10문제 → 1장");
ok(pg(11).qPages===2&&pg(11).perPage===6,"11문제 → 2장 6+5");
ok(pg(15).qPages===2&&pg(15).perPage===8,"15문제 → 2장 8+7");
ok(pg(20).qPages===2&&pg(20).perPage===10,"20문제 → 2장 10+10");
for(let n=1;n<=20;n++){ const p=pg(n); ok(p.perPage<=PER_PAGE&&p.perPage*p.qPages>=n&&p.perPage*(p.qPages-1)<n,"배분 불변식 n="+n); }

/* 3) 서수 읽기 — "1번"이 "한 번"으로 읽히는 문제 회피 */
ok(ordinalKo(1)==="첫 번째"&&ordinalKo(2)==="두 번째"&&ordinalKo(10)==="열 번째"&&ordinalKo(20)==="스무 번째","서수 1·2·10·20");
ok(ordinalKo(21)==="21 번째","21 이상은 숫자 폴백");

/* 4) 클립 판정 — 급수표 낱말은 전부 파일, 모르는 낱말 하나라도 섞이면 기기 음성 */
const w11=U.gsetWords(U.read("badaseugi/geupsu/1-1/index.html"))[0].w;
ok(allClipsReady(w11)===true,"1학년 1학기 1급 10낱말 전부 클립 있음");
ok(allClipsReady(w11.concat(["없는낱말ㅋ"]))===false,"모르는 낱말 섞이면 false");
ok(allClipsReady([])===false,"빈 목록은 false");
ok(typeof clipId(w11[0])==="string"&&clipId("없는낱말ㅋ")===null,"clipId 있음/없음");

ok.done("급수표 1급 "+w11.length+"낱말 클립 확인");
