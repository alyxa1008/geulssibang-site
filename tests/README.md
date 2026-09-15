# 회귀 테스트 (배포 제외 — .gitattributes export-ignore)

저장소 루트에서 **전부 한 번에**:

    bash tests/run-all.sh          # 하나라도 실패하면 종료 코드 1, 실패한 테스트의 로그 6줄 출력
    ./audit.sh                     # 사이트 감사 12항목 — 12번 항목이 run-all.sh를 포함해서 돌림

개별 실행 (`node tests/<파일>`):

| 파일 | 대상 | 검사 |
|---|---|---|
| test-hangul.js | hangul/hangul-gen.js | 줄 빌더 2종·페이지 배분·색 매핑 |
| test-math.js | math/generators.js | 전 토픽·단계 식 검산, 받아올림 없음 옵션, 나머지, 소수 자릿수, 시드 결정성 |
| test-word.js | math/wordgen.js | 조사(은/는·이/가) 규칙, 정답 양수, 주인공 이름 반영 |
| test-gugudan.js | gugudan/gugudan-gen.js + 페이지 | 문제 생성·채점·사지선다·공유 링크·구구단표 인쇄 배선 |
| test-maze.js | maze/maze-gen.js | 4모양×난이도 경로 검증, 구 링크 호환 |
| test-maze-page.js | maze/index.html | 13조합 렌더·공유 라운드트립 |
| test-maze-word.js | maze/maze-word-gen.js | 낱말·숫자 미로 성질(길 위 글자 순서·함정 배치) |
| test-quiz.js | quiz/quiz-gen.js + quiz-data.js | 문제은행 무결성(275)·출제·채점·페이지 배선 |
| test-badaseugi.js | badaseugi/badaseugi-gen.js | 낱말 파싱·페이지 배분 불변식·서수 읽기·클립 판정 |
| test-badaseugi-voice.js | badaseugi/voice | 급수표 전 낱말 클립 존재·이름 규칙·급수표 인쇄 배선 |
| test-plan.js | plan/plan-gen.js | 시간 칸 계산·부채꼴 경로·테마·SVG 결정성·이스케이프 |
| test-share.js | 전 도구 encodeState/loadFromHash | 첫 칸 버전 규약, 페이지 밖 링크 생성자(common.js·card) 칸 수 대조 |
| test-diary.js | diary/ | 배선·격자 줄 수 검산·사이트 연결 |
| test-chart.js | hangul/chart/ | 배선·자모 이름·음절 공식·레이아웃·사이트 연결 |
| test-card.js | card/ | 이름표 인쇄 배선·38칸·시트 높이·SEO 반영 |
| test-today.js | today/today-gen.js + 페이지 | build(state) 결정성·학년별 구성·줄 패턴·today-data = 급수표 원본 대조·사이트 연결 |

공용 헬퍼 `tests/_util.js`: `read(경로)`, `htmlPages()`, `makeOk(라벨)`(실패 카운터 + `ok.done()`),
`ldJson(html)`, `gsetWords(html)`(급수표 카드 추출 — tools/gen-today-data.js도 같은 함수 사용), `siteWiring(ok, {url, tools, home, footer})`.

**새 도구 테스트 만들 때** test-diary.js를 복사해서 시작 — 배선 id·GA 이벤트·canonical·JSON-LD·`siteWiring` 순서.

브라우저 스모크 테스트 (playwright + 시스템 크롬 — `npm i playwright --no-save --no-package-lock`):

    node tools/smoke-test.js       # sitemap의 전 페이지: 콘솔 에러 0·딥링크 배선·시트 렌더

도구 코드를 고치면 `bash tests/run-all.sh` + `./audit.sh`, 배포 전에 smoke-test까지 통과시킬 것.
