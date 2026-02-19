/** Maps ISO 3166-1 alpha-3 → alpha-2, then computes Unicode flag emoji */
const ISO3_ISO2: Record<string, string> = {
  ABW:'AW',AFG:'AF',AGO:'AO',AIA:'AI',ALB:'AL',AND:'AD',ARE:'AE',ARG:'AR',ARM:'AM',
  ASM:'AS',ATG:'AG',AUS:'AU',AUT:'AT',AZE:'AZ',BDI:'BI',BEL:'BE',BEN:'BJ',BFA:'BF',
  BGD:'BD',BGR:'BG',BHR:'BH',BHS:'BS',BIH:'BA',BLR:'BY',BLZ:'BZ',BMU:'BM',BOL:'BO',
  BRA:'BR',BRB:'BB',BRN:'BN',BTN:'BT',BWA:'BW',CAF:'CF',CAN:'CA',CHE:'CH',CHL:'CL',
  CHN:'CN',CIV:'CI',CMR:'CM',COD:'CD',COG:'CG',COK:'CK',COL:'CO',COM:'KM',CPV:'CV',
  CRI:'CR',CUB:'CU',CUW:'CW',CYM:'KY',CYP:'CY',CZE:'CZ',DEU:'DE',DJI:'DJ',DMA:'DM',
  DNK:'DK',DOM:'DO',DZA:'DZ',ECU:'EC',EGY:'EG',ERI:'ER',ESP:'ES',EST:'EE',ETH:'ET',
  FIN:'FI',FJI:'FJ',FLK:'FK',FRA:'FR',FRO:'FO',FSM:'FM',GAB:'GA',GBR:'GB',GEO:'GE',
  GHA:'GH',GIB:'GI',GIN:'GN',GLP:'GP',GMB:'GM',GNB:'GW',GNQ:'GQ',GRC:'GR',GRD:'GD',
  GRL:'GL',GTM:'GT',GUF:'GF',GUM:'GU',GUY:'GY',HKG:'HK',HND:'HN',HRV:'HR',HTI:'HT',
  HUN:'HU',IDN:'ID',IND:'IN',IRL:'IE',IRN:'IR',IRQ:'IQ',ISL:'IS',ISR:'IL',ITA:'IT',
  JAM:'JM',JOR:'JO',JPN:'JP',KAZ:'KZ',KEN:'KE',KGZ:'KG',KHM:'KH',KIR:'KI',KNA:'KN',
  KOR:'KR',KWT:'KW',LAO:'LA',LBN:'LB',LBR:'LR',LBY:'LY',LCA:'LC',LIE:'LI',LKA:'LK',
  LSO:'LS',LTU:'LT',LUX:'LU',LVA:'LV',MAC:'MO',MAR:'MA',MCO:'MC',MDA:'MD',MDG:'MG',
  MDV:'MV',MEX:'MX',MHL:'MH',MKD:'MK',MLI:'ML',MLT:'MT',MMR:'MM',MNE:'ME',MNG:'MN',
  MOZ:'MZ',MRT:'MR',MSR:'MS',MUS:'MU',MWI:'MW',MYS:'MY',NAM:'NA',NCL:'NC',NER:'NE',
  NGA:'NG',NIC:'NI',NIU:'NU',NLD:'NL',NOR:'NO',NPL:'NP',NRU:'NR',NZL:'NZ',OMN:'OM',
  PAK:'PK',PAN:'PA',PER:'PE',PHL:'PH',PLW:'PW',PNG:'PG',POL:'PL',PRI:'PR',PRK:'KP',
  PRT:'PT',PRY:'PY',PSE:'PS',QAT:'QA',REU:'RE',ROU:'RO',RUS:'RU',RWA:'RW',SAU:'SA',
  SDN:'SD',SEN:'SN',SGP:'SG',SLB:'SB',SLE:'SL',SLV:'SV',SMR:'SM',SOM:'SO',SRB:'RS',
  SSD:'SS',STP:'ST',SUR:'SR',SVK:'SK',SVN:'SI',SWE:'SE',SWZ:'SZ',SXM:'SX',SYC:'SC',
  SYR:'SY',TCD:'TD',TGO:'TG',THA:'TH',TJK:'TJ',TKM:'TM',TLS:'TL',TON:'TO',TTO:'TT',
  TUN:'TN',TUR:'TR',TUV:'TV',TWN:'TW',TZA:'TZ',UGA:'UG',UKR:'UA',URY:'UY',USA:'US',
  UZB:'UZ',VAT:'VA',VCT:'VC',VEN:'VE',VNM:'VN',VUT:'VU',WSM:'WS',YEM:'YE',ZAF:'ZA',
  ZMB:'ZM',ZWE:'ZW',ATF:'TF',ATA:'AQ',
};

export function iso3ToFlag(iso3: string): string {
  const iso2 = ISO3_ISO2[iso3.toUpperCase()];
  if (!iso2) return '🌐';
  return iso2
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('');
}
