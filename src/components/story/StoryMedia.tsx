import { useEffect, useState } from 'react'
import { signedPhotoUrl } from '../../lib/supabase'
import type { Media } from '../../types/database'

function Photo({ path, alt }: { path: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    void signedPhotoUrl(path).then((next) => {
      if (active) setUrl(next)
    })
    return () => {
      active = false
    }
  }, [path])
  if (!url) return <div className="aspect-[4/3] rounded-md bg-paper-dark" />
  return <img src={url} alt={alt} className="h-full w-full rounded-md object-cover" />
}

export function StoryMedia({ media }: { media: Media[] }) {
  const photos = media.filter((item) => item.kind === 'photo' && item.storage_path)
  const links = media.filter((item) => item.kind === 'link' && item.url)
  if (photos.length === 0 && links.length === 0) return null
  return (
    <div className="space-y-4">
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <Photo key={photo.id} path={photo.storage_path as string} alt={photo.title ?? ''} />
          ))}
        </div>
      ) : null}
      {links.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={link.url ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="text-oxblood underline-offset-2 hover:underline"
              >
                {link.title || link.url}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
