import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MediaFields, type LinkDraft } from '../components/story/MediaFields'
import { PersonPicker } from '../components/story/PersonPicker'
import { Button, ErrorText, Field, Input, Page, Spinner, Subtitle, Textarea, Title } from '../components/ui'
import { useApp } from '../context/AppContext'
import { usePeople } from '../hooks/usePeople'
import { fetchStoryDetail } from '../hooks/useStories'
import { attachStoryMedia, syncStoryPeople } from '../lib/storyMedia'
import { supabase } from '../lib/supabase'
import type { Perspective, StoryDetail } from '../types/database'

export function EditPerspectivePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { person, family } = useApp()
  const { people, loading: peopleLoading, error: peopleError, reload } = usePeople(family.id)
  const [story, setStory] = useState<StoryDetail | null>(null)
  const [existing, setExisting] = useState<Perspective | null>(null)
  const [body, setBody] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [links, setLinks] = useState<LinkDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchStoryDetail(id)
      .then((detail) => {
        setStory(detail)
        const mine = detail?.perspectives.find((item) => item.author_person_id === person.id)
        setExisting(mine ?? null)
        setBody(mine?.body ?? '')
        setPlaceName(detail?.place_name ?? '')
        const tagged = detail?.people.map((item) => item.id) ?? []
        setSelectedIds(tagged.includes(person.id) ? tagged : [...tagged, person.id])
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load story')
        setLoading(false)
      })
  }, [id, person.id])

  if (loading || peopleLoading) return <Spinner />
  if (!story) {
    return (
      <Page>
        <Title>Story not found</Title>
      </Page>
    )
  }

  const currentStory = story

  function togglePerson(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!body.trim()) {
      setError('Write your telling first.')
      return
    }
    if (selectedIds.length === 0) {
      setError('Tag at least one person who was there.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (existing) {
        const { error: updateError } = await supabase
          .from('perspectives')
          .update({ body: body.trim(), updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (updateError) throw new Error(updateError.message)
      } else {
        const { error: insertError } = await supabase.from('perspectives').insert({
          story_id: currentStory.id,
          author_person_id: person.id,
          body: body.trim(),
          is_original: false,
        })
        if (insertError) throw new Error(insertError.message)
      }

      await syncStoryPeople(currentStory.id, selectedIds)

      const nextPlace = placeName.trim() || null
      if (nextPlace !== (currentStory.place_name ?? null)) {
        const { error: placeError } = await supabase
          .from('stories')
          .update({ place_name: nextPlace, updated_at: new Date().toISOString() })
          .eq('id', currentStory.id)
        if (placeError) throw new Error(placeError.message)
      }

      await attachStoryMedia({
        familyId: family.id,
        storyId: currentStory.id,
        uploadedBy: person.id,
        files,
        links,
        startOrder: currentStory.media.length,
      })

      navigate(`/stories/${currentStory.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your perspective')
      setSaving(false)
    }
  }

  async function remove() {
    if (!existing || existing.is_original) return
    if (!confirm('Delete your perspective? The original telling stays.')) return
    const { error: deleteError } = await supabase
      .from('perspectives')
      .delete()
      .eq('id', existing.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    navigate(`/stories/${currentStory.id}`)
  }

  return (
    <Page>
      <Title>{existing ? 'Edit your telling' : 'Add your perspective'}</Title>
      <Subtitle>{currentStory.title}</Subtitle>
      <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-6">
        <Field label="Your telling">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What happened, as you remember it."
          />
        </Field>
        <Field label="Who was there" hint="Add anyone the first telling missed.">
          <PersonPicker
            people={people}
            selectedIds={selectedIds}
            familyId={family.id}
            createdBy={person.id}
            onToggle={togglePerson}
            onCreated={(added) => {
              void reload()
              setSelectedIds((ids) => [...ids, added.id])
            }}
          />
        </Field>
        <Field label="Place" hint="A name is enough. This is for the event, not just your telling.">
          <Input
            value={placeName}
            onChange={(event) => setPlaceName(event.target.value)}
            placeholder="The lake cabin"
          />
        </Field>
        <MediaFields files={files} links={links} onFiles={setFiles} onLinks={setLinks} />
        <ErrorText>{peopleError}</ErrorText>
        <ErrorText>{error}</ErrorText>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {existing && !existing.is_original ? (
            <Button type="button" variant="danger" onClick={() => void remove()}>
              Delete my perspective
            </Button>
          ) : null}
        </div>
      </form>
    </Page>
  )
}
