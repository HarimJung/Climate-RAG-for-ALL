# DB 스키마 + JSON 파일 구조

## Supabase 테이블

### countries (250행)
```sql
id          SERIAL PRIMARY KEY
iso3        CHAR(3) UNIQUE NOT NULL
name        TEXT NOT NULL
region      TEXT
sub_region  TEXT
income_group TEXT
population  BIGINT
lat         DECIMAL
lng         DECIMAL
flag_url    TEXT
created_at  TIMESTAMPTZ DEFAULT NOW()
iso2        CHAR(2)
```

### indicators (67행)
```sql
id          SERIAL PRIMARY KEY
source      TEXT NOT NULL
code        TEXT UNIQUE NOT NULL
name        TEXT NOT NULL
unit        TEXT
category    TEXT
domain      TEXT
issb_s2_ref TEXT
sdg_target  TEXT
created_at  TIMESTAMPTZ DEFAULT NOW()
```

### country_data (172,121행)
```sql
id            SERIAL PRIMARY KEY
country_iso3  CHAR(3) REFERENCES countries(iso3)
indicator_code TEXT REFERENCES indicators(code)
year          INTEGER NOT NULL
value         DECIMAL
source        TEXT
created_at    TIMESTAMPTZ DEFAULT NOW()
```

## 주요 indicator_code 패턴
- `WB.*` — World Bank WDI (경제, 인구, CO2)
- `EMBER.*` — Ember 전력 데이터
- `OWID.*` — Our World in Data 에너지
- `NDGAIN.*` — ND-GAIN 취약성/준비도
- `CTRACE.*` — Climate TRACE 부문별 배출 (POWER, TRANSPORTATION 등 9개)
- `DERIVED.*` — 파생 지표 (CO2_PER_GDP, ENERGY_TRANSITION 등)

## JSON 파일 구조

### Kaya LMDI (public/data/kaya/) — 68파일
파일명: `{ISO3}.json`
```json
{
  "country": "KOR",
  "years": [2000, 2001, ...],
  "factors": {
    "population": [...],
    "gdp_per_capita": [...],
    "energy_intensity": [...],
    "carbon_intensity": [...]
  },
  "decomposition": {
    "population_effect": [...],
    "activity_effect": [...],
    "intensity_effect": [...],
    "carbon_effect": [...]
  }
}
```

### NDC Gap (public/data/ndc-gap/) — 204파일
파일명: `{ISO3}.json`
```json
{
  "country": "KOR",
  "ndc_target_year": 2030,
  "ndc_reduction_pct": -40,
  "base_year": 2018,
  "base_emissions": 727.6,
  "target_emissions": 436.6,
  "current_trajectory": [...],
  "gap": 150.2
}
```

### Risk Profile (public/data/) — 6파일
파일명: `risk-profile-{ISO3}.json`
국가: KOR, USA, DEU, BRA, NGA, BGD만 존재

### Emissions Trend (public/data/analysis/)
6개 국가만 존재 → 나머지 국가는 인사이트 텍스트 없음
