# -*- coding: utf-8 -*-
"""네이버 웹문서 탭에서 글씨방이 몇 번째 사이트로 나오는지 재는 도구 (개인화 없는 비로그인 기준).
사용: python3 tools/naver-rank.py "미로찾기 도안" "그림일기 양식" ...
색인 여부만 볼 때는 네이버에 site:geulssibang.com/경로/ 를 검색 — 없으면 "검색결과가 없습니다"가 뜬다.
주의: 통합검색 첫 화면은 블로그·이미지·쇼핑 블록이 웹문서 위에 오므로, 여기 순위가 높아도 클릭이 적을 수 있다."""
import re,sys,time,subprocess,urllib.parse
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
def fetch(q,start):
    url="https://search.naver.com/search.naver?where=web&query="+urllib.parse.quote(q)+"&start=%d"%start
    return subprocess.run(["curl","-s","--max-time","20","-A",UA,"-H","Accept-Language: ko-KR,ko;q=0.9",url],capture_output=True).stdout.decode("utf-8","ignore")
def domains(html):
    out=[]
    for m in re.finditer(r'href="(https?://[^"]+)"',html):
        u=m.group(1); d=urllib.parse.urlparse(u).netloc.lower()
        if not d or "naver." in d or "pstatic" in d or d.endswith("navercorp.com"): continue
        out.append((d,u))
    seen=[]; 
    for d,u in out:
        if d not in [x[0] for x in seen]: seen.append((d,u))
    return seen
for q in sys.argv[1:]:
    rank=None; total=[]; hit=""
    for page,start in enumerate([1,16,31]):
        ds=domains(fetch(q,start))
        for d,u in ds:
            if d not in [x[0] for x in total]: total.append((d,u))
        time.sleep(1)
    for i,(d,u) in enumerate(total,1):
        if "geulssibang.com" in d: rank=i; hit=u; break
    top=", ".join(d.replace("www.","") for d,_ in total[:5])
    print(u"%-14s → %s   (웹문서 상위 3쪽 %d개 사이트 중)   1~5위: %s"%(q, (u"%d번째 %s"%(rank,hit.replace("https://geulssibang.com","")) if rank else u"3쪽 안에 없음"), len(total), top))
