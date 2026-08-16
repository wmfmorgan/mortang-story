import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Person } from '../types/database'

export function usePeople(familyId: string) {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    const { data, error: queryError } = await supabase
      .from('people')
      .select('*')
      .eq('family_id', familyId)
      .order('display_name')
    if (queryError) {
      setError(queryError.message)
      setPeople([])
    } else {
      setPeople((data ?? []) as Person[])
    }
    setLoading(false)
  }, [familyId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { people, loading, error, reload }
}

export async function createPerson(input: {
  family_id: string
  display_name: string
  birth_year?: number | null
  death_year?: number | null
  bio?: string | null
  created_by: string
}): Promise<Person> {
  const { data, error } = await supabase
    .from('people')
    .insert({
      family_id: input.family_id,
      display_name: input.display_name.trim(),
      birth_year: input.birth_year ?? null,
      death_year: input.death_year ?? null,
      bio: input.bio?.trim() || null,
      created_by: input.created_by,
    })
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Could not add person')
  return data as Person
}

export function personYears(person: Person): string | null {
  if (!person.birth_year && !person.death_year) return null
  return `${person.birth_year ?? '—'} – ${person.death_year ?? ''}`
}

export function personStatus(person: Person): 'admin' | 'member' | 'invited' | 'person' {
  if (person.role === 'admin') return 'admin'
  if (person.user_id) return 'member'
  if (person.invite_email) return 'invited'
  return 'person'
}
