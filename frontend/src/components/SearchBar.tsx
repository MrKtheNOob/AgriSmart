import { useState, useEffect, useRef, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import { Search, X, MapPin } from 'lucide-react';
import type { FeatureCollection } from 'geojson';
import senegalRegionsGeoJSONString from '../assets/senegal_adm1.geojson?raw';
import senegalDepartmentsGeoJSONString from '../assets/senegal_adm2.geojson?raw';
import {
  findContainingFeature,
  getFeatureName,
  getGeometryCenter,
} from '../utils/geo';

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

const findParentRegion = (point: [number, number]) => {
  const regionFeature = findContainingFeature(point, senegalRegionsGeoJSON);

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
      className="relative min-w-0 flex-1 basis-64 pointer-events-auto"
    >
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={`w-5 h-5 ${isLoading ? 'text-green-500 animate-pulse' : 'text-slate-400'}`} />
        </div>
        
        <input
          type="text"
          aria-label="Rechercher une région ou un département"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une région, un département…"
          className="w-full bg-paper border border-line py-3 pl-12 pr-12 rounded-[2px] text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
        />

        {query && (
          <button
            onClick={clearSearch}
            aria-label="Effacer la recherche"
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-full z-10 mt-2 max-h-[45dvh] overflow-y-auto bg-paper border border-line rounded-[2px] shadow-[0_4px_12px_#233e3014] animate-in fade-in slide-in-from-top-2 duration-200">
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
                      {suggestion.kind === 'Region' ? 'Région' : 'Département'}
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
