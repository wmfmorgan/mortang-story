import { useState } from 'react'
import {
  decadeLabel,
  emptyFilters,
  filtersActive,
  type Density,
  type TimelineFilters,
} from '../../lib/timelineFilters'
import { Input } from '../ui'

type Props = {
  density: Density
  onDensity: (value: Density) => void
  filters: TimelineFilters
  onFilters: (value: TimelineFilters) => void
  people: { id: string; name: string }[]
  places: { key: string; label: string }[]
  decades: number[]
  yearBounds: { min: number; max: number } | null
  shown: number
  total: number
}

const segmentOff = 'rounded-md px-2.5 py-1 text-xs text-ink-soft hover:text-ink'
const segmentOn = 'rounded-md bg-oxblood px-2.5 py-1 text-xs text-paper'
const chipOff =
  'rounded-full border border-rule px-2.5 py-1 text-xs text-ink hover:bg-paper-dark'
const chipOn =
  'rounded-full border border-oxblood bg-oxblood/10 px-2.5 py-1 text-xs text-ink'

export function TimelineToolbar({
  density,
  onDensity,
  filters,
  onFilters,
  people,
  places,
  decades,
  yearBounds,
  shown,
  total,
}: Props) {
  const [open, setOpen] = useState(false)
  const active = filtersActive(filters)

  function togglePerson(id: string) {
    const next = filters.personIds.includes(id)
      ? filters.personIds.filter((item) => item !== id)
      : [...filters.personIds, id]
    onFilters({ ...filters, personIds: next })
  }

  function togglePlace(key: string) {
    const next = filters.places.includes(key)
      ? filters.places.filter((item) => item !== key)
      : [...filters.places, key]
    onFilters({ ...filters, places: next })
  }

  return (
    <div className="mb-8 rounded-xl border border-rule bg-[#fffdf8]/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segment
          label="Cards"
          value={density}
          options={[
            { id: 'full', label: 'Full' },
            { id: 'compact', label: 'Compact' },
            { id: 'minimal', label: 'Minimal' },
          ]}
          onChange={onDensity}
        />
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
          <span>
            {shown === total
              ? `${total} stor${total === 1 ? 'y' : 'ies'}`
              : `${shown} of ${total} stories`}
          </span>
          {active ? (
            <button
              type="button"
              className="text-oxblood hover:underline"
              onClick={() => onFilters(emptyFilters)}
            >
              Clear filters
            </button>
          ) : null}
          <button
            type="button"
            className="text-ink hover:underline"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Hide filters' : active ? 'Show filters · on' : 'Show filters'}
          </button>
        </div>
      </div>
      {open ? (
      <div className="mt-4 space-y-4 border-t border-rule/70 pt-4">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-soft">Timeframe</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-ink-soft">
            From
            <span className="inline-block w-20">
              <Input
                type="number"
                min={yearBounds?.min}
                max={yearBounds?.max}
                placeholder={yearBounds ? String(yearBounds.min) : '—'}
                value={filters.fromYear ?? ''}
                onChange={(event) =>
                  onFilters({
                    ...filters,
                    fromYear: event.target.value ? Number(event.target.value) : null,
                  })
                }
              />
            </span>
          </label>
          <label className="flex items-center gap-1 text-xs text-ink-soft">
            To
            <span className="inline-block w-20">
              <Input
                type="number"
                min={yearBounds?.min}
                max={yearBounds?.max}
                placeholder={yearBounds ? String(yearBounds.max) : '—'}
                value={filters.toYear ?? ''}
                onChange={(event) =>
                  onFilters({
                    ...filters,
                    toYear: event.target.value ? Number(event.target.value) : null,
                  })
                }
              />
            </span>
          </label>
          {decades.map((decade) => {
            const on =
              filters.fromYear === decade && filters.toYear === decade + 9
            return (
              <button
                key={decade}
                type="button"
                className={on ? chipOn : chipOff}
                onClick={() =>
                  onFilters({
                    ...filters,
                    fromYear: on ? null : decade,
                    toYear: on ? null : decade + 9,
                  })
                }
              >
                {decadeLabel(decade)}
              </button>
            )
          })}
        </div>
      </div>
      {people.length > 0 ? (
        <ChipRow
          label="Family"
          items={people.map((person) => ({
            key: person.id,
            label: person.name,
            on: filters.personIds.includes(person.id),
          }))}
          onToggle={togglePerson}
        />
      ) : null}
      {places.length > 0 ? (
        <ChipRow
          label="Location"
          items={places.map((place) => ({
            key: place.key,
            label: place.label,
            on: filters.places.includes(place.key),
          }))}
          onToggle={togglePlace}
        />
      ) : null}
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
          Event
        </span>
        <Input
          value={filters.query}
          placeholder="Search by title"
          onChange={(event) => onFilters({ ...filters, query: event.target.value })}
        />
      </label>
      </div>
      ) : null}
    </div>
  )
}

function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-soft">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={option.id === value ? segmentOn : segmentOff}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ChipRow({
  label,
  items,
  onToggle,
}: {
  label: string
  items: { key: string; label: string; on: boolean }[]
  onToggle: (key: string) => void
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-soft">{label}</p>
      <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.on ? chipOn : chipOff}
            title={item.label}
            onClick={() => onToggle(item.key)}
          >
            {item.label.length > 36 ? `${item.label.slice(0, 34)}…` : item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
