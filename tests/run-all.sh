#!/usr/bin/env bash
# 전 회귀 테스트 실행 — 저장소 루트에서 `bash tests/run-all.sh`. 하나라도 실패하면 종료 코드 1
cd "$(dirname "$0")/.." || exit 1
fail=0
for t in tests/test-*.js; do
  if node "$t" >/dev/null 2>&1; then
    echo "✅ $t"
  else
    echo "❌ $t"; node "$t" 2>&1 | tail -6; fail=1
  fi
done
exit $fail
