import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-paper-dark text-ink' : 'text-ink-soft hover:text-ink'}`

export function AppShell() {
  const { person, family, signOut } = useApp()
  const isAdmin = person.role === 'admin'

  return (
    <div className="min-h-svh bg-paper">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <NavLink to="/" className="font-serif text-lg font-semibold text-ink">
            {family.name}
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1">
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
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-md px-3 py-2 text-sm text-ink-soft hover:text-ink"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
