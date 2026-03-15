# 디자인 시스템

## 테마
라이트 전용. 다크 테마 절대 금지.

## 색상
| 용도 | 값 |
|------|-----|
| Primary | #0066FF |
| Changer | #00A67E |
| Starter | #F59E0B |
| Talker | #E5484D |
| Background | #FFFFFF |
| Section BG | #F8F9FA |
| Text Primary | #1A1A2E |
| Text Secondary | #4A4A6A |
| Text Muted | #8888A0 |
| Border | #E5E7EB |

## 금지 색상
bg-slate-900, bg-slate-800, #0a0a1a, #0d1117 — 절대 사용 금지

## 타이포그래피
- 본문: Inter
- 데이터/코드: JetBrains Mono

## 간격
4px 단위 (Tailwind 기본 spacing)

## 컴포넌트 규칙
- 파일 제한: 컴포넌트당 400줄 이하
- 400줄 초과 시 즉시 분할
- 별칭: @/ = src/

## UI 컴포넌트 (src/components/climate/)
- PageWrapper — 페이지 레이아웃 래퍼
- HeroSection — 히어로 영역
- SectionHeader — 섹션 제목
- ChartCard — 차트 카드 래퍼
- ScrollFadeIn — 스크롤 페이드인 애니메이션
- SummaryFan — 요약 팬 카드
- StoryBlock — 스토리 블록
- BentoGrid — 벤토 그리드 레이아웃

## CountryClient 내부 프리미티브
- Card — 카드 래퍼
- SectionTitle — 섹션 제목
- InsightText — 인사이트 텍스트
- StatCard — 통계 카드
- SourceLabel — 출처 라벨
- SafeChart — ErrorBoundary wrapper (모든 차트를 감쌈)
