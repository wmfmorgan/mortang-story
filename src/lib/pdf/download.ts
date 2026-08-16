import { createElement } from 'react'
import { fetchStoriesForPerson, fetchStoryDetail } from '../../hooks/useStories'
import type { StoryDetail, StoryListItem } from '../../types/database'
import { slugify } from '../dates'
import { signedPhotoUrl } from '../supabase'
import type { PdfStory } from './StoryBook'

type TimelineInput = {
  mode: 'timeline'
  familyName: string
  stories: StoryListItem[]
}

type OneStoryInput = {
  mode: 'story'
  familyName: string
  story: StoryDetail
}

type PersonInput = {
  mode: 'person'
  familyName: string
  personName: string
  familyId: string
  personId: string
}

async function hydrate(detail: StoryDetail): Promise<PdfStory> {
  const photoUrls: { id: string; url: string }[] = []
  for (const item of detail.media) {
    if (item.kind !== 'photo' || !item.storage_path) continue
    const url = await signedPhotoUrl(item.storage_path)
    if (url) photoUrls.push({ id: item.id, url })
  }
  return { ...detail, photoUrls }
}

async function detailsFromList(stories: StoryListItem[]): Promise<PdfStory[]> {
  const result: PdfStory[] = []
  for (const item of stories) {
    const detail = await fetchStoryDetail(item.id)
    if (detail) result.push(await hydrate(detail))
  }
  return result
}

function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(href)
}

export async function downloadStoryBook(input: TimelineInput | OneStoryInput | PersonInput) {
  let title = input.familyName
  let subtitle: string | undefined
  let stories: PdfStory[] = []
  let slug = slugify(input.familyName)

  if (input.mode === 'story') {
    title = input.story.title
    subtitle = input.familyName
    stories = [await hydrate(input.story)]
    slug = slugify(input.story.title)
  } else if (input.mode === 'timeline') {
    title = `The ${input.familyName} stories`
    stories = await detailsFromList(input.stories)
    slug = `${slugify(input.familyName)}-book`
  } else {
    title = input.personName
    subtitle = `Stories of the ${input.familyName}`
    const list = await fetchStoriesForPerson(input.familyId, input.personId)
    stories = await detailsFromList(list)
    slug = slugify(input.personName)
  }

  const [{ pdf }, { StoryBook }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./StoryBook'),
  ])
  const element = createElement(StoryBook, {
    familyName: input.familyName,
    title,
    subtitle,
    stories,
  })
  const blob = await pdf(element).toBlob()
  saveBlob(blob, `mortang-${slug}.pdf`)
}
