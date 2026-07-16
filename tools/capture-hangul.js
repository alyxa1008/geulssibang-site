// 한글 도구 리팩토링 전/후 출력 비교용 — 8개 상태의 #sheets innerHTML 캡처
// 사용: node capture-hangul.js <출력파일.json>
const { chromium } = require('playwright');
const fs = require('fs');

// [text, mode, font, size, emptyCells, traceRows, emptyRows, guide, title, fade, ink]
const STATES = [
  ["가나다라마바사", "char", "f-gowun", "mid", 3, 2, 1, 1, "", "mid", "gray"],          // 기본
  ["가 가나\n다", "char", "f-gaegu", "big", 0, 2, 1, 1, "중복·공백", "light", "blue"],   // 중복 제거·빈칸 0
  ["김하준", "line", "f-pen", "mid", 3, 3, 2, 1, "이름 연습", "dark", "red"],            // 짧은 이름 반복 채움
  ["토끼가 깡충깡충 뛰어요 우리집 강아지는 정말 귀여워요", "line", "f-batang", "small", 3, 2, 1, 0, "", "mid", "gray"], // 줄바꿈 배분
  ["가나다라마바사아자차카타파하가나다", "line", "f-gowun", "mid", 3, 1, 0, 1, "긴 단어", "mid", "gray"],  // 칸수 초과 단어 분할
  ["가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호", "char", "f-himelody", "small", 2, 2, 1, 1, "여러 장", "mid", "gray"], // 다중 페이지
  ["여름방학 숙제 일기 쓰기 그림 그리기 물놀이 준비물 챙기기 아침 운동 저녁 독서", "line", "f-gamja", "big", 3, 2, 2, 1, "방학", "dark", "gray"], // line 다중 페이지
  ["", "char", "f-gowun", "mid", 3, 2, 1, 1, "", "mid", "gray"],                        // 빈 입력 → 빈 페이지
];

(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage();
  const results = [];
  for (const st of STATES) {
    const hash = encodeURIComponent(Buffer.from(JSON.stringify(st)).toString('base64'));
    await p.goto('about:blank');
    await p.goto('file://' + (process.env.BASE || '/Users/simjaehun/Documents/geulssibang') + '/hangul/index.html#s=' + hash);
    await p.waitForTimeout(350);
    const html = await p.evaluate(() => document.getElementById('sheets').innerHTML);
    const pageInfo = await p.evaluate(() => document.getElementById('pageInfo').textContent);
    results.push({ state: st, pageInfo, html });
  }
  await b.close();
  fs.writeFileSync(out, JSON.stringify(results));
  console.log('captured', results.length, '→', out, '| pages:', results.map(r => r.pageInfo).join(', '));
})();
