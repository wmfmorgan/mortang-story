import type { StoryListItem } from '../types/database'

export type Density = 'full' | 'compact' | 'minimal'
export type DateGrouping = 'story' | 'year' | 'decade'

export const NONE_PLACE = '__none__'

export type TimelineFilters = {
  query: string
  fromYear: number | null
  toYear: number | null
  personIds: string[]
  places: string[]
}

export const emptyFilters: TimelineFilters = {
  query: '',
  fromYear: null,
  toYear: null,
  personIds: [],
  places: [],
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10
}

export function decadeLabel(year: number): string {
  return `${decadeOf(year)}s`
}

export function placeKey(story: StoryListItem): string {
  return story.place_name?.trim() || NONE_PLACE
}

export function applyFilters(
  stories: StoryListItem[],
  filters: TimelineFilters,
): StoryListItem[] {
  const q = filters.query.trim().toLowerCase()
  return stories.filter((story) => {
    if (filters.fromYear != null && story.occurred_year < filters.fromYear) return false
    if (filters.toYear != null && story.occurred_year > filters.toYear) return false
    if (q && !story.title.toLowerCase().includes(q)) return false
    if (filters.personIds.length > 0) {
      const ids = new Set(story.people.map((person) => person.id))
      if (!filters.personIds.some((id) => ids.has(id))) return false
    }
    if (filters.places.length > 0 && !filters.places.includes(placeKey(story))) {
      return false
    }
    return true
  })
}

export function filtersActive(filters: TimelineFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.fromYear != null ||
    filters.toYear != null ||
    filters.personIds.length > 0 ||
    filters.places.length > 0
  )
}

export function uniquePeople(
  stories: StoryListItem[],
): { id: string; name: string }[] {
  const map = new Map<string, string>()
  for (const story of stories) {
    for (const person of story.people) {
      map.set(person.id, person.display_name)
    }
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function uniquePlaces(stories: StoryListItem[]): { key: string; label: string }[] {
  const set = new Set<string>()
  for (const story of stories) set.add(placeKey(story))
  return [...set]
    .map((key) => ({
      key,
      label: key === NONE_PLACE ? 'No location' : key,
    }))
    .sort((a, b) => {
      if (a.key === NONE_PLACE) return 1
      if (b.key === NONE_PLACE) return -1
      return a.label.localeCompare(b.label)
    })
}

export function decadesIn(stories: StoryListItem[]): number[] {
  const set = new Set(stories.map((story) => decadeOf(story.occurred_year)))
  return [...set].sort((a, b) => a - b)
}

export function yearRange(stories: StoryListItem[]): { min: number; max: number } | null {
  if (stories.length === 0) return null
  const years = stories.map((story) => story.occurred_year)
  return { min: Math.min(...years), max: Math.max(...years) }
}
