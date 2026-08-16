import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ErrorText, Page, Title } from '../components/ui'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function finish() {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!active) return
        if (exchangeError) {
          setError(exchangeError.message)
          return
        }
        navigate('/', { replace: true })
        return
      }
      const { data } = await supabase.auth.getSession()
      if (!active) return
      if (data.session) {
        navigate('/', { replace: true })
        return
      }
      setError('This sign-in link is missing or expired. Request a new one.')
    }
    void finish()
    return () => {
      active = false
    }
  }, [navigate])

  return (
    <Page narrow>
      <Title>Signing you in</Title>
      <p className="mt-4 text-ink-soft">One moment…</p>
      <div className="mt-4">
        <ErrorText>{error}</ErrorText>
      </div>
    </Page>
  )
}
