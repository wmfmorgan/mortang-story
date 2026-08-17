import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dateParts, storyToFuzzyDate } from '../../lib/dates'
import { signedPhotoUrl } from '../../lib/supabase'
import type { StoryListItem } from '../../types/database'

export function StoryNode({
  story,
  side,
  expanded,
  onExpand,
}: {
  story: StoryListItem
  side: 'left' | 'right'
  expanded: boolean
  onExpand: () => void
}) {
  const navigate = useNavigate()
  const [thumbs, setThumbs] = useState<string[]>([])

  useEffect(() => {
    let active = true
    void Promise.all(story.photo_paths.map((path) => signedPhotoUrl(path))).then((urls) => {
      if (active) setThumbs(urls.filter((url): url is string => Boolean(url)))
    })
    return () => {
      active = false
    }
  }, [story.photo_paths])

  const names = story.people.map((person) => person.display_name).join(', ')
  const tellings =
    story.perspective_count === 1
      ? '1 telling'
      : `${story.perspective_count} tellings`
  const parts = dateParts(storyToFuzzyDate(story))

  function open() {
    if (expanded || !story.original_telling) {
      navigate(`/stories/${story.id}`)
      return
    }
    onExpand()
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-expanded={expanded}
      className="relative w-full overflow-visible text-left"
    >
      <Pointer side="left" className={side === 'right' ? '' : 'md:hidden'} />
      {side === 'left' ? <Pointer side="right" className="hidden md:block" /> : null}
      <div className="flex overflow-hidden rounded-xl bg-[#fffdf8] shadow-[0_8px_22px_rgba(43,36,29,0.14)] ring-1 ring-rule/70 transition hover:shadow-[0_12px_28px_rgba(43,36,29,0.18)]">
      <div className="min-w-0 flex-1 px-4 py-3">
        <h2 className="font-serif text-lg font-semibold leading-snug text-ink">{story.title}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {names || 'Family'}
          {story.place_name ? ` · ${story.place_name}` : ''} · {tellings}
        </p>
        {thumbs.length > 0 ? (
          <div className="mt-3 flex gap-1.5">
            {thumbs.map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                className="h-11 w-11 rounded-sm object-cover"
              />
            ))}
          </div>
        ) : null}
        {expanded && story.original_telling ? (
          <div className="mt-4 border-t border-rule/70 pt-3">
            <p className="text-sm font-medium tracking-wide text-ink-soft">
              As Remembered by {story.original_telling.author_name}
            </p>
            <p className="mt-2 whitespace-pre-wrap font-serif text-base leading-relaxed text-ink">
              {story.original_telling.body}
            </p>
            <p className="mt-3 text-xs text-ink-soft">Click again for the full story</p>
          </div>
        ) : null}
      </div>
      <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center border-l border-rule/70 px-2 py-3 text-center">
        {parts.eyebrow ? (
          <span className="text-[0.7rem] font-medium tracking-wide text-ink-soft">
            {parts.eyebrow}
          </span>
        ) : null}
        {parts.day ? (
          <span className="font-serif text-3xl leading-none font-semibold text-ink">{parts.day}</span>
        ) : null}
        <span className={`text-xs text-ink ${parts.day ? '' : 'font-serif text-xl font-semibold'}`}>
          {parts.year}
        </span>
      </div>
      </div>
    </button>
  )
}

function Pointer({
  side,
  className = '',
}: {
  side: 'left' | 'right'
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={`absolute top-7 z-10 h-3 w-3 rotate-45 bg-[#fffdf8] shadow-[1px_1px_0_rgba(43,36,29,0.12)] ${
        side === 'right' ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'
      } ${className}`}
    />
  )
}
