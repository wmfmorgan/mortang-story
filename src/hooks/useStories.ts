import { useCallback, useEffect, useState } from 'react'
import { sortKey, storyToFuzzyDate } from '../lib/dates'
import { supabase } from '../lib/supabase'
import type { Media, Person, Perspective, Story, StoryDetail, StoryListItem } from '../types/database'

type StoryRow = Story & {
  story_people: { person: Person }[] | null
  perspectives:
    | (Pick<Perspective, 'id' | 'body' | 'is_original'> & {
        author: Pick<Person, 'display_name'> | null
      })[]
    | null
  media: Pick<Media, 'kind' | 'storage_path'>[] | null
}

type StoryDetailRow = Story & {
  story_people: { person: Person }[] | null
  perspectives: (Perspective & { author: Person })[] | null
  media: Media[] | null
  creator: Person | null
}

function toListItem(row: StoryRow): StoryListItem {
  const media = row.media ?? []
  const photoPaths = media
    .filter((item) => item.kind === 'photo' && item.storage_path)
    .map((item) => item.storage_path as string)
    .slice(0, 3)
  const original = (row.perspectives ?? []).find((item) => item.is_original)
  return {
    ...row,
    people: (row.story_people ?? []).map((link) => link.person).filter(Boolean),
    perspective_count: row.perspectives?.length ?? 0,
    first_photo_path: photoPaths[0] ?? null,
    photo_paths: photoPaths,
    original_telling: original
      ? {
          body: original.body,
          author_name: original.author?.display_name ?? 'Family',
        }
      : null,
  }
}

export function compareStories(a: Story, b: Story): number {
  return sortKey(storyToFuzzyDate(a)) - sortKey(storyToFuzzyDate(b))
}

export function useStories(familyId: string) {
  const [stories, setStories] = useState<StoryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    const { data, error: queryError } = await supabase
      .from('stories')
      .select(
        `
        *,
        story_people ( person:people (*) ),
        perspectives ( id, body, is_original, author:people!perspectives_author_person_id_fkey ( display_name ) ),
        media ( kind, storage_path )
      `,
      )
      .eq('family_id', familyId)
    if (queryError) {
      setError(queryError.message)
      setStories([])
    } else {
      const items = ((data ?? []) as StoryRow[]).map(toListItem).sort(compareStories)
      setStories(items)
    }
    setLoading(false)
  }, [familyId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { stories, loading, error, reload }
}

export async function fetchStoryDetail(id: string): Promise<StoryDetail | null> {
  const { data, error } = await supabase
    .from('stories')
    .select(
      `
      *,
      story_people ( person:people (*) ),
      perspectives ( *, author:people!perspectives_author_person_id_fkey (*) ),
      media ( * ),
      creator:people!stories_created_by_person_id_fkey (*)
    `,
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const row = data as StoryDetailRow
  const perspectives = (row.perspectives ?? [])
    .map((item) => ({ ...item, author: item.author }))
    .sort((a, b) => {
      if (a.is_original !== b.is_original) return a.is_original ? -1 : 1
      return a.created_at.localeCompare(b.created_at)
    })
  const media = (row.media ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)
  return {
    ...row,
    people: (row.story_people ?? []).map((link) => link.person).filter(Boolean),
    perspectives,
    media,
    creator: row.creator as Person,
  }
}

export async function fetchStoriesForPerson(
  familyId: string,
  personId: string,
): Promise<StoryListItem[]> {
  const { data, error } = await supabase
    .from('story_people')
    .select(
      `
      story:stories (
        *,
        story_people ( person:people (*) ),
        perspectives ( id, body, is_original, author:people!perspectives_author_person_id_fkey ( display_name ) ),
        media ( kind, storage_path )
      )
    `,
    )
    .eq('person_id', personId)
  if (error) throw new Error(error.message)
  const stories = (data ?? [])
    .map((row) => {
      const story = (row as { story: StoryRow | StoryRow[] | null }).story
      const resolved = Array.isArray(story) ? story[0] : story
      return resolved ? toListItem(resolved) : null
    })
    .filter((item): item is StoryListItem => Boolean(item))
    .filter((item) => item.family_id === familyId)
    .sort(compareStories)
  return stories
}
