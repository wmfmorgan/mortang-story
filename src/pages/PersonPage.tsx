import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  PersonFields,
  PersonFormActions,
  draftFromPerson,
  emptyPersonDraft,
  yearFromDraft,
  type PersonDraft,
} from '../components/PersonFields'
import { Avatar } from '../components/Avatar'
import { Timeline } from '../components/timeline/Timeline'
import { Button, EmptyState, ErrorText, Page, Spinner, Title } from '../components/ui'
import { useApp } from '../context/AppContext'
import { personStatus, personYears, updatePerson } from '../hooks/usePeople'
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
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<PersonDraft>(emptyPersonDraft)
  const [saving, setSaving] = useState(false)

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

  function startEdit() {
    setDraft(draftFromPerson(profile))
    setEditing(true)
    setError(null)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!draft.display_name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updatePerson(profile, {
        display_name: draft.display_name,
        birth_year: yearFromDraft(draft.birth_year),
        death_year: yearFromDraft(draft.death_year),
        bio: draft.bio,
        email: draft.email,
      })
      setPerson(updated)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this person')
    } finally {
      setSaving(false)
    }
  }

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
      <div className="mt-3 flex items-center gap-4">
        <Avatar person={profile} size="md" />
        <Title>{profile.display_name}</Title>
      </div>
      {personYears(profile) ? <p className="mt-2 text-ink-soft">{personYears(profile)}</p> : null}
      {profile.bio ? <p className="mt-4 max-w-prose text-ink">{profile.bio}</p> : null}
      {editing ? (
        <form onSubmit={(event) => void save(event)} className="mt-6 space-y-3">
          <PersonFields
            draft={draft}
            onChange={setDraft}
            showEmail={!profile.user_id}
            emailHint="Changing this sends a new sign-in link."
          />
          <ErrorText>{error}</ErrorText>
          <PersonFormActions
            saving={saving}
            submitLabel="Save changes"
            onCancel={() => setEditing(false)}
          />
        </form>
      ) : (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={startEdit}>
            Edit details
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={exporting || stories.length === 0}
            onClick={() => void exportStories()}
          >
            {exporting ? 'Preparing…' : 'Export their stories'}
          </Button>
        </div>
      )}
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
