#!/bin/bash
cd ~/Documents/visualclimate

echo "=== STEP 0: CSS 유틸리티 ==="
claude --dangerously-skip-permissions -p "globals.css에 glow-green, glow-blue, glow-amber, glow-red, glass-card, gradient-text, hero-gradient, card-hover, float-anim CSS 유틸리티 클래스 추가. Google Fonts(Inter, JetBrains Mono) import도 추가. layout.tsx에 폰트 적용 확인. npm run build" --allowedTools "Bash,Read,Edit,Write"

echo "=== STEP 1: Hero 리디자인 ==="
claude --dangerously-skip-permissions -p "홈페이지 hero를 디자인시스템대로 리디자인. gradient bg, blur blobs, 큰 타이틀, 검색바, 스탯 카운터. 데이터로직 유지. npm run build" --allowedTools "Bash,Read,Edit,Write"

echo "=== STEP 2: Bento Grid + 국가카드 ==="
claude --dangerously-skip-permissions -p "홈페이지 Key Findings를 bento grid(grid-cols-4)로 변환. 64/72는 col-span-2 큰숫자, 414×는 col-span-1, 53.3%는 col-span-3 프로그레스바포함. Top Changers/Biggest Talkers에 accent line, 큰 rank숫자, grade badge 추가. 데이터로직 유지. npm run build" --allowedTools "Bash,Read,Edit,Write"

echo "=== STEP 3: Report Card 시각강화 ==="
claude --dangerously-skip-permissions -p "report card 페이지 리디자인. grade badge 120px 글로우 원형, 총점 72px mono CountUp, 5개 도메인을 색상별 카드+프로그레스바로, radar chart에 gradient fill+colored dots, 하단 CTA 2개 큰 카드. 데이터로직 유지. npm run build" --allowedTools "Bash,Read,Edit,Write"

echo "=== STEP 4: Country 차트 업그레이드 ==="
claude --dangerously-skip-permissions -p "country 페이지 모든 차트 시각 업그레이드. Sankey에 linearGradient 링크+둥근노드, 도넛에 radial gradient+그림자, 라인차트에 area fill+Paris 기준선, 바차트 둥근끝+gradient, 산점도에 하이라이트, Data Sources 테이블을 카테고리별 accordion으로. 데이터로직 유지. npm run build" --allowedTools "Bash,Read,Edit,Write"

echo "=== STEP 5: Posters 갤러리 ==="
claude --dangerously-skip-permissions -p "posters 페이지를 masonry grid 갤러리로 변환. 포스터타입 pill tabs, 선택국가의 모든 포스터 동시표시, hover overlay+download 버튼, featured 포스터 크게. 다운로드 로직 유지. npm run build" --allowedTools "Bash,Read,Edit,Write"

echo "=== STEP 6: Explore 필터링 ==="
claude --dangerously-skip-permissions -p "explore 페이지에 검색바, Changer/Starter/Talker 필터탭, 지역 드롭다운, 정렬 드롭다운 추가. 카드 디자인시스템대로 리디자인(accent line, grade badge, pill badge). 24개씩 Load More. Supabase 쿼리 유지. npm run build" --allowedTools "Bash,Read,Edit,Write"

echo "=== STEP 7: Header + Footer ==="
claude --dangerously-skip-permissions -p "Header를 sticky backdrop-blur로, 로고에 3원 SVG 추가, nav 5개(Report Card,Explore,Posters,Learn,About), CTA 버튼. Footer를 4컬럼 그리드로 리디자인. npm run build" --allowedTools "Bash,Read,Edit,Write"

echo "=== STEP 8: 배포 ==="
claude --dangerously-skip-permissions -p "npm run build && git add -A && git commit -m 'design: complete visual overhaul' && git push origin main && npx vercel --prod" --allowedTools "Bash,Read,Edit,Write"

echo "=== 전부 완료! ==="
