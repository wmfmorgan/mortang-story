import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ErrorText, Page, Spinner, Subtitle, Textarea, Title } from '../components/ui'
import { useApp } from '../context/AppContext'
import { fetchStoryDetail } from '../hooks/useStories'
import { supabase } from '../lib/supabase'
import type { Perspective, StoryDetail } from '../types/database'

export function EditPerspectivePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { person } = useApp()
  const [story, setStory] = useState<StoryDetail | null>(null)
  const [existing, setExisting] = useState<Perspective | null>(null)
  const [body, setBody] = useState('')
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
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load story')
        setLoading(false)
      })
  }, [id, person.id])

  if (loading) return <Spinner />
  if (!story) {
    return (
      <Page>
        <Title>Story not found</Title>
      </Page>
    )
  }

  const currentStory = story

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!body.trim()) {
      setError('Write your telling first.')
      return
    }
    setSaving(true)
    setError(null)
    if (existing) {
      const { error: updateError } = await supabase
        .from('perspectives')
        .update({ body: body.trim(), updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from('perspectives').insert({
        story_id: currentStory.id,
        author_person_id: person.id,
        body: body.trim(),
        is_original: false,
      })
      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }
    }
    navigate(`/stories/${currentStory.id}`)
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
      <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} />
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
