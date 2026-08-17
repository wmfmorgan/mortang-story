import type { StoryListItem } from '../../types/database'
import { StoryNode } from './StoryNode'

export function Timeline({ stories }: { stories: StoryListItem[] }) {
  return (
    <ol className="relative">
      <span
        aria-hidden
        className="absolute top-0 bottom-0 left-3 w-px bg-rule md:left-1/2 md:-translate-x-1/2"
      />
      {stories.map((story, index) => {
        const side: 'left' | 'right' = index % 2 === 0 ? 'left' : 'right'
        return (
          <li
            key={story.id}
            className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] items-center py-4 md:grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)]"
          >
            <div className="relative col-start-1 row-start-1 md:col-start-2">
              <span className="absolute top-8 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-oxblood ring-4 ring-paper" />
            </div>
            <div
              className={
                side === 'left'
                  ? 'col-start-2 row-start-1 md:col-start-1 md:pr-5'
                  : 'col-start-2 row-start-1 md:col-start-3 md:pl-5'
              }
            >
              <StoryNode story={story} side={side === 'left' ? 'left' : 'right'} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}
