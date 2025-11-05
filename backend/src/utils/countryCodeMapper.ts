/**
 * FIDE to ISO Country Code Mapper
 * Maps FIDE's 3-character country codes to ISO 3166-1 alpha-2 codes
 * Used for flag emoji display and standardization
 */

export const FIDE_TO_ISO: Record<string, string> = {
  // Major chess countries
  USA: 'US',
  RUS: 'RU',
  CHN: 'CN',
  IND: 'IN',
  UKR: 'UA',
  FRA: 'FR',
  GER: 'DE',
  ESP: 'ES',
  NOR: 'NO',
  NED: 'NL',
  POL: 'PL',
  AZE: 'AZ',
  HUN: 'HU',
  CZE: 'CZ',
  ENG: 'GB', // England -> Great Britain for emoji
  IRI: 'IR', // Iran
  UZB: 'UZ',
  VIE: 'VN', // Vietnam
  CRO: 'HR', // Croatia
  ROU: 'RO',
  ISR: 'IL',
  SWE: 'SE',
  MEX: 'MX',
  TUR: 'TR',
  ARM: 'AM',
  SRB: 'RS',
  AUT: 'AT',
  GRE: 'GR',
  SLO: 'SI', // Slovenia
  BUL: 'BG',

  // Special/International codes
  FID: 'FD', // FIDE (players representing FIDE directly, not a specific country)

  // Add more as needed - comprehensive list
  AFG: 'AF',
  ALB: 'AL',
  ALG: 'DZ', // Algeria
  AND: 'AD',
  ANG: 'AO', // Angola
  ANT: 'AG', // Antigua and Barbuda
  ARG: 'AR',
  ARU: 'AW', // Aruba
  AUS: 'AU',
  BAH: 'BS', // Bahamas
  BAN: 'BD', // Bangladesh
  BAR: 'BB', // Barbados
  BDI: 'BI', // Burundi
  BEL: 'BE',
  BEN: 'BJ',
  BER: 'BM', // Bermuda
  BIH: 'BA', // Bosnia and Herzegovina
  BLR: 'BY', // Belarus
  BOL: 'BO',
  BOT: 'BW', // Botswana
  BRA: 'BR',
  BRN: 'BH', // Bahrain
  BRU: 'BN', // Brunei
  CAM: 'KH', // Cambodia
  CAN: 'CA',
  CAY: 'KY', // Cayman Islands
  CGO: 'CG', // Congo
  CHI: 'CL', // Chile
  CIV: 'CI', // Ivory Coast
  CMR: 'CM', // Cameroon
  COL: 'CO',
  CRC: 'CR', // Costa Rica
  CUB: 'CU',
  CYP: 'CY',
  DEN: 'DK', // Denmark
  DOM: 'DO', // Dominican Republic
  ECU: 'EC',
  EGY: 'EG',
  ESA: 'SV', // El Salvador
  EST: 'EE',
  ETH: 'ET',
  FAI: 'FO', // Faroe Islands
  FIJ: 'FJ',
  FIN: 'FI',
  GAB: 'GA', // Gabon
  GCI: 'GG', // Guernsey
  GEO: 'GE',
  GHA: 'GH',
  GRN: 'GD', // Grenada
  GUA: 'GT', // Guatemala
  GUM: 'GU',
  GUY: 'GY',
  HAI: 'HT', // Haiti
  HKG: 'HK', // Hong Kong
  HON: 'HN', // Honduras
  INA: 'ID', // Indonesia
  IRL: 'IE',
  IRQ: 'IQ',
  ISL: 'IS', // Iceland
  ISV: 'VI', // US Virgin Islands
  ITA: 'IT',
  IVB: 'VG', // British Virgin Islands
  JAM: 'JM',
  JCI: 'JE', // Jersey
  JOR: 'JO',
  JPN: 'JP',
  KAZ: 'KZ',
  KEN: 'KE',
  KGZ: 'KG', // Kyrgyzstan
  KOR: 'KR', // South Korea
  KOS: 'XK', // Kosovo
  KSA: 'SA', // Saudi Arabia
  KUW: 'KW',
  LAO: 'LA',
  LAT: 'LV', // Latvia
  LBA: 'LY', // Libya
  LBN: 'LB', // Lebanon
  LBR: 'LR', // Liberia
  LCA: 'LC', // Saint Lucia
  LES: 'LS', // Lesotho
  LIE: 'LI',
  LTU: 'LT',
  LUX: 'LU',
  MAC: 'MO', // Macau
  MAD: 'MG', // Madagascar
  MAR: 'MA', // Morocco
  MAS: 'MY', // Malaysia
  MAW: 'MW', // Malawi
  MDA: 'MD', // Moldova
  MKD: 'MK', // North Macedonia
  MLI: 'ML',
  MLT: 'MT',
  MNC: 'MC', // Monaco
  MNE: 'ME', // Montenegro
  MON: 'MN', // Mongolia
  MOZ: 'MZ', // Mozambique
  MRI: 'MU', // Mauritius
  MTN: 'MR', // Mauritania
  MYA: 'MM', // Myanmar
  NAM: 'NA', // Namibia
  NCA: 'NI', // Nicaragua
  NEP: 'NP',
  NGR: 'NG', // Nigeria
  NIG: 'NE', // Niger
  NZL: 'NZ',
  OMA: 'OM',
  PAK: 'PK',
  PAN: 'PA',
  PAR: 'PY', // Paraguay
  PER: 'PE',
  PHI: 'PH', // Philippines
  PLE: 'PS', // Palestine
  PNG: 'PG', // Papua New Guinea
  POR: 'PT',
  PRK: 'KP', // North Korea
  PUR: 'PR', // Puerto Rico
  QAT: 'QA',
  RSA: 'ZA', // South Africa
  RWA: 'RW',
  SCO: 'GB', // Scotland -> Great Britain for emoji
  SEN: 'SN',
  SEY: 'SC', // Seychelles
  SIN: 'SG', // Singapore
  SKN: 'KN', // Saint Kitts and Nevis
  SLE: 'SL', // Sierra Leone
  SMR: 'SM', // San Marino
  SOL: 'SB', // Solomon Islands
  SOM: 'SO',
  SRI: 'LK', // Sri Lanka
  SUD: 'SD',
  SUI: 'CH', // Switzerland
  SUR: 'SR', // Suriname
  SVK: 'SK', // Slovakia
  SWZ: 'SZ', // Eswatini
  SYR: 'SY',
  TAN: 'TZ', // Tanzania
  TGA: 'TO', // Tonga
  THA: 'TH',
  TJK: 'TJ', // Tajikistan
  TKM: 'TM', // Turkmenistan
  TLS: 'TL', // Timor-Leste
  TOG: 'TG', // Togo
  TRI: 'TT', // Trinidad and Tobago
  TUN: 'TN',
  UAE: 'AE',
  UGA: 'UG',
  URU: 'UY',
  VAN: 'VU', // Vanuatu
  VEN: 'VE',
  WAL: 'GB', // Wales -> Great Britain for emoji
  YEM: 'YE',
  ZAM: 'ZM',
  ZIM: 'ZW',
};

// Country name to ISO code mapping
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  'Norway': 'NO',
  'United States': 'US',
  'United States of America': 'US',
  'USA': 'US',
  'Russia': 'RU',
  'Russian Federation': 'RU',
  'China': 'CN',
  'India': 'IN',
  'Ukraine': 'UA',
  'France': 'FR',
  'Germany': 'DE',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'Poland': 'PL',
  'Azerbaijan': 'AZ',
  'Hungary': 'HU',
  'Czech Republic': 'CZ',
  'England': 'GB',
  'Iran': 'IR',
  'Uzbekistan': 'UZ',
  'Vietnam': 'VN',
  'Croatia': 'HR',
  'Romania': 'RO',
  'Israel': 'IL',
  'Sweden': 'SE',
  'Mexico': 'MX',
  'Turkey': 'TR',
  'Turkiye': 'TR',
  'Armenia': 'AM',
  'Serbia': 'RS',
  'FIDE': 'FD',  // FIDE (players representing FIDE directly)
  'Austria': 'AT',
  'Greece': 'GR',
  'Slovenia': 'SI',
  'Bulgaria': 'BG',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Canada': 'CA',
  'Australia': 'AU',
  'Italy': 'IT',
  'Japan': 'JP',
  'South Korea': 'KR',
  'Switzerland': 'CH',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Belgium': 'BE',
  'Portugal': 'PT',
  'Ireland': 'IE',
  'Iceland': 'IS',
  'New Zealand': 'NZ',
  'South Africa': 'ZA',
  'Egypt': 'EG',
  'Morocco': 'MA',
  'Tunisia': 'TN',
  'Algeria': 'DZ',
  'Indonesia': 'ID',
  'Malaysia': 'MY',
  'Singapore': 'SG',
  'Philippines': 'PH',
  'Thailand': 'TH',
};

/**
 * Convert FIDE country code or country name to ISO 3166-1 alpha-2 code
 */
export function fideToIso(fideCode: string): string {
  if (!fideCode) return 'XX';

  const trimmed = fideCode.trim();
  const upperCode = trimmed.toUpperCase();

  // If already a 2-letter code, return as is
  if (trimmed.length === 2) return trimmed.toUpperCase();

  // Check if it's a full country name
  if (COUNTRY_NAME_TO_ISO[trimmed]) {
    return COUNTRY_NAME_TO_ISO[trimmed];
  }

  // Look up 3-letter FIDE code in mapping
  return FIDE_TO_ISO[upperCode] || 'XX';
}

/**
 * Get country name from FIDE code (for future use with DB)
 */
export const FIDE_COUNTRY_NAMES: Record<string, string> = {
  USA: 'United States',
  RUS: 'Russia',
  CHN: 'China',
  IND: 'India',
  UKR: 'Ukraine',
  FRA: 'France',
  GER: 'Germany',
  ESP: 'Spain',
  NOR: 'Norway',
  NED: 'Netherlands',
  POL: 'Poland',
  AZE: 'Azerbaijan',
  HUN: 'Hungary',
  CZE: 'Czech Republic',
  ENG: 'England',
  IRI: 'Iran',
  UZB: 'Uzbekistan',
  VIE: 'Vietnam',
  CRO: 'Croatia',
  ROU: 'Romania',
  ISR: 'Israel',
  SWE: 'Sweden',
  MEX: 'Mexico',
  TUR: 'Turkey',
  ARM: 'Armenia',
  SRB: 'Serbia',
  AUT: 'Austria',
  GRE: 'Greece',
  SLO: 'Slovenia',
  BUL: 'Bulgaria',
  FID: 'FIDE',
  // Add more as needed
};
