import { useState, useEffect, useRef } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import { Search, Loader2, MapPin, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  onLocationSelect?: (name: string) => void;
}

export const LocationPicker = ({ latitude, longitude, onChange, onLocationSelect }: LocationPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Click on map to select custom coordinates
  const ClickHandler = () => {
    useMapEvents({
      click(event) {
        onChange(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6)));
      },
    });
    return null;
  };

  // Fly/Pan map to new center coordinates
  const ChangeView = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
  };

  // Perform geocoding using Photon Komoot API (Elasticsearch + OSM)
  const performSearch = async (queryText: string) => {
    if (!queryText.trim()) return;

    setSearching(true);
    setSearchError(null);
    setShowDropdown(true); // Open dropdown immediately to show "searching" state
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(queryText)}&limit=6`);
      if (!res.ok) {
        throw new Error(`HTTP Hata kodu: ${res.status}`);
      }
      const data = await res.json();
      
      if (data && data.features) {
        setResults(data.features);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      console.error('Geocoding error:', err);
      setSearchError(err.message || 'Arama servisine bağlanırken teknik bir hata oluştu.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Search As You Type (Debounced after 450ms)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setShowDropdown(false);
      setSearchError(null);
      return;
    }

    const delayDebounce = setTimeout(() => {
      performSearch(trimmed);
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Handle click on a search result suggestion
  const selectLocation = (feature: any) => {
    const props = feature.properties;
    const geometry = feature.geometry;

    // Photon geometry coordinates are in [longitude, latitude] format
    const lng = Number(Number(geometry.coordinates[0]).toFixed(6));
    const lat = Number(Number(geometry.coordinates[1]).toFixed(6));
    
    onChange(lat, lng);

    if (onLocationSelect) {
      // Build a clean, structured address name in Turkish
      const mainName = props.name || props.street || 'Seçilen Konum';
      const detailParts = [
        props.street && props.name ? props.street : null,
        props.locality || props.district,
        props.city || props.county,
        props.state && props.state !== props.city ? props.state : null,
      ].filter(Boolean);

      const locationString = detailParts.length > 0 
        ? `${mainName} (${detailParts.slice(0, 2).join(', ')})`
        : mainName;

      onLocationSelect(locationString);
    }

    setShowDropdown(false);
  };

  // Build full descriptive text for dropdown lists
  const getFullAddressLabel = (properties: any) => {
    const parts = [
      properties.street ? `${properties.street}${properties.housenumber ? ` No:${properties.housenumber}` : ''}` : null,
      properties.locality || properties.district,
      properties.city || properties.county || properties.state,
      properties.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="space-y-3 relative">
      {/* Search Input Bar */}
      <div className="relative z-50 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                performSearch(searchQuery.trim());
              }
            }}
            placeholder="Konum ara... (yazmaya başlayın veya ara butonuna basın)"
            className="w-full rounded-2xl bg-[#111123]/90 border border-white/10 pl-11 pr-10 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setResults([]);
                setShowDropdown(false);
                setSearchError(null);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white transition-colors"
              aria-label="Aramayı temizle"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            performSearch(searchQuery.trim());
          }}
          disabled={searching}
          className="px-5 py-3 rounded-2xl bg-purple-500 hover:bg-purple-600 active:scale-95 text-sm font-bold text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ara'}
        </button>
      </div>

      {/* Floating Suggestions Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-14 z-[9999] rounded-2xl border border-white/10 bg-[#0c0c1c] p-2 shadow-2xl max-h-64 overflow-y-auto divide-y divide-white/5 animate-fade-in">
          
          {/* 1. Searching/Loading State */}
          {searching && (
            <div className="flex items-center gap-3 px-4 py-4 text-sm text-white/60">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
              <span>Konum aranıyor, lütfen bekleyin...</span>
            </div>
          )}

          {/* 2. Connection/Fetch Error State */}
          {!searching && searchError && (
            <div className="p-4 text-xs space-y-2 text-red-200">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <X className="w-4 h-4" />
                <span>Bağlantı Hatası</span>
              </div>
              <p className="text-white/65">Arama servisine ulaşılamadı. Cihazınızın internet bağlantısını veya tarayıcı eklentilerinizi (ad-blocker vb.) kontrol edin.</p>
              <p className="text-white/45 bg-red-950/20 p-2 rounded-lg font-mono border border-red-500/10">Hata Detayı: {searchError}</p>
            </div>
          )}

          {/* 3. Successful Results List */}
          {!searching && !searchError && results.length > 0 && (
            <>
              <div className="flex items-center justify-between px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-white/35">
                <span>Önerilen Lokasyonlar ({results.length})</span>
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-white/45 hover:text-white"
                >
                  Kapat
                </button>
              </div>
              {results.map((feature, idx) => {
                const props = feature.properties;
                const title = props.name || props.street || 'Bilinmeyen Konum';
                const desc = getFullAddressLabel(props);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectLocation(feature)}
                    className="w-full text-left px-3 py-3 rounded-xl hover:bg-white/5 transition-colors flex items-start gap-3 group"
                  >
                    <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 group-hover:text-purple-300 transition-colors" />
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{title}</p>
                      {desc && <p className="text-white/45 text-xs truncate mt-0.5">{desc}</p>}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* 4. No Results Found State */}
          {!searching && !searchError && results.length === 0 && searchQuery.trim().length >= 3 && (
            <div className="p-4 text-xs space-y-2 text-amber-200">
              <p className="font-bold">Sonuç bulunamadı.</p>
              <p className="text-white/60">Arama motorumuz açık kaynaklı harita verilerini (OpenStreetMap) kullandığı için özel şirket veya ofis isimlerini (örn: "feltouch") doğrudan veri tabanında bulamayabilir.</p>
              <p className="text-white/60"><strong>Çözüm:</strong> Lütfen şirket adı yerine doğrudan açık adres veya sokak adını aratın (örn: <em className="text-purple-300">"Burhaniye mah. Bahçeler sok Üsküdar"</em>). Ardından haritada tam binayı tıklayarak kolayca işaretleyebilirsiniz.</p>
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <div className="h-64 rounded-3xl overflow-hidden border border-white/10 relative z-10">
        <MapContainer center={[latitude, longitude]} zoom={15} className="h-full w-full">
          <ChangeView center={[latitude, longitude]} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler />
          <CircleMarker center={[latitude, longitude]} radius={10} pathOptions={{ color: '#7c3aed', fillColor: '#a855f7', fillOpacity: 0.8 }} />
        </MapContainer>
      </div>
    </div>
  );
};
