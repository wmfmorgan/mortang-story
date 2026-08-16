import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, ErrorText, Input, Page, Spinner, Subtitle, Title } from '../components/ui'
import { useApp } from '../context/AppContext'
import { personStatus, usePeople } from '../hooks/usePeople'
import { supabase } from '../lib/supabase'
import type { MemberRole, Person } from '../types/database'

export function AdminPage() {
  const { person, family } = useApp()
  const { people, loading, error, reload } = usePeople(family.id)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  if (person.role !== 'admin') return <Navigate to="/" replace />
  if (loading) return <Spinner />

  async function setInvite(target: Person) {
    setSavingId(target.id)
    setFormError(null)
    const email = (drafts[target.id] ?? target.invite_email ?? '').trim()
    const { error: rpcError } = await supabase.rpc('admin_set_invite', {
      target_id: target.id,
      email,
    })
    setSavingId(null)
    if (rpcError) {
      setFormError(rpcError.message)
      return
    }
    await reload()
  }

  async function setRole(target: Person, role: MemberRole) {
    setSavingId(target.id)
    setFormError(null)
    const { error: rpcError } = await supabase.rpc('admin_set_role', {
      target_id: target.id,
      new_role: role,
    })
    setSavingId(null)
    if (rpcError) {
      setFormError(rpcError.message)
      return
    }
    await reload()
  }

  return (
    <Page>
      <Title>Admin</Title>
      <Subtitle>
        Attach an email to a person, then ask them to sign in with that exact address. The
        magic link will land them as that person.
      </Subtitle>
      <ErrorText>{error}</ErrorText>
      <ErrorText>{formError}</ErrorText>
      <ul className="mt-8 space-y-6">
        {people.map((item) => (
          <li key={item.id} className="rounded-lg border border-rule p-4">
            <div className="font-serif text-lg">{item.display_name}</div>
            <p className="text-sm text-ink-soft">
              {personStatus(item) === 'admin'
                ? 'Admin'
                : item.user_id
                  ? 'Has a login'
                  : item.invite_email
                    ? `Invite pending: ${item.invite_email}`
                    : 'No login'}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="invite@email"
                value={drafts[item.id] ?? item.invite_email ?? ''}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                }
              />
              <Button
                type="button"
                variant="ghost"
                disabled={savingId === item.id}
                onClick={() => void setInvite(item)}
              >
                Save invite
              </Button>
            </div>
            {item.user_id && item.id !== person.id ? (
              <div className="mt-2">
                {item.role === 'admin' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={savingId === item.id}
                    onClick={() => void setRole(item, 'member')}
                  >
                    Demote to member
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={savingId === item.id}
                    onClick={() => void setRole(item, 'admin')}
                  >
                    Make admin
                  </Button>
                )}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Page>
  )
}
