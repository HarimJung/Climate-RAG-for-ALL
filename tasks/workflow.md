# VisualClimate Workflow Reference

> CLAUDE.md에서 분리된 상세 참조 문서. 필요 시 로드.

---

## Subagents (14개 — Phased Rollout)

| # | Name | Role | Phase | Model |
|---|------|------|-------|-------|
| 1 | etl-pipeline | 12개 소스 ETL, API 호출, Supabase 저장 | 0 | inherit |
| 2 | api-manager | API 키/속도 제한/헬스 체크/citations.json | 0 | sonnet |
| 3 | report-embedder | PDF→chunk→pgvector 임베딩 | 1 | sonnet |
| 4 | data-quality-auditor | 교차 소스 검증, 이상치, 품질 점수 | 1 | inherit |
| 5 | climate-data-scientist | 파생 지표, 통계 분석, 추세 분해 | 2 | opus |
| 6 | issb-auditor | ISSB S2 매핑, 프레임워크 준수 매트릭스 | 2 | inherit |
| 7 | sdg-paris-analyst | SDG/NDC/파리협정 매핑 | 2 | sonnet |
| 8 | physical-risk-analyst | TCFD 물리적 위험 분석, CMIP6 시나리오 | 2 | sonnet |
| 9 | d3-visualization | D3 차트(choropleth, line, bar, radar, Sankey) | 3 | inherit |
| 10 | ui-designer | Stripe 스타일 다크 테마 UI, 컴포넌트 시스템 | 3 | inherit |
| 11 | seo-content | 메타태그, JSON-LD, 사이트맵, 랜딩 카피 | 4 | sonnet |
| 12 | pdf-exporter | 국가 리포트 PDF 생성 파이프라인 | 4 | sonnet |
| 13 | qa-validator | 빌드/타입/데이터/페이지 검증, qa-report.md | 0 | inherit |
| 14 | devops-infra | Vercel 배포, 환경변수, 모니터링, 보안 | 4 | sonnet |

에이전트 파일 위치: `.claude/agents/{name}.md`
해당 Phase 도달 시 생성. 미리 만들지 않는다.

---

## Phase 0 Checklist

```
□ cd ~/Documents/visualclimate
□ claude 실행, /rename phase0-infra-setup
□ claude mcp list → supabase, sequential-thinking, context7 확인
□ Supabase 테이블 생성 (IF NOT EXISTS): countries, indicators, country_data
□ 6개국 시드 데이터 삽입 → SELECT COUNT(*) FROM countries = 6
□ 핵심 지표 시드 삽입 → SELECT COUNT(*) FROM indicators 확인
□ npm run build → 성공 확인
□ qa-report.md에 Phase 0 결과 기록
□ tasks/data-pipeline-log.md에 초기 로그 기록
```

## Phase 1 Checklist

```
□ /clear (Phase 전환)
□ /rename phase1-data-collection
□ etl-pipeline 서브에이전트에 WDI 수집 위임
□ 6개국 × 핵심 지표, 2000–2023
□ 매 API 호출마다 HTTP 상태 + 반환 row count 로깅
□ 완료 시: SELECT COUNT(*) FROM country_data GROUP BY indicator_code, country_iso3
□ npm run build
□ qa-report.md에 Phase 1 결과 기록
```

## Phase 2 Checklist

```
□ /clear
□ /rename phase2-qa-analysis
□ data-quality-auditor로 교차 검증
□ climate-data-scientist로 파생 지표 계산
□ issb-auditor로 프레임워크 매핑
□ 품질 점수 < 0.70 국가 식별 및 차단
□ qa-report.md에 Phase 2 결과 기록
```

---

## Antigravity 협업

### Phase 0–2: Claude Code 단독
- Antigravity는 보조 리서치만 (코드 수정 금지)
- 결과물은 `docs/drafts/` 또는 `mockups/`에만 저장

### Phase 3–4: 제한적 병행
- Antigravity: 디자인 시안(`mockups/`), 카피(`docs/drafts/`)
- Claude Code: 코드 구현 (`src/**/*`)
- 커뮤니케이션: Antigravity → `docs/drafts/` 작성 → Claude Code 읽기

### 파일 충돌 방지
1. 작업 전 → 대상 파일 소유권 확인
2. 충돌 감지 → 즉시 중단 → tasks/lessons.md에 기록
3. 재시도 → `/clear` 후 소유권 재확인

---

## Directory Structure

```
visualclimate/
├── CLAUDE.md                    # 핵심 규칙 (~100줄, 항상 로딩)
├── GEMINI.md                    # Antigravity 규칙 (수정 금지)
├── .claude/
│   ├── agents/                  # 서브에이전트 (Phase별 생성)
│   └── skills/                  # 스킬 5개 (on-demand)
├── src/
│   ├── app/                     # Next.js App Router pages
│   └── components/
│       └── charts/              # D3 차트 컴포넌트
├── tasks/
│   ├── workflow.md              # 이 파일
│   ├── lessons.md               # 에러/교훈 누적 기록
│   └── data-pipeline-log.md     # ETL 실행 로그
├── data/                        # 데이터 파일 (Phase 1+)
├── mockups/                     # Antigravity 전용
├── docs/drafts/                 # 에이전트 간 커뮤니케이션
└── qa-report.md                 # QA 검증 결과
```

---

## Session Management

- 새 세션: `claude` → `/rename phase{N}-{task}`
- 이어하기: `claude --continue` (최근) 또는 `claude --resume` (선택)
- Phase 전환 시: 반드시 `/clear`
- 컨텍스트 무거울 때: `/compact`

### 병렬 실행 (Git Worktrees)
```bash
git worktree add ../visualclimate-phase1 phase-1/data-collection
cd ../visualclimate-phase1 && claude
```
같은 파일을 두 세션에서 동시 수정 금지.

---

## Reference URLs

- World Bank WDI API: https://api.worldbank.org/v2/
- Climate Watch API: https://www.climatewatchdata.org/api/v1/
- Climate TRACE API: https://api.climatetrace.org
- Supabase MCP: https://supabase.com/docs/guides/getting-started/mcp
