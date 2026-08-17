import { useEffect, useState } from 'react'
import { deleteStoryMedia } from '../../lib/storyMedia'
import { signedPhotoUrl } from '../../lib/supabase'
import type { Media } from '../../types/database'

function Photo({
  path,
  alt,
  canDelete,
  onDelete,
}: {
  path: string
  alt: string
  canDelete: boolean
  onDelete: () => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    let active = true
    void signedPhotoUrl(path).then((next) => {
      if (active) setUrl(next)
    })
    return () => {
      active = false
    }
  }, [path])

  async function remove() {
    if (!confirm('Remove this picture?')) return
    setRemoving(true)
    try {
      await onDelete()
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="relative">
      {url ? (
        <img src={url} alt={alt} className="h-full w-full rounded-md object-cover" />
      ) : (
        <div className="aspect-[4/3] rounded-md bg-paper-dark" />
      )}
      {canDelete ? (
        <button
          type="button"
          onClick={() => void remove()}
          disabled={removing}
          className="absolute top-2 right-2 rounded-full bg-paper/90 px-2 py-0.5 text-xs text-oxblood shadow-sm hover:bg-paper"
        >
          {removing ? '…' : 'Remove'}
        </button>
      ) : null}
    </div>
  )
}

export function StoryMedia({
  media,
  currentPersonId,
  isAdmin,
  onChange,
}: {
  media: Media[]
  currentPersonId: string
  isAdmin: boolean
  onChange: (media: Media[]) => void
}) {
  const photos = media.filter((item) => item.kind === 'photo' && item.storage_path)
  const links = media.filter((item) => item.kind === 'link' && item.url)
  if (photos.length === 0 && links.length === 0) return null

  async function remove(item: Media) {
    await deleteStoryMedia(item)
    onChange(media.filter((row) => row.id !== item.id))
  }

  return (
    <div className="space-y-4">
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <Photo
              key={photo.id}
              path={photo.storage_path as string}
              alt={photo.title ?? ''}
              canDelete={isAdmin || photo.uploaded_by === currentPersonId}
              onDelete={() => remove(photo)}
            />
          ))}
        </div>
      ) : null}
      {links.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {links.map((link) => {
            const canDelete = isAdmin || link.uploaded_by === currentPersonId
            return (
              <li key={link.id} className="flex items-baseline gap-3">
                <a
                  href={link.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="text-oxblood underline-offset-2 hover:underline"
                >
                  {link.title || link.url}
                </a>
                {canDelete ? (
                  <button
                    type="button"
                    className="text-xs text-ink-soft hover:text-oxblood"
                    onClick={() => {
                      if (confirm('Remove this link?')) void remove(link)
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
