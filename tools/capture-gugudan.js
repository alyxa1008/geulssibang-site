// 리팩토링 전/후 출력 비교 템플릿 (구구단) — Math.random 시드 고정 + 외부요청 차단(중요: gtag가 난수를 소비함)
// 사용: BASE=<트리 경로> node tools/capture-gugudan.js <출력파일.json>  (STUDY.md 3번 참고)
const { chromium } = require('playwright');
const fs = require('fs');

// [1, 단문자열, 문제수, 순서, 답방식, 생각시간, 소리]
const STATES = [
  [1, "25", 10, "mix", "speak", 5, 0],
  [1, "23456789", 20, "mix", "choice", 5, 0],
  [1, "7", 0, "seq", "type", 5, 0],
];

(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ channel: 'chrome' });
  const BASE = process.env.BASE;
  const ctx = await b.newContext();
  // 외부 요청 차단 — gtag 등이 Math.random을 소비해 셔플이 흔들리는 것 방지
  await ctx.route('**/*', r => r.request().url().startsWith('file://') ? r.continue() : r.fulfill({status:200, contentType:'application/javascript', body:''}));
  // Math.random 결정적 고정 (모든 페이지 로드 전에 주입)
  await ctx.addInitScript(() => {
    let seed = 12345;
    Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x80000000; };
  });
  const p = await ctx.newPage();
  const results = [];

  for (const st of STATES) {
    const hash = encodeURIComponent(Buffer.from(JSON.stringify(st)).toString('base64'));
    await p.goto('about:blank');
    await p.goto('file://' + BASE + '/gugudan/index.html#s=' + hash);
    await p.waitForTimeout(300);
    await p.click('#btnStart');
    await p.waitForTimeout(300);
    const firstQ = await p.evaluate(() => document.getElementById('quizBody').innerHTML);
    results.push({ state: st, firstQ });
  }

  // 고르기 모드 완주 → 결과 화면 (문제 배열·콤보·채점·결과 HTML까지 결정적)
  {
    const st = [1, "234", 10, "mix", "choice", 5, 0];
    const hash = encodeURIComponent(Buffer.from(JSON.stringify(st)).toString('base64'));
    await p.goto('about:blank');
    await p.goto('file://' + BASE + '/gugudan/index.html#s=' + hash);
    await p.waitForTimeout(300);
    await p.click('#btnStart');
    for (let i = 0; i < 10; i++) {
      await p.waitForTimeout(350);
      // 7문제는 정답, 3문제(3·6·9번째)는 오답을 눌러 채점·약한단 분기까지 태운다
      const clicked = await p.evaluate((qi) => {
        const btns = [...document.querySelectorAll('#choices button')];
        if (!btns.length) return false;
        const ansBtn = btns.find(x => x.classList.length === 0 || true); // placeholder
        return true;
      }, i);
      await p.evaluate((wrongTurn) => {
        const q = quiz.qs[quiz.idx];
        const btns = [...document.querySelectorAll('#choices button')];
        const target = wrongTurn ? btns.find(x => +x.dataset.v !== q.ans) : btns.find(x => +x.dataset.v === q.ans);
        target.click();
      }, [2, 5, 8].includes(i));
      await p.waitForTimeout(1700);
    }
    await p.waitForTimeout(500);
    const finalHTML = await p.evaluate(() => document.getElementById('quizBody').innerHTML);
    const resultsArr = await p.evaluate(() => JSON.stringify(quiz.results));
    results.push({ state: st, finalHTML, resultsArr });
  }

  await b.close();
  fs.writeFileSync(out, JSON.stringify(results));
  console.log('captured', results.length, '→', out);
})();
