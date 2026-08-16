import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Button, ErrorText, Field, Input, Page, Subtitle, Title } from '../components/ui'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })
    setSaving(false)
    if (authError) {
      setError(authError.message)
      return
    }
    setSent(true)
  }

  return (
    <Page narrow>
      <Title>Family stories</Title>
      <Subtitle>Sign in with your email. We will send a link — no password.</Subtitle>
      {sent ? (
        <p className="mt-8 text-ink">
          Check {email} for a sign-in link. It may take a minute, and it can land in junk.
        </p>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
          <Field label="Email">
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={saving}>
            {saving ? 'Sending…' : 'Send the link'}
          </Button>
        </form>
      )}
    </Page>
  )
}
