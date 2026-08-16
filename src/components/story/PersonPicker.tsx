import { useState } from 'react'
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
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function addMissing() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const person = await createPerson({
        family_id: familyId,
        display_name: name,
        created_by: createdBy,
        email,
      })
      onCreated(person)
      setName('')
      setEmail('')
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
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Field label="Someone missing?">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void addMissing()
              }
            }}
          />
        </Field>
        <Field label="Email" hint="Optional. They get a sign-in link right away.">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="aunt@email"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void addMissing()
              }
            }}
          />
        </Field>
        <div className="flex items-end">
          <Button
            type="button"
            variant="ghost"
            disabled={saving || !name.trim()}
            onClick={() => void addMissing()}
          >
            {saving ? 'Adding…' : email.trim() ? 'Add and invite' : 'Add'}
          </Button>
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  )
}
