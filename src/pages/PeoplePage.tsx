import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, ErrorText, Field, Input, Page, Spinner, Title } from '../components/ui'
import { useApp } from '../context/AppContext'
import { createPerson, personStatus, personYears, usePeople } from '../hooks/usePeople'

const statusLabel = {
  admin: 'Admin',
  member: 'Has a login',
  invited: 'Invited',
  person: 'No login',
}

export function PeoplePage() {
  const { family, person } = useApp()
  const { people, loading, error, reload } = usePeople(family.id)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [birth, setBirth] = useState('')
  const [death, setDeath] = useState('')
  const [bio, setBio] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function add(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setFormError(null)
    try {
      await createPerson({
        family_id: family.id,
        display_name: name,
        birth_year: birth ? Number(birth) : null,
        death_year: death ? Number(death) : null,
        bio,
        created_by: person.id,
        email,
      })
      setName('')
      setEmail('')
      setBirth('')
      setDeath('')
      setBio('')
      await reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add person')
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
      </p>
      <ul className="mt-8 divide-y divide-rule">
        {people.map((item) => (
          <li key={item.id} className="py-3">
            <Link to={`/people/${item.id}`} className="block hover:text-oxblood">
              <span className="font-serif text-lg">{item.display_name}</span>
              <span className="ml-2 text-sm text-ink-soft">
                {personYears(item) ? `${personYears(item)} · ` : ''}
                {statusLabel[personStatus(item)]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <form onSubmit={(event) => void add(event)} className="mt-10 space-y-3 border-t border-rule pt-8">
        <h2 className="font-serif text-xl">Add a person</h2>
        <Field label="Name">
          <Input required value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Email" hint="Optional. Leave blank for someone who will not log in.">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="aunt@email"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Born (year)">
            <Input value={birth} onChange={(event) => setBirth(event.target.value)} />
          </Field>
          <Field label="Died (year)">
            <Input value={death} onChange={(event) => setDeath(event.target.value)} />
          </Field>
        </div>
        <Field label="A line about them">
          <Input value={bio} onChange={(event) => setBio(event.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <ErrorText>{formError}</ErrorText>
        <Button type="submit" disabled={saving}>
          {saving ? 'Adding…' : email.trim() ? 'Add and invite' : 'Add person'}
        </Button>
      </form>
    </Page>
  )
}
