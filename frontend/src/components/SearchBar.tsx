import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { Search, X, MapPin } from 'lucide-react';

interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function SearchBar() {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              query
            )}&countrycodes=ma&limit=5&addressdetails=1`
          );
          const data = await response.json();
          setSuggestions(data);
          setIsOpen(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestions when clicking outside
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
    
    // Smoothly fly to the location
    map.flyTo([lat, lon], 13, {
      duration: 1.5,
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
      className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 w-[90%] max-w-md"
    >
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={`w-5 h-5 ${isLoading ? 'text-green-500 animate-pulse' : 'text-slate-400'}`} />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une ville, une commune..."
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

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="mt-2 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="divide-y divide-slate-50">
            {suggestions.map((suggestion) => (
              <li key={suggestion.place_id}>
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
                      {suggestion.display_name.split(',').slice(1).join(',').trim()}
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
