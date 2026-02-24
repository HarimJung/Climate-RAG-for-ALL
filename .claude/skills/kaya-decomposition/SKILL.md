## Kaya Identity LMDI Decomposition

### 공식
CO₂ = Pop × (GDP/Pop) × (Energy/GDP) × (CO₂/Energy)

### 데이터 매핑
- Pop: SP.POP.TOTL
- GDP/Pop: NY.GDP.PCAP.CD
- Energy/Pop: EG.USE.PCAP.KG.OE
- CO₂/Energy: EMBER.CARBON.INTENSITY 또는 DERIVED

### LMDI 방법
ΔCO₂_factor = Σ_t [ L(CO₂_t, CO₂_t-1) × ln(factor_t / factor_t-1) ]
where L(a,b) = (a-b) / (ln(a)-ln(b))

### 검증
- 4요소 기여분 합 = 실제 CO₂ 변화량 (허용 오차 ±2%)
- 데이터 없는 국가는 skip, 로그에 기록

### 시각화
- 워터폴 차트: 시작(2015 CO₂) → Pop효과 → GDP효과 → Energy효과 → Carbon효과 → 끝(2023 CO₂)
- 초록(감소 기여), 빨강(증가 기여)
- 각 막대에 숫자 라벨

### 출력
- /public/data/kaya/{ISO3}.json
