import { describe, expect, it } from 'vitest'
import type { StoryListItem } from '../types/database'
import {
  applyFilters,
  decadeLabel,
  emptyFilters,
  filtersActive,
  uniquePlaces,
} from './timelineFilters'

function story(partial: Partial<StoryListItem> & { title: string }): StoryListItem {
  return {
    id: partial.id ?? partial.title,
    family_id: 'f',
    title: partial.title,
    occurred_year: partial.occurred_year ?? 1990,
    occurred_month: null,
    occurred_day: null,
    precision: 'year',
    circa: false,
    season: null,
    place_name: partial.place_name ?? null,
    place_lat: null,
    place_lng: null,
    created_by_person_id: 'p',
    created_at: '',
    updated_at: '',
    people: partial.people ?? [],
    perspective_count: 1,
    first_photo_path: null,
    photo_paths: [],
    original_telling: null,
  }
}

describe('applyFilters', () => {
  const bill = { id: 'bill', display_name: 'Bill' } as StoryListItem['people'][0]
  const mary = { id: 'mary', display_name: 'Mary' } as StoryListItem['people'][0]
  const stories = [
    story({ title: 'Jedi training', occurred_year: 1987, people: [bill], place_name: 'Orlando' }),
    story({ title: 'Cabin weekend', occurred_year: 1994, people: [mary], place_name: null }),
    story({ title: 'Christmas', occurred_year: 2024, people: [bill, mary], place_name: 'Orlando' }),
  ]

  it('filters by year range', () => {
    expect(applyFilters(stories, { ...emptyFilters, fromYear: 1990, toYear: 2000 }).map((s) => s.title)).toEqual([
      'Cabin weekend',
    ])
  })

  it('filters by title query', () => {
    expect(applyFilters(stories, { ...emptyFilters, query: 'jedi' }).map((s) => s.title)).toEqual([
      'Jedi training',
    ])
  })

  it('filters by any selected person', () => {
    expect(applyFilters(stories, { ...emptyFilters, personIds: ['bill'] })).toHaveLength(2)
  })

  it('filters by location including none', () => {
    expect(
      applyFilters(stories, { ...emptyFilters, places: ['__none__'] }).map((s) => s.title),
    ).toEqual(['Cabin weekend'])
  })
})

describe('filtersActive / helpers', () => {
  it('is inactive when empty', () => {
    expect(filtersActive(emptyFilters)).toBe(false)
    expect(filtersActive({ ...emptyFilters, query: 'x' })).toBe(true)
  })

  it('labels decades', () => {
    expect(decadeLabel(1987)).toBe('1980s')
  })

  it('lists places with a none bucket', () => {
    const places = uniquePlaces([
      story({ title: 'a', place_name: 'Orlando' }),
      story({ title: 'b', place_name: null }),
    ])
    expect(places.map((p) => p.key)).toEqual(['Orlando', '__none__'])
  })
})
