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
  const label = perspective.is_original
    ? `Original Story by ${perspective.author.display_name}`
    : `${perspective.author.display_name}’s perspective`

  return (
    <article className={perspective.is_original ? '' : 'relative'}>
      <div className="flex items-baseline justify-between gap-3">
        <h3
          className={`font-serif text-ink ${perspective.is_original ? 'text-xl' : 'text-lg'}`}
        >
          {label}
        </h3>
        {own ? (
          <Link to={`/stories/${storyId}/tell`} className="text-sm text-oxblood hover:underline">
            Edit
          </Link>
        ) : null}
      </div>
      <p className="mt-4 whitespace-pre-wrap font-serif text-lg leading-relaxed text-ink">
        {perspective.body}
      </p>
      <div className="mt-5 space-y-4">
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
  )
}
