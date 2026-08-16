import { Button, Field, Input } from './ui'

export type PersonDraft = {
  display_name: string
  email: string
  birth_year: string
  death_year: string
  bio: string
}

export const emptyPersonDraft: PersonDraft = {
  display_name: '',
  email: '',
  birth_year: '',
  death_year: '',
  bio: '',
}

export function draftFromPerson(person: {
  display_name: string
  invite_email: string | null
  birth_year: number | null
  death_year: number | null
  bio: string | null
}): PersonDraft {
  return {
    display_name: person.display_name,
    email: person.invite_email ?? '',
    birth_year: person.birth_year?.toString() ?? '',
    death_year: person.death_year?.toString() ?? '',
    bio: person.bio ?? '',
  }
}

export function yearFromDraft(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const year = Number(trimmed)
  return Number.isFinite(year) ? year : null
}

type Props = {
  draft: PersonDraft
  onChange: (draft: PersonDraft) => void
  showEmail?: boolean
  emailHint?: string
}

export function PersonFields({
  draft,
  onChange,
  showEmail = true,
  emailHint = 'Optional. Leave blank for someone who will not log in.',
}: Props) {
  function set<K extends keyof PersonDraft>(key: K, value: PersonDraft[K]) {
    onChange({ ...draft, [key]: value })
  }

  return (
    <div className="space-y-3">
      <Field label="Name">
        <Input
          required
          value={draft.display_name}
          onChange={(event) => set('display_name', event.target.value)}
        />
      </Field>
      {showEmail ? (
        <Field label="Email" hint={emailHint}>
          <Input
            type="email"
            value={draft.email}
            onChange={(event) => set('email', event.target.value)}
            placeholder="aunt@email"
          />
        </Field>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Born (year)">
          <Input
            value={draft.birth_year}
            onChange={(event) => set('birth_year', event.target.value)}
          />
        </Field>
        <Field label="Died (year)">
          <Input
            value={draft.death_year}
            onChange={(event) => set('death_year', event.target.value)}
          />
        </Field>
      </div>
      <Field label="A line about them">
        <Input value={draft.bio} onChange={(event) => set('bio', event.target.value)} />
      </Field>
    </div>
  )
}

export function PersonFormActions({
  saving,
  submitLabel,
  onCancel,
}: {
  saving: boolean
  submitLabel: string
  onCancel?: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : submitLabel}
      </Button>
      {onCancel ? (
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      ) : null}
    </div>
  )
}
