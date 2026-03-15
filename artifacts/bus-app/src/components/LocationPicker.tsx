import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type DepotLocation } from "@/lib/depots";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { animate: true, duration: 1.2 });
  }, [lat, lng]);
  return null;
}

interface Props {
  current: DepotLocation;
  onConfirm: (loc: DepotLocation) => void;
  onClose: () => void;
}

export default function LocationPicker({ current, onConfirm, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<{ lat: number; lng: number; name: string }>({
    lat: current.lat,
    lng: current.lng,
    name: current.name,
  });
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&countrycodes=de,at,ch`,
        { headers: { "Accept-Language": "de" } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  }

  function handlePickResult(r: NominatimResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const name = r.display_name.split(",").slice(0, 2).join(", ");
    setSelected({ lat, lng, name });
    setFlyTarget({ lat, lng });
    setResults([]);
    setQuery(name);
  }

  function handleMapClick(lat: number, lng: number) {
    setSelected(prev => ({ ...prev, lat, lng }));
    setFlyTarget(null);
    reverseGeocode(lat, lng);
  }

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "de" } }
      );
      const data = await res.json();
      if (data.display_name) {
        const name = data.display_name.split(",").slice(0, 2).join(", ");
        setSelected(prev => ({ ...prev, name }));
        setQuery(name);
      }
    } catch {}
  }

  function handleConfirm() {
    const city = selected.name.split(",")[0].trim();
    onConfirm({
      name: selected.name.split(",").slice(0, 2).join(", "),
      city,
      lat: Math.round(selected.lat * 100000) / 100000,
      lng: Math.round(selected.lng * 100000) / 100000,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="bg-[#0a0a0a] border border-yellow-500/20 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl" style={{ maxHeight: "90vh" }}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-white">Depot-Standort wählen</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Adresse eingeben oder auf die Karte klicken</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all">✕</button>
        </div>

        <div className="px-6 pt-4 pb-3 relative">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Adresse oder Ort suchen…"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40 pr-10"
              autoFocus
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-yellow-500/40 border-t-yellow-500 rounded-full animate-spin" />
            )}
          </div>
          {results.length > 0 && (
            <div className="absolute left-6 right-6 top-full mt-1 bg-[#111] border border-white/[0.08] rounded-xl overflow-hidden z-50 shadow-xl">
              {results.map(r => (
                <button
                  key={r.place_id}
                  onClick={() => handlePickResult(r)}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-yellow-500/10 hover:text-yellow-400 border-b border-white/[0.04] last:border-0 transition-all truncate"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 mx-6 mb-4 rounded-xl overflow-hidden border border-white/[0.06]" style={{ minHeight: "340px" }}>
          <MapContainer
            center={[selected.lat, selected.lng]}
            zoom={12}
            style={{ height: "340px", width: "100%", background: "#111" }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />
            <Marker position={[selected.lat, selected.lng]} />
            <MapClickHandler onMapClick={handleMapClick} />
            {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
          </MapContainer>
        </div>

        <div className="px-6 pb-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Gewählter Standort</p>
            <p className="text-sm font-semibold text-yellow-400 truncate mt-0.5">{selected.name || "Karte antippen…"}</p>
            <p className="text-[11px] text-zinc-600 tabular-nums">{selected.lat.toFixed(5)}° N, {selected.lng.toFixed(5)}° E</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-xs border border-white/10 text-zinc-400 rounded-lg hover:border-white/20 hover:text-zinc-200 transition-all">
              Abbrechen
            </button>
            <button onClick={handleConfirm} className="px-5 py-2 text-xs font-bold bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-all">
              Standort übernehmen
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
