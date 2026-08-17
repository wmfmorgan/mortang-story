import { useState, type FormEvent } from 'react'
import type { FuzzyDate } from '../../lib/dates'
import { attachStoryMedia } from '../../lib/storyMedia'
import { supabase } from '../../lib/supabase'
import type { Person } from '../../types/database'
import { Button, ErrorText, Field, Input, Textarea } from '../ui'
import { FuzzyDateInput } from './FuzzyDateInput'
import { MediaFields, type LinkDraft } from './MediaFields'
import { PersonPicker } from './PersonPicker'

type Props = {
  familyId: string
  author: Person
  people: Person[]
  onPeopleChange: (people: Person[]) => void
  onCreated: (storyId: string) => void
}

export function StoryComposer({
  familyId,
  author,
  people,
  onPeopleChange,
  onCreated,
}: Props) {
  const now = new Date().getFullYear()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState<FuzzyDate>({ year: now, precision: 'year' })
  const [selectedIds, setSelectedIds] = useState<string[]>([author.id])
  const [body, setBody] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [links, setLinks] = useState<LinkDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function togglePerson(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !date.year || !body.trim() || selectedIds.length === 0) {
      setError('A story needs a title, a year, your telling, and at least one person.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          title: title.trim(),
          occurred_year: date.year,
          occurred_month: date.month ?? null,
          occurred_day: date.day ?? null,
          precision: date.precision,
          circa: Boolean(date.circa),
          season: date.season ?? null,
          place_name: placeName.trim() || null,
          created_by_person_id: author.id,
        })
        .select('id')
        .single()
      if (storyError || !story) throw new Error(storyError?.message ?? 'Could not create story')

      const { error: tagsError } = await supabase.from('story_people').insert(
        selectedIds.map((person_id) => ({ story_id: story.id, person_id })),
      )
      if (tagsError) throw new Error(tagsError.message)

      const { error: tellingError } = await supabase.from('perspectives').insert({
        story_id: story.id,
        author_person_id: author.id,
        body: body.trim(),
        is_original: true,
      })
      if (tellingError) throw new Error(tellingError.message)

      await attachStoryMedia({
        familyId,
        storyId: story.id,
        uploadedBy: author.id,
        files,
        links,
      })

      onCreated(story.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the story')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-6">
      <Field label="Title">
        <Input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="The cabin weekend"
        />
      </Field>
      <Field label="When">
        <FuzzyDateInput value={date} onChange={setDate} />
      </Field>
      <Field label="Who was there">
        <PersonPicker
          people={people}
          selectedIds={selectedIds}
          familyId={familyId}
          createdBy={author.id}
          onToggle={togglePerson}
          onCreated={(person) => {
            onPeopleChange([...people, person].sort((a, b) =>
              a.display_name.localeCompare(b.display_name),
            ))
            setSelectedIds((ids) => [...ids, person.id])
          }}
        />
      </Field>
      <Field label="Your telling">
        <Textarea
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What happened, as you remember it."
        />
      </Field>
      <Field label="Place" hint="A name is enough. A map view comes later.">
        <Input
          value={placeName}
          onChange={(event) => setPlaceName(event.target.value)}
          placeholder="The lake cabin"
        />
      </Field>
      <MediaFields files={files} links={links} onFiles={setFiles} onLinks={setLinks} />
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save this story'}
      </Button>
    </form>
  )
}
