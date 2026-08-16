import { useNavigate } from 'react-router-dom'
import { StoryComposer } from '../components/story/StoryComposer'
import { ErrorText, Page, Spinner, Subtitle, Title } from '../components/ui'
import { useApp } from '../context/AppContext'
import { usePeople } from '../hooks/usePeople'

export function NewStoryPage() {
  const { family, person } = useApp()
  const { people, loading, error, reload } = usePeople(family.id)
  const navigate = useNavigate()

  if (loading) return <Spinner />

  return (
    <Page>
      <Title>Write a story</Title>
      <Subtitle>One event. Your telling. Others can add theirs later.</Subtitle>
      <div className="mt-8">
        <ErrorText>{error}</ErrorText>
        <StoryComposer
          familyId={family.id}
          author={person}
          people={people}
          onPeopleChange={() => void reload()}
          onCreated={(id) => navigate(`/stories/${id}`)}
        />
      </div>
    </Page>
  )
}
