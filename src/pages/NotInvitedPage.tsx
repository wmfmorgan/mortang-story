import { Button, Page, Subtitle, Title } from '../components/ui'

export function NotInvitedPage({ onSignOut }: { onSignOut: () => void }) {
  return (
    <Page narrow>
      <Title>This archive is invite-only</Title>
      <Subtitle>
        Someone in the family needs to add your email to a person on the Admin page, then you
        can sign in with that same email.
      </Subtitle>
      <div className="mt-8">
        <Button type="button" variant="ghost" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </Page>
  )
}
