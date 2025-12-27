# Notebook Design System

A comprehensive design system for the Notebook application, built on Tailwind CSS and shadcn/ui.

---

## 1. Design Tokens

### 1.1 Colors

Our color system uses OKLCH for perceptual uniformity and better dark mode support.

#### Brand Colors

```css
/* Primary - Blue/Indigo */
--color-primary-50:  oklch(97% 0.02 250);
--color-primary-100: oklch(94% 0.04 250);
--color-primary-200: oklch(88% 0.08 250);
--color-primary-300: oklch(78% 0.12 250);
--color-primary-400: oklch(68% 0.15 250);
--color-primary-500: oklch(58% 0.18 250);  /* Default */
--color-primary-600: oklch(50% 0.18 250);
--color-primary-700: oklch(42% 0.16 250);
--color-primary-800: oklch(35% 0.14 250);
--color-primary-900: oklch(28% 0.10 250);
--color-primary-950: oklch(20% 0.08 250);

/* Secondary - Teal */
--color-secondary-50:  oklch(97% 0.02 180);
--color-secondary-100: oklch(94% 0.04 180);
--color-secondary-200: oklch(88% 0.08 180);
--color-secondary-300: oklch(78% 0.12 180);
--color-secondary-400: oklch(68% 0.14 180);
--color-secondary-500: oklch(60% 0.14 180);  /* Default */
--color-secondary-600: oklch(52% 0.14 180);
--color-secondary-700: oklch(44% 0.12 180);
--color-secondary-800: oklch(36% 0.10 180);
--color-secondary-900: oklch(28% 0.08 180);
--color-secondary-950: oklch(20% 0.06 180);
```

#### Neutral Colors (Zinc-based)

```css
/* Light Mode */
--color-background:    oklch(99% 0.002 250);
--color-foreground:    oklch(15% 0.02 260);
--color-card:          oklch(100% 0 0);
--color-card-foreground: oklch(15% 0.02 260);
--color-muted:         oklch(96% 0.005 250);
--color-muted-foreground: oklch(45% 0.02 260);
--color-border:        oklch(91% 0.006 250);
--color-input:         oklch(91% 0.006 250);
--color-ring:          oklch(58% 0.18 250);

/* Dark Mode */
--color-background-dark:    oklch(10% 0.015 260);
--color-foreground-dark:    oklch(98% 0.002 250);
--color-card-dark:          oklch(14% 0.012 260);
--color-card-foreground-dark: oklch(98% 0.002 250);
--color-muted-dark:         oklch(20% 0.015 260);
--color-muted-foreground-dark: oklch(65% 0.01 250);
--color-border-dark:        oklch(26% 0.01 260);
--color-input-dark:         oklch(26% 0.01 260);
--color-ring-dark:          oklch(65% 0.15 250);
```

#### Semantic Colors

```css
/* Success - Green */
--color-success:      oklch(65% 0.18 145);
--color-success-foreground: oklch(98% 0.02 145);

/* Warning - Amber */
--color-warning:      oklch(75% 0.15 85);
--color-warning-foreground: oklch(20% 0.05 85);

/* Error/Destructive - Red */
--color-destructive:  oklch(55% 0.22 25);
--color-destructive-foreground: oklch(98% 0.02 25);

/* Info - Blue */
--color-info:         oklch(60% 0.15 250);
--color-info-foreground: oklch(98% 0.02 250);
```

### 1.2 Typography

#### Font Families

```css
--font-sans: "Inter Variable", "Inter", system-ui, -apple-system, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
```

#### Type Scale (Major Third - 1.25)

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| `xs` | 0.75rem (12px) | 1rem | 400 | Labels, captions |
| `sm` | 0.875rem (14px) | 1.25rem | 400 | Secondary text |
| `base` | 1rem (16px) | 1.5rem | 400 | Body text |
| `lg` | 1.125rem (18px) | 1.75rem | 400 | Lead paragraphs |
| `xl` | 1.25rem (20px) | 1.75rem | 500 | Card titles |
| `2xl` | 1.563rem (25px) | 2rem | 600 | Section headers |
| `3xl` | 1.953rem (31px) | 2.25rem | 600 | Page titles |
| `4xl` | 2.441rem (39px) | 2.5rem | 700 | Hero headlines |

```css
--text-xs:   0.75rem;
--text-sm:   0.875rem;
--text-base: 1rem;
--text-lg:   1.125rem;
--text-xl:   1.25rem;
--text-2xl:  1.563rem;
--text-3xl:  1.953rem;
--text-4xl:  2.441rem;

--leading-tight:   1.25;
--leading-snug:    1.375;
--leading-normal:  1.5;
--leading-relaxed: 1.75;
--leading-loose:   2;

--tracking-tight:  -0.025em;
--tracking-normal: 0;
--tracking-wide:   0.025em;
```

### 1.3 Spacing Scale

Base unit: 4px (0.25rem)

```css
--spacing-0:   0;
--spacing-0.5: 0.125rem;  /* 2px */
--spacing-1:   0.25rem;   /* 4px */
--spacing-1.5: 0.375rem;  /* 6px */
--spacing-2:   0.5rem;    /* 8px */
--spacing-2.5: 0.625rem;  /* 10px */
--spacing-3:   0.75rem;   /* 12px */
--spacing-3.5: 0.875rem;  /* 14px */
--spacing-4:   1rem;      /* 16px */
--spacing-5:   1.25rem;   /* 20px */
--spacing-6:   1.5rem;    /* 24px */
--spacing-7:   1.75rem;   /* 28px */
--spacing-8:   2rem;      /* 32px */
--spacing-9:   2.25rem;   /* 36px */
--spacing-10:  2.5rem;    /* 40px */
--spacing-11:  2.75rem;   /* 44px */
--spacing-12:  3rem;      /* 48px */
--spacing-14:  3.5rem;    /* 56px */
--spacing-16:  4rem;      /* 64px */
--spacing-20:  5rem;      /* 80px */
--spacing-24:  6rem;      /* 96px */
```

### 1.4 Border Radius

```css
--radius-none: 0;
--radius-sm:   0.25rem;   /* 4px - Small buttons */
--radius-md:   0.375rem;  /* 6px - Default */
--radius-lg:   0.5rem;    /* 8px - Cards */
--radius-xl:   0.75rem;   /* 12px - Modals */
--radius-2xl:  1rem;      /* 16px - Large containers */
--radius-3xl:  1.5rem;    /* 24px - Hero sections */
--radius-full: 9999px;    /* Pills, avatars */
```

### 1.5 Shadows

```css
/* Light Mode */
--shadow-sm:  0 1px 2px 0 oklch(0% 0 0 / 0.05);
--shadow:     0 1px 3px 0 oklch(0% 0 0 / 0.1), 0 1px 2px -1px oklch(0% 0 0 / 0.1);
--shadow-md:  0 4px 6px -1px oklch(0% 0 0 / 0.1), 0 2px 4px -2px oklch(0% 0 0 / 0.1);
--shadow-lg:  0 10px 15px -3px oklch(0% 0 0 / 0.1), 0 4px 6px -4px oklch(0% 0 0 / 0.1);
--shadow-xl:  0 20px 25px -5px oklch(0% 0 0 / 0.1), 0 8px 10px -6px oklch(0% 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px oklch(0% 0 0 / 0.25);

/* Dark Mode - softer with blue tint */
--shadow-sm-dark:  0 1px 2px 0 oklch(0% 0 0 / 0.3);
--shadow-dark:     0 1px 3px 0 oklch(0% 0 0 / 0.4), 0 1px 2px -1px oklch(0% 0 0 / 0.4);
--shadow-md-dark:  0 4px 6px -1px oklch(0% 0 0 / 0.4), 0 2px 4px -2px oklch(0% 0 0 / 0.4);
--shadow-lg-dark:  0 10px 15px -3px oklch(0% 0 0 / 0.4), 0 4px 6px -4px oklch(0% 0 0 / 0.4);
```

### 1.6 Transitions

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in:      cubic-bezier(0.4, 0, 1, 1);
--ease-out:     cubic-bezier(0, 0, 0.2, 1);
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-bounce:  cubic-bezier(0.68, -0.55, 0.27, 1.55);

--duration-75:  75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;
```

---

## 2. Component Inventory

### 2.1 Primitives

| Component | Variants | States | Keyboard | ARIA |
|-----------|----------|--------|----------|------|
| **Button** | default, secondary, destructive, outline, ghost, link | hover, focus, active, disabled, loading | Enter, Space | role="button" |
| **Input** | default, file, search | hover, focus, error, disabled | Tab | aria-invalid |
| **Textarea** | default, auto-resize | hover, focus, error, disabled | Tab | aria-invalid |
| **Select** | default | open, closed, disabled | Arrow keys, Enter | aria-expanded |
| **Checkbox** | default, indeterminate | checked, unchecked, disabled | Space | aria-checked |
| **Radio** | default | selected, unselected, disabled | Arrow keys | role="radiogroup" |
| **Switch** | default | on, off, disabled | Space | role="switch" |
| **Slider** | default, range | hover, dragging, disabled | Arrow keys | aria-valuenow |

### 2.2 Layout Components

| Component | Purpose | Responsive |
|-----------|---------|------------|
| **Container** | Max-width wrapper | Yes |
| **Grid** | CSS Grid layouts | Yes |
| **Flex** | Flexbox layouts | Yes |
| **Stack** | Vertical spacing | Yes |
| **Divider** | Visual separator | No |
| **Spacer** | Flexible space | No |

### 2.3 Navigation

| Component | Variants | Features |
|-----------|----------|----------|
| **Navbar** | default, sticky | Logo, links, search, user menu |
| **Sidebar** | default, collapsible | Navigation tree, resizable |
| **Tabs** | default, pills | Keyboard navigation |
| **Breadcrumb** | default | Links with separators |
| **Pagination** | default, simple | Page numbers, prev/next |
| **CommandPalette** | default | Fuzzy search, ⌘K trigger |

### 2.4 Feedback

| Component | Variants | Auto-dismiss |
|-----------|----------|--------------|
| **Alert** | info, success, warning, error | No |
| **Toast** | info, success, warning, error | Yes (5s) |
| **Dialog/Modal** | default, alert, sheet | No |
| **Drawer** | left, right, bottom | No |
| **Tooltip** | default | On hover |
| **Popover** | default | On click |
| **Progress** | default, indeterminate | No |
| **Skeleton** | default | Shimmer animation |

### 2.5 Data Display

| Component | Features |
|-----------|----------|
| **Card** | Header, content, footer, hover effects |
| **Table** | Sortable, selectable, pagination |
| **DataTable** | Filters, column visibility, export |
| **List** | Items, icons, actions |
| **Avatar** | Image, fallback initials, status indicator |
| **Badge** | Colors, sizes, dot variant |
| **Tag** | Removable, colors |
| **Calendar** | Date picker, range selection |

### 2.6 Application-Specific

| Component | Purpose |
|-----------|---------|
| **NoteCard** | Display note preview with title, snippet, date |
| **NoteEditor** | Tiptap-based rich text editor |
| **NotebookList** | Sidebar notebook navigation |
| **GraphView** | React Flow knowledge graph |
| **AudioPlayer** | Waveform player for podcasts |
| **SearchModal** | Command palette for search |
| **SourceCard** | Display imported sources (web, PDF) |
| **AIPanel** | AI chat and synthesis panel |

---

## 3. Component Specifications

### 3.1 Button

```tsx
interface ButtonProps {
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}

// Sizes
sm: { height: 32px, padding: 12px, fontSize: 14px }
md: { height: 40px, padding: 16px, fontSize: 14px }  // Default
lg: { height: 48px, padding: 24px, fontSize: 16px }
icon: { height: 40px, width: 40px, padding: 0 }

// Accessibility
- Focus ring visible on keyboard navigation
- Disabled state prevents interaction
- Loading state shows spinner, disables interaction
- aria-busy="true" when loading
```

### 3.2 NoteCard

```tsx
interface NoteCardProps {
  id: string;
  title: string;
  snippet: string;
  updatedAt: Date;
  isPinned?: boolean;
  sourceType?: 'manual' | 'web' | 'pdf' | 'audio' | 'video';
  tags?: string[];
  onClick?: () => void;
  onPin?: () => void;
  onDelete?: () => void;
}

// Layout
┌─────────────────────────────────────┐
│ 📌 [Source Icon]                   ⋮ │
│ Title of the Note                    │
│ ─────────────────────────────────── │
│ Snippet text that shows a preview    │
│ of the note content...               │
│ ─────────────────────────────────── │
│ 🏷️ tag1  🏷️ tag2         2 hours ago │
└─────────────────────────────────────┘

// States
- Default: bg-card, shadow-sm
- Hover: shadow-md, slight translate-y
- Selected: ring-2 ring-primary
- Pinned: Pin icon visible
```

### 3.3 NoteEditor

```tsx
interface NoteEditorProps {
  content: JSONContent;  // Tiptap JSON
  onChange: (content: JSONContent) => void;
  placeholder?: string;
  readOnly?: boolean;
  onSave?: () => void;
}

// Features
- Block-based editing
- Slash commands (/)
- Markdown shortcuts
- Inline AI (⌘J)
- Link detection
- Image/file embedding
- Code blocks with syntax highlighting
- Tables
- Checklists

// Toolbar
Bold | Italic | Strikethrough | Code | Link |
H1 | H2 | H3 | List | Numbered | Checklist |
Quote | Code Block | Image | Divider

// Keyboard Shortcuts
⌘B - Bold
⌘I - Italic
⌘K - Link
⌘J - AI assist
⌘S - Save
⌘/ - Slash commands
```

### 3.4 CommandPalette

```tsx
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (command: Command) => void;
}

interface Command {
  id: string;
  title: string;
  icon: ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'notes' | 'ai' | 'settings';
}

// Layout
┌─────────────────────────────────────────────────┐
│ 🔍 Search commands...                      ⌘K   │
├─────────────────────────────────────────────────┤
│ Navigation                                       │
│   📓 Go to Notebooks                      ⌘1    │
│   📝 Go to Notes                          ⌘2    │
│   🔍 Search Notes                         ⌘F    │
├─────────────────────────────────────────────────┤
│ Notes                                            │
│   ➕ New Note                             ⌘N    │
│   📋 Duplicate Note                       ⌘D    │
├─────────────────────────────────────────────────┤
│ AI                                               │
│   ✨ Summarize                            ⌘J    │
│   🎙️ Generate Podcast                          │
│   🗺️ Create Mindmap                            │
└─────────────────────────────────────────────────┘
```

---

## 4. Page Templates

### 4.1 App Shell

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]  Search...                    [Theme] [Notifications] [👤] │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                         │
│ Side   │                      Main Content                       │
│ bar    │                                                         │
│        │                                                         │
│ ────── │                                                         │
│ Note   │                                                         │
│ books  │                                                         │
│        │                                                         │
│ ────── │                                                         │
│ Quick  │                                                         │
│ Access │                                                         │
│        │                                                         │
└────────┴────────────────────────────────────────────────────────┘
```

### 4.2 Note Editor Page

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back   Note Title                              [Save] [⋮]     │
├─────────────────────────────────────────────────────────────────┤
│ [Toolbar: Bold | Italic | Link | H1 | H2 | List | Code | AI ]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│                         Editor Area                              │
│                                                                  │
│                                                                  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Tags: [+ Add tag]  |  Source: Web  |  Updated: 2 min ago       │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Graph View Page

```
┌─────────────────────────────────────────────────────────────────┐
│ Knowledge Graph                    [Zoom +] [Zoom -] [Reset]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│           ○───○                                                 │
│          /     \         ○──────○                               │
│         ○       ○───────/        \                              │
│          \     /                  ○                             │
│           ○───○──────────────────/                              │
│                                                                  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Selected: [Note Title]                           [Open] [Link]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Accessibility Guidelines

### 5.1 Color Contrast

- Normal text: minimum 4.5:1 contrast ratio
- Large text (18px+ or 14px bold): minimum 3:1
- UI components: minimum 3:1
- Focus indicators: minimum 3:1

### 5.2 Keyboard Navigation

- All interactive elements focusable via Tab
- Logical focus order (left-to-right, top-to-bottom)
- Skip links for main content
- Escape closes modals/dropdowns
- Arrow keys for menu navigation

### 5.3 Screen Readers

- Semantic HTML elements
- ARIA labels for icons/buttons
- Live regions for dynamic content
- Descriptive link text
- Form labels associated with inputs

### 5.4 Motion

- Respect prefers-reduced-motion
- No auto-playing animations
- Pause/stop controls for animations
- Alternative static states available

---

## 6. Implementation Notes

### 6.1 CSS Variables Setup

```css
/* globals.css */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary: oklch(58% 0.18 250);
  --color-secondary: oklch(60% 0.14 180);

  /* ... all tokens from above */
}

:root {
  color-scheme: light;
}

.dark {
  color-scheme: dark;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6.2 Tailwind Configuration

See `tailwind.config.ts` for the full configuration extending shadcn/ui defaults with our design tokens.

### 6.3 Component Library Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── app/             # Application-specific components
│   │   ├── note-card.tsx
│   │   ├── note-editor.tsx
│   │   ├── notebook-list.tsx
│   │   ├── graph-view.tsx
│   │   ├── audio-player.tsx
│   │   ├── command-palette.tsx
│   │   └── ...
│   └── layout/          # Layout components
│       ├── app-shell.tsx
│       ├── sidebar.tsx
│       ├── navbar.tsx
│       └── ...
```

---

*Design System v1.0*
*Last updated: December 2024*
