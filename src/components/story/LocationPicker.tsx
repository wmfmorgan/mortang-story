import { useEffect, useId, useRef, useState } from 'react'
import {
  searchPlaces,
  shouldSearchPlaces,
  type PlaceHit,
  type PlaceValue,
} from '../../lib/geocode'
import { Input } from '../ui'

type Props = {
  value: PlaceValue | null
  onChange: (value: PlaceValue | null) => void
}

export function LocationPicker({ value, onChange }: Props) {
  const listId = useId()
  const [query, setQuery] = useState(value?.name ?? '')
  const [hits, setHits] = useState<PlaceHit[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value?.name ?? '')
  }, [value?.name])

  useEffect(() => {
    if (value && query === value.name) {
      setHits([])
      setOpen(false)
      return
    }
    if (!shouldSearchPlaces(query)) {
      setHits([])
      setSearching(false)
      return
    }
    let cancelled = false
    setSearching(true)
    const timer = window.setTimeout(() => {
      void searchPlaces(query)
        .then((next) => {
          if (cancelled) return
          setHits(next)
          setActive(0)
          setOpen(next.length > 0)
          setError(null)
        })
        .catch((err: unknown) => {
          if (cancelled) return
          setHits([])
          setError(err instanceof Error ? err.message : 'Could not search locations')
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, value])

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (box.current && !box.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  function pick(hit: PlaceHit) {
    onChange({ name: hit.label, lat: hit.lat, lng: hit.lng })
    setQuery(hit.label)
    setHits([])
    setOpen(false)
  }

  function clear() {
    onChange(null)
    setQuery('')
    setHits([])
    setOpen(false)
  }

  return (
    <div ref={box} className="relative">
      <div className="flex gap-2">
        <Input
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder="Search an address or place"
          onChange={(event) => {
            const next = event.target.value
            setQuery(next)
            if (value && next !== value.name) onChange(null)
          }}
          onFocus={() => {
            if (hits.length > 0) setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
              return
            }
            if (!open || hits.length === 0) return
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive((index) => (index + 1) % hits.length)
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((index) => (index - 1 + hits.length) % hits.length)
            } else if (event.key === 'Enter') {
              event.preventDefault()
              const hit = hits[active]
              if (hit) pick(hit)
            }
          }}
        />
        {value || query ? (
          <button
            type="button"
            className="shrink-0 text-sm text-ink-soft hover:text-oxblood"
            onClick={clear}
          >
            Clear
          </button>
        ) : null}
      </div>
      {searching ? <p className="mt-1 text-xs text-ink-soft">Searching…</p> : null}
      {error ? <p className="mt-1 text-xs text-oxblood">{error}</p> : null}
      {value ? <p className="mt-1 text-xs text-ink-soft">Saved as a map location.</p> : null}
      {open && hits.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-rule bg-paper shadow-md"
        >
          {hits.map((hit, index) => (
            <li key={hit.id} role="option" aria-selected={index === active}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm ${
                  index === active ? 'bg-paper-dark' : 'hover:bg-paper-dark'
                }`}
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(hit)}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
