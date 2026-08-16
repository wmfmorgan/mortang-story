import type { StoryListItem } from '../../types/database'
import { StoryNode } from './StoryNode'

export function Timeline({ stories }: { stories: StoryListItem[] }) {
  return (
    <ol className="relative space-y-6 border-l-2 border-rule ml-1.5">
      {stories.map((story) => (
        <StoryNode key={story.id} story={story} />
      ))}
    </ol>
  )
}
