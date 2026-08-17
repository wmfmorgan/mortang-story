import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Comments } from '../components/social/Comments'
import { Reactions } from '../components/social/Reactions'
import { PerspectiveCard } from '../components/story/PerspectiveCard'
import { StoryMedia } from '../components/story/StoryMedia'
import { Button, ButtonLink, ErrorText, Page, Spinner, Title } from '../components/ui'
import { useApp } from '../context/AppContext'
import { fetchStoryDetail } from '../hooks/useStories'
import { formatFuzzyDate, storyToFuzzyDate } from '../lib/dates'
import { downloadStoryBook } from '../lib/pdf/download'
import { supabase } from '../lib/supabase'
import type { StoryDetail } from '../types/database'

export function StoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { person, family } = useApp()
  const [story, setStory] = useState<StoryDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    fetchStoryDetail(id)
      .then((detail) => {
        if (!active) return
        setStory(detail)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Could not load story')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <Spinner />
  if (!story) {
    return (
      <Page>
        <Title>Story not found</Title>
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      </Page>
    )
  }

  const detail = story
  const original = detail.perspectives.find((item) => item.is_original)
  const childPerspectives = detail.perspectives.filter((item) => !item.is_original)
  const hasOwn = detail.perspectives.some((item) => item.author_person_id === person.id)
  const canDelete =
    detail.created_by_person_id === person.id || person.role === 'admin'

  async function exportStory() {
    setExporting(true)
    try {
      await downloadStoryBook({
        mode: 'story',
        familyName: family.name,
        story: detail,
      })
    } finally {
      setExporting(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this story and every telling on it?')) return
    const { error: deleteError } = await supabase.from('stories').delete().eq('id', detail.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    navigate('/')
  }

  return (
    <Page>
      <p className="text-xs uppercase tracking-wider text-ink-soft">
        {formatFuzzyDate(storyToFuzzyDate(detail))}
        {detail.place_name ? ` · ${detail.place_name}` : ''}
      </p>
      <Title>{detail.title}</Title>
      <p className="mt-3 text-ink-soft">
        {detail.people.map((item) => (
          <span key={item.id}>
            <Link to={`/people/${item.id}`} className="hover:text-oxblood">
              {item.display_name}
            </Link>
            {item.id !== detail.people[detail.people.length - 1]?.id ? ', ' : ''}
          </span>
        ))}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink to={`/stories/${detail.id}/tell`} variant="ghost">
          {hasOwn ? 'Edit your telling' : 'Add your perspective'}
        </ButtonLink>
        <Button type="button" variant="ghost" disabled={exporting} onClick={() => void exportStory()}>
          {exporting ? 'Preparing…' : 'Export this story'}
        </Button>
        {canDelete ? (
          <Button type="button" variant="danger" onClick={() => void remove()}>
            Delete story
          </Button>
        ) : null}
      </div>
      <div className="mt-8">
        <StoryMedia
          media={detail.media}
          currentPersonId={person.id}
          isAdmin={person.role === 'admin'}
          onChange={(media) => setStory({ ...detail, media })}
        />
      </div>
      <div className="mt-6 space-y-4">
        {original ? (
          <PerspectiveCard
            storyId={detail.id}
            perspective={original}
            current={person}
          />
        ) : null}
        {childPerspectives.length > 0 ? (
          <div className="relative ml-3 space-y-4 border-l-2 border-oxblood/30 pl-3 sm:ml-5 sm:pl-4">
            {childPerspectives.map((perspective) => (
              <div key={perspective.id} className="relative">
                <span className="absolute top-4 -left-[0.95rem] h-px w-3 bg-oxblood/30 sm:-left-[1.15rem] sm:w-4" />
                <PerspectiveCard
                  storyId={detail.id}
                  perspective={perspective}
                  current={person}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <footer className="relative mt-14 border-t border-rule/70 pt-5">
        <p className="text-xs text-ink-soft">This event</p>
        <div className="absolute right-3 top-0 flex -translate-y-1/2 items-center gap-1 bg-paper px-1">
          <Reactions storyId={detail.id} personId={person.id} />
          <Comments
            storyId={detail.id}
            personId={person.id}
            isAdmin={person.role === 'admin'}
          />
        </div>
      </footer>
      <ErrorText>{error}</ErrorText>
    </Page>
  )
}
