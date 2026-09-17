export interface CountryGeo {
  code: string;
  label: string;
  latitude: number;
  longitude: number;
}

/**
 * GA4's country dimension is a display name rather than an ISO code.
 * Keep the small lookup local so the analytics screen does not need a second
 * geocoding request or expose visitor data to another service.
 */
const COUNTRY_GEO: Record<string, CountryGeo> = {
  Australia: { code: 'AU', label: '호주', latitude: -25.3, longitude: 133.8 },
  Brazil: { code: 'BR', label: '브라질', latitude: -10.8, longitude: -52.9 },
  Canada: { code: 'CA', label: '캐나다', latitude: 56.1, longitude: -106.3 },
  China: { code: 'CN', label: '중국', latitude: 35.9, longitude: 104.2 },
  France: { code: 'FR', label: '프랑스', latitude: 46.2, longitude: 2.2 },
  Germany: { code: 'DE', label: '독일', latitude: 51.2, longitude: 10.4 },
  India: { code: 'IN', label: '인도', latitude: 20.6, longitude: 79.0 },
  Italy: { code: 'IT', label: '이탈리아', latitude: 41.9, longitude: 12.6 },
  Japan: { code: 'JP', label: '일본', latitude: 36.2, longitude: 138.3 },
  'Korea, South': { code: 'KR', label: '대한민국', latitude: 35.9, longitude: 127.8 },
  Netherlands: { code: 'NL', label: '네덜란드', latitude: 52.1, longitude: 5.3 },
  'New Zealand': { code: 'NZ', label: '뉴질랜드', latitude: -41.8, longitude: 172.8 },
  Qatar: { code: 'QA', label: '카타르', latitude: 25.4, longitude: 51.2 },
  Russia: { code: 'RU', label: '러시아', latitude: 61.5, longitude: 105.3 },
  'Saudi Arabia': { code: 'SA', label: '사우디아라비아', latitude: 23.9, longitude: 45.1 },
  Singapore: { code: 'SG', label: '싱가포르', latitude: 1.4, longitude: 103.8 },
  Spain: { code: 'ES', label: '스페인', latitude: 40.5, longitude: -3.7 },
  Sweden: { code: 'SE', label: '스웨덴', latitude: 60.1, longitude: 18.6 },
  Taiwan: { code: 'TW', label: '대만', latitude: 23.7, longitude: 121.0 },
  Thailand: { code: 'TH', label: '태국', latitude: 15.9, longitude: 100.9 },
  Turkey: { code: 'TR', label: '튀르키예', latitude: 38.9, longitude: 35.2 },
  'United Arab Emirates': {
    code: 'AE',
    label: '아랍에미리트',
    latitude: 23.4,
    longitude: 53.8,
  },
  'United Kingdom': { code: 'GB', label: '영국', latitude: 55.4, longitude: -3.4 },
  'United States': { code: 'US', label: '미국', latitude: 37.1, longitude: -95.7 },
  Vietnam: { code: 'VN', label: '베트남', latitude: 14.1, longitude: 108.3 },
};

const COUNTRY_ALIASES: Record<string, string> = {
  'Korea, Republic of': 'Korea, South',
  'South Korea': 'Korea, South',
  'Republic of Korea': 'Korea, South',
  'Russian Federation': 'Russia',
  Türkiye: 'Turkey',
  'United States of America': 'United States',
  'Viet Nam': 'Vietnam',
};

export function getCountryGeo(name: string): CountryGeo | null {
  const canonical = COUNTRY_ALIASES[name.trim()] ?? name.trim();
  return COUNTRY_GEO[canonical] ?? null;
}

export function formatCountryName(name: string): string {
  return getCountryGeo(name)?.label ?? name;
}

export interface GlobePoint {
  x: number;
  y: number;
  depth: number;
}

/** Projects latitude/longitude onto a small orthographic globe facing Europe and Asia. */
export function projectGlobePoint(
  latitude: number,
  longitude: number,
  centerLatitude = 20,
  centerLongitude = 20,
): GlobePoint | null {
  const latitudeRadians = (latitude * Math.PI) / 180;
  const longitudeRadians = (longitude * Math.PI) / 180;
  const centerLatitudeRadians = (centerLatitude * Math.PI) / 180;
  const centerLongitudeRadians = (centerLongitude * Math.PI) / 180;
  const deltaLongitude = longitudeRadians - centerLongitudeRadians;
  const depth =
    Math.sin(centerLatitudeRadians) * Math.sin(latitudeRadians) +
    Math.cos(centerLatitudeRadians) * Math.cos(latitudeRadians) * Math.cos(deltaLongitude);

  if (depth < -0.08) return null;

  return {
    x: Math.cos(latitudeRadians) * Math.sin(deltaLongitude) * 100,
    y:
      (Math.cos(centerLatitudeRadians) * Math.sin(latitudeRadians) -
        Math.sin(centerLatitudeRadians) * Math.cos(latitudeRadians) * Math.cos(deltaLongitude)) *
      -100,
    depth,
  };
}
