import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Timeline } from '../components/timeline/Timeline'
import { Button, EmptyState, ErrorText, Page, Spinner, Title } from '../components/ui'
import { useApp } from '../context/AppContext'
import { personStatus, personYears } from '../hooks/usePeople'
import { fetchStoriesForPerson } from '../hooks/useStories'
import { downloadStoryBook } from '../lib/pdf/download'
import { supabase } from '../lib/supabase'
import type { Person, StoryListItem } from '../types/database'

const statusLabel = {
  admin: 'Admin',
  member: 'Has a login',
  invited: 'Invite pending',
  person: 'No login yet',
}

export function PersonPage() {
  const { id } = useParams()
  const { family } = useApp()
  const [person, setPerson] = useState<Person | null>(null)
  const [stories, setStories] = useState<StoryListItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    Promise.all([
      supabase.from('people').select('*').eq('id', id).maybeSingle(),
      fetchStoriesForPerson(family.id, id),
    ])
      .then(([personResult, storyList]) => {
        if (!active) return
        if (personResult.error) throw new Error(personResult.error.message)
        setPerson(personResult.data as Person | null)
        setStories(storyList)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Could not load this person')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, family.id])

  if (loading) return <Spinner />
  if (!person) {
    return (
      <Page>
        <Title>Person not found</Title>
        <ErrorText>{error}</ErrorText>
      </Page>
    )
  }

  const profile = person

  async function exportStories() {
    setExporting(true)
    try {
      await downloadStoryBook({
        mode: 'person',
        familyName: family.name,
        personName: profile.display_name,
        familyId: family.id,
        personId: profile.id,
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Page>
      <p className="text-xs uppercase tracking-wider text-ink-soft">
        {statusLabel[personStatus(profile)]}
        {profile.invite_email && !profile.user_id ? ` · ${profile.invite_email}` : ''}
      </p>
      <Title>{profile.display_name}</Title>
      {personYears(profile) ? <p className="mt-2 text-ink-soft">{personYears(profile)}</p> : null}
      {profile.bio ? <p className="mt-4 max-w-prose text-ink">{profile.bio}</p> : null}
      <div className="mt-6">
        <Button
          type="button"
          variant="ghost"
          disabled={exporting || stories.length === 0}
          onClick={() => void exportStories()}
        >
          {exporting ? 'Preparing…' : 'Export their stories'}
        </Button>
      </div>
      <h2 className="mt-10 font-serif text-xl text-ink">Stories</h2>
      <div className="mt-4">
        {stories.length === 0 ? (
          <EmptyState
            title="Not in a story yet"
            body="Tag them the next time you write about something they were part of."
          />
        ) : (
          <Timeline stories={stories} />
        )}
      </div>
    </Page>
  )
}
