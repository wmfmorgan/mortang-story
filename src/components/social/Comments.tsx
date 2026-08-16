import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Comment, Person } from '../../types/database'
import { Button, Textarea } from '../ui'

type Row = Comment & { author: Person }

type Props = {
  storyId: string
  perspectiveId?: string | null
  personId: string
  isAdmin: boolean
}

export function Comments({ storyId, perspectiveId = null, personId, isAdmin }: Props) {
  const [comments, setComments] = useState<Row[]>([])
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [composing, setComposing] = useState(false)

  async function load() {
    let query = supabase
      .from('comments')
      .select('*, author:people!comments_author_person_id_fkey (*)')
      .eq('story_id', storyId)
      .order('created_at')
    query = perspectiveId
      ? query.eq('perspective_id', perspectiveId)
      : query.is('perspective_id', null)
    const { data } = await query
    setComments((data ?? []) as Row[])
  }

  useEffect(() => {
    void load()
  }, [storyId, perspectiveId])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!body.trim()) return
    setSaving(true)
    await supabase.from('comments').insert({
      story_id: storyId,
      perspective_id: perspectiveId,
      author_person_id: personId,
      body: body.trim(),
    })
    setBody('')
    setSaving(false)
    setComposing(false)
    await load()
  }

  async function remove(id: string) {
    await supabase.from('comments').delete().eq('id', id)
    await load()
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="border-t border-rule/70 pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-ink">{comment.author.display_name}</p>
            {comment.author_person_id === personId || isAdmin ? (
              <button
                type="button"
                className="text-xs text-ink-soft hover:text-oxblood"
                onClick={() => void remove(comment.id)}
              >
                Delete
              </button>
            ) : null}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{comment.body}</p>
        </div>
      ))}
      {composing ? (
        <form onSubmit={(event) => void submit(event)} className="space-y-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="A short comment — not a telling."
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="ghost" disabled={saving || !body.trim()}>
              {saving ? 'Saving…' : 'Post comment'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setComposing(false)
                setBody('')
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="ghost" onClick={() => setComposing(true)}>
          Add comment
        </Button>
      )}
    </div>
  )
}
