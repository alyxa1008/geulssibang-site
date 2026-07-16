// 전 페이지 브라우저 스모크 테스트: node tools/smoke-test.js (저장소 루트에서)
// 필요: playwright + 시스템 크롬 (npm i playwright --no-save --no-package-lock)
// 검사 항목 — sitemap.xml의 모든 페이지에 대해:
//   ① HTTP 200 + <title> 존재  ② JS 예외(pageerror) 0건  ③ 콘솔 error 0건
//   ④ 딥링크 버튼(.gobtn[data-*], .gset 내부) 전부 #s= 해시 배선됨 (wireDeepLinks 동작 확인)
//   ⑤ 도구 페이지(.sheet-scale 존재 시) 시트가 실제로 렌더됨
// 외부 요청(GA·애드센스·폰트)은 빈 응답으로 대체해 네트워크 없이 돈다.
const { spawn } = require('child_process');
const fs = require('fs');
const { chromium } = require('playwright');

const PORT = 8931;

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return; } catch (e) {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('local server did not start');
}

(async () => {
  const paths = [...fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>https:\/\/geulssibang\.com([^<]*)<\/loc>/g)]
    .map(m => m[1] || '/');
  console.log(`pages: ${paths.length}`);

  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { stdio: 'ignore' });
  let failures = 0;
  try {
    await waitForServer(`http://127.0.0.1:${PORT}/`);
    const browser = await chromium.launch({ channel: 'chrome' });
    const ctx = await browser.newContext();
    // 외부 요청은 빈 응답으로 대체 (오프라인·무추적)
    await ctx.route('**/*', route => {
      const u = route.request().url();
      if (u.startsWith(`http://127.0.0.1:${PORT}`)) return route.continue();
      const type = route.request().resourceType();
      const body = '';
      const contentType = type === 'stylesheet' ? 'text/css' : type === 'script' ? 'application/javascript' : 'text/plain';
      return route.fulfill({ status: 200, contentType, body });
    });
    const page = await ctx.newPage();

    for (const p of paths) {
      const errs = [];
      const onPageError = e => errs.push(`pageerror: ${e.message}`);
      const onConsole = m => { if (m.type() === 'error') errs.push(`console: ${m.text()}`); };
      page.on('pageerror', onPageError);
      page.on('console', onConsole);

      const resp = await page.goto(`http://127.0.0.1:${PORT}${p}`, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(250);

      const checks = await page.evaluate(() => {
        const bad = [];
        if (!document.title.trim()) bad.push('빈 title');
        // 딥링크 배선: data-* gobtn과 .gset 내부 gobtn은 #s= 해시가 있어야 함
        document.querySelectorAll('.gobtn').forEach(b => {
          const isDeep = b.matches('[data-text],[data-topic],[data-quiz-dan]') || b.closest('.gset[data-title]');
          if (isDeep && !(b.getAttribute('href') || '').includes('#s=')) bad.push(`딥링크 미배선: ${b.textContent.trim().slice(0, 20)}`);
        });
        const sheet = document.querySelector('.sheet-scale');
        if (sheet && sheet.children.length === 0) bad.push('시트 미렌더');
        return bad;
      });

      page.off('pageerror', onPageError);
      page.off('console', onConsole);

      const problems = [
        ...(!resp || !resp.ok() ? [`HTTP ${resp && resp.status()}`] : []),
        ...errs, ...checks,
      ];
      if (problems.length) { failures++; console.log(`❌ ${p}\n   ${problems.join('\n   ')}`); }
      else console.log(`✅ ${p}`);
    }
    await browser.close();
  } finally {
    server.kill();
  }
  console.log(failures ? `\n🔴 실패 ${failures}건` : '\n🟢 전체 통과');
  process.exit(failures ? 1 : 0);
})();
