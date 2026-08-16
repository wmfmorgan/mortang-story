import { useState, type FormEvent } from 'react'
import { createPerson } from '../../hooks/usePeople'
import type { Person } from '../../types/database'
import { Button, ErrorText, Field, Input } from '../ui'

type Props = {
  people: Person[]
  selectedIds: string[]
  familyId: string
  createdBy: string
  onToggle: (id: string) => void
  onCreated: (person: Person) => void
}

export function PersonPicker({
  people,
  selectedIds,
  familyId,
  createdBy,
  onToggle,
  onCreated,
}: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function addMissing(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const person = await createPerson({
        family_id: familyId,
        display_name: name,
        created_by: createdBy,
      })
      onCreated(person)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add person')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {people.map((person) => {
          const selected = selectedIds.includes(person.id)
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => onToggle(person.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selected
                  ? 'border-oxblood bg-oxblood text-paper'
                  : 'border-rule bg-paper text-ink hover:bg-paper-dark'
              }`}
            >
              {person.display_name}
            </button>
          )
        })}
      </div>
      <form onSubmit={(event) => void addMissing(event)} className="flex gap-2">
        <Field label="Someone missing?">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Add a name"
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="ghost" disabled={saving || !name.trim()}>
            Add
          </Button>
        </div>
      </form>
      <ErrorText>{error}</ErrorText>
    </div>
  )
}
