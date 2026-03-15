# VisualClimate TODO
# 마지막 업데이트: 2026-03-15

## P0 버그 및 UI 개선 (Phase 1)
| # | 항목 | 유형 | 수정 방향 | 상태 |
|---|------|------|-----------|------|
| 1 | 홈 CTA 묻힘 | UI 재설계 | 히어로+검색창 중앙 배치 (docs/pages-spec.md 참조) | [ ] |
| 2 | 네비게이션 과다 | UI 재설계 | Home, Explore, Posters 3개만. 나머지 푸터 | [ ] |
| 3 | Report Card 내러티브 없음 | 기능 추가 | 등급뱃지 + So What 텍스트 | [ ] |
| 4 | Explore 24/250 | 버그 | 250개국 + 필터 + Compare 연결 | [ ] |
| 5 | Posters 맵 에러 | 버그 | try-catch + fallback SVG | [ ] |
| 6 | Transition Race 에러 | 버그 | 에러 바운더리 + 재시도 | [ ] |
| 7 | LinkedIn Sankey 크기 | 버그 | width=960 height=700, 패딩 제거 | [ ] |
| 8 | PostersClient.tsx 841줄 | 기술부채 | 400줄 이하로 분할 | [ ] |
| 9 | 모든 페이지 하단 CTA 없음 | UI 추가 | 다음 행동 유도 버튼 | [ ] |

## 실행 로드맵

### Phase 1 (1-2주): UI 구조 재설계 + 버그 수정
- [ ] CLAUDE.md v3 적용 완료
- [ ] 네비게이션 정리
- [ ] 홈 재설계
- [ ] Report Card에 등급 뱃지 + So What 텍스트
- [ ] Explore 250개국 + 필터 + Compare 연결
- [ ] Posters 에러 수정 + 재구성
- [ ] LinkedIn Sankey 크기 수정
- [ ] PostersClient.tsx 분할
- [ ] 모든 페이지 하단 CTA 추가
- [ ] 첫 LinkedIn 카드 + 캡션 생성 및 발행

### Phase 2 (3-4주): 콘텐츠 + 비교 강화
- [ ] Compare 페이지 완성
- [ ] LinkedIn 카드 6종 타입 완성
- [ ] 추가 커맨드 6개 생성
- [ ] Report Card 자동 내러티브 고도화

### Phase 3 (5-8주): Insights + 자동화
- [ ] Insights 5개 데이터 스토리 작성
- [ ] 일일 콘텐츠 자동화 (Vercel Cron)
- [ ] Claude 스킬 패키징 및 공유

### Phase 4 (9-12주): 수익화
- [ ] Supabase Auth 구현
- [ ] Stripe Checkout (PDF 보고서)
- [ ] Stripe Subscription (API)
- [ ] REST API v1 엔드포인트 4개
- [ ] Product Hunt 런칭

### Phase 5 (4-6개월): 확장
- [ ] Kaya LMDI 250개국 확장
- [ ] ESG 파트너십
- [ ] 컨설팅 패키지 런칭

## 전략 보강 필요
- [ ] 브랜딩 확정 (태그라인, 톤, 로고 시안)
- [ ] 컨설팅 딜리버러블 상세 정의
- [ ] 멀티플랫폼 전략 (Reddit, X, Substack)
- [ ] 스코어링 방법론 개선 (CO2/GDP 중복, percentile 전환)
- [ ] 수익 예측 벤치마크
