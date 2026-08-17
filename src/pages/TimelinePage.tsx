import { useEffect, useMemo, useState } from 'react'
import { Timeline } from '../components/timeline/Timeline'
import { TimelineToolbar } from '../components/timeline/TimelineToolbar'
import { Button, ButtonLink, EmptyState, ErrorText, Page, Spinner, Title } from '../components/ui'
import { useApp } from '../context/AppContext'
import { useStories } from '../hooks/useStories'
import { downloadStoryBook } from '../lib/pdf/download'
import {
  applyFilters,
  decadesIn,
  emptyFilters,
  uniquePeople,
  uniquePlaces,
  yearRange,
  type DateGrouping,
  type Density,
  type TimelineFilters,
} from '../lib/timelineFilters'

function readDensity(): Density {
  try {
    const value = localStorage.getItem('mortang.timeline.density')
    if (value === 'full' || value === 'compact' || value === 'minimal') return value
  } catch {
    /* ignore */
  }
  return 'full'
}

export function TimelinePage() {
  const { family, person } = useApp()
  const { stories, loading, error } = useStories(family.id)
  const [newestFirst, setNewestFirst] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [density, setDensity] = useState<Density>(readDensity)
  const [grouping, setGrouping] = useState<DateGrouping>('story')
  const [filters, setFilters] = useState<TimelineFilters>(emptyFilters)

  useEffect(() => {
    try {
      localStorage.setItem('mortang.timeline.density', density)
    } catch {
      /* ignore */
    }
  }, [density])

  const ordered = useMemo(
    () => (newestFirst ? [...stories].reverse() : stories),
    [stories, newestFirst],
  )
  const filtered = useMemo(() => applyFilters(ordered, filters), [ordered, filters])
  const people = useMemo(() => uniquePeople(stories), [stories])
  const places = useMemo(() => uniquePlaces(stories), [stories])
  const decades = useMemo(() => decadesIn(stories), [stories])
  const bounds = useMemo(() => yearRange(stories), [stories])

  async function exportBook() {
    setExporting(true)
    try {
      await downloadStoryBook({
        mode: 'timeline',
        familyName: family.name,
        stories: filtered,
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <Page wide>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Title>{family.name}</Title>
          <p className="mt-2 text-ink-soft">
            {stories.length === 0
              ? 'No stories yet.'
              : `${stories.length} stor${stories.length === 1 ? 'y' : 'ies'}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="text-sm text-ink-soft hover:text-ink"
            onClick={() => setNewestFirst((value) => !value)}
          >
            {newestFirst ? 'Oldest first' : 'Newest first'}
          </button>
          {filtered.length > 0 ? (
            <Button type="button" variant="ghost" disabled={exporting} onClick={() => void exportBook()}>
              {exporting ? 'Preparing…' : 'Export the book'}
            </Button>
          ) : null}
          <ButtonLink to="/stories/new">Write a story</ButtonLink>
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
      {stories.length === 0 ? (
        <EmptyState
          title="Write the first story"
          body={`${person.display_name}, the timeline is empty. Start with something you remember.`}
          action={<ButtonLink to="/stories/new">Write a story</ButtonLink>}
        />
      ) : (
        <>
          <TimelineToolbar
            density={density}
            onDensity={setDensity}
            grouping={grouping}
            onGrouping={setGrouping}
            filters={filters}
            onFilters={setFilters}
            people={people}
            places={places}
            decades={decades}
            yearBounds={bounds}
            shown={filtered.length}
            total={stories.length}
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="Nothing matches"
              body="Clear a filter or widen the years to see stories again."
            />
          ) : (
            <Timeline stories={filtered} density={density} grouping={grouping} />
          )}
        </>
      )}
    </Page>
  )
}
