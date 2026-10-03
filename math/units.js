"use strict";
/* 초등 수학 단원 데이터 (2022 개정 교육과정 교과서 기준) — 학기 페이지(/math/unit/학기/)와 홈·수학 도구의 '이번 주 진도' 코너가 함께 쓴다.
   페이지는 tools/gen-math-units.js로 생성하므로 여기를 고치면 다시 생성할 것 (tests/test-units.js가 대조).
   start: 그 단원을 보통 시작하는 날(월-일) — 학교·교과서마다 ±2주 차이, 안내문에 명시.
   tools: 단원에 맞춘 학습지 — math(연산 생성기 v2 딥링크), suja(숫자 미로 v1), gugu(구구단 시험 v1), href(페이지 링크).
   없는 단원은 home(집에서 이렇게)만 — 억지로 끼우지 않는다. */
var MATH_UNITS={
 "1-1":{ grade:1, sem:1, name:"1학년 1학기", range:"3월~7월", units:[
  { no:1, name:"9까지의 수", start:"03-02",
    learn:"1부터 9까지 수를 세고, 읽고, 쓰는 단원이에요. '하나·둘·셋'과 '일·이·삼' 두 가지 읽기를 상황에 맞게 쓰고, 수의 순서와 크기 비교(더 많다·적다), 0도 배웁니다.",
    pit:"숫자 모양을 거꾸로 쓰거나(3·5·7), 세는 소리와 손가락이 어긋나는 일이 흔해요. 물건을 손으로 하나씩 밀어 놓으며 세게 하면 잡힙니다.",
    tools:[ {kind:"href", href:"/hangul/suja/", label:"✎ 숫자 1~9 따라쓰기"}, {kind:"suja", k:"c10", level:"easy", title:"1부터 10까지 수 세기 미로", label:"🌀 1~10 수 세기 미로"} ] },
  { no:2, name:"여러 가지 모양", start:"04-01",
    learn:"상자(직육면체)·둥근 기둥(원기둥)·공(구) 모양을 생활 속 물건에서 찾고, 쌓을 수 있는지·굴러가는지 같은 특징으로 구별해요. 아직 도형 이름은 쓰지 않고 '상자 모양'처럼 부릅니다.",
    pit:"교과서가 이름 대신 모양으로 부르니 집에서도 '직육면체'보다 '상자 모양'으로 맞춰 주세요.",
    home:["집 안 물건을 '잘 굴러가는 것 / 잘 쌓이는 것'으로 나눠 보기","휴지심·주사위·공을 눈 감고 만져서 어떤 모양인지 맞히기"] },
  { no:3, name:"덧셈과 뺄셈", start:"04-20",
    learn:"9 이하의 수에서 모으기와 가르기를 한 뒤, 합이 9를 넘지 않는 덧셈과 그 범위의 뺄셈을 배웁니다. +, −, = 기호와 '덧셈식·뺄셈식'이라는 말이 처음 나와요.",
    pit:"식은 쓰는데 뜻을 모르는 경우가 많아요. '3+2'를 '사탕 3개에 2개 더'처럼 말로 풀어 보게 하면 식과 상황이 연결됩니다.",
    tools:[ {kind:"math", topic:"addsub", level:0, nocarry:1, title:"1학년 1학기 덧셈과 뺄셈 (9까지)", label:"✚ 9까지의 덧셈·뺄셈 학습지"}, {kind:"href", href:"/math/add-sub/", label:"📖 덧셈·뺄셈 단계 안내"} ] },
  { no:4, name:"비교하기", start:"05-25",
    learn:"길이·무게·넓이·들이를 '더 길다, 더 무겁다, 더 넓다, 더 많이 담긴다'처럼 직접 대 보고 비교해요. 자나 저울 같은 단위는 아직 쓰지 않습니다.",
    pit:"'크다'를 길이·넓이·무게에 다 써 버리기 쉬워요. 상황마다 알맞은 말(길다·넓다·무겁다)을 골라 쓰게 해 주세요.",
    home:["연필·숟가락·리모컨을 한 줄로 세워 긴 순서로 놓기","컵 두 개에 물을 따라 어느 쪽이 더 많이 들어가는지 맞히기"] },
  { no:5, name:"50까지의 수", start:"06-15",
    learn:"10을 한 묶음으로 보는 눈이 생기는 단원이에요. 십몇을 '10과 몇'으로 가르고, 10개씩 묶어 세어 50까지의 수를 읽고 쓰며 크기를 비교합니다.",
    pit:"'십일'을 '일십일'로 읽거나, 21과 12를 헷갈려요. 10개 묶음과 낱개를 따로 세어 '묶음 2개, 낱개 1개 → 21'로 말하게 해 주세요.",
    tools:[ {kind:"suja", k:"c20", level:"easy", title:"1부터 20까지 수 세기 미로", label:"🌀 1~20 수 세기 미로"}, {kind:"href", href:"/math/sense/", label:"📖 수 감각 키우기"} ] }
 ]},
 "1-2":{ grade:1, sem:2, name:"1학년 2학기", range:"9월~12월", units:[
  { no:1, name:"100까지의 수", start:"09-01",
    learn:"60, 70 … 100까지 몇십을 배우고, 두 자리 수를 10개씩 묶음과 낱개로 나타내요. 수의 순서, 크기 비교, 짝수와 홀수도 여기서 나옵니다.",
    pit:"99 다음이 100이라는 건 알아도 '89 다음'을 물으면 막히는 아이가 많아요. 10씩 뛰어 세기(10, 20, 30…)와 1씩 세기를 번갈아 해 보세요.",
    tools:[ {kind:"suja", k:"c20", level:"mid", title:"1부터 20까지 수 세기 미로", label:"🌀 수 세기 미로"}, {kind:"href", href:"/math/sense/", label:"📖 수 감각 키우기"} ] },
  { no:2, name:"덧셈과 뺄셈(1)", start:"09-22",
    learn:"받아올림·받아내림이 없는 두 자리 수 덧셈과 뺄셈이에요. (몇십)+(몇), (몇십몇)+(몇), (몇십)+(몇십), (몇십몇)+(몇십몇)과 같은 범위의 뺄셈을 배웁니다.",
    pit:"자릿수를 맞추지 않고 더해서 23+4를 63으로 쓰는 실수가 전형적이에요. 세로셈에서 일의 자리끼리 줄을 맞추는 습관부터 봐 주세요.",
    tools:[ {kind:"math", topic:"addsub", level:1, nocarry:1, title:"1학년 2학기 덧셈과 뺄셈(1) 두 자리와 한 자리", label:"✚ (몇십몇)±(몇) 학습지"}, {kind:"math", topic:"addsub", level:2, nocarry:1, title:"1학년 2학기 덧셈과 뺄셈(1) 두 자리끼리", label:"✚ (몇십몇)±(몇십몇) 학습지"} ] },
  { no:3, name:"여러 가지 모양", start:"10-13",
    learn:"네모·세모·동그라미 모양을 찾고 특징(곧은 선, 뾰족한 곳, 둥근 곳)을 알아봐요. 1학기의 입체 모양에 이어 이번엔 평면 모양입니다.",
    pit:"기울어진 세모나 길쭉한 네모를 '다른 모양'이라고 느끼는 아이가 있어요. 종이를 돌려 가며 같은 모양임을 보여 주세요.",
    home:["색종이를 접고 잘라 네모·세모·동그라미 만들기","집 안에서 각 모양 3개씩 찾아 사진 찍기"] },
  { no:4, name:"덧셈과 뺄셈(2)", start:"10-27",
    learn:"세 수의 덧셈과 뺄셈, 10이 되는 더하기(3+7, 6+4…), 10에서 빼기를 배워요. 다음 단원의 받아올림을 위한 '10 만들기' 감각을 기르는 단원입니다.",
    pit:"10이 되는 짝(1-9, 2-8, 3-7, 4-6, 5-5)이 자동으로 나와야 다음 단원이 편해요. 손가락 열 개로 매일 한 번씩 짝 맞추기를 해 보세요.",
    tools:[ {kind:"math", topic:"add", level:0, nocarry:0, title:"1학년 2학기 덧셈과 뺄셈(2) 10 만들기", label:"✚ 한 자리 덧셈 (10 만들기 포함)"} ] },
  { no:5, name:"시계 보기와 규칙 찾기", start:"11-17",
    learn:"'몇 시'와 '몇 시 30분'을 시계에서 읽고, 모양·색·수가 반복되는 규칙을 찾아 이어 그려요. 교과서에 따라 모양 단원과 묶이기도 합니다.",
    pit:"긴바늘이 6을 가리킬 때 짧은바늘이 숫자 사이에 있어서 '몇 시'인지 헷갈려요. 짧은바늘이 '지나온 숫자'를 읽는다고 알려 주세요.",
    tools:[ {kind:"href", href:"/plan/", label:"⏰ 생활계획표로 시각 읽기 연습"}, {kind:"suja", k:"skip", dan:2, level:"easy", title:"2씩 뛰어 세기 미로", label:"🌀 2씩 뛰어 세기 미로 (규칙)"} ] },
  { no:6, name:"덧셈과 뺄셈(3)", start:"12-01",
    learn:"드디어 받아올림이 있는 (몇)+(몇)과 받아내림이 있는 (십몇)−(몇)이에요. 10을 만들어 더하고, 10에서 빼는 방법으로 계산합니다. 1학년 수학의 산 하나를 넘는 단원이에요.",
    pit:"손가락으로 하나씩 세어 답은 맞히지만 느린 경우가 많아요. 틀린 게 아니니 다그치지 말고, '8에 2를 더해 10, 남은 5를 더해 15'처럼 10 만들기를 말로 따라 하게 해 주세요.",
    tools:[ {kind:"math", topic:"add", level:0, nocarry:0, title:"1학년 2학기 받아올림 있는 덧셈", label:"✚ 받아올림 덧셈 (몇)+(몇)"}, {kind:"math", topic:"sub", level:1, nocarry:0, title:"1학년 2학기 받아내림 있는 뺄셈", label:"✚ 받아내림 뺄셈 (십몇)−(몇)"} ] }
 ]},
 "2-1":{ grade:2, sem:1, name:"2학년 1학기", range:"3월~7월", units:[
  { no:1, name:"세 자리 수", start:"03-02",
    learn:"100이 10개면 1000. 백·십·일의 자릿값으로 세 자리 수를 읽고 쓰고, 뛰어 세기와 크기 비교를 해요.",
    pit:"'삼백오'를 3005로 쓰는 실수가 전형적이에요. 빈 자리에 0을 넣는 이유를 동전(100원·10원·1원)으로 보여 주세요.",
    tools:[ {kind:"href", href:"/math/sense/", label:"📖 수 감각 키우기"}, {kind:"href", href:"/hangul/suja/", label:"✎ 숫자 따라쓰기"} ] },
  { no:2, name:"여러 가지 도형", start:"03-23",
    learn:"삼각형·사각형·원의 이름을 배우고 꼭짓점과 변을 세어요. 오각형·육각형도 나오고, 칠교판으로 모양을 만듭니다.",
    pit:"'변'과 '꼭짓점'을 바꿔 말하기 쉬워요. 꼭짓점은 '뾰족한 점', 변은 '곧은 선'으로 손으로 짚으며 세게 해 주세요.",
    home:["칠교판(없으면 색종이를 7조각으로)으로 집·배 모양 만들기","간판·창문에서 삼각형·사각형 찾아 변 개수 세기"] },
  { no:3, name:"덧셈과 뺄셈", start:"04-13",
    learn:"받아올림·받아내림이 있는 두 자리 수 덧셈과 뺄셈을 세로셈으로 배워요. 덧셈과 뺄셈의 관계(37+25=62 ↔ 62−25=37), □가 있는 식도 다룹니다.",
    pit:"받아내림에서 윗자리 수를 1 줄이는 걸 잊어 52−17을 45로 쓰는 실수가 가장 많아요. 세로셈 윗자리에 '1 빌려 줌' 표시를 꼭 쓰게 하세요.",
    tools:[ {kind:"math", topic:"addsub", level:2, nocarry:0, title:"2학년 1학기 두 자리 덧셈과 뺄셈", label:"✚ 두 자리 덧셈·뺄셈 (받아올림·내림)"}, {kind:"href", href:"/math/add-sub/", label:"📖 자주 틀리는 유형 3가지"} ] },
  { no:4, name:"길이 재기", start:"05-11",
    learn:"1cm를 배우고 자로 길이를 재요. 어림하고 재어 보며 'cm' 단위 감각을 기릅니다.",
    pit:"자의 0이 아니라 1에 맞춰 재는 실수가 흔해요. 자의 시작점을 먼저 찾게 해 주세요.",
    home:["손 한 뼘·발 길이를 cm로 재어 적어 두기","집 안 물건 세 개의 길이를 어림한 뒤 자로 재서 비교하기"] },
  { no:5, name:"분류하기", start:"05-25",
    learn:"물건을 색·모양·크기 같은 기준으로 나누고, 나눈 결과를 세어 표로 정리해요. 2학기 '표와 그래프'의 바탕이 됩니다.",
    pit:"'예쁜 것 / 안 예쁜 것'처럼 사람마다 다른 기준으로 나누려 해요. 누가 나눠도 같은 결과가 나오는 기준이 '분류 기준'임을 알려 주세요.",
    home:["빨래 개면서 색깔별·사람별로 분류하기","장난감을 두 가지 기준(색, 크기)으로 번갈아 나눠 보기"] },
  { no:6, name:"곱셈", start:"06-08",
    learn:"묶어 세기와 몇 배를 배우고 곱셈식(2×3=6)을 처음 써요. 구구단 암기는 2학기 일이고, 여기서는 '3씩 4묶음'이라는 뜻을 이해하는 단원입니다.",
    pit:"구구단을 미리 외운 아이가 뜻 설명을 건너뛰기 쉬워요. '2×3'을 그림으로 그려 보게 하면 이해했는지 바로 보입니다.",
    tools:[ {kind:"suja", k:"skip", dan:2, level:"easy", title:"2씩 뛰어 세기 미로", label:"🌀 2씩·5씩 뛰어 세기 미로"}, {kind:"href", href:"/gugudan/when/", label:"📖 구구단은 언제 시작할까"} ] }
 ]},
 "2-2":{ grade:2, sem:2, name:"2학년 2학기", range:"9월~12월", units:[
  { no:1, name:"네 자리 수", start:"09-01",
    learn:"1000이 10개면 10000. 천·백·십·일의 자릿값으로 네 자리 수를 읽고 쓰고, 뛰어 세기와 크기 비교를 해요.",
    pit:"'이천삼'을 20003처럼 쓰는 실수가 세 자리 때와 똑같이 나와요. 자릿값 표(천·백·십·일)에 숫자를 하나씩 넣어 보게 하세요.",
    tools:[ {kind:"href", href:"/math/sense/", label:"📖 수 감각 키우기"} ] },
  { no:2, name:"곱셈구구", start:"09-22",
    learn:"2단부터 9단까지 곱셈구구를 배우고 외워요. 교과서는 2·5단 → 3·6단 → 4·8단 → 7·9단 순서로 가고, 1단과 0의 곱도 다룹니다.",
    pit:"6·7·8단에서 막히는 게 정상이에요. 매일 한 단씩 5분, 외운 단은 거꾸로(9×7부터)도 말해 보게 하면 오래 갑니다.",
    tools:[ {kind:"math", topic:"gugudan", level:0, dan:0, title:"2학년 2학기 곱셈구구", label:"✚ 구구단 학습지 (단 선택)"}, {kind:"gugu", dans:"25", label:"🔊 구구단 외우기 시험 (2·5단부터)"}, {kind:"href", href:"/math/gugudan/", label:"📋 벽에 붙이는 구구단표"} ] },
  { no:3, name:"길이 재기", start:"10-20",
    learn:"1m를 배우고 'm와 cm'로 긴 길이를 나타내요. 길이의 합과 차, 어림하기를 합니다.",
    pit:"1m 20cm를 120cm로 바꾸는 건 되는데 거꾸로(135cm → 1m 35cm)에서 막혀요. 100cm가 1m임을 줄자로 직접 보여 주세요.",
    home:["줄자로 키·팔 길이 재서 m와 cm로 적기","방 한쪽 벽 길이를 어림한 뒤 재어 보기"] },
  { no:4, name:"시각과 시간", start:"11-03",
    learn:"'몇 시 몇 분'을 1분 단위로 읽고, 1시간=60분, 하루=24시간, 1주일·1년 달력을 배워요. '시각'(몇 시)과 '시간'(얼마 동안)의 차이도 여기서 나옵니다.",
    pit:"긴바늘이 가리키는 숫자 3을 '3분'으로 읽는 실수가 가장 많아요. 긴바늘은 숫자×5라고 알려 주고 5·10·15…를 함께 세어 보세요.",
    tools:[ {kind:"href", href:"/plan/", label:"⏰ 생활계획표 만들며 시각 읽기"} ],
    home:["아침 일과를 '몇 시 몇 분에 무엇'으로 적어 보기","달력에서 이번 달 토요일이 며칠씩인지 찾기"] },
  { no:5, name:"표와 그래프", start:"11-24",
    learn:"조사한 자료를 표로 정리하고 ○·×·/ 같은 기호로 그래프를 그려요. 표와 그래프에서 알 수 있는 것을 말합니다.",
    pit:"그래프 칸을 아래에서부터 채워야 하는데 위에서부터 그리는 아이가 있어요. '쌓아 올리기'로 설명해 주세요.",
    home:["가족이 좋아하는 과일을 조사해 표로 만들고 ○ 그래프 그리기","일주일 날씨를 기호로 기록하기"] },
  { no:6, name:"규칙 찾기", start:"12-08",
    learn:"무늬·쌓기나무·수 배열표에서 규칙을 찾고, 찾은 규칙으로 다음을 예상해요. 덧셈표와 곱셈표의 규칙도 봅니다.",
    pit:"규칙을 찾아도 말로 설명을 못 해요. '2씩 커져요'처럼 한 문장으로 말하게 하면 이해가 굳어집니다.",
    tools:[ {kind:"suja", k:"skip", dan:3, level:"mid", title:"3씩 뛰어 세기 미로", label:"🌀 뛰어 세기 미로 (단 선택)"}, {kind:"href", href:"/math/gugudan/", label:"📋 곱셈표에서 규칙 찾기"} ] }
 ]}
};
var SEMESTERS=["1-1","1-2","2-1","2-2"];

/* 오늘 날짜로 '지금쯤 배우는 단원' — 3~7월은 1학기, 9~12월(+1·2월은 2학기 복습)으로 보고, 시작일이 지난 마지막 단원을 고른다.
   반환: {semKey, unit, idx, state:"on"|"break"} — 8월·1~2월은 방학(break)으로 직전 학기 마지막 단원 */
function currentUnit(grade, date){
  date=date||new Date();
  var m=date.getMonth()+1, md=("0"+m).slice(-2)+"-"+("0"+date.getDate()).slice(-2);
  var sem = (m>=3&&m<=8) ? 1 : 2;   /* 8월은 1학기 방학 */
  var key=grade+"-"+sem, S=MATH_UNITS[key]; if(!S) return null;
  var isBreak = (m===8) || (m===1) || (m===2);
  var idx=0;
  if(!isBreak){ for(var i=0;i<S.units.length;i++){ if(S.units[i].start<=md) idx=i; } }
  else idx=S.units.length-1;
  return { semKey:key, sem:S, unit:S.units[idx], idx:idx, state:isBreak?"break":"on" };
}
/* 딥링크 — 각 도구의 공유 포맷(v1/v2)과 같은 칸 수. 바뀌면 tests/test-units.js가 잡는다 */
function unitToolHref(t, base){
  base=base||"";
  if(t.kind==="href") return base+t.href;
  if(t.kind==="math") return base+"/math/#s="+encodeURIComponent(b64e(JSON.stringify([2,t.topic,t.level,t.nocarry?1:0,t.dan||0,"v",1,1,t.title,0])));
  if(t.kind==="suja") return base+"/maze/suja/#s="+encodeURIComponent(b64e(JSON.stringify([1,t.k,t.dan||2,t.level||"easy",1,1,t.title,0])));
  if(t.kind==="gugu") return base+"/gugudan/#s="+encodeURIComponent(b64e(JSON.stringify([1,t.dans,10,"mix","speak",5,1])));
  return base+"/math/";
}
if(typeof module!=="undefined") module.exports={ MATH_UNITS:MATH_UNITS, SEMESTERS:SEMESTERS, currentUnit:currentUnit, unitToolHref:unitToolHref };

/* '이번 주 진도' 코너 렌더 — 홈·수학 도구·단원 페이지 공용. opts={grade:고정 학년|null, base:사이트 루트까지 상대경로, scrollTo:단원 섹션으로 이동 링크}
   학년은 localStorage gb_grade에 기억 */
function renderUnitNow(box, opts){
  opts=opts||{}; var base=opts.base||"";
  var saved=null; try{ saved=+localStorage.getItem("gb_grade")||null; }catch(e){}
  var grade=opts.grade||saved||1;
  function draw(){
    var c=currentUnit(grade);
    if(!c){ box.innerHTML=""; return; }
    var u=c.unit, when = c.state==="break" ? "방학 — 지난 학기 마지막 단원 복습" : "지금쯤 배우는 단원";
    var links=(u.tools||[]).slice(0,2).map(function(t){ return '<a class="gobtn" data-unit="'+c.semKey+'-'+u.no+'" data-tool="'+t.kind+'" href="'+unitToolHref(t,base)+'">'+t.label.replace(/^[^\s]+\s/,"")+'</a>'; }).join("");
    var more='<a class="gobtn" href="'+base+'/math/unit/'+c.semKey+'/#u'+u.no+'">📖 단원 설명 보기</a>';
    var gbtn = opts.grade ? "" : '<div class="gbtns">'+[1,2].map(function(g){ return '<button type="button" data-g="'+g+'"'+(g===grade?' class="on"':'')+'>'+g+'학년</button>'; }).join("")+'</div>';
    box.innerHTML='<div>📚 <b>'+when+'</b> · '+c.sem.name+' <strong>'+u.name+'</strong> <small>(학교마다 2주 안팎 차이)</small></div>'+gbtn+'<div class="ubtns" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+links+more+'</div>';
  }
  box.addEventListener("click",function(e){
    var a=e.target.closest("a.gobtn[data-unit]");
    if(a){ if(typeof track==="function") track("unit_to_tool",{unit:a.getAttribute("data-unit"), tool:a.getAttribute("data-tool"), from:"now"}); return; }
    var b=e.target.closest("button[data-g]"); if(!b) return;
    grade=+b.getAttribute("data-g"); try{ localStorage.setItem("gb_grade",String(grade)); }catch(err){}
    if(typeof track==="function") track("unit_now_grade",{grade:grade}); draw();
  });
  draw();
}
