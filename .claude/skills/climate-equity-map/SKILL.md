## Climate Equity Scatter Plot

### 데이터
- X축: OWID.CUMULATIVE_CO2 / SP.POP.TOTL (누적 CO₂ per capita, tonnes)
- Y축: NDGAIN.VULNERABILITY (0-1, 높을수록 취약)
- 점 크기: EN.GHG.CO2.PC.CE.AR5 latest (현재 연간 CO₂/capita)
- 점 색상: DERIVED.CLIMATE_CLASS (Changer=#10B981, Starter=#F59E0B, Talker=#EF4444)

### 처리
- 200개국 cross-join, NULL 제외
- 점 크기: min 4px, max 24px, sqrt scale
- 사분면 라벨:
  - 우상(높은배출+낮은취약) = "Historical Polluters"
  - 좌하(낮은배출+높은취약) = "Climate Victims"

### 시각화
- SVG 산점도, 호버 시 국가명+수치 툴팁
- 현재 국가 하이라이트 (큰 점 + 라벨 항상 표시)
- 대각선 추세선 (optional)

### 출력
- /public/data/equity-scatter.json (전체 200개국)
