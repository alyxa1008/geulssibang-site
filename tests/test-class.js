/* 우리 반 받아쓰기 링크·QR(/badaseugi/class/) — 배선·시험 링크 포맷 = 받아쓰기 도구·QR 라이브러리·연결
   실행: node tests/test-class.js */
"use strict";
const vm=require("vm");
const U=require("./_util");
const ok=U.makeOk("test-class");
const html=U.read("badaseugi/class/index.html");

/* 1) 배선 */
["cls","exam","words","repeat","gap","answers","showWords","chipSample","btnCopy","btnPrint","btnQR","btnShare","btnReset","sheets","classHint","pageLabel"].forEach(id=>ok(html.includes('id="'+id+'"'),"id 누락: "+id));
ok(/track\("share_link",\{tool:"class"/.test(html)&&/track\("print_sheet",\{tool:"class-notice"/.test(html)&&/track\("save_png",\{tool:"class-qr"/.test(html),"GA 이벤트 3종");
["../../assets/common.js","../../assets/qrcode.js","../badaseugi-gen.js"].forEach(s=>ok(html.includes('<script src="'+s+'">'),"스크립트 로드: "+s));
ok(html.includes("makeSheet({")&&html.includes("parseWords(")&&html.includes("escHtml("),"공용 makeSheet·parseWords·escHtml 사용");
ok(html.includes('<link rel="canonical" href="https://geulssibang.com/badaseugi/class/">'),"canonical");
ok(html.includes("ca-pub-1834921044404408"),"광고 스크립트");
ok(U.ldJson(html).some(o=>o["@type"]==="FAQPage"),"FAQ JSON-LD");

/* 2) 시험 링크 = 받아쓰기 도구 v1 포맷 (칸 수·순서) */
const m=/var payload=\[1, state\.words\.join\("\\n"\), state\.repeat, state\.gap, 0\.85, examTitle\(\), state\.answers\?1:0\];/.exec(html);
ok(!!m,"시험 링크 payload [1, 단어, 횟수, 간격, 속도, 제목, 정답지]");
const bada=U.read("badaseugi/index.html");
ok(/JSON\.stringify\(\[1,state\.words\.join\("\\n"\),state\.repeat,state\.gap,state\.rate,state\.title,state\.answers\?1:0\]\)/.test(bada),"받아쓰기 encodeState 7칸 그대로 (바뀌면 class 링크도 같이 고칠 것)");
ok(html.includes('EXAM_BASE="https://geulssibang.com/badaseugi/"'),"시험 링크 절대 주소");

/* 3) QR 라이브러리 — 20낱말 문장도 한 QR에 담기는지 */
const q={ module:{exports:{}} }; q.exports=q.module.exports; vm.createContext(q);
vm.runInContext(U.read("assets/qrcode.js")+"\n;this.__q=typeof qrcode!==\"undefined\"?qrcode:module.exports;",q);
ok(U.read("assets/qrcode.js").includes("Copyright (c) 2009 Kazuhiko Arase")&&U.read("assets/qrcode.js").includes("MIT license"),"qrcode.js 라이선스 표기 유지");
const words=Array.from({length:20},(_,i)=>"토끼가 깡충깡충 뜁니다 "+i);
const url="https://geulssibang.com/badaseugi/#s="+encodeURIComponent(Buffer.from(JSON.stringify([1,words.join("\n"),2,12,0.85,"1학년 3반 9월 셋째 주 · 5급",1])).toString("base64"));
const qr=q.__q(0,"M"); qr.addData(url,"Byte"); qr.make();
ok(qr.getModuleCount()<=177,"20문장 링크("+url.length+"자)도 QR 한 장 ("+qr.getModuleCount()+"모듈)");
ok(qr.createSvgTag({cellSize:1,margin:0,scalable:true}).includes("viewBox"),"createSvgTag scalable");

/* 4) 사이트 연결 */
ok(bada.includes('href="class/"'),"받아쓰기 본문 → class 링크");
const w=U.siteWiring(ok,{url:"/badaseugi/class/", tools:'"/badaseugi/class/":1', home:'href="./badaseugi/class/"', footer:'href="/badaseugi/class/">우리 반 링크·QR'});
ok.done("푸터 "+w.footerPages+"페이지, sitemap "+w.sitemapUrls+"URL");
