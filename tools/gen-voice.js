// 받아쓰기 자연 목소리 클립 생성기 (Cloud TTS, ko-KR-Chirp3-HD-Sulafat)
// 실행: GKEY=<Cloud TTS API 키> node tools/gen-voice.js   (저장소 루트에서)
//
// 하는 일: 급수표 5페이지·맞춤법의 .gset li + 받아쓰기 내장 프리셋 + 번호(서수 1~20)
//   + 미리듣기 인사말을 모아, badaseugi/voice/에 없는 것만 mp3로 생성하고
//   manifest.js를 다시 쓴다. 이미 있는 클립은 건드리지 않는다(목소리 일관성).
// 언제 쓰나: 급수표·프리셋에 단어를 추가·수정했을 때. 끝나면
//   node tests/test-badaseugi-voice.js 로 커버리지 확인.
// 키: 구글 클라우드 콘솔 → 사용자 인증 정보 → API 키(Cloud Text-to-Speech 제한).
//   월 100만 자 무료 — 전체 재생성해도 3천 자 미만이라 비용 0원.
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const KEY = process.env.GKEY;
if (!KEY) { console.error("GKEY 환경변수에 Cloud TTS API 키를 넣어 실행하세요"); process.exit(1); }
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "badaseugi/voice");
const VOICE = "ko-KR-Chirp3-HD-Sulafat";
const id = t => crypto.createHash("sha1").update(t, "utf8").digest("hex").slice(0, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---- 생성 대상 수집 (tests/test-badaseugi-voice.js 커버리지와 같은 규칙) ---- */
const set = new Set();
["badaseugi/geupsu/1-1", "badaseugi/geupsu/1-2", "badaseugi/geupsu/2-1",
 "badaseugi/geupsu/2-2", "badaseugi/geupsu/3", "badaseugi/matchumbeop"].forEach(p => {
  const src = fs.readFileSync(path.join(ROOT, p, "index.html"), "utf8");
  (src.match(/<div class="gset[\s\S]*?<\/ol>/g) || []).forEach(b => {
    (b.match(/<li>([\s\S]*?)<\/li>/g) || []).forEach(l => {
      const t = l.replace(/<[^>]+>/g, "").trim();
      if (t) set.add(t);
    });
  });
});
const bSrc = fs.readFileSync(path.join(ROOT, "badaseugi/index.html"), "utf8");
bSrc.match(/var PRESETS=\{([\s\S]*?)\};/)[1].match(/"([^"]+)"/g)
  .map(s => s.slice(1, -1)).filter(s => !/^[ws]\d$/.test(s)).forEach(w => set.add(w));
["첫","두","세","네","다섯","여섯","일곱","여덟","아홉","열",
 "열한","열두","열세","열네","열다섯","열여섯","열일곱","열여덟","열아홉","스무"]
  .forEach(o => set.add(o + " 번째"));
set.add("안녕하세요. 받아쓰기 연습을 시작해 볼까요?");
const LIST = Array.from(set);

async function gen(text, tries) {
  const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize?key=" + KEY, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "ko-KR", name: VOICE },
      audioConfig: { audioEncoding: "MP3" }
    })
  });
  const j = await r.json();
  if (!r.ok) {
    if (j.error && (j.error.code === 429 || j.error.code === 503) && tries < 5) {
      await sleep(3000 * (tries + 1));
      return gen(text, tries + 1);
    }
    throw new Error((j.error && j.error.message || "").slice(0, 150));
  }
  return Buffer.from(j.audioContent, "base64");
}

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  let made = 0, skip = 0;
  const fail = [];
  for (const text of LIST) {
    const f = path.join(OUT, id(text) + ".mp3");
    if (fs.existsSync(f) && fs.statSync(f).size > 800) { skip++; continue; }
    try {
      fs.writeFileSync(f, await gen(text, 0));
      made++;
      console.log("+ " + text);
      await sleep(150);
    } catch (e) { fail.push(text + " — " + e.message); }
  }
  const map = {};
  LIST.forEach(t => {
    const f = path.join(OUT, id(t) + ".mp3");
    if (fs.existsSync(f) && fs.statSync(f).size > 800) map[t] = id(t);
  });
  fs.writeFileSync(path.join(OUT, "manifest.js"),
    "/* 자동 생성: tools/gen-voice.js (Cloud TTS " + VOICE + "). 수정하지 말 것 */\n" +
    "var GB_VOICE=" + JSON.stringify(map) + ";\n");
  console.log("신규 " + made + ", 유지 " + skip + ", manifest " + Object.keys(map).length + "항목");
  fail.forEach(f => console.log("FAIL: " + f));
  process.exit(fail.length ? 1 : 0);
})();
