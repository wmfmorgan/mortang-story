import { describe, expect, it } from 'vitest'
import { mapNominatimHits, osmMapUrl, shouldSearchPlaces } from './geocode'

describe('shouldSearchPlaces', () => {
  it('rejects short or empty queries', () => {
    expect(shouldSearchPlaces('')).toBe(false)
    expect(shouldSearchPlaces('  ab  ')).toBe(false)
  })

  it('accepts three or more characters', () => {
    expect(shouldSearchPlaces('oak')).toBe(true)
    expect(shouldSearchPlaces('  Disney World  ')).toBe(true)
  })
})

describe('mapNominatimHits', () => {
  it('keeps valid hits and drops bad rows', () => {
    const hits = mapNominatimHits([
      {
        place_id: 1,
        display_name: 'Disney World, Florida, USA',
        lat: '28.3852',
        lon: '-81.5639',
      },
      { place_id: 2, display_name: 'nowhere', lat: 'nope', lon: '0' },
      { display_name: '   ', lat: '1', lon: '2' },
    ])
    expect(hits).toEqual([
      {
        id: '1',
        label: 'Disney World, Florida, USA',
        lat: 28.3852,
        lng: -81.5639,
      },
    ])
  })
})

describe('osmMapUrl', () => {
  it('points at a marker', () => {
    expect(osmMapUrl(28.3, -81.5)).toContain('mlat=28.3')
    expect(osmMapUrl(28.3, -81.5)).toContain('mlon=-81.5')
  })
})
