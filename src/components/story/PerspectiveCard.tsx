import { Link } from 'react-router-dom'
import type { Person, PerspectiveWithAuthor } from '../../types/database'
import { Comments } from '../social/Comments'
import { Reactions } from '../social/Reactions'

type Props = {
  storyId: string
  perspective: PerspectiveWithAuthor
  current: Person
}

export function PerspectiveCard({ storyId, perspective, current }: Props) {
  const own = perspective.author_person_id === current.id
  const isAdmin = current.role === 'admin'
  const label = `As Remembered by ${perspective.author.display_name}`

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 px-1">
        <p className="text-sm font-medium tracking-wide text-ink-soft sm:text-base">{label}</p>
        {own ? (
          <Link to={`/stories/${storyId}/tell`} className="text-xs text-oxblood hover:underline">
            Edit
          </Link>
        ) : null}
      </div>
      <article className="relative rounded-xl border border-rule px-4 py-3">
        <p className="whitespace-pre-wrap font-serif text-base leading-relaxed text-ink">
          {perspective.body}
        </p>
        <div className="absolute right-3 bottom-0 z-10 flex translate-y-1/2 items-center gap-1 bg-paper px-1">
          <Reactions
            storyId={storyId}
            perspectiveId={perspective.id}
            personId={current.id}
          />
          <Comments
            storyId={storyId}
            perspectiveId={perspective.id}
            personId={current.id}
            isAdmin={isAdmin}
          />
        </div>
      </article>
    </div>
  )
}
