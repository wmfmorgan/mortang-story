import { Fragment, useEffect, useState } from 'react'
import { decadeLabel, type DateGrouping, type Density } from '../../lib/timelineFilters'
import type { StoryListItem } from '../../types/database'
import { StoryNode } from './StoryNode'

function yearLabel(story: StoryListItem): string {
  return story.circa ? `c. ${story.occurred_year}` : String(story.occurred_year)
}

function groupKey(story: StoryListItem, grouping: DateGrouping): string {
  if (grouping === 'decade') return decadeLabel(story.occurred_year)
  return yearLabel(story)
}

export function Timeline({
  stories,
  density = 'full',
  grouping = 'story',
}: {
  stories: StoryListItem[]
  density?: Density
  grouping?: DateGrouping
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [openGroups, setOpenGroups] = useState<string[]>([])

  useEffect(() => {
    if (grouping === 'story') {
      setOpenGroups([])
      return
    }
    const keys = [...new Set(stories.map((story) => groupKey(story, grouping)))]
    setOpenGroups(keys)
  }, [grouping, stories])

  return (
    <div className="relative flex flex-col">
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 left-3 w-px bg-rule md:left-1/2 md:-translate-x-1/2"
      />
      {stories.map((story, index) => {
        const side: 'left' | 'right' = index % 2 === 0 ? 'left' : 'right'
        const year = yearLabel(story)
        const group = groupKey(story, grouping)
        const prev = stories[index - 1]
        const showYear = grouping === 'story' && (index === 0 || year !== yearLabel(prev!))
        const showGroup =
          grouping !== 'story' && (index === 0 || group !== groupKey(prev!, grouping))
        const groupOpen = grouping === 'story' || openGroups.includes(group)
        const groupCount = stories.filter((item) => groupKey(item, grouping) === group).length
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
            {showGroup ? (
              <div className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] py-1 md:grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)]">
                <span className="relative z-10 col-start-1 flex justify-center md:col-start-2">
                  <button
                    type="button"
                    className="bg-paper px-1.5 text-center font-serif text-sm font-semibold tracking-wide text-oxblood hover:underline"
                    onClick={() =>
                      setOpenGroups((current) =>
                        current.includes(group)
                          ? current.filter((item) => item !== group)
                          : [...current, group],
                      )
                    }
                    aria-expanded={groupOpen}
                  >
                    {group}
                    <span className="mt-0.5 block text-[0.65rem] font-sans font-medium text-ink-soft">
                      {groupCount} · {groupOpen ? 'hide' : 'show'}
                    </span>
                  </button>
                </span>
              </div>
            ) : null}
            {groupOpen ? (
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
            ) : null}
          </Fragment>
        )
      })}
    </div>
  )
}
