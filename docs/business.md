# 비즈니스 모델

## 가격 체계
| 레이어 | 가격 | 내용 |
|--------|------|------|
| Free | $0 | 성적표, 6종 포스터 PNG, LinkedIn 카드 |
| PDF Report | $49/국가 | 20페이지 상세 보고서 (Hormozi 100:1 가치 비율) |
| API/Widget | $199-$999/월 | REST API + 임베드 위젯 |
| Consulting | $10K-$100K | NDC 분석, ISSB S2 매핑, 맞춤 대시보드 |

## 크론잡 자동화
```json
{
  "crons": [
    { "path": "/api/cron/daily-content", "schedule": "0 0 * * *" },
    { "path": "/api/cron/weekly-audit", "schedule": "0 21 * * 0" },
    { "path": "/api/cron/source-check", "schedule": "0 21 * * 2" }
  ]
}
```

## 수익화 로드맵 (Phase 4)
1. Supabase Auth 구현
2. Stripe Checkout (PDF 보고서)
3. Stripe Subscription (API)
4. REST API v1 엔드포인트 4개
5. Product Hunt 런칭

## 전략 보강 필요
- 브랜딩 확정 (태그라인, 톤, 로고 시안)
- 컨설팅 딜리버러블 상세 정의
- 수익 예측 벤치마크 (시장 규모, 전환율 근거)
