# MiniMax Gen UI Style Guide

Use this guide to recreate the same simple, clean shadcn-style UI in another project.

## Design Goal

The UI should feel quiet, practical, and focused. It is a workspace, not a landing page.

Prioritize:

- Clear navigation.
- Neutral colors.
- Strong spacing.
- Simple cards.
- Obvious empty, loading, success, and error states.
- A small number of reusable layout patterns.

Avoid:

- Big gradients.
- Decorative backgrounds.
- Emoji icons.
- Heavy shadows.
- Nested cards.
- Large marketing-style hero sections.
- Too many accent colors.

## Core Stack

Use:

- React or Next.js.
- Tailwind CSS.
- shadcn-style components.
- `lucide-react` icons.
- Geist font.

Recommended packages:

```bash
npm install lucide-react class-variance-authority clsx tailwind-merge @fontsource-variable/geist
```

## Theme Tokens

Use CSS variables and Tailwind theme mapping. This keeps the UI consistent and lets shadcn components read the same design language everywhere.

```css
@import '@fontsource-variable/geist';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 99%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 72.2% 50.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
    --radius-md: 0.5rem;
  }

  * {
    @apply border-border;
  }

  html {
    font-family: 'Geist Variable', ui-sans-serif, system-ui, sans-serif;
  }

  body {
    @apply bg-background text-foreground antialiased;
  }
}
```

Tailwind config:

```js
theme: {
  extend: {
    colors: {
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
    fontFamily: {
      sans: ['Geist Variable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      heading: ['Geist Variable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    ringWidth: {
      3: '3px',
    },
  },
}
```

## Color Rules

The app is mostly neutral:

- Page background: near-white.
- Cards: white.
- Borders: soft gray.
- Text: almost black.
- Secondary text: muted gray.
- Primary actions: black.
- Destructive actions: red only when needed.
- Success: emerald.
- Processing or warning: amber.

Do not make every surface blue, purple, or gradient. Use color only to communicate state.

Good examples:

```tsx
<Button>Generate image</Button>
<Button variant="outline">Refresh</Button>
<span className="border-emerald-200 bg-emerald-50 text-emerald-700">success</span>
<span className="border-amber-200 bg-amber-50 text-amber-700">processing</span>
```

## Layout System

Use one shared shell for most app pages.

Recommended shell:

```tsx
<div className="min-h-screen bg-background text-foreground">
  <header className="border-b bg-background/95">
    <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
      {/* brand + nav */}
    </div>
  </header>

  <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
    {/* page content */}
  </main>
</div>
```

Use:

- `max-w-6xl` for app pages.
- `px-4 sm:px-6 lg:px-8` for page padding.
- `py-6` for page content.
- `gap-4` for cards.
- `gap-6` for main page columns.
- `rounded-lg` for cards and panels.
- `border` instead of heavy shadows.

## Navigation

Keep navigation small and predictable.

Pattern:

```tsx
<nav className="flex items-center gap-1 rounded-lg border bg-card p-1">
  <NavLink className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-sm">
    <ImageIcon className="size-3.5" />
    <span className="hidden sm:inline">Images</span>
  </NavLink>
</nav>
```

Mobile rule:

- Show icons.
- Hide nav text with `hidden sm:inline`.
- Keep buttons compact.

## Page Headers

Use direct, short titles.

Good:

```tsx
<h1 className="text-2xl font-semibold tracking-tight text-foreground">Images</h1>
<p className="max-w-2xl text-sm text-muted-foreground">
  Generate from text or use a reference image.
</p>
```

Avoid:

- Huge headings inside tool pages.
- Marketing copy.
- Long instructions.

## Dashboard Pattern

The dashboard should answer one question: where should the user go next?

Use:

- One short intro.
- Two primary actions.
- One compact stats panel.
- Three feature cards.

Feature card pattern:

```tsx
<Card className="h-full rounded-lg transition-colors hover:border-foreground/20 hover:bg-muted/30">
  <CardHeader>
    <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg border bg-background">
      <ImageIcon className="size-4 text-foreground" />
    </div>
    <CardTitle>Images</CardTitle>
    <CardDescription>Generate from text or transform a reference image.</CardDescription>
    <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground">
      Open image studio
      <ArrowRight className="size-3.5" />
    </div>
  </CardHeader>
</Card>
```

## Tool Page Pattern

For generation or editing tools, use a two-column layout:

```tsx
<div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
  <Card className="rounded-lg">
    {/* controls */}
  </Card>

  <Card className="rounded-lg lg:sticky lg:top-6 lg:self-start">
    {/* result preview */}
  </Card>
</div>
```

Left side:

- Mode selector.
- Prompt input.
- Settings.
- Submit button.

Right side:

- Result preview.
- Status.
- Open/download actions.
- Empty state.

## Mode Selectors

Use segmented controls instead of tabs when choices are few.

```tsx
<div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted p-1">
  <Button variant={mode === 'text' ? 'default' : 'ghost'}>Text</Button>
  <Button variant={mode === 'reference' ? 'default' : 'ghost'}>Reference</Button>
</div>
```

For four options:

```tsx
<div className="grid gap-1 rounded-lg border bg-muted p-1 sm:grid-cols-2">
  {/* buttons */}
</div>
```

## Forms

Keep labels short and controls full width.

```tsx
<div className="space-y-2">
  <Label htmlFor="prompt">Prompt</Label>
  <Textarea
    id="prompt"
    className="min-h-32 resize-none"
    placeholder="A calm street scene at dusk [Pan left]"
  />
</div>
```

Select controls:

```tsx
<Select>
  <SelectTrigger className="w-full">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="768P">768P</SelectItem>
  </SelectContent>
</Select>
```

## Empty States

Every output area needs a calm empty state.

```tsx
<div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-center">
  <div className="mb-4 flex size-12 items-center justify-center rounded-lg border bg-card">
    <ImageIcon className="size-5 text-muted-foreground" />
  </div>
  <p className="text-sm font-medium text-foreground">No image yet</p>
  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
    Generated images appear here when they finish.
  </p>
</div>
```

Rules:

- Use dashed border.
- Use one icon.
- Use one short title.
- Use one muted sentence.
- Do not add paragraphs of help text.

## Error States

Do not show an empty state when the app failed to load data.

Use:

```tsx
<Card className="rounded-lg">
  <CardContent className="py-14 text-center">
    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg border bg-card">
      <HistoryIcon className="size-5 text-muted-foreground" />
    </div>
    <h3 className="text-base font-medium text-foreground">History unavailable</h3>
    <p className="mt-1 text-sm text-muted-foreground">Check the API connection and refresh.</p>
    <Button variant="outline" size="sm" className="mt-4">
      <RefreshCw className="size-4" />
      Refresh
    </Button>
  </CardContent>
</Card>
```

## Status Badges

Use subtle badges with borders.

```tsx
const styles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  failed: 'border-red-200 bg-red-50 text-red-700',
  processing: 'border-amber-200 bg-amber-50 text-amber-700',
  pending: 'border-border bg-muted text-muted-foreground',
}
```

Badge class:

```tsx
<span className="inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium capitalize">
  success
</span>
```

## Buttons

Button hierarchy:

- Primary: submit or main action.
- Outline: secondary action.
- Ghost: mode switches, low-emphasis controls.
- Destructive text only when deleting.

Examples:

```tsx
<Button>
  <WandSparkles className="size-4" />
  Generate image
</Button>

<Button variant="outline">
  <RefreshCw className="size-4" />
  Refresh
</Button>

<Button variant="outline" className="text-destructive hover:text-destructive">
  <Trash2 className="size-3.5" />
</Button>
```

## Icons

Use Lucide icons.

Recommended:

- Brand/action: `WandSparkles`.
- Images: `Image`.
- Videos: `Clapperboard`.
- History: `History`.
- Refresh: `RefreshCw`.
- Upload: `Upload`.
- Open external: `ExternalLink`.
- Delete: `Trash2`.
- Download: `Download`.

Icon sizes:

- Nav icons: `size-3.5`.
- Button icons: `size-4`.
- Empty state icons: `size-5`.
- Placeholder cards: `size-6`.

## Responsive Rules

Desktop:

- Use two-column layouts for tools.
- Keep result card sticky with `lg:sticky lg:top-6`.
- Use `max-w-6xl`.

Mobile:

- Stack everything vertically.
- Hide nav text.
- Keep forms full width.
- Keep button text short.
- Do not use viewport-scaled font sizes.

Useful layout classes:

```tsx
className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]"
className="grid gap-4 sm:grid-cols-2"
className="grid gap-4 md:grid-cols-3"
```

## Spacing And Shape

Use these defaults:

- Card radius: `rounded-lg`.
- Inner panel radius: `rounded-md`.
- Page padding: `px-4 py-6 sm:px-6 lg:px-8`.
- Card gap: `gap-4`.
- Major layout gap: `gap-6`.
- Card padding comes from shadcn card components.

Avoid:

- `rounded-2xl` and larger.
- Large drop shadows.
- Multiple borders inside borders unless it is a form segment or preview area.

## Copy Style

Use short, direct labels.

Good:

- Images
- Videos
- History
- Create image
- Generate image
- No image yet
- History unavailable

Avoid:

- "Unlock your creative potential"
- "Experience the next generation of AI"
- Long tutorial text inside the page

## Checklist For New Screens

Before finishing a new screen:

- The page uses the shared shell.
- The page has one short title and one muted description.
- Main content is inside a `max-w-6xl` container.
- Cards use `rounded-lg border bg-card`.
- Controls use shadcn components.
- Icons come from Lucide.
- Empty, loading, and error states are distinct.
- Mobile stacks cleanly.
- Text does not overflow buttons or cards.
- No gradients, emoji icons, or heavy shadows.

