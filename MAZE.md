# 미로 3형제 설계 스펙 (2026-07-23 기준)

> 목표: "미로찾기 도안"(검색 클릭 1위 키워드)으로 들어온 방문자가
> 놀이(미로) → 한글(낱말 미로) → 수학(숫자 미로)으로 이어지는 **미로 허브**.
> 공식: 미로의 재미는 그대로, 정답 길 위에 "모을 것"(글자·숫자)을 얹으면 학습지가 된다.

## 1. 구성과 파일 지도

| 페이지 | URL | 역할 |
|---|---|---|
| 미로 찾기 | `/maze/` | 순수 미로 — 난이도 5(유아~괴물), 모양 4, 테마 8, 7일 챌린지, 시합용 2장, 책 표지 |
| 한글 낱말 미로 | `/maze/hangul/` | 정답 길에서 글자를 모으면 낱말 완성. 힌트·낱말 풀 3세트 |
| 숫자 미로 | `/maze/suja/` | 수 세기 1~10/1~20, 구구단 뛰어세기 2~9단 |

- `maze/maze-gen.js` — 미로 심장부 (순수 함수): buildGrid(마스크)·buildCircle·carve·solve·gridSVG(labels 옵션)·circleSVG
- `maze/maze-word-gen.js` — 수집형 심장부: **buildTokenMaze**(토큰을 정답 길에 배치+함정) ← buildWordMaze / buildNumberMaze 는 래퍼
- 각 페이지 인라인 스크립트 — 화면·컨트롤·공유만 (생성 로직 없음)
- 상단 `.subtabs`(style.css 공용)로 3형제 상호 이동. 새 갈래 페이지가 생기면 탭에 추가.

## 2. 공유 링크 포맷 (`#s=` base64 JSON 배열)

**규칙: 칸은 뒤에만 추가한다.** 읽을 때 없는 칸은 안전한 기본값으로 — 구형 링크가 영원히 열린다.

- `/maze/` (10칸): `[level, pages, answers, title, seed, shape, theme, deco, twin, cover]`
  - pages: 숫자 또는 `"week"`(7일 챌린지) · deco: 일반 난이도 테마("none"=없음) · 구형 5칸/7칸/8칸 링크 전부 호환
- `/maze/hangul/` (5칸): `[text, level, answers, title, seed]`
  - text = textarea 원문("낱말: 힌트" 줄 포함) · level: easy|mid
- `/maze/suja/` (7칸): `[kind, dan, level, pages, answers, title, seed]`
  - kind: c10|c20|skip · seed 0 = 열 때마다 새 미로 (급수표 딥링크가 사용)

## 3. 지켜야 할 불변식 (어기면 배포 금지)

1. **구형 링크 바이트 동일 재현** — `/maze/`의 기존 상태 조합은 코드를 고쳐도 같은 SVG가 나와야 한다.
   검증: scratchpad `mazecmp/cmp.js` (git HEAD 트리 vs 현재 트리, 대표 상태 7종 바이트 비교).
   이를 위해 buildGrid의 이웃 탐색 순서(위→오른쪽→아래→왼쪽)와 carve의 난수 사용 횟수를 바꾸면 안 된다.
2. **gridSVG는 labels 옵션이 없으면 출력 불변** — 수집형 기능이 순수 미로를 오염시키지 않는 안전핀.
3. **수집형 미로의 약속**: 정답 길을 따라 모은 토큰 = 입력 순서 그대로. 함정 토큰은 길 밖 + 정답 토큰과 미겹침.
   검증: tests/test-maze-word.js 성질 검사 + 퍼즈(낱말 2,000건·숫자 900건 전례).
4. mix 셔플·테마·시드 재현성: 같은 시드 → 같은 도안 (공유 재현). Date/Math.random을 생성 로직에 직접 쓰지 않는다(시드 주입).

## 4. 기능 연혁

- v1.0 (7/11): 유아 테마 4종, 원형·하트·별, 3난이도
- v1.1 (7/22): 테마 8종+전연령 개방(deco), 미로 5장, 7일 챌린지(쉬움2→보통3→어려움2)
- 낱말 미로 (7/23): buildWordMaze, 힌트("낱말: 힌트"), 낱말 풀 56개(동물20·과일18·탈것18, 난이도 맞춤 랜덤 5개)
- 숫자 미로 (7/23): buildTokenMaze 일반화, c10/c20/skip, 두 자리 수 작은 글씨(4.6)
- v1.2 (7/23): 괴물🔥(rect 23×29·heart 29×26·star 33×33·원형 12고리), 시합용 같은 미로 2장(twin, 정답지 1장), 책 표지(cover — 이름·날짜·완주 별)
- 연동 (7/23): 급수표 단어형 급수 13곳 → 낱말 미로 딥링크 (common.js `.gobtn[data-maze]`, 2~6자 단어만 추림)

## 5. 판정 지표 (GA4)

- `print_sheet` — tool: maze(+level/shape/pages) / maze-word(+level/words) / maze-suja(+kind/dan)
  - `pages:"week"` 비율 = 7일 챌린지 사용률
- 서치: "미로찾기"(일반 키워드) 순위 상승 여부, "낱말 미로"·"숫자 미로" 신규 진입
- 급수표→낱말 미로 전환은 maze-word 인쇄 중 title에 "급" 포함 여부로 간접 확인

## 6. 확장 가이드

- **새 수집형 미로**(예: 알파벳, 시계 읽기): maze-word-gen.js에 래퍼 함수 하나 + 페이지 하나. buildTokenMaze는 건드리지 않는다.
- **테마별 SEO 랜딩**(유아 미로·공룡 미로 등): 애드센스 승인 후 1순위. 딥링크(`#s=`)로 기존 도구에 상태만 실어 보내는 랜딩 패턴 재사용.
- 관찰 중(10차 감사): `.collect/.cbox` 스타일 2벌(hangul·suja — 3번째 수집형에서 통합), makeSheet 인라인 3벌(다음 미로 페이지 추가 시 common.js 승격 검토).

## 7. 테스트 지도

- `tests/test-maze.js` — 생성기 성질(구 알고리즘 재현·경로 유효·마스크·SVG)
- `tests/test-maze-page.js` — /maze/ 인라인(17조합 렌더·공유 하위호환·twin·cover·주간팩)
- `tests/test-maze-word.js` — 수집형 성질(낱말·숫자·함정·재현성·labels 불변)
- `tools/smoke-test.js` — 전 페이지 로드·콘솔 에러·딥링크 배선
