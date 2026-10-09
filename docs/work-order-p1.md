# P1 Work Order — Astro rebuild

목표: mingalaredu.com 을 국가 허브 → 유학 상품 상세 → 질문 페이지 구조의 정적 사이트로 재구축. 브랜드는 Mingalar Edu 하나 (One to Korea/OTK 금지). 색 navy #1E3A5F, gold #D4A843 유지.

## 기술
- Astro 최신 안정판 + Tailwind 빌드(CDN 금지), output static, @astrojs/sitemap.
- GitHub Actions 배포 워크플로 .github/workflows/deploy.yml 추가. public/CNAME = mingalaredu.com.
- 언어 /en/ , /my/ (버마어). 루트 / 는 언어 선택 + x-default=/en/. 모든 페이지 hreflang 상호참조. 버마어는 Noto Sans Myanmar 자체 호스팅, line-height 1.8, 유니코드만.
- 모든 본문·표·FAQ·JSON-LD 는 JS 없이 HTML에 있어야 함. JSON-LD는 화면 텍스트와 같은 데이터에서 생성.
- 전역 Organization(@id https://mingalaredu.com/#org) 1회 + 페이지별 BreadcrumbList, FAQPage, 질문 페이지 Article(author Steven).
- 페이지별 고유 title(50~60자)·description(150~160자)·canonical·OG. robots.txt(기존 내용 유지, Sitemap은 sitemap-index.xml), llms.txt 갱신, 실제 404 페이지.

## 데이터 (src/data/*.json 에서만 숫자·학교·가격을 읽음. 모르는 값은 "TODO" → 화면엔 "Contact us")
- site.json: brand "Mingalar Edu", phone "+959966042973", phone_display "09 966 042 973", email info@mingalaredu.com, channels 순서 telegram https://t.me/+959966042973 → viber viber://chat?number=%2B959966042973 → messenger https://m.me/693815550488674, reviewer "Steven", fx {usd_mmk:"TODO", asof:"TODO"}
- countries.json 순서: china(1), europe(2: Spain·Switzerland·Germany), korea(3)
- schools.json: Zhejiang University, Xi'an Jiaotong University, Fudan University (English programme), Xi'an Jiaotong-Liverpool University, University of Nottingham Ningbo China, Jiangsu University, Beijing Information Science and Technology University, EU Business School (Barcelona, Geneva, Munich, Digital), Jeju Tourism University, TUN YADANAR School (Mandalay, education partner). 학비·요건 숫자는 TODO.
- products.json: CN-BACH-2027 (중국 명문대 학사, 학교 7개), EU-BACH-2027 (EU Business School 학사, 2027-02 입학), KR-JTU-2027 (Jeju Tourism University, 2027-03 입학). includes: shortlist, documents, application, admissions follow-up, visa documents, pre-departure. excludes: tuition, school application fee, translation/notary, flight, insurance, housing.
- fees.json: status "draft", currency USD, asof 2026-10-09. CN-BACH stage1 100 / stage2 800, EU-BACH 100 / 1200, KR-JTU 100 / 800, 불합격 시 stage2 = 0. discount: 300,000 MMK voucher, valid_until 2027-09-30. status가 draft면 운영 빌드에서 수수료 표 대신 "Fees: contact us" (환경변수 SHOW_DRAFT_FEES=1 일 때만 숫자 표시).
- 모든 비용·요건 항목에 source(URL)·asof 필수. 누락 시 빌드 경고.

## 페이지 템플릿
- 홈: 히어로 직답 + "Find my program" 버튼 · 국가 카드(중국·유럽·한국 순 크게) · 상품 카드 3 · 진행 3단계 · 학교 목록 · FAQ 5(기존 FAQ 재사용, "free re-application support" 문구는 제거) · CTA
- 국가 허브 /[lang]/study-in-[country]/: 상단 고정 점프내비 · 직답 문단 · 상품 카드 · 비용 표(TODO 허용) · 입학 시기 · 비자 단계 · FAQ · "Reviewed by Steven · Last updated"
- 상품 상세 /[lang]/study-in-[country]/[product]/ (하나투어형): 상품코드 · 이름+태그+상태 배지 · 요약 카드(데스크톱 우측 sticky / 모바일 하단 시트: 기간·입학시기·수수료·CTA) · 탭(소개/일정 타임라인/포함·불포함/학교/약관·유의사항) · "공식 계좌·영수증만 유효" 경고 · 메신저 버튼 위 "Mention code: <상품코드>"
- 질문 페이지 /[lang]/guide/[slug]/ : content/guide/*.md, frontmatter(question, answer, data_asof, sources, faq, related, reviewer). 템플릿 + 샘플 1개("How much does Mingalar Edu charge?", fees 사용).
- 도구 /[lang]/tools/find-my-program/: 질문 5~6개 → 추천 상품 1~3 + 메신저 CTA, 클라이언트 계산, 개인정보 저장 안 함.
- /my/ 문구는 영어 원문 유지 + <!-- TODO: Burmese translation --> (번역은 별도 PR).

## 반응형
- 모바일(<768px): 1단, 하단 고정 바 Telegram·Viber·Messenger(높이 56px, 터치 44px+), 표는 카드 전환 또는 가로 스크롤.
- 데스크톱(≥1024px): 최대 폭 1200px, 본문 2/3 + 우측 sticky 요약 카드.
- 이미지 WebP + width/height, 자동재생 영상 금지, 대비 4.5:1 이상, 상태 배지는 글자 포함.

금지: 출처 없는 통계, 보장 표현(guarantee/100%/합격 보장), 경쟁사 비교, 가상 후기, OTK 표기.

## 수용 기준 (PR 본문에 결과 첨부)
- npm run build 성공
- dist/en/index.html, dist/my/index.html, dist/en/study-in-china/index.html, dist/en/study-in-china/china-top-universities-bachelor/index.html 존재, 각각 ld+json 1개 이상
- grep -ri "one to korea\|otk\|guarantee" dist → 결과 없음
- 운영 빌드에서 수수료 숫자 미노출, SHOW_DRAFT_FEES=1 빌드에서는 노출
- 가능하면 Lighthouse 모바일 점수 첨부
