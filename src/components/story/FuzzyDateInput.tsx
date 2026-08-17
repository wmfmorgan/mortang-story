import { withDay, withMonth, withSeason, type FuzzyDate, type Season } from '../../lib/dates'
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

const months = [
  { value: '', label: '—' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const selectClass =
  'w-full rounded-md border border-rule bg-paper px-3 py-2 text-ink outline-none focus:border-oxblood'

export function FuzzyDateInput({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
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
          <select
            className={selectClass}
            value={value.month ?? ''}
            onChange={(event) => {
              const raw = event.target.value
              onChange(withMonth(value, raw ? Number(raw) : undefined))
            }}
          >
            {months.map((month) => (
              <option key={month.value || 'none'} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
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
              const raw = event.target.value
              onChange(withDay(value, raw ? Number(raw) : undefined))
            }}
          />
        </Field>
        <Field label="Season">
          <select
            className={selectClass}
            value={value.season ?? ''}
            onChange={(event) =>
              onChange(withSeason(value, (event.target.value || undefined) as Season | undefined))
            }
          >
            {seasons.map((season) => (
              <option key={season.value || 'none'} value={season.value}>
                {season.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="text-xs text-ink-soft">Use a month or a season, not both.</p>
      <label className="flex items-center gap-2 text-sm text-ink">
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
