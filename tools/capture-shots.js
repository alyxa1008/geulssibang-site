// 도구 페이지 스크린샷 재생성: node tools/capture-shots.js (저장소 루트에서, playwright+크롬 필요)
// 결과 PNG를 sips로 리사이즈해 assets/shots/*.jpg 교체. 배포 제외 폴더.
const {chromium}=require('playwright');
const b64=s=>Buffer.from(s).toString('base64');
(async()=>{
const br=await chromium.launch({channel:'chrome'});
const ctx=await br.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:2});
const pg=await ctx.newPage();
async function clean(){ await pg.evaluate(()=>{const t=document.getElementById('toast'); if(t)t.remove();}); }
async function sheetShot(url,out){
  await pg.goto(url,{waitUntil:'networkidle'});
  await pg.waitForTimeout(2500); await clean();
  await pg.locator('.sheet-scale').first().screenshot({path:out});
  console.log('ok',out);
}
await sheetShot('https://geulssibang.com/hangul/','shots/sheet-hangul.png');
await sheetShot('https://geulssibang.com/badaseugi/','shots/sheet-badaseugi.png');
await sheetShot('https://geulssibang.com/math/','shots/sheet-math.png');
await sheetShot('https://geulssibang.com/maze/#s='+encodeURIComponent(b64('["mid",1,1,"",777,"heart","rabbit"]')),'shots/sheet-maze.png');
await sheetShot('https://geulssibang.com/plan/','shots/sheet-plan.png');
// 구구단: 시험 진행 화면 — 문제 영역만 잘라서
await pg.goto('https://geulssibang.com/gugudan/#s='+encodeURIComponent(b64('[1,"36",10,"mix","choice",5,0]')),{waitUntil:'networkidle'});
await pg.waitForTimeout(1500); await clean();
await pg.click('#btnStart');
await pg.waitForTimeout(1300);
const box=await pg.locator('#quizBody').boundingBox();
const m=46;
await pg.screenshot({path:'shots/quiz-gugudan.png', clip:{x:box.x-m, y:box.y-m, width:box.width+2*m, height:box.height+2*m}});
console.log('ok quiz', JSON.stringify(box));
await br.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
