import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.',
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '')

export const FAMILY_MEDIA_BUCKET = 'family-media'

export async function signedPhotoUrl(
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from(FAMILY_MEDIA_BUCKET)
    .createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}
