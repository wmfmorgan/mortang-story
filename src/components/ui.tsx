import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'
import { Link } from 'react-router-dom'

export function Page({
  children,
  narrow = false,
  wide = false,
}: {
  children: ReactNode
  narrow?: boolean
  wide?: boolean
}) {
  const width = narrow ? 'max-w-xl' : wide ? 'max-w-5xl' : 'max-w-3xl'
  return (
    <div className={`mx-auto w-full px-4 py-8 sm:px-6 ${width}`}>
      {children}
    </div>
  )
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
      {children}
    </h1>
  )
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-ink-soft">{children}</p>
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}) {
  const styles = {
    primary: 'bg-oxblood text-paper hover:bg-oxblood-hover',
    ghost: 'border border-rule bg-transparent text-ink hover:bg-paper-dark',
    danger: 'border border-oxblood/40 text-oxblood hover:bg-oxblood/10',
  }[variant]
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  )
}

export function ButtonLink({
  to,
  children,
  variant = 'primary',
}: {
  to: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
}) {
  const styles =
    variant === 'primary'
      ? 'bg-oxblood text-paper hover:bg-oxblood-hover'
      : 'border border-rule text-ink hover:bg-paper-dark'
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium ${styles}`}
    >
      {children}
    </Link>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-soft">{hint}</span> : null}
    </div>
  )
}

const inputClass =
  'w-full rounded-md border border-rule bg-paper px-3 py-2 text-ink outline-none focus:border-oxblood'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClass} {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClass} min-h-40 leading-relaxed`} {...props} />
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="text-sm text-oxblood">{children}</p>
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-dashed border-rule px-6 py-12 text-center">
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      <p className="mt-2 text-ink-soft">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-ink-soft">{label}…</div>
  )
}
