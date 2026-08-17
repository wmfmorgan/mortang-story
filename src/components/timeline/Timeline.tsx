import { Fragment, useState } from 'react'
import type { Density } from '../../lib/timelineFilters'
import type { StoryListItem } from '../../types/database'
import { StoryNode } from './StoryNode'

function yearLabel(story: StoryListItem): string {
  return story.circa ? `c. ${story.occurred_year}` : String(story.occurred_year)
}

export function Timeline({
  stories,
  density = 'full',
}: {
  stories: StoryListItem[]
  density?: Density
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="relative flex flex-col">
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 left-3 w-px bg-rule md:left-1/2 md:-translate-x-1/2"
      />
      {stories.map((story, index) => {
        const side: 'left' | 'right' = index % 2 === 0 ? 'left' : 'right'
        const year = yearLabel(story)
        const prev = stories[index - 1]
        const showYear = index === 0 || year !== yearLabel(prev!)
        return (
          <Fragment key={story.id}>
            {showYear ? (
              <div className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] py-1 md:grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)]">
                <span className="relative z-10 col-start-1 flex justify-center md:col-start-2">
                  <span className="bg-paper px-1.5 font-serif text-sm font-semibold tracking-wide text-oxblood">
                    {year}
                  </span>
                </span>
              </div>
            ) : null}
            <div className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] items-center py-4 md:grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)]">
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
                <StoryNode
                  story={story}
                  side={side === 'left' ? 'left' : 'right'}
                  expanded={expandedId === story.id}
                  onExpand={() => setExpandedId(story.id)}
                  density={density}
                />
              </div>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
