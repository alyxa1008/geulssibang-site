# 글씨방 — 무료 학습지 생성기 (geulssibang.com)

100% 정적 사이트(HTML+CSS+JS). **빌드 과정 없음** — 폴더를 그대로 Cloudflare Pages에 올린다.
head(GA·폰트·OG·애드센스)가 페이지마다 중복된 것은 의도 — title·description·JSON-LD는 크롤러가 읽는 정적 HTML에 있어야 한다.

## 코드 3층 구조
```
assets/common.js          공유 유틸 — el·escHtml·b64e/b64d·track(GA)·copyShareLink·showToast·fitScale·
                          printWith(인쇄 토글)·wireDeepLinks(랜딩 딥링크 자동 배선)·최근 도구·PNG 저장·한국어 음성
*/‑gen.js, generators.js   순수 생성기 모듈 — DOM 없음, 노드 테스트 가능 (한글·수학·문장제·미로·낱말미로·구구단·퀴즈)
각 페이지 인라인 <script>   state·DEF·PRESETS → render() → syncUI/syncControls, encodeState/loadFromHash(공유 링크)
```
규칙: 같은 코드가 **3번째** 등장하면 common.js(또는 모듈)로 올린다. 페이지 안에 인쇄 토글·이스케이프·셔플을 새로 쓰지 말 것.

## 구조
```
index.html                    허브 홈 (도구 카드 + 칩, ⭐ 많이 찾는 학습지 고정 배너)
assets/style.css              공통 디자인 (.sheet A4 틀, .panel, .seg, 인쇄 CSS)
assets/common.js              공용 유틸 (위)

hangul/index.html + hangul-gen.js    한글 따라쓰기 생성기
hangul/{jamo,natmal,ireum,suja}/     따라쓰기 랜딩 (검색 유입 → 딥링크로 도구 연결)
hangul/order/  guide/  pencil/ pilsa/  획순(포스터 인쇄)·한글 떼기·연필 잡기·필사 가이드
hangul/chart/                        자음모음표·가나다 음절표 출력 (SVG mm)
hangul/trace/                        화면 손글씨 (캔버스)
hangul/pen/                          예쁜 글씨 연습 (성인)
badaseugi/index.html + badaseugi-gen.js  받아쓰기 불러주기·시험지 (voice/ 자연 음성 292클립 + manifest.js; 파싱·페이지 배분·서수·클립 판정은 모듈)
badaseugi/geupsu/{1-1,1-2,2-1,2-2,3} 학기별 급수표 (A4 인쇄, 딥링크 → 시험)
badaseugi/{matchumbeop,howto,tips}   맞춤법 26(요약표 인쇄)·지도법·공부법
math/index.html + generators.js      수학 연산 생성기 (토픽 등록부는 generators.js)
math/word/ + wordgen.js              문장제 생성기
math/{add-sub,gugudan,mul-div,fraction,roadmap,sense}  수학 랜딩·가이드 (gugudan은 벽에 붙이는 구구단표 인쇄)
gugudan/ + gugudan-gen.js            구구단 외우기 시험 (음성·키패드·고르기, 상장)
gugudan/{tips,when}                  가이드
maze/index.html + maze-gen.js        미로 찾기 (4모양·5난이도·테마·7일 챌린지)
maze/{hangul,suja}/ + maze-word-gen.js  낱말 미로·숫자 미로
maze/{kids,dino}/                    미로 랜딩
quiz/ + quiz-gen.js + quiz-data.js   상식 퀴즈 (문제은행 275, 원본은 QUIZ-DRAFT.md)
quiz/tips/                           가이드
plan/ + plan-gen.js                  생활계획표 (원형 시간표 SVG — buildSVG(state)는 모듈)
diary/                               그림일기·원고지 양식 (SVG mm)
card/                                이름 카드 PNG + 어린이집 이름표 38칸 인쇄
today/ + today-gen.js + today-data.js  오늘의 학습지 — build(state)가 날짜 시드로 한글·수학·미로·받아쓰기·상식을 한 장에 (생성기 4종 재사용)
banghak/ {gaehak,routine}            여름방학 학습지·가이드
about/ privacy/ terms/ 404.html      사이트 소개·개인정보·약관·404
robots.txt  sitemap.xml  ads.txt  manifest.json

audit.sh        사이트 감사 12항목 (누수·딥링크·CSS·링크·중복 meta·sitemap·푸터 md5·JSON-LD·애드센스·톤·인쇄토글·테스트)
tests/          회귀 테스트 16벌 + run-all.sh + _util.js (tests/README.md)
tools/          smoke-test.js(전 페이지 브라우저 검사)·gen-today-data.js·gen-voice.js·gen-order-svg.py·capture-*.js
*.md            운영 문서 (PLAYBOOK·QA·STUDY·CONCEPTS·GUGUDAN·MAZE·QUIZ-DRAFT) — .gitattributes export-ignore로 배포 제외
```

## 새 도구 추가 체크리스트
1. `도구이름/index.html` — 가장 비슷한 도구 페이지(diary/ = SVG 시트형, today/ = 조합형, card/ = 캔버스형)를 복사해 시작.
   canonical·og:url·JSON-LD(WebApplication + FAQPage)·`ca-pub` 애드센스 스크립트(audit 9번이 검사)를 새 URL로.
2. 순수 로직은 `도구이름/도구이름-gen.js`로 분리(테스트 가능하게). 이스케이프는 `escHtml`, 인쇄 토글은 `printWith(cls, gaParams, before)`.
3. 공유 링크: `encodeState()`는 **첫 칸에 버전 정수** `[1, …]`, `loadFromHash()`는 `typeof a[0]==="number"`로 버전을 떼고 모든 칸을 검증 후 폴백(`tests/test-share.js`가 규약과 페이지 밖 생성자의 칸 수를 검사). 시트가 있으면 `makeSheet({deco,title,meta,foot,pageNo,pageTotal}, body)`. GA는 `track("print_sheet",{tool:"이름", …})`.
4. **전 페이지 푸터**(`foot-map`)에 링크 추가 — 한 페이지라도 빠지면 audit 7번(md5) 실패. 스크립트로 일괄 삽입할 것.
5. `assets/common.js`의 `TOOLS`에 경로 추가(최근 도구), 홈 `index.html` 카드 칩, `sitemap.xml`.
6. `tests/test-이름.js` 작성(test-diary.js 복사 → `siteWiring`), `QA.md` 폰 확인 항목, README 구조 갱신.
7. `bash tests/run-all.sh` → `./audit.sh` → `node tools/smoke-test.js` 전부 통과 후 배포.

## 배포
push는 백업일 뿐 반영되지 않는다(직접 업로드 방식).
```
rm -rf /tmp/gb-deploy && mkdir -p /tmp/gb-deploy && git archive main | tar -x -C /tmp/gb-deploy \
 && cd /tmp/gb-deploy && npx wrangler pages deploy . --project-name geulssibang-site --branch main --commit-dirty=true
```
기존 페이지를 고쳤으면 Cloudflare 캐시 퍼지(전 페이지 푸터 변경 시 "모두 제거"), 새 페이지는 GSC·네이버·Bing 색인 요청.

## 데이터 다시 만들기
- 급수표/낱말 페이지를 고쳤다 → `node tools/gen-today-data.js` (test-today가 원본과 대조해 어긋나면 실패)
- 받아쓰기 낱말이 늘었다 → `GKEY=<Cloud TTS 키> node tools/gen-voice.js` (증분 생성, manifest 재작성)
- 획순 그림 수정 → `python3 tools/gen-order-svg.py` 출력으로 order/index.html의 strokegrid 교체
- 퀴즈 문항 → QUIZ-DRAFT.md 수정 후 quiz-data.js 재변환 (출제 원칙: 답이 사실 하나로 고정되는 문제만)
- 홈·about 스크린샷 → `node tools/capture-shots.js`

## 애드센스
발급자 pub-1834921044404408, 스크립트는 전 페이지 head(404·about·privacy·terms 제외). `.adslot`은 승인 전까지 style.css에서 숨김.
광고는 `.no-print` 안에 두어 인쇄물에 안 들어가게.
