# Claude 도구 가이드

## 에이전트 사용법

### Climate Director 팀
| 에이전트 | 용도 | 호출 시점 |
|----------|------|-----------|
| climate-data-scientist | NDC 갭 분석, Kaya 분해, 추세 분석 | 데이터 분석/지표 설계 시 |
| sdg-paris-analyst | SDG 매핑, 파리협정 NDC 정합성 | 정책 분석 시 |
| issb-auditor | ISSB S2 공시 요구사항 매핑 | 프레임워크 감사 시 |

### Tech Architect 팀
| 에이전트 | 용도 | 호출 시점 |
|----------|------|-----------|
| etl-pipeline | 12개 소스 ETL | 데이터 수집 시 |
| api-manager | API 키/엔드포인트 관리 | API 상태 확인 시 |
| devops-infra | Vercel 배포, 모니터링 | 배포/인프라 시 |
| pdf-exporter | PDF 리포트 생성 | 리포트 생성 시 |

### Visual Designer 팀
| 에이전트 | 용도 | 호출 시점 |
|----------|------|-----------|
| d3-visualization | D3 차트 구현 | 차트 추가/수정 시 |
| ui-designer | Stripe-style UI | UI 구현 시 |

### Data Scientist 팀
| 에이전트 | 용도 | 호출 시점 |
|----------|------|-----------|
| data-quality-auditor | 교차 검증, 이상값 탐지 | 데이터 검증 시 |
| qa-validator | 빌드/타입/페이지 검증 | 배포 전 |
| physical-risk-analyst | TCFD 물리적 리스크 | 리스크 분석 시 |

### Growth Lead 팀
| 에이전트 | 용도 | 호출 시점 |
|----------|------|-----------|
| seo-content | SEO 메타, JSON-LD, 사이트맵 | SEO 작업 시 |

## 스킬 참조
- `/data-source-catalog` — 12개 소스 카탈로그 로드
- `/indicator-map` — 50+ 지표 매핑 로드
- `/issb-s2-mapping` — ISSB S2 + TCFD + GRI 305 매핑

## 커맨드 빠른 참조
```bash
# 데이터
/add-country KOR          # 새 국가 파이프라인
/data-audit KOR            # 데이터 품질 감사
/full-audit                # 전체 시스템 감사

# 콘텐츠
/generate-linkedin-card KOR emissions  # LinkedIn 카드
/linkedin-caption KOR emissions        # 캡션 3종
/daily-content KOR                     # 일일 콘텐츠

# 코드
/refactor-section src/app/page.tsx     # 컴포넌트 분할
/fix-broken-page /posters              # 버그 수정
/expand-explore                        # 250개국 확장

# 운영
/deploy                    # 빌드 → 커밋 → 푸시
/memory-save               # 세션 기억 저장
```

## 토큰 최적화 규칙
1. CLAUDE.md의 "작업별 파일 위치"를 먼저 확인. Glob/Grep 최소화.
2. 컴포넌트 400줄 초과 시 즉시 분할.
3. Agent Teams로 독립 작업은 병렬 실행.
4. 반복 작업은 /commands/ 사용.
5. Supabase 조회는 MCP 도구로 직접 실행.
6. 한 세션에서 context rot 감지 시 phase 분리.
