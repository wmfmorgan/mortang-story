import { describe, expect, it } from 'vitest'
import { formatFuzzyDate, sortKey, type FuzzyDate } from './dates'

describe('formatFuzzyDate', () => {
  it('formats a year', () => {
    expect(formatFuzzyDate({ year: 1962, precision: 'year' })).toBe('1962')
  })

  it('formats a circa year', () => {
    expect(formatFuzzyDate({ year: 1962, circa: true, precision: 'year' })).toBe(
      'c. 1962',
    )
  })

  it('formats a month', () => {
    expect(formatFuzzyDate({ year: 1994, month: 6, precision: 'month' })).toBe(
      'June 1994',
    )
  })

  it('formats an exact day', () => {
    expect(
      formatFuzzyDate({ year: 1994, month: 6, day: 14, precision: 'day' }),
    ).toBe('14 June 1994')
  })

  it('formats a season', () => {
    expect(
      formatFuzzyDate({ year: 1987, season: 'summer', precision: 'year' }),
    ).toBe('Summer 1987')
  })

  it('formats a circa season', () => {
    expect(
      formatFuzzyDate({
        year: 1987,
        season: 'summer',
        circa: true,
        precision: 'year',
      }),
    ).toBe('c. Summer 1987')
  })
})

describe('sortKey', () => {
  const yearOnly: FuzzyDate = { year: 1987, precision: 'year' }
  const summer: FuzzyDate = { year: 1987, season: 'summer', precision: 'year' }
  const june: FuzzyDate = { year: 1987, month: 6, precision: 'month' }
  const day: FuzzyDate = { year: 1987, month: 6, day: 14, precision: 'day' }
  const laterYear: FuzzyDate = { year: 1988, precision: 'year' }

  it('puts year-only before June of the same year', () => {
    expect(sortKey(yearOnly)).toBeLessThan(sortKey(june))
  })

  it('treats summer as approximately June', () => {
    expect(sortKey(summer)).toBe(sortKey(june))
  })

  it('puts a specific day after the month', () => {
    expect(sortKey(june)).toBeLessThan(sortKey(day))
  })

  it('orders later years after earlier ones', () => {
    expect(sortKey(day)).toBeLessThan(sortKey(laterYear))
  })
})
