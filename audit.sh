#!/bin/bash
# ============================================================
# 글씨방 코드 감사 스크립트 — ./audit.sh 로 실행
# 검사: 메모리 누수 패턴 / 중복 스크립트 / 미사용 CSS / 깨진 링크
#       / 중복 title·description / 사이트맵 정합성 / 푸터 일관성
#       / JSON-LD 유효성 / 애드센스 분포
# 배포 전 습관처럼 돌리면 프롬프팅 잔여물이 쌓이는 걸 막는다.
# ============================================================
cd "$(dirname "$0")"
FAIL=0

echo "━━━ 1. 메모리 누수 패턴 ━━━"
for pat in 'setInterval' 'requestAnimationFrame'; do
  n=$(grep -rho "$pat" --include='*.html' --include='*.js' . 2>/dev/null | grep -v audit.sh | wc -l | tr -d ' ')
  if [ "$n" -gt 0 ]; then echo "  ⚠️  $pat ${n}건 — clear 짝이 있는지 확인 필요"; FAIL=1; else echo "  ✅ $pat 0건"; fi
done

echo "━━━ 2. 랜딩 딥링크 중복 스크립트 (wireDeepLinks로 통합됨 — 인라인 금지) ━━━"
n=$(grep -rl 'gobtn\[data-text\]\|gobtn\[data-topic\]\|querySelectorAll(".gset")' --include='*.html' . 2>/dev/null | grep -v '.git' | wc -l | tr -d ' ')
if [ "$n" -gt 0 ]; then echo "  ❌ 인라인 딥링크 스크립트 ${n}개 페이지 — common.js wireDeepLinks만 쓸 것"; FAIL=1; else echo "  ✅ 0건"; fi

echo "━━━ 3. 미사용 CSS 클래스 ━━━"
classes=$(grep -oE '\.[a-zA-Z][a-zA-Z0-9_-]*' assets/style.css | sort -u | sed 's/^\.//')
all=$(find . -name '*.html' -not -path './.git/*' -exec cat {} + ; cat assets/*.js)
un=0
for c in $classes; do echo "$all" | grep -q "$c" || { echo "  ⚠️  미사용: .$c"; un=$((un+1)); }; done
[ "$un" -eq 0 ] && echo "  ✅ 없음" || FAIL=1

echo "━━━ 4. 깨진 내부 링크 ━━━"
node -e '
const fs=require("fs"),path=require("path");
function walk(d){let r=[];for(const f of fs.readdirSync(d)){if([".git",".wrangler","node_modules"].includes(f))continue;const p=path.join(d,f);if(fs.statSync(p).isDirectory())r=r.concat(walk(p));else if(f.endsWith(".html"))r.push(p);}return r;}
let b=[];for(const f of walk(".")){const h=fs.readFileSync(f,"utf8"),dir=path.dirname(f);
for(const m of h.matchAll(/href="([^"]+)"/g)){let x=m[1];if(/^(https?:|#|mailto:|data:)/.test(x))continue;let hp=x.split("#")[0].split("?")[0];if(!hp)continue;let t=hp.startsWith("/")?path.join(".",hp):path.join(dir,hp);if(hp.endsWith("/")||!path.extname(t))t=path.join(t,"index.html");if(!fs.existsSync(t))b.push(f+" → "+x);}}
if(b.length){console.log("  ❌ "+b.length+"건"); b.slice(0,10).forEach(x=>console.log("     "+x)); process.exit(1);}
console.log("  ✅ 0건");' || FAIL=1

echo "━━━ 5. 중복 title / description (얇은 콘텐츠 SEO 위험) ━━━"
node -e '
const fs=require("fs"),path=require("path");
function walk(d){let r=[];for(const f of fs.readdirSync(d)){if([".git",".wrangler","node_modules"].includes(f))continue;const p=path.join(d,f);if(fs.statSync(p).isDirectory())r=r.concat(walk(p));else if(f.endsWith(".html"))r.push(p);}return r;}
let T={},D={};
for(const f of walk(".")){const h=fs.readFileSync(f,"utf8");
const t=(h.match(/<title>([^<]*)<\/title>/)||[])[1]||"",d=(h.match(/name="description" content="([^"]*)"/)||[])[1]||"";
(T[t]=T[t]||[]).push(f);(D[d]=D[d]||[]).push(f);}
let bad=0;
for(const[k,v]of Object.entries(T))if(v.length>1&&k){bad++;console.log("  ⚠️ title 중복 ×"+v.length+": "+v.join(", "));}
for(const[k,v]of Object.entries(D))if(v.length>1&&k){bad++;console.log("  ⚠️ desc 중복 ×"+v.length+": "+v.join(", "));}
if(bad){process.exit(1)} console.log("  ✅ 중복 없음");' || FAIL=1

echo "━━━ 6. 사이트맵 정합성 ━━━"
node -e '
const fs=require("fs"),path=require("path");
const sm=fs.readFileSync("sitemap.xml","utf8");
const locs=[...sm.matchAll(/<loc>https:\/\/geulssibang\.com(\/[^<]*)<\/loc>/g)].map(m=>m[1]);
let bad=0;
for(const l of locs){let t=l==="/"?"index.html":path.join(".",l,"index.html");if(!fs.existsSync(t)){bad++;console.log("  ❌ 파일 없음: "+l);}}
function walk(d){let r=[];for(const f of fs.readdirSync(d)){if([".git",".wrangler","node_modules"].includes(f))continue;const p=path.join(d,f);if(fs.statSync(p).isDirectory())r=r.concat(walk(p));else if(f==="index.html")r.push(p);}return r;}
for(const f of walk(".")){let u="/"+path.dirname(f).replace(/^\.\/?/,"");if(u!=="/")u+="/";u=u.replace("//","/");
if(!locs.includes(u)){bad++;console.log("  ⚠️ 사이트맵 누락: "+u);}}
if(bad)process.exit(1); console.log("  ✅ "+locs.length+"개 URL 정합");' || FAIL=1

echo "━━━ 7. 푸터 사이트맵 일관성 (전 페이지 동일해야) ━━━"
kinds=$(find . -name '*.html' -not -path './.git/*' | while read f; do
  sed -n '/<nav class="foot-map"/,/<\/nav>/p' "$f" | md5
done | sort -u | wc -l | tr -d ' ')
if [ "$kinds" -eq 1 ]; then echo "  ✅ 전 페이지 동일 (md5 1종)"; else echo "  ❌ 푸터가 ${kinds}종으로 갈라짐 — 일괄 갱신 누락"; FAIL=1; fi

echo "━━━ 8. JSON-LD 유효성 ━━━"
python3 - <<'PY' || FAIL=1
import re,json,glob,sys
bad=0;n=0
for f in glob.glob("**/*.html",recursive=True):
    if ".git" in f: continue
    h=open(f,encoding="utf-8").read()
    for b in re.findall(r'application/ld\+json">(.*?)</script>',h,re.S):
        n+=1
        try: json.loads(b)
        except Exception as e: bad+=1; print(f"  ❌ {f}: {e}")
print(f"  {'✅' if bad==0 else '❌'} {n}개 블록 중 오류 {bad}건")
sys.exit(1 if bad else 0)
PY

echo "━━━ 9. 애드센스 분포 (미삽입은 404·privacy·about만 정상) ━━━"
missing=$(grep -rL 'ca-pub-1834921044404408' $(find . -name '*.html' -not -path './.git/*' | tr '\n' ' ') | sed 's|^\./||' | sort | tr '\n' ' ')
expected="404.html about/index.html privacy/index.html "
if [ "$missing" = "$expected" ]; then echo "  ✅ 정상 (미삽입: $missing)"; else echo "  ⚠️ 미삽입 목록 변화: $missing (기대: $expected)"; FAIL=1; fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$FAIL" -eq 0 ]; then echo "🟢 전체 통과"; else echo "🔴 실패 항목 있음 — 위 로그 확인"; fi
exit $FAIL
