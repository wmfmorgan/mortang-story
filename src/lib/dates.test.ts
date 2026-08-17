import { describe, expect, it } from 'vitest'
import {
  dateParts,
  formatFuzzyDate,
  sortKey,
  withDay,
  withMonth,
  withSeason,
  type FuzzyDate,
} from './dates'

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

describe('dateParts', () => {
  it('splits an exact day', () => {
    expect(
      dateParts({ year: 2020, month: 10, day: 1, precision: 'day' }),
    ).toEqual({ eyebrow: 'Oct', day: '01', year: '2020' })
  })

  it('uses season as the eyebrow', () => {
    expect(
      dateParts({ year: 1987, season: 'summer', precision: 'year' }),
    ).toEqual({ eyebrow: 'Summer', day: '', year: '1987' })
  })

  it('keeps circa on the year', () => {
    expect(dateParts({ year: 1962, circa: true, precision: 'year' })).toEqual({
      eyebrow: '',
      day: '',
      year: 'c. 1962',
    })
  })
})

describe('withSeason / withMonth', () => {
  const june: FuzzyDate = { year: 1987, month: 6, day: 14, precision: 'day' }

  it('season clears month and day', () => {
    expect(withSeason(june, 'summer')).toEqual({
      year: 1987,
      season: 'summer',
      month: undefined,
      day: undefined,
      precision: 'year',
    })
  })

  it('month clears season', () => {
    expect(withMonth({ year: 1987, season: 'summer', precision: 'year' }, 6)).toEqual({
      year: 1987,
      month: 6,
      day: undefined,
      season: undefined,
      precision: 'month',
    })
  })

  it('day requires a month', () => {
    expect(withDay({ year: 1987, precision: 'year' }, 14).day).toBeUndefined()
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
