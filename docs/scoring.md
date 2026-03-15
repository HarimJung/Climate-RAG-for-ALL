# 스코어링 방법론

## 정규화
(value - min) / (max - min) x 100. 역방향 지표는 100 - norm.

## 도메인 가중치
| 도메인 | 가중치 | 지표 |
|--------|--------|------|
| Emissions | 30% | CO2/capita(50%), CO2/GDP(30%), Decoupling(20%) |
| Energy | 25% | Renewable %(60%), Grid carbon intensity(40%) |
| Economy | 15% | GDP/capita(50%), CO2/GDP(50%) |
| Responsibility | 15% | 누적 CO2 비중(100%) |
| Resilience | 15% | ND-GAIN readiness(60%), vulnerability(40%) |

## 등급
| 등급 | 점수 범위 |
|------|-----------|
| A+ | 90-100 |
| A | 80-89 |
| B+ | 70-79 |
| B | 60-69 |
| C+ | 50-59 |
| C | 40-49 |
| D | 25-39 |
| F | 0-24 |

## 분류
| 분류 | 기준 | 국가 수 |
|------|------|---------|
| Changer | CO2 감소 + 재생에너지 증가 | 64개국 |
| Starter | 한쪽만 개선 | 80개국 |
| Talker | 파리협정 서명했으나 측정 가능한 진전 없음 | 72개국 |

## 개선 검토 사항
- CO2/GDP가 Emissions(30%)과 Economy(50%) 양쪽에 중복 → 비중 재검토 필요
- min-max 정규화 → percentile 전환 검토
