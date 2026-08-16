import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../Avatar'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-paper-dark text-ink' : 'text-ink-soft hover:text-ink'}`

export function AppShell() {
  const { person, family } = useApp()
  const isAdmin = person.role === 'admin'

  return (
    <div className="min-h-svh bg-paper">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <NavLink to="/" className="font-serif text-lg font-semibold text-ink">
            {family.name}
          </NavLink>
          <nav className="ml-auto flex flex-wrap items-center justify-end gap-1">
            <NavLink to="/" end className={linkClass}>
              Timeline
            </NavLink>
            <NavLink to="/people" className={linkClass}>
              People
            </NavLink>
            <NavLink to="/stories/new" className={linkClass}>
              Write
            </NavLink>
            {isAdmin ? (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            ) : null}
            <NavLink
              to="/me"
              title="Your profile"
              className="ml-1 rounded-full ring-offset-2 ring-offset-paper hover:ring-2 hover:ring-oxblood/40"
            >
              <Avatar person={person} size="sm" />
              <span className="sr-only">Your profile</span>
            </NavLink>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
