import { useMemo, useState } from 'react'
import { Timeline } from '../components/timeline/Timeline'
import { Button, ButtonLink, EmptyState, ErrorText, Page, Spinner, Title } from '../components/ui'
import { useApp } from '../context/AppContext'
import { useStories } from '../hooks/useStories'
import { downloadStoryBook } from '../lib/pdf/download'

export function TimelinePage() {
  const { family, person } = useApp()
  const { stories, loading, error } = useStories(family.id)
  const [newestFirst, setNewestFirst] = useState(false)
  const [exporting, setExporting] = useState(false)

  const ordered = useMemo(
    () => (newestFirst ? [...stories].reverse() : stories),
    [stories, newestFirst],
  )

  async function exportBook() {
    setExporting(true)
    try {
      await downloadStoryBook({
        mode: 'timeline',
        familyName: family.name,
        stories,
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <Page>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
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
          {stories.length > 0 ? (
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
        <Timeline stories={ordered} />
      )}
    </Page>
  )
}
