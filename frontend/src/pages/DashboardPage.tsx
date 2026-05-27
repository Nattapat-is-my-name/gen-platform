import { Link } from 'react-router-dom'
import { ArrowRight, Clapperboard, History, Image as ImageIcon } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { PageShell } from '@/components/app/PageShell'
import { cn } from '@/lib/utils'

const features = [
  {
    title: 'Images',
    desc: 'Generate from text or transform a reference image.',
    path: '/images',
    icon: ImageIcon,
    cta: 'Open image studio',
  },
  {
    title: 'Videos',
    desc: 'Create short clips with prompt controls and camera moves.',
    path: '/videos',
    icon: Clapperboard,
    cta: 'Open video studio',
  },
  {
    title: 'History',
    desc: 'Review, open, download, or remove past generations.',
    path: '/history',
    icon: History,
    cta: 'View history',
  },
]

export default function DashboardPage() {
  return (
    <PageShell>
      <section className="grid gap-6 py-3 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
        <div className="space-y-4">
          <div className="inline-flex h-7 items-center rounded-full border bg-card px-3 text-xs font-medium text-muted-foreground">
            MiniMax generation workspace
          </div>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              What do you want to create?
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Pick a workspace, write the prompt, and keep the result in your session history.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/images" className={cn(buttonVariants())}>
              <ImageIcon className="size-4" />
              Images
            </Link>
            <Link to="/videos" className={cn(buttonVariants({ variant: 'outline' }))}>
              <Clapperboard className="size-4" />
              Videos
            </Link>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40 p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">Modes</p>
              <p className="mt-1 text-xl font-semibold">6</p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">Output</p>
              <p className="mt-1 text-xl font-semibold">Image + video</p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">Scope</p>
              <p className="mt-1 text-xl font-semibold">Session</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Start</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.path} className="group block">
              <Card className="h-full rounded-lg transition-colors hover:border-foreground/20 hover:bg-muted/30">
                <CardHeader>
                  <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg border bg-background">
                    <feature.icon className="size-4 text-foreground" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.desc}</CardDescription>
                  <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                    {feature.cta}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
