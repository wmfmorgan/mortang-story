export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export type DatePrecision = 'year' | 'month' | 'day'

export type FuzzyDate = {
  year: number
  month?: number
  day?: number
  circa?: boolean
  season?: Season
  precision: DatePrecision
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const SEASON_MONTH: Record<Season, number> = {
  spring: 3,
  summer: 6,
  autumn: 9,
  winter: 12,
}

const SEASON_LABEL: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
}

export function sortKey(d: FuzzyDate): number {
  const month = d.month ?? (d.season ? SEASON_MONTH[d.season] : 1)
  const day = d.day ?? 1
  return d.year * 10000 + month * 100 + day
}

export function formatFuzzyDate(d: FuzzyDate): string {
  const circa = d.circa ? 'c. ' : ''
  if (d.season) {
    return `${circa}${SEASON_LABEL[d.season]} ${d.year}`
  }
  if (d.precision === 'day' && d.month && d.day) {
    return `${circa}${d.day} ${MONTHS[d.month - 1]} ${d.year}`
  }
  if ((d.precision === 'month' || d.month) && d.month) {
    return `${circa}${MONTHS[d.month - 1]} ${d.year}`
  }
  return `${circa}${d.year}`
}

export function storyToFuzzyDate(story: {
  occurred_year: number
  occurred_month: number | null
  occurred_day: number | null
  precision: DatePrecision
  circa: boolean
  season: Season | null
}): FuzzyDate {
  return {
    year: story.occurred_year,
    month: story.occurred_month ?? undefined,
    day: story.occurred_day ?? undefined,
    circa: story.circa,
    season: story.season ?? undefined,
    precision: story.precision,
  }
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'stories'
  )
}
