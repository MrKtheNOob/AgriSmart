import { useState, useEffect, useRef, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import { Search, X, MapPin } from 'lucide-react';
import type { FeatureCollection, Geometry } from 'geojson';
import senegalRegionsGeoJSONString from '../assets/senegal_adm1.geojson?raw';
import senegalDepartmentsGeoJSONString from '../assets/senegal_adm2.geojson?raw';

interface Suggestion {
  id: string;
  display_name: string;
  lat: string;
  lon: string;
  kind: 'District' | 'Region';
  parentRegion?: string;
}

interface SearchPlace {
  id: string;
  display_name: string;
  lat: number;
  lon: number;
  kind: 'District' | 'Region';
  parentRegion?: string;
  searchKey: string;
  tokens: string[];
}

const senegalRegionsGeoJSON: FeatureCollection = JSON.parse(
  senegalRegionsGeoJSONString,
);
const senegalDepartmentsGeoJSON: FeatureCollection = JSON.parse(
  senegalDepartmentsGeoJSONString,
);

const getFeatureName = (properties: Record<string, unknown>) => {
  const candidates = [
    properties.shapeName,
    properties.adm2_name,
    properties.adm1_name,
    properties.name,
    properties.ADM2_EN,
    properties.ADM1_EN,
  ];

  return (
    candidates.find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    ) || 'Selected area'
  );
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value: string) =>
  normalizeText(value)
    .split(' ')
    .filter(Boolean)
    .map((token) => (token === 'st' ? 'saint' : token === 'ste' ? 'sainte' : token));

const stripAdminWords = (value: string) => {
  const adminWords = new Set([
    'department',
    'departement',
    'district',
    'region',
    'commune',
    'arrondissement',
    'province',
    'village',
    'city',
    'town',
    'de',
    'du',
    'des',
    'la',
    'le',
    'les',
    'of',
    'the',
  ]);

  const keptTokens = tokenize(value).filter((token) => !adminWords.has(token));
  return keptTokens.join(' ');
};

const getGeometryCenter = (geometry: Geometry): [number, number] => {
  const points: Array<[number, number]> = [];

  const collectPoints = (coords: unknown): void => {
    if (!Array.isArray(coords) || coords.length === 0) return;

    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      points.push([coords[0] as number, coords[1] as number]);
      return;
    }

    coords.forEach(collectPoints);
  };

  if (geometry.type === 'GeometryCollection') {
    geometry.geometries.forEach((item) => {
      const [lat, lon] = getGeometryCenter(item);
      points.push([lon, lat]);
    });
  } else {
    collectPoints(geometry.coordinates);
  }

  if (points.length === 0) {
    return [14.5, -14.5];
  }

  const bounds = points.reduce(
    (acc, [lng, lat]) => ({
      minLat: Math.min(acc.minLat, lat),
      maxLat: Math.max(acc.maxLat, lat),
      minLng: Math.min(acc.minLng, lng),
      maxLng: Math.max(acc.maxLng, lng),
    }),
    {
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
      minLng: Number.POSITIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY,
    },
  );

  return [(bounds.minLat + bounds.maxLat) / 2, (bounds.minLng + bounds.maxLng) / 2];
};

const pointInRing = (
  point: [number, number],
  ring: number[][],
): boolean => {
  const [lng, lat] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0000001) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

const pointInPolygon = (
  point: [number, number],
  polygon: number[][][],
): boolean => {
  if (polygon.length === 0) return false;
  const [outerRing, ...holes] = polygon;
  if (!pointInRing(point, outerRing)) return false;
  return !holes.some((hole) => pointInRing(point, hole));
};

const pointInGeometry = (point: [number, number], geometry: Geometry): boolean => {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(point, geometry.coordinates);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
  }

  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.some((item) => pointInGeometry(point, item));
  }

  return false;
};

const findParentRegion = (point: [number, number]) => {
  const regionFeature = senegalRegionsGeoJSON.features.find((feature) => {
    if (!feature.geometry) return false;
    return pointInGeometry(point, feature.geometry);
  });

  if (!regionFeature) return undefined;

  return getFeatureName(regionFeature.properties as Record<string, unknown>);
};

const buildSearchIndex = (): SearchPlace[] => {
  const regions = senegalRegionsGeoJSON.features.flatMap((feature, index) => {
    if (!feature.geometry) return [];

    const properties = feature.properties as Record<string, unknown>;
    const [lat, lon] = getGeometryCenter(feature.geometry);
    const name = getFeatureName(properties);

    return [
      {
        id: `region-${index}`,
        display_name: name,
        lat,
        lon,
        kind: 'Region' as const,
        searchKey: normalizeText(
          [
            name,
            `region ${name}`,
            `${name} region`,
          ].join(' '),
        ),
        tokens: tokenize(name),
      },
    ];
  });

  const departments = senegalDepartmentsGeoJSON.features.flatMap((feature, index) => {
    if (!feature.geometry) return [];

    const properties = feature.properties as Record<string, unknown>;
    const [lat, lon] = getGeometryCenter(feature.geometry);
    const name = getFeatureName(properties);
    const parentRegion = findParentRegion([lon, lat]);
    const aliases = [
      name,
      `department ${name}`,
      `district ${name}`,
      parentRegion ? `${name} ${parentRegion}` : null,
      parentRegion ? `${parentRegion} ${name}` : null,
      parentRegion ? `${name}, ${parentRegion}` : null,
    ].filter(Boolean) as string[];

    return [
      {
        id: `department-${index}`,
        display_name: name,
        lat,
        lon,
        kind: 'District' as const,
        parentRegion,
        searchKey: normalizeText(aliases.join(' ')),
        tokens: tokenize([name, parentRegion].filter(Boolean).join(' ')),
      },
    ];
  });

  return [...regions, ...departments];
};

export default function SearchBar() {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchIndex = useMemo(() => buildSearchIndex(), []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setIsLoading(true);
        const cleanedQuery = stripAdminWords(query);
        const normalized = normalizeText(cleanedQuery || query);
        const queryTokens = tokenize(cleanedQuery || query);

        const scorePlace = (place: SearchPlace) => {
          let score = place.kind === 'Region' ? 30 : 18;

          if (place.searchKey === normalized) score += 100;
          if (place.searchKey.startsWith(normalized)) score += 60;
          if (place.searchKey.includes(normalized)) score += 30;

          const matchedTokens = queryTokens.filter((token) =>
            place.tokens.some((placeToken) => placeToken.startsWith(token) || placeToken.includes(token)),
          ).length;

          score += matchedTokens * 15;

          if (queryTokens.length > 1 && matchedTokens === queryTokens.length) {
            score += 20;
          }

          if (place.parentRegion) {
            const parentKey = normalizeText(place.parentRegion);
            if (parentKey.includes(normalized) || normalized.includes(parentKey)) {
              score += 18;
            }
            if (
              queryTokens.some((token) => parentKey.includes(token)) &&
              place.kind === 'District'
            ) {
              score += 12;
            }
          }

          if (place.kind === 'Region') score += 8;

          return score;
        };

        const ranked = searchIndex
          .map((place) => ({ place, score: scorePlace(place) }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (a.place.kind !== b.place.kind) {
              return a.place.kind === 'Region' ? -1 : 1;
            }
            return a.place.display_name.localeCompare(b.place.display_name);
          })
          .map(({ place }) => place);

        const matches = ranked.slice(0, 8).map((place) => ({
          id: place.id,
          display_name: place.display_name,
          lat: String(place.lat),
          lon: String(place.lon),
          kind: place.kind,
          parentRegion: place.parentRegion,
        }));
        setSuggestions(matches);
        setIsOpen(matches.length > 0);
        setIsLoading(false);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, searchIndex]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: Suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);

    map.flyTo([lat, lon], suggestion.kind === 'Region' ? 8 : 11, {
      duration: 1.2,
    });

    setQuery(suggestion.display_name);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef}
      className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md"
    >
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={`w-5 h-5 ${isLoading ? 'text-green-500 animate-pulse' : 'text-slate-400'}`} />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une ville, une commune, un département..."
          className="w-full bg-white/95 backdrop-blur-md border border-slate-200 py-3.5 pl-12 pr-12 rounded-2xl shadow-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
        />

        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="mt-2 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="divide-y divide-slate-50">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <button
                  onClick={() => handleSelect(suggestion)}
                  className="w-full text-left px-4 py-3.5 hover:bg-green-50 flex items-start gap-3 transition-colors group"
                >
                  <MapPin className="w-5 h-5 text-slate-300 group-hover:text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700 line-clamp-1">
                      {suggestion.display_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {suggestion.kind}
                      {suggestion.parentRegion ? ` · ${suggestion.parentRegion}` : ''}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
