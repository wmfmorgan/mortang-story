import { useEffect, useState } from 'react'
import { signedPhotoUrl } from '../lib/supabase'

type PersonLike = {
  display_name: string
  avatar_path: string | null
}

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-24 w-24 text-2xl',
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

export function Avatar({
  person,
  size = 'sm',
  className = '',
}: {
  person: PersonLike
  size?: keyof typeof sizes
  className?: string
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setUrl(null)
    void signedPhotoUrl(person.avatar_path).then((next) => {
      if (active) setUrl(next)
    })
    return () => {
      active = false
    }
  }, [person.avatar_path])

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-oxblood text-paper ${sizes[size]} ${className}`}
      aria-hidden={false}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-medium">{initials(person.display_name)}</span>
      )}
    </span>
  )
}
