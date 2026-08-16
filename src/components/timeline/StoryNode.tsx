import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatFuzzyDate, storyToFuzzyDate } from '../../lib/dates'
import { signedPhotoUrl } from '../../lib/supabase'
import type { StoryListItem } from '../../types/database'

export function StoryNode({ story }: { story: StoryListItem }) {
  const [thumb, setThumb] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void signedPhotoUrl(story.first_photo_path).then((url) => {
      if (active) setThumb(url)
    })
    return () => {
      active = false
    }
  }, [story.first_photo_path])

  const names = story.people.map((person) => person.display_name).join(', ')
  const tellings =
    story.perspective_count === 1
      ? '1 telling'
      : `${story.perspective_count} tellings`

  return (
    <li className="relative pl-8">
      <span className="absolute top-2 left-0 h-3 w-3 rounded-full border-2 border-paper bg-oxblood" />
      <Link to={`/stories/${story.id}`} className="block rounded-lg py-1 hover:bg-paper-dark/60">
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-ink-soft">
              {formatFuzzyDate(storyToFuzzyDate(story))}
            </div>
            <h2 className="font-serif text-xl text-ink">{story.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {names || 'Family'} · {tellings}
            </p>
          </div>
          {thumb ? (
            <img
              src={thumb}
              alt=""
              className="h-16 w-16 shrink-0 rounded-md object-cover"
            />
          ) : null}
        </div>
      </Link>
    </li>
  )
}
