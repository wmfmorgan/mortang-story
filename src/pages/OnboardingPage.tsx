import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Button, ErrorText, Field, Input, Page, Subtitle, Title } from '../components/ui'

export function OnboardingPage({ onCreated }: { onCreated: () => void }) {
  const [familyName, setFamilyName] = useState('')
  const [yourName, setYourName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('bootstrap_family', {
      family_name: familyName.trim(),
      founder_name: yourName.trim(),
    })
    setSaving(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    onCreated()
  }

  return (
    <Page narrow>
      <Title>Start the archive</Title>
      <Subtitle>
        You are the first person here. Name the family and yourself. You will be the founding
        admin.
      </Subtitle>
      <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
        <Field label="Family name">
          <Input
            required
            value={familyName}
            onChange={(event) => setFamilyName(event.target.value)}
            placeholder="The Mortangs"
          />
        </Field>
        <Field label="Your name">
          <Input
            required
            value={yourName}
            onChange={(event) => setYourName(event.target.value)}
            placeholder="June"
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={saving}>
          {saving ? 'Creating…' : 'Create the family'}
        </Button>
      </form>
    </Page>
  )
}
