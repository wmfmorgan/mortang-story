import { useState, type FormEvent } from 'react'
import { Avatar } from '../components/Avatar'
import {
  PersonFields,
  PersonFormActions,
  draftFromPerson,
  yearFromDraft,
} from '../components/PersonFields'
import { Button, ErrorText, Page, Subtitle, Title } from '../components/ui'
import { useApp } from '../context/AppContext'
import { updatePerson, uploadAvatar } from '../hooks/usePeople'

export function ProfilePage() {
  const { person, setPerson, signOut } = useApp()
  const [draft, setDraft] = useState(() => draftFromPerson(person))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!draft.display_name.trim()) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await updatePerson(person, {
        display_name: draft.display_name,
        birth_year: yearFromDraft(draft.birth_year),
        death_year: yearFromDraft(draft.death_year),
        bio: draft.bio,
      })
      setPerson(updated)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile')
    } finally {
      setSaving(false)
    }
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await uploadAvatar(person, file)
      setPerson(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that picture')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Page narrow>
      <Title>Your profile</Title>
      <Subtitle>This is how you appear in the archive. The picture shows in the header.</Subtitle>
      <div className="mt-8 flex items-center gap-4">
        <Avatar person={person} size="lg" />
        <label className="cursor-pointer text-sm text-oxblood hover:underline">
          {uploading ? 'Uploading…' : 'Change picture'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void onPhoto(file)
            }}
          />
        </label>
      </div>
      <form onSubmit={(event) => void save(event)} className="mt-8 space-y-4">
        <PersonFields draft={draft} onChange={setDraft} showEmail={false} />
        <ErrorText>{error}</ErrorText>
        {saved ? <p className="text-sm text-ink-soft">Saved.</p> : null}
        <PersonFormActions saving={saving} submitLabel="Save profile" />
      </form>
      <div className="mt-12 border-t border-rule pt-6">
        <Button type="button" variant="ghost" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </Page>
  )
}
