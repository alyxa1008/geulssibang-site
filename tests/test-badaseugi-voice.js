/* 받아쓰기 자연 음성 클립 검사
   실행: node tests/test-badaseugi-voice.js
   1) manifest가 급수표·맞춤법·프리셋·번호(서수)를 전부 덮는가 (파일 모드 판정의 전제)
   2) manifest의 모든 항목이 실제 mp3 파일로 존재하는가
   3) 파일명 = sha1(텍스트) 앞 10자리 규칙이 지켜지는가
   4) 페이지 배선(manifest 로드·speakEx 사용)이 살아 있는가 */
"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var ROOT = path.join(__dirname, "..");
var fails = 0;
function ok(cond, msg) {
  if (cond) console.log("  ✓ " + msg);
  else { fails++; console.log("  ✗ " + msg); }
}
function id(t) { return crypto.createHash("sha1").update(t, "utf8").digest("hex").slice(0, 10); }

/* manifest 로드 */
var mSrc = fs.readFileSync(path.join(ROOT, "badaseugi/voice/manifest.js"), "utf8");
var GB_VOICE = {};
new Function("var GB_VOICE;" + mSrc + ";return GB_VOICE;").call() && null;
GB_VOICE = new Function(mSrc + ";return GB_VOICE;")();

console.log("1. 커버리지 — 시험 딥링크가 만드는 모든 단어에 클립이 있어야 파일 모드가 된다");
var pages = ["badaseugi/geupsu/1-1", "badaseugi/geupsu/1-2", "badaseugi/geupsu/2-1",
             "badaseugi/geupsu/2-2", "badaseugi/geupsu/3", "badaseugi/matchumbeop"];
var missing = [];
pages.forEach(function (p) {
  var src = fs.readFileSync(path.join(ROOT, p, "index.html"), "utf8");
  (src.match(/<div class="gset[\s\S]*?<\/ol>/g) || []).forEach(function (b) {
    (b.match(/<li>([\s\S]*?)<\/li>/g) || []).forEach(function (l) {
      var t = l.replace(/<[^>]+>/g, "").trim();
      if (t && !GB_VOICE[t]) missing.push(p + ": " + t);
    });
  });
});
ok(missing.length === 0, "급수표·맞춤법 전 항목 커버" + (missing.length ? " — 누락: " + missing.join(", ") : ""));

var bSrc = fs.readFileSync(path.join(ROOT, "badaseugi/index.html"), "utf8");
var presets = bSrc.match(/var PRESETS=\{([\s\S]*?)\};/)[1].match(/"([^"]+)"/g)
  .map(function (s) { return s.slice(1, -1); })
  .filter(function (s) { return !/^[ws]\d$/.test(s); });
var pMiss = presets.filter(function (w) { return !GB_VOICE[w]; });
ok(pMiss.length === 0, "내장 프리셋 " + presets.length + "개 커버" + (pMiss.length ? " — 누락: " + pMiss.join(", ") : ""));

var ORD = ["첫", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열",
           "열한", "열두", "열세", "열네", "열다섯", "열여섯", "열일곱", "열여덟", "열아홉", "스무"];
var oMiss = ORD.filter(function (o) { return !GB_VOICE[o + " 번째"]; });
ok(oMiss.length === 0, "번호(서수) 1~20 커버" + (oMiss.length ? " — 누락: " + oMiss.join(", ") : ""));

console.log("2. 파일 실재 + 3. 이름 규칙");
var broken = [], badId = [];
Object.keys(GB_VOICE).forEach(function (t) {
  var f = path.join(ROOT, "badaseugi/voice", GB_VOICE[t] + ".mp3");
  if (!fs.existsSync(f) || fs.statSync(f).size < 800) broken.push(t);
  if (GB_VOICE[t] !== id(t)) badId.push(t);
});
ok(broken.length === 0, "manifest " + Object.keys(GB_VOICE).length + "항목 모두 mp3 실재" + (broken.length ? " — 깨짐: " + broken.join(", ") : ""));
ok(badId.length === 0, "sha1 이름 규칙 일치" + (badId.length ? " — 불일치: " + badId.join(", ") : ""));

console.log("4. 페이지 배선");
ok(bSrc.indexOf('src="voice/manifest.js"') > -1, "manifest.js 스크립트 로드");
ok(/speakEx\(word/.test(bSrc) && /speakEx\(ordinalKo/.test(bSrc), "시험 경로가 speakEx 사용 (단어·번호)");
ok(/typeof GB_VOICE!=="undefined"/.test(bSrc), "manifest 부재 시 기기 음성 폴백 가드");
ok(/stopClip\(\)/.test(bSrc), "정지 경로에서 클립도 멈춤");
ok(/examRetry/.test(bSrc) && /exam\.list=sel/.test(bSrc) && /allClipsReady\(sel\)/.test(bSrc),
  "틀린 낱말 재시험 배선 (부분집합 + 목소리 재판정)");

console.log(fails ? "\n실패 " + fails + "건" : "\n전부 통과");
process.exit(fails ? 1 : 0);
