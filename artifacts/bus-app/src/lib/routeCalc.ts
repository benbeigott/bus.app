export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  fromCity: string;
  toCity: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}

async function geocode(city: string): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=0`;
    const res = await fetch(url, { headers: { "Accept-Language": "de" } });
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name.split(",")[0] };
  } catch { return null; }
}

export async function calcRoute(routeStr: string): Promise<RouteResult | null> {
  const parts = routeStr.split(/→|->|–|->/);
  if (parts.length < 2) return null;
  const fromRaw = parts[0].trim();
  const toRaw   = parts[parts.length - 1].trim();
  if (!fromRaw || !toRaw || fromRaw === toRaw) return null;

  const [from, to] = await Promise.all([geocode(fromRaw), geocode(toRaw)]);
  if (!from || !to) return null;

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const res = await fetch(osrmUrl);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    return {
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.round(route.duration / 60),
      fromCity: from.name,
      toCity: to.name,
      fromLat: from.lat,
      fromLng: from.lng,
      toLat: to.lat,
      toLng: to.lng,
    };
  } catch { return null; }
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} Min.`;
  if (m === 0) return `${h} Std.`;
  return `${h} Std. ${m} Min.`;
}
