export type PlaceHit = {
  id: string
  label: string
  lat: number
  lng: number
}

export type PlaceValue = {
  name: string
  lat: number
  lng: number
}

export function shouldSearchPlaces(query: string): boolean {
  return query.trim().length >= 3
}

export function mapNominatimHits(
  rows: { place_id?: number | string; display_name?: string; lat?: string; lon?: string }[],
): PlaceHit[] {
  const hits: PlaceHit[] = []
  for (const row of rows) {
    const lat = Number(row.lat)
    const lng = Number(row.lon)
    const label = row.display_name?.trim()
    if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) continue
    hits.push({
      id: String(row.place_id ?? `${lat},${lng}`),
      label,
      lat,
      lng,
    })
  }
  return hits
}

export function osmMapUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`
}

export async function searchPlaces(query: string): Promise<PlaceHit[]> {
  if (!shouldSearchPlaces(query)) return []
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query.trim())
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '5')
  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error('Could not search locations')
  const rows = (await response.json()) as Parameters<typeof mapNominatimHits>[0]
  return mapNominatimHits(rows)
}
