import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Reaction } from '../../types/database'

const LIKE = '❤️'
const EMOJIS = ['😂', '😮', '😢', '🎉', '🙏'] as const

type Props = {
  storyId: string
  perspectiveId?: string | null
  personId: string
}

export function Reactions({ storyId, perspectiveId = null, personId }: Props) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [open, setOpen] = useState(false)

  async function load() {
    let query = supabase.from('reactions').select('*').eq('story_id', storyId)
    query = perspectiveId
      ? query.eq('perspective_id', perspectiveId)
      : query.is('perspective_id', null)
    const { data } = await query
    setReactions((data ?? []) as Reaction[])
  }

  useEffect(() => {
    void load()
  }, [storyId, perspectiveId])

  async function toggle(emoji: string) {
    const existing = reactions.find(
      (row) => row.author_person_id === personId && row.emoji === emoji,
    )
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('reactions').insert({
        story_id: storyId,
        perspective_id: perspectiveId,
        author_person_id: personId,
        emoji,
      })
    }
    await load()
  }

  const likes = reactions.filter((row) => row.emoji === LIKE)
  const liked = likes.some((row) => row.author_person_id === personId)
  const others = EMOJIS.map((emoji) => ({
    emoji,
    count: reactions.filter((row) => row.emoji === emoji).length,
  })).filter((row) => row.count > 0)

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => void toggle(LIKE)}
        className={`rounded-full border px-2 py-0.5 text-xs ${
          liked ? 'border-oxblood bg-oxblood/10' : 'border-rule hover:bg-paper-dark'
        }`}
      >
        {LIKE} {likes.length || ''}
      </button>
      {others.map((row) => (
        <button
          key={row.emoji}
          type="button"
          onClick={() => void toggle(row.emoji)}
          className="rounded-full border border-rule px-2 py-0.5 text-xs hover:bg-paper-dark"
        >
          {row.emoji} {row.count}
        </button>
      ))}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full border border-rule px-2 py-0.5 text-xs text-ink-soft hover:bg-paper-dark"
        >
          +
        </button>
        {open ? (
          <div className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-md border border-rule bg-paper p-1 shadow-sm">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded px-2 py-1 hover:bg-paper-dark"
                onClick={() => {
                  setOpen(false)
                  void toggle(emoji)
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
