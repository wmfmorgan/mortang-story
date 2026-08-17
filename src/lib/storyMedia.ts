import type { LinkDraft } from '../components/story/MediaFields'
import { FAMILY_MEDIA_BUCKET, supabase } from './supabase'

export async function attachStoryMedia(input: {
  familyId: string
  storyId: string
  uploadedBy: string
  files: File[]
  links: LinkDraft[]
  startOrder?: number
}): Promise<void> {
  const mediaRows: Record<string, unknown>[] = []
  const start = input.startOrder ?? 0
  for (const [index, file] of input.files.entries()) {
    const safeName = file.name.replace(/[^\w.\-]+/g, '_')
    const path = `${input.familyId}/${input.storyId}/${Date.now()}-${index}-${safeName}`
    const { error: uploadError } = await supabase.storage
      .from(FAMILY_MEDIA_BUCKET)
      .upload(path, file, { upsert: false })
    if (uploadError) throw new Error(uploadError.message)
    mediaRows.push({
      family_id: input.familyId,
      story_id: input.storyId,
      kind: 'photo',
      storage_path: path,
      sort_order: start + index,
      uploaded_by: input.uploadedBy,
    })
  }
  input.links
    .filter((link) => link.url.trim())
    .forEach((link, index) => {
      mediaRows.push({
        family_id: input.familyId,
        story_id: input.storyId,
        kind: 'link',
        url: link.url.trim(),
        title: link.title.trim() || null,
        sort_order: start + input.files.length + index,
        uploaded_by: input.uploadedBy,
      })
    })
  if (mediaRows.length === 0) return
  const { error } = await supabase.from('media').insert(mediaRows)
  if (error) throw new Error(error.message)
}

export async function syncStoryPeople(storyId: string, personIds: string[]): Promise<void> {
  const unique = [...new Set(personIds)]
  const { data, error } = await supabase
    .from('story_people')
    .select('person_id')
    .eq('story_id', storyId)
  if (error) throw new Error(error.message)
  const current = new Set((data ?? []).map((row) => row.person_id as string))
  const next = new Set(unique)
  const toAdd = unique.filter((id) => !current.has(id))
  const toRemove = [...current].filter((id) => !next.has(id))
  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from('story_people')
      .insert(toAdd.map((person_id) => ({ story_id: storyId, person_id })))
    if (insertError) throw new Error(insertError.message)
  }
  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('story_people')
      .delete()
      .eq('story_id', storyId)
      .in('person_id', toRemove)
    if (deleteError) throw new Error(deleteError.message)
  }
}

export async function deleteStoryMedia(media: {
  id: string
  storage_path: string | null
}): Promise<void> {
  if (media.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(FAMILY_MEDIA_BUCKET)
      .remove([media.storage_path])
    if (storageError) throw new Error(storageError.message)
  }
  const { error } = await supabase.from('media').delete().eq('id', media.id)
  if (error) throw new Error(error.message)
}
