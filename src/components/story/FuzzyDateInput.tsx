import type { DatePrecision, FuzzyDate, Season } from '../../lib/dates'
import { Field, Input } from '../ui'

type Props = {
  value: FuzzyDate
  onChange: (next: FuzzyDate) => void
}

const seasons: { value: '' | Season; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'autumn', label: 'Autumn' },
  { value: 'winter', label: 'Winter' },
]

function inferPrecision(month?: number, day?: number): DatePrecision {
  if (month && day) return 'day'
  if (month) return 'month'
  return 'year'
}

export function FuzzyDateInput({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Field label="Year">
        <Input
          type="number"
          required
          min={1000}
          max={2100}
          value={value.year || ''}
          onChange={(event) =>
            onChange({ ...value, year: Number(event.target.value) || 0 })
          }
        />
      </Field>
      <Field label="Month">
        <Input
          type="number"
          min={1}
          max={12}
          placeholder="—"
          value={value.month ?? ''}
          onChange={(event) => {
            const month = event.target.value ? Number(event.target.value) : undefined
            onChange({
              ...value,
              month,
              day: month ? value.day : undefined,
              season: month ? undefined : value.season,
              precision: inferPrecision(month, month ? value.day : undefined),
            })
          }}
        />
      </Field>
      <Field label="Day">
        <Input
          type="number"
          min={1}
          max={31}
          placeholder="—"
          disabled={!value.month}
          value={value.day ?? ''}
          onChange={(event) => {
            const day = event.target.value ? Number(event.target.value) : undefined
            onChange({
              ...value,
              day,
              precision: inferPrecision(value.month, day),
            })
          }}
        />
      </Field>
      <Field label="Season">
        <select
          className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-ink outline-none focus:border-oxblood"
          value={value.season ?? ''}
          disabled={Boolean(value.month)}
          onChange={(event) =>
            onChange({
              ...value,
              season: (event.target.value || undefined) as Season | undefined,
            })
          }
        >
          {seasons.map((season) => (
            <option key={season.value || 'none'} value={season.value}>
              {season.label}
            </option>
          ))}
        </select>
      </Field>
      <label className="col-span-2 flex items-center gap-2 text-sm text-ink sm:col-span-4">
        <input
          type="checkbox"
          checked={Boolean(value.circa)}
          onChange={(event) => onChange({ ...value, circa: event.target.checked })}
        />
        Circa / around this time
      </label>
    </div>
  )
}
