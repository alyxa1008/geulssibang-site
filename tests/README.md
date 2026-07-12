# 회귀 테스트 (배포 제외 — .gitattributes export-ignore)

저장소 루트에서 실행:

    node tests/test-gugudan.js    # 구구단 시험: 문제 생성·채점·사지선다·공유 링크
    node tests/test-maze.js       # 미로 생성기: 4모양×난이도 경로 검증, 구 링크 호환
    node tests/test-maze-page.js  # 미로 페이지: 13조합 렌더·공유 라운드트립

도구 코드를 고치면 해당 테스트 + ./audit.sh 를 돌리고 배포할 것.
