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
  label?: string
  split?: boolean
}

export function Comments({
  storyId,
  perspectiveId = null,
  personId,
  isAdmin,
  label,
  split = false,
}: Props) {
  const [comments, setComments] = useState<Row[]>([])
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
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

  const count = comments.length
  const toggleLabel =
    label ??
    (count === 0 ? 'Comments' : count === 1 ? '1 comment' : `${count} comments`)

  return (
    <div className={split ? 'contents' : ''}>
      <button
        type="button"
        className={`text-xs tracking-wide text-ink-soft hover:text-ink ${
          split ? 'col-start-2 row-start-2 justify-self-end text-right' : ''
        }`}
        onClick={() => {
          setOpen((value) => !value)
          if (open) setComposing(false)
        }}
        aria-expanded={open}
      >
        {toggleLabel}
      </button>
      {open ? (
        <div
          className={`space-y-3 ${
            split
              ? 'col-span-2 mt-2 border-t border-rule/70 pt-3'
              : 'mt-3 border-l border-rule pl-3'
          }`}
        >
          {count === 0 && !composing ? (
            <p className="text-xs text-ink-soft">No comments yet.</p>
          ) : null}
          {comments.map((comment) => (
            <div key={comment.id}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs font-medium text-ink-soft">{comment.author.display_name}</p>
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
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-soft">{comment.body}</p>
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
                  {saving ? 'Saving…' : 'Post'}
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
            <button
              type="button"
              className="text-xs text-oxblood hover:underline"
              onClick={() => setComposing(true)}
            >
              Add a comment
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
