import { type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Clapperboard, History, Image as ImageIcon, WandSparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type PageShellProps = {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

const navItems = [
  { to: '/images', label: 'Images', icon: ImageIcon },
  { to: '/videos', label: 'Videos', icon: Clapperboard },
  { to: '/history', label: 'History', icon: History },
]

export function PageShell({ title, description, actions, children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex h-8 items-center gap-2 rounded-lg pr-2 text-sm font-semibold">
            <span className="inline-flex size-8 items-center justify-center rounded-lg border bg-card text-foreground">
              <WandSparkles className="size-4" />
            </span>
            MiniMax Gen
          </Link>

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 rounded-lg border bg-card p-1">
              {navItems.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                        isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                      )
                    }
                  >
                    <Icon className="size-3.5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>
            {actions}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {(title || description) && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              {title && <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>}
              {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
