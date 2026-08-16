import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AppShell } from './components/layout/AppShell'
import { Spinner } from './components/ui'
import { useSession } from './hooks/useSession'
import { supabase } from './lib/supabase'
import { AdminPage } from './pages/AdminPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { EditPerspectivePage } from './pages/EditPerspectivePage'
import { LoginPage } from './pages/LoginPage'
import { NewStoryPage } from './pages/NewStoryPage'
import { NotInvitedPage } from './pages/NotInvitedPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PeoplePage } from './pages/PeoplePage'
import { PersonPage } from './pages/PersonPage'
import { StoryPage } from './pages/StoryPage'
import { ProfilePage } from './pages/ProfilePage'
import { TimelinePage } from './pages/TimelinePage'
import type { Family, Person } from './types/database'

type Gate =
  | { status: 'loading' }
  | { status: 'anon' }
  | { status: 'onboarding' }
  | { status: 'not-invited' }
  | { status: 'ready'; person: Person; family: Family }

export default function App() {
  const { session, loading: sessionLoading } = useSession()
  const [gate, setGate] = useState<Gate>({ status: 'loading' })
  const [tick, setTick] = useState(0)
  const [personOverride, setPersonOverride] = useState<Person | null>(null)

  const refresh = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    document.title = 'Family stories'
  }, [])

  useEffect(() => {
    if (sessionLoading) return
    if (!session) {
      setGate({ status: 'anon' })
      return
    }
    const userId = session.user.id

    let active = true
    async function resolve() {
      setGate({ status: 'loading' })
      const claimed = await supabase.rpc('claim_invite')
      if (!active) return
      let person = (claimed.data as Person | null) ?? null
      if (claimed.error) {
        const existing = await supabase
          .from('people')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        person = (existing.data as Person | null) ?? null
      }
      if (person) {
        const familyResult = await supabase
          .from('families')
          .select('*')
          .eq('id', person.family_id)
          .single()
        if (!active) return
        if (familyResult.data) {
          document.title = (familyResult.data as Family).name
          setGate({
            status: 'ready',
            person,
            family: familyResult.data as Family,
          })
          return
        }
      }
      const exists = await supabase.rpc('family_exists')
      if (!active) return
      if (exists.data === false) {
        setGate({ status: 'onboarding' })
        return
      }
      setGate({ status: 'not-invited' })
    }
    void resolve()
    return () => {
      active = false
    }
  }, [session, sessionLoading, tick])

  async function signOut() {
    await supabase.auth.signOut()
    document.title = 'Family stories'
  }

  if (gate.status === 'loading') return <Spinner label="Opening the archive" />
  if (gate.status === 'anon') {
    return (
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }
  if (gate.status === 'onboarding') {
    return <OnboardingPage onCreated={refresh} />
  }
  if (gate.status === 'not-invited') {
    return <NotInvitedPage onSignOut={() => void signOut()} />
  }

  return (
    <AppProvider
      value={{
        person:
          personOverride && personOverride.id === gate.person.id
            ? personOverride
            : gate.person,
        family: gate.family,
        setPerson: setPersonOverride,
        signOut,
      }}
    >
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<TimelinePage />} />
          <Route path="/me" element={<ProfilePage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/people/:id" element={<PersonPage />} />
          <Route path="/stories/new" element={<NewStoryPage />} />
          <Route path="/stories/:id" element={<StoryPage />} />
          <Route path="/stories/:id/tell" element={<EditPerspectivePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AppProvider>
  )
}
