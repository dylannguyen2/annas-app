# Premium Styling Guide

This document outlines the premium styling patterns used across Anna's World app for consistency.

## Page Container

```tsx
<div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
```

- `gap-6 p-4` on mobile, `sm:gap-8 sm:p-8` on desktop
- `max-w-[1600px]` standard max width
- `animate-in fade-in duration-500` page entrance animation

## Page Header

```tsx
<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-4">
      {/* Icon with glow */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
        <div className="relative p-3 bg-card border border-border/50 rounded-2xl shadow-sm">
          <Icon className="h-7 w-7 text-primary" />
        </div>
      </div>
      {/* Title and subtitle */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
          Page Title
        </h1>
        <p className="text-muted-foreground font-medium mt-1">
          Short description of the page
        </p>
      </div>
    </div>
  </div>
  
  {/* Action buttons on right */}
  <div className="flex flex-wrap items-center gap-2">
    <Button variant="outline" size="sm" className="gap-2 border-border/60 hover:bg-accent/50">
      Action
    </Button>
  </div>
</div>
```

## Summary Stat Cards

Clean, minimal stat cards used on Workouts, Health, and Cycle pages.

### Container
```tsx
<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
```

- Use responsive grid: `grid-cols-2` on mobile, `md:grid-cols-3` or `md:grid-cols-4` on desktop
- Consistent gap: `gap-4`

### Individual Card
```tsx
<Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1">
  {/* Background watermark icon (bottom-right, very subtle) */}
  <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
    <Icon className="w-32 h-32" />
  </div>
  
  <CardHeader className="pb-2 relative">
    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Label
    </CardTitle>
  </CardHeader>
  
  <CardContent className="relative">
    <div className="text-3xl font-bold text-foreground">Value</div>
    <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">subtitle</p>
  </CardContent>
</Card>
```

### Key Design Elements
- **Background icon**: Bottom-right positioned (`-bottom-6 -right-6`), very low opacity (`opacity-[0.03]`), rotated (`rotate-[-15deg]`), large (`w-32 h-32`)
- **Title**: Uppercase with tracking (`text-xs font-semibold uppercase tracking-wider`)
- **Value**: Large and bold (`text-3xl font-bold`)
- **Subtitle**: Subtle and lowercase (`text-xs font-medium opacity-80`)
- **No icon badge in header** - cleaner look

### Using with Map Pattern
```tsx
{[
  { title: "This Week", value: "5", sub: "workouts", icon: CalendarIcon },
  { title: "Duration", value: "3h 45m", sub: "total", icon: Clock },
  { title: "Calories", value: "1,234", sub: "burned", icon: Flame },
].map((stat, i) => (
  <Card key={i} className="relative overflow-hidden ...">
    <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
      <stat.icon className="w-32 h-32" />
    </div>
    <CardHeader className="pb-2 relative">
      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {stat.title}
      </CardTitle>
    </CardHeader>
    <CardContent className="relative">
      <div className="text-3xl font-bold text-foreground">{stat.value}</div>
      <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">{stat.sub}</p>
    </CardContent>
  </Card>
))}`
```

## Two-Column Layout (Calendar + Content)

```tsx
<div className="grid gap-6 lg:grid-cols-[1fr_3fr] items-start">
  {/* Left: Calendar (1/4 width) */}
  <Card>...</Card>
  
  {/* Right: Content (3/4 width) */}
  <div>...</div>
</div>
```

## Calendar Card Header with Legend

```tsx
<CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
  <div className="space-y-3">
    <div>
      <CardTitle className="text-xl">Calendar View</CardTitle>
      <CardDescription>Select a date to log details</CardDescription>
    </div>
    <div className="hidden sm:flex flex-wrap gap-2">
      <Badge variant="outline" className="gap-1.5 py-1 px-2 font-normal border-primary/20 bg-primary/5">
        <div className="w-2 h-2 rounded-full bg-primary" /> Label
      </Badge>
      {/* More badges... */}
    </div>
  </div>
</CardHeader>
```

## List Item Cards

```tsx
<div className="flex items-start justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
  <div className="flex items-start gap-4">
    {/* Icon/emoji */}
    <div className="text-3xl">emoji</div>
    
    <div className="space-y-1">
      {/* Title with badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className="font-medium">Title</h4>
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          <Icon className="h-2.5 w-2.5" />
          Badge
        </span>
      </div>
      
      {/* Metadata */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <Icon className="h-3.5 w-3.5" />
          Value
        </span>
      </div>
    </div>
  </div>
  
  {/* Actions (show on hover) */}
  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <Button variant="ghost" size="icon">...</Button>
  </div>
</div>
```

## Empty States

```tsx
<div className="text-center py-12">
  <div className="text-6xl mb-4">emoji</div>
  <h3 className="text-xl font-semibold mb-2">No items yet</h3>
  <p className="text-muted-foreground mb-6">
    Helpful description text
  </p>
  <Button>Action</Button>
</div>
```

## Theme-Aware Colors

Always use CSS variables for colors to support theming:

| Use | Don't Use |
|-----|-----------|
| `bg-primary/10` | `bg-pink-100` |
| `text-primary` | `text-pink-500` |
| `bg-card` | `bg-white` |
| `border-border/40` | `border-gray-200` |
| `text-muted-foreground` | `text-gray-500` |

For colors that must be specific (like green for "success"):
```tsx
// Light and dark mode variants
className="bg-green-500/20 text-green-700 dark:text-green-300"
className="border-green-500/30 dark:border-green-400/30"
```

## Hover & Transition Effects

Standard transitions:
- `transition-all duration-500` - for cards with multiple effects
- `transition-colors` - for simple color changes
- `transition-opacity duration-500` - for fades
- `hover:-translate-y-0.5` or `hover:-translate-y-1` - subtle lift effect
- `hover:shadow-lg hover:shadow-primary/5` - shadow on hover

## Button Styles

```tsx
// Primary action
<Button size="sm" className="gap-2">Action</Button>

// Secondary/outline action
<Button variant="outline" size="sm" className="gap-2 border-border/60 hover:bg-accent/50">
  <Icon className="h-4 w-4 text-muted-foreground" />
  Action
</Button>

// Ghost action (for less prominent actions)
<Button variant="ghost" size="icon" className="h-8 w-8">
  <Icon className="h-4 w-4" />
</Button>
```

## Mobile Considerations

- Stat cards: Use responsive grid (`grid-cols-2 md:grid-cols-4`) - cards stack nicely on mobile
- For horizontal scroll carousels (if needed): `flex gap-4 overflow-x-auto snap-x snap-mandatory`
- Hide scrollbars: `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`
- Card min-width for carousels: `min-w-[160px]` or `min-w-[200px]`
- Reset on desktop: `md:min-w-0 md:flex-shrink`
- Action buttons below content on mobile (use `sm:hidden` / `hidden sm:flex`)
- Mobile date picker pattern (hidden native input over styled button):
  ```tsx
  <div className="relative">
    <Button variant="outline" size="sm">Select Date</Button>
    <input
      type="date"
      className="absolute inset-0 z-10 opacity-0 cursor-pointer"
    />
  </div>
  ```
