import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  PersonFields,
  PersonFormActions,
  draftFromPerson,
  emptyPersonDraft,
  yearFromDraft,
} from '../components/PersonFields'
import { Avatar } from '../components/Avatar'
import { ErrorText, Page, Spinner, Title } from '../components/ui'
import { useApp } from '../context/AppContext'
import {
  createPerson,
  personStatus,
  personYears,
  updatePerson,
  usePeople,
} from '../hooks/usePeople'
import type { Person } from '../types/database'

const statusLabel = {
  admin: 'Admin',
  member: 'Has a login',
  invited: 'Invited',
  person: 'No login',
}

export function PeoplePage() {
  const { family, person } = useApp()
  const { people, loading, error, reload } = usePeople(family.id)
  const [draft, setDraft] = useState(emptyPersonDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const editing = people.find((item) => item.id === editingId) ?? null

  function startEdit(item: Person) {
    setEditingId(item.id)
    setDraft(draftFromPerson(item))
    setFormError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft(emptyPersonDraft)
    setFormError(null)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!draft.display_name.trim()) return
    setSaving(true)
    setFormError(null)
    try {
      const fields = {
        display_name: draft.display_name,
        birth_year: yearFromDraft(draft.birth_year),
        death_year: yearFromDraft(draft.death_year),
        bio: draft.bio,
        email: draft.email,
      }
      if (editing) {
        await updatePerson(editing, fields)
      } else {
        await createPerson({
          family_id: family.id,
          created_by: person.id,
          ...fields,
        })
      }
      cancelEdit()
      await reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save this person')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <Page>
      <Title>People</Title>
      <p className="mt-2 text-ink-soft">
        Anyone can appear in a story. Add an email and they get a sign-in link immediately.
        Click Edit to change someone who is already here.
      </p>
      <ul className="mt-8 divide-y divide-rule">
        {people.map((item) => (
          <li key={item.id} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <Link to={`/people/${item.id}`} className="flex min-w-0 items-center gap-3 hover:text-oxblood">
                <Avatar person={item} size="sm" />
                <span className="font-serif text-lg">{item.display_name}</span>
                <span className="ml-2 text-sm text-ink-soft">
                  {personYears(item) ? `${personYears(item)} · ` : ''}
                  {statusLabel[personStatus(item)]}
                </span>
              </Link>
              <button
                type="button"
                className="shrink-0 text-sm text-oxblood hover:underline"
                onClick={() => startEdit(item)}
              >
                Edit
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={(event) => void save(event)} className="mt-10 space-y-3 border-t border-rule pt-8">
        <h2 className="font-serif text-xl">
          {editing ? `Edit ${editing.display_name}` : 'Add a person'}
        </h2>
        <PersonFields
          draft={draft}
          onChange={setDraft}
          showEmail={!editing?.user_id}
          emailHint={
            editing
              ? 'Changing this sends a new sign-in link.'
              : 'Optional. Leave blank for someone who will not log in.'
          }
        />
        <ErrorText>{error}</ErrorText>
        <ErrorText>{formError}</ErrorText>
        <PersonFormActions
          saving={saving}
          submitLabel={
            editing
              ? 'Save changes'
              : draft.email.trim()
                ? 'Add and invite'
                : 'Add person'
          }
          onCancel={editing ? cancelEdit : undefined}
        />
      </form>
    </Page>
  )
}
