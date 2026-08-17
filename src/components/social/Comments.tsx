import { useEffect, useRef, useState, type FormEvent } from 'react'
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

export function Comments({
  storyId,
  perspectiveId = null,
  personId,
  isAdmin,
}: Props) {
  const [comments, setComments] = useState<Row[]>([])
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

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
    await load()
  }

  async function remove(id: string) {
    await supabase.from('comments').delete().eq('id', id)
    await load()
  }

  const count = comments.length

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={count === 0 ? 'Comments' : `${count} comments`}
        className={`inline-flex items-center gap-1 rounded-full border bg-paper px-2 py-0.5 text-xs ${
          open ? 'border-oxblood text-oxblood' : 'border-rule text-ink-soft hover:bg-paper-dark'
        }`}
      >
        <CommentIcon />
        {count > 0 ? <span>{count}</span> : null}
      </button>
      {open ? (
        <div className="absolute bottom-0 left-full z-30 ml-2 w-72 rounded-xl border border-rule bg-paper p-3 shadow-md max-sm:left-auto max-sm:right-0 max-sm:bottom-full max-sm:mb-2 max-sm:ml-0">
          <p className="mb-2 text-xs font-medium tracking-wide text-ink-soft">Comments</p>
          <div className="mb-3 max-h-56 space-y-3 overflow-y-auto">
            {count === 0 ? (
              <p className="text-xs text-ink-soft">None yet. Add the first.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-xs font-medium text-ink">{comment.author.display_name}</p>
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
              ))
            )}
          </div>
          <form onSubmit={(event) => void submit(event)} className="space-y-2">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Add a comment"
              autoFocus
            />
            <Button type="submit" variant="ghost" disabled={saving || !body.trim()}>
              {saving ? 'Saving…' : 'Post'}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function CommentIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5.5h12A1.5 1.5 0 0 1 17.5 7v6A1.5 1.5 0 0 1 16 14.5H9l-3.5 2.5V14.5H4A1.5 1.5 0 0 1 2.5 13V7A1.5 1.5 0 0 1 4 5.5Z"
      />
    </svg>
  )
}
