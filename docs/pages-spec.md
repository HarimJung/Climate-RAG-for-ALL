# 페이지별 스펙 (유저 플로우 기반)

## 홈 (/)
**목적**: 유저가 10초 안에 "검색하거나 둘러보거나" 선택할 수 있게
**현재 문제**: CTA 묻힘, 링크 과다, 뭘 해야 하는지 불명확
**필수 UI 요소**:
- 히어로: 한 줄 카피 + 검색창(중앙, 가장 큰 요소) + "250개국 기후 성적표"
- 검색창 아래: 인기 국가 6개 태그 (KOR, USA, CHN, DEU, IND, BRA)
- 스크롤 시: 글로벌 스코어보드 맵 (선택 시 해당 국가 Report Card로 이동)
- 하단: 핵심 수치 바 (250 countries, 61 indicators, 172K+ datapoints)
- **제거**: 현재 홈의 과도한 카드/리스트 정리

## Report Card (/report/[ISO3])
**목적**: 한 나라의 기후 성적을 한눈에 보여주고, 공유 가능한 차트 제공
**현재 문제**: 내러티브 없음, 숫자만 나열, "그래서 뭐?" 답 없음
**필수 UI 요소**:
- 상단 히어로: 국기 + 국가명 + 등급 뱃지(A+~F) + 분류(Changer/Starter/Talker) + 한 줄 요약
- 레이더 차트: 5개 도메인 한눈에 비교
- 5개 도메인 섹션 (각각):
  - 점수 + 등급
  - 차트 (기존 분리된 charts/ 컴포넌트 사용)
  - "So What?" 해석 텍스트 (2-3문장, 데이터 기반 자동 생성)
  - "포스터로 저장" 버튼 (PNG)
- 하단 CTA: "다른 나라 보기" (검색창) + "비교하기" (Compare 링크)

## Explore (/explore)
**목적**: 250개국 전체를 훑어보고 비교 대상을 고르는 곳
**현재 문제**: 24개국만 표시, 필터 없음, Compare 연결 없음
**필수 UI 요소**:
- 상단: 검색 + 필터 바 (지역, 소득수준, 등급, 분류)
- 테이블: 250개국, 컬럼 = 국가명, 등급, 분류, 종합점수, 5개 도메인 점수
- 정렬: 각 컬럼 클릭 시 오름/내림차순
- 체크박스: 2-4개국 선택 → 상단에 "Compare Selected" 버튼 활성화
- 하단: CSV 다운로드 버튼
- 각 국가명 클릭 → 해당 Report Card로 이동

## Posters (/posters)
**목적**: 공유 가능한 1080x1080 차트 이미지를 뽑는 곳
**현재 문제**: 맵 로딩 에러, Transition Race 에러
**필수 UI 요소**:
- 국가 드롭다운 (250개국)
- 6종 포스터 타입 선택 (emissions, energy-mix, paris-gap, transition-race, carbon-inequality, air-quality)
- 선택 시 미리보기 렌더링
- 각 포스터 하단: "Download PNG" + "Share on LinkedIn" 버튼
- 에러 시: fallback 메시지 + 다른 포스터 추천 (맵 깨져도 페이지 전체가 죽지 않게)

## Compare (/compare)
**목적**: 선택한 2-4개국을 나란히 비교
**필수 UI 요소**:
- 상단: 선택된 국가 태그 + "국가 추가" 드롭다운
- 레이더 차트: 선택 국가 오버레이
- 도메인별 비교 테이블
- CSV 다운로드

## 기타 페이지
| 페이지 | 위치 | 상태 |
|--------|------|------|
| Insights (/insights) | 푸터 링크 | Phase 3에서 5개 스토리 작성 |
| Methodology (/methodology) | 푸터 링크 | 작동, 유지 |
| About (/about) | 푸터 링크 | 작동, 유지 |
| Learn (/learn) | 푸터 링크 | 작동, 유지 |
| Dashboard (/dashboard) | 삭제 검토 | Report Card에 통합 가능 |
| Library (/library) | 삭제 검토 | 사용 안 됨 |
| Guides (/guides) | 푸터 링크 | SEO용 유지 |
| LinkedIn Card (/linkedin/[iso3]/[type]) | 내부용 | 직접 접근 불필요, 생성 도구용 |
