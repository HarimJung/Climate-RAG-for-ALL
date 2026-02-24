## NDC Gap Tracker Methodology

### 데이터
- CO₂ per capita: Supabase indicator_data WHERE indicator_code = 'EN.GHG.CO2.PC.CE.AR5'
- NDC targets: Supabase ndc_targets 테이블 (ISO3, base_year, base_value, target_year, target_pct, target_abs)

### 계산
1. CAGR(2015-2023) = (value_2023/value_2015)^(1/8) - 1
2. Projected 2035 = value_2023 × (1 + CAGR)^12
3. Gap = Projected_2035 - NDC_target_2035
4. Gap % = Gap / value_2023 × 100
5. Achievement probability = P(projected ≤ target) using historical std_dev (2015-2023)
   - z = (target - projected) / (std_dev × √12)
   - probability = Φ(z) using normal CDF

### 시각화
- 라인차트: X=2000-2035, Y=CO₂/capita
- 2023까지 실선, 2024-2035 점선 (현재추세)
- NDC 목표점: 빨간 다이아몬드
- 갭 영역: 빨간 반투명 fill
- 신뢰구간: ±1σ 회색 밴드

### 출력
- /public/data/ndc-gap/{ISO3}.json
