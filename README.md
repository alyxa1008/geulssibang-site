# 글씨방 — 무료 학습지 생성기

100% 정적 사이트(HTML+CSS+JS). 빌드 과정 없음. Cloudflare Pages에 폴더 그대로 배포.

## 구조
```
index.html            허브 홈 (도구 카드)
assets/style.css      공통 디자인 시스템 (모든 페이지가 공유)
assets/common.js      공통 유틸 (el, b64e/b64d, showToast, fitScale)
hangul/index.html     한글 따라쓰기 생성기
hangul/guide/         한글 떼기 순서 가이드 (검색 유입용 콘텐츠, 도구로 연결)
hangul/trace/         화면 손글씨 (캔버스+포인터, 프린터 없는 모바일용 따라쓰기)
badaseugi/index.html  받아쓰기 불러주기 & 시험지
badaseugi/geupsu/     학기별 받아쓰기 급수표 (검색 유입용 콘텐츠, 도구로 연결)
math/index.html       수학 연산 생성기 (화면·인쇄)
math/generators.js    수학 문제 생성기 등록부 — 유형 추가는 이 파일에
math/roadmap/         학년별 수학 연산 로드맵 (검색 유입용 콘텐츠, 도구로 연결)
maze/index.html       미로 찾기 활동지 생성기
card/index.html       이름 한글 카드 생성기 (캔버스 PNG, 공유·바이럴용)
404.html              잘못된 주소 안내 페이지 (Cloudflare Pages가 자동 사용)

about/index.html      사이트 소개 (애드센스 심사용 콘텐츠)
privacy/index.html    개인정보처리방침 (애드센스 필수)
robots.txt
sitemap.xml
```

## 새 도구 추가하는 법
1. 새 폴더 생성: `퍼즐이름/index.html`
2. 기존 도구 페이지(예: math/index.html) 복사해서 시작 — head의
   style.css/common.js 링크와 topnav, footer를 그대로 쓰면 디자인 통일됨
3. 모든 페이지의 `<nav class="topnav">`에 새 링크 추가
4. 허브(index.html)의 도구 카드 추가
5. sitemap.xml에 URL 추가
6. 배포 후 구글 서치콘솔에서 색인 요청

## 도메인 연결 시 (1회)
모든 파일에서 `https://example.com` 을 실제 도메인으로 일괄 치환.
(canonical, og:url, JSON-LD, robots.txt, sitemap.xml에 사용됨)
about/privacy의 `contact@example.com` 도 실제 이메일로 치환.

## 애드센스 적용 절차
1. 도메인 연결 후 애드센스 가입 → 사이트 추가
2. 발급받은 스크립트를 각 페이지 head의
   `<!-- ===== GOOGLE ADSENSE ... -->` 주석 자리에 삽입
3. 승인 후: 자동 광고를 켜거나, 각 페이지의 `.adslot` div를 광고 유닛 코드로 교체
4. 루트에 ads.txt 파일 추가 (애드센스가 내용 제공)
※ 광고는 .no-print 클래스 안에 있어야 인쇄물에 안 들어감

## 검색 등록 체크리스트
- [ ] Google Search Console 등록 + sitemap.xml 제출
- [ ] 네이버 서치어드바이저 등록 + sitemap.xml 제출
