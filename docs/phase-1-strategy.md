# Phase 1: Deep Research & Strategy

## Executive Summary

Notebook is a privacy-focused, AI-powered personal knowledge management application that combines the best features of HyperbookLM (web scraping, multimedia synthesis, mindmaps) and Open Notebook (multi-provider AI, advanced podcasts, self-hosted deployment). This strategy document synthesizes competitive analysis, user research, design inspiration, and technical decisions to guide development.

---

## 1. Competitive Analysis

### Market Overview

The personal knowledge management market is valued at **$7.95B (2024)** projected to reach **$9.74B by 2028** (17% CAGR). The broader knowledge management software market is expected to grow from **$22.9B (2025) to $81.9B by 2035**.

### Top 10 Competitor Analysis

| App | Core Strength | AI Features | Pricing | Target Audience |
|-----|---------------|-------------|---------|-----------------|
| **Notion** | All-in-one workspace, databases | GPT-4 + Claude, autofill, NL queries | Free / $10-24/mo | Teams, project managers |
| **Obsidian** | Local-first, graph visualization | Plugin-based | Free / Sync $5/mo | Researchers, developers |
| **Roam Research** | Networked thought, bullet-level linking | Minimal native | $15/mo or $500/5yr | Academics, knowledge workers |
| **Reflect** | Voice transcription, calendar integration | GPT-4, Whisper | Free tier + paid | Calendar-heavy professionals |
| **Mem** | AI-first organization, semantic search | Copilot, deep search | Free / $12/mo | Busy professionals |
| **NotebookLM** | Document analysis, audio overviews | Google AI, citations | Free / $20/mo | Researchers, analysts |
| **Evernote** | Reliable sync, comprehensive features | AI Assistant (2025) | Free / Premium | General note-takers |
| **Logseq** | Open-source, privacy-focused | Plugin-based | Free / Sync $5/mo | Privacy advocates, developers |
| **Bear** | Beautiful minimalist design | Minimal | Free / $2.99/mo | Apple users, writers |
| **Craft** | Native Apple experience, beautiful UI | AI writing assistance | Free / $5-8/mo | Apple ecosystem users |

### Competitive Gaps Identified

1. **No single app combines** web scraping + AI podcasts + mindmaps + self-hosted deployment
2. **Multi-provider AI** (16+ providers) is rare - most lock to OpenAI/Anthropic
3. **Audio Overview quality** varies - NotebookLM leads but lacks notebook organization
4. **Graph visualization + AI synthesis** rarely combined effectively
5. **True offline-first with AI** is underserved (most require cloud for AI)

### Our Differentiation Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTEBOOK POSITIONING                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Privacy-First ◄──────────────────────────► Feature-Rich       │
│        │                                           │             │
│   [Obsidian]                                  [Notion]           │
│   [Logseq]                                    [Mem]              │
│        │                                           │             │
│        │          ★ NOTEBOOK ★                     │             │
│        │     (Best of both worlds)                 │             │
│        │                                           │             │
│   Single AI ◄───────────────────────────────► Multi-Provider    │
│   [NotebookLM]                               [Open Notebook]     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. User Personas

### Persona 1: Alex - The Academic Researcher

**Demographics:** 32, PhD candidate in Cognitive Science, uses MacBook and iPad

**Goals:**
- Synthesize 100+ papers into coherent literature review
- Discover unexpected connections between research domains
- Generate audio summaries for commute listening
- Maintain control over sensitive research data

**Pain Points:**
- Zotero + Notion + NotebookLM = fragmented workflow
- AI tools train on data - privacy concerns
- Citation management is disconnected from note-taking
- Can't easily share findings with collaborators without exposing everything

**Journey Map:**
```
Read Paper → Highlight Key Points → Link to Concepts → Generate Summary → Create Audio → Share Selectively
     │              │                     │                  │               │              │
     ▼              ▼                     ▼                  ▼               ▼              ▼
  [Import]    [Annotate]          [Auto-link AI]      [Synthesize]    [Podcast]    [Publish]
```

**Success Metrics:** Papers processed/week, connections discovered, audio hours generated

---

### Persona 2: Maya - The Content Creator

**Demographics:** 28, YouTube educator, creates videos about productivity

**Goals:**
- Research topics deeply from multiple sources
- Transform research into scripts, slides, podcasts
- Maintain a "second brain" for content ideas
- Monetize knowledge through courses

**Pain Points:**
- Manual research compilation takes 10+ hours per video
- Can't easily convert notes to different formats
- Ideas scattered across 5+ apps
- No single tool handles research → content pipeline

**Journey Map:**
```
Topic Idea → Web Research → Organize Notes → Generate Script → Create Slides → Record Audio
     │            │              │                │                 │              │
     ▼            ▼              ▼                ▼                 ▼              ▼
  [Capture]  [Scrape URLs]  [AI Organize]   [Transform]       [Mindmap]     [Podcast]
```

**Success Metrics:** Research time reduction, content output velocity, format versatility

---

### Persona 3: Jordan - The Knowledge Worker

**Demographics:** 45, Senior Product Manager at tech company, Windows + Android

**Goals:**
- Track meeting notes, decisions, action items
- Build institutional knowledge base
- Quick retrieval during meetings
- Integrate with existing tools (Slack, Jira)

**Pain Points:**
- Enterprise tools are clunky and slow
- Search never finds what they need
- Can't use AI tools due to company data policies
- Knowledge silos between team members

**Journey Map:**
```
Meeting → Capture Notes → Extract Actions → Link to Projects → Search Later → Share with Team
    │           │               │                 │                │              │
    ▼           ▼               ▼                 ▼                ▼              ▼
 [Voice]   [Transcribe]    [AI Extract]      [Relate]         [Semantic]    [Collaborate]
```

**Success Metrics:** Retrieval accuracy, time-to-find, team adoption rate

---

### Persona 4: Sam - The Lifelong Learner

**Demographics:** 22, recent graduate, learning programming and design, budget-conscious

**Goals:**
- Learn new skills from YouTube, courses, books
- Build a personal curriculum
- Track learning progress
- Connect concepts across domains

**Pain Points:**
- Free tools are limited; paid tools are expensive
- Can't extract insights from video content easily
- No spaced repetition integration
- Learning feels fragmented

**Journey Map:**
```
Find Resource → Consume Content → Take Notes → Connect Ideas → Review → Apply
      │               │              │              │            │        │
      ▼               ▼              ▼              ▼            ▼        ▼
   [Scrape]     [Transcribe]    [Capture]     [Graph]      [Space Rep]  [Projects]
```

**Success Metrics:** Concepts learned/month, knowledge retention rate, cross-domain connections

---

## 3. Design Direction

### Visual Philosophy

**Principle:** "Calm Technology" - The interface should fade into the background, letting content shine.

**Inspiration Sources:**
- **Linear** - Bold typography, keyboard-first, gesture navigation
- **Craft** - Beautiful animations, three-pane elegance, native feel
- **Arc Browser** - Thumb-friendly, dark mode excellence, split screens
- **Raycast** - Instant search, command-palette efficiency
- **Bear** - Typography-focused, hashtag organization, minimal chrome

### Color System

```
┌────────────────────────────────────────────────────────────────┐
│ PRIMARY PALETTE                                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Brand Primary    ████████  oklch(65% 0.15 250)   Blue-Indigo  │
│  Brand Secondary  ████████  oklch(70% 0.12 180)   Teal         │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│ NEUTRAL PALETTE (Light Mode)                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Background       ████████  oklch(99% 0.002 250)  Almost White │
│  Surface          ████████  oklch(97% 0.003 250)  Soft Gray    │
│  Border           ████████  oklch(92% 0.006 250)  Light Gray   │
│  Text Primary     ████████  oklch(20% 0.02 260)   Near Black   │
│  Text Secondary   ████████  oklch(45% 0.02 260)   Medium Gray  │
│  Text Muted       ████████  oklch(60% 0.015 260)  Light Gray   │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│ NEUTRAL PALETTE (Dark Mode)                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Background       ████████  oklch(12% 0.02 260)   Deep Black   │
│  Surface          ████████  oklch(18% 0.015 260)  Dark Gray    │
│  Border           ████████  oklch(28% 0.01 260)   Soft Edge    │
│  Text Primary     ████████  oklch(95% 0.005 250)  Near White   │
│  Text Secondary   ████████  oklch(70% 0.01 250)   Light Gray   │
│  Text Muted       ████████  oklch(50% 0.01 250)   Medium Gray  │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│ SEMANTIC COLORS                                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Success          ████████  oklch(65% 0.18 145)   Green        │
│  Warning          ████████  oklch(75% 0.15 85)    Amber        │
│  Error            ████████  oklch(60% 0.22 25)    Red          │
│  Info             ████████  oklch(65% 0.15 250)   Blue         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Typography Scale

```
Font Family: Inter (UI) + JetBrains Mono (Code)

Scale (1.25 ratio - Major Third):
├── 4xl:  2.441rem (39px)  - Hero headlines
├── 3xl:  1.953rem (31px)  - Page titles
├── 2xl:  1.563rem (25px)  - Section headers
├── xl:   1.25rem  (20px)  - Card titles
├── lg:   1.125rem (18px)  - Emphasized body
├── base: 1rem     (16px)  - Body text
├── sm:   0.875rem (14px)  - Secondary text
└── xs:   0.75rem  (12px)  - Captions, labels

Line Heights:
├── Tight:  1.25  - Headlines
├── Snug:   1.375 - Subheadings
├── Normal: 1.5   - Body text
└── Relaxed: 1.75 - Long-form reading
```

### Layout Patterns

**Primary Layout: Adaptive Three-Pane**

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────┐ ┌──────────────────────────────────────────────────┐  │
│  │ Side │ │                                                  │  │
│  │ bar  │ │                    Editor                        │  │
│  │      │ │                                                  │  │
│  │ Nav  │ │                                                  │  │
│  │      │ ├──────────────────────────────────────────────────┤  │
│  │ List │ │               Preview / Graph                    │  │
│  │      │ │                                                  │  │
│  └──────┘ └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Breakpoints:
- Mobile (<768px): Single pane with navigation drawer
- Tablet (768-1024px): Two panes, collapsible sidebar
- Desktop (>1024px): Full three-pane with resizable splits
```

### Micro-Interactions

1. **Note Creation** - Soft fade-in with gentle scale (0.95 → 1.0)
2. **Link Connection** - Elastic line animation connecting nodes
3. **Search Results** - Staggered list reveal (50ms delay per item)
4. **Mode Transitions** - Smooth cross-fade (200ms ease-out)
5. **Button Hover** - Subtle lift with shadow increase
6. **Loading States** - Skeleton with shimmer animation
7. **Success Actions** - Brief green pulse on completion

### Component Patterns

| Component | Pattern | Inspiration |
|-----------|---------|-------------|
| **Command Palette** | ⌘K triggered, fuzzy search | Raycast, Linear |
| **Note Cards** | Subtle shadow, rounded corners, hover lift | Notion, Craft |
| **Editor** | Block-based, slash commands, inline AI | Notion, Reflect |
| **Graph View** | Force-directed, zoom/pan, node selection | Obsidian, Roam |
| **Sidebar** | Collapsible, icon + text, drag-drop reorder | Linear, Arc |
| **Search** | Instant results, semantic highlighting | Raycast, Algolia |
| **Audio Player** | Minimal controls, waveform visualization | Spotify, Pocket Casts |

---

## 4. Technical Architecture

### Validated Tech Stack

| Layer | Technology | Documentation Score | Rationale |
|-------|-----------|---------------------|-----------|
| **Backend** | FastAPI | 31,710 snippets (High) | Async, type-safe, OpenAPI auto-docs |
| **Frontend** | Next.js 15 + React 19 | 10,222 snippets (High) | RSC, streaming, app router |
| **AI Framework** | LangChain | 57,671 snippets (High) | Multi-provider, chains, agents |
| **Database** | PostgreSQL + pgvector | Excellent community | ACID, vector search, mature |
| **Styling** | Tailwind CSS + shadcn/ui | Extensive | Design tokens, accessible components |
| **Auth** | NextAuth.js v5 | Good | OAuth, credentials, sessions |
| **Search** | Meilisearch | Growing | Typo-tolerant, fast, self-hosted |

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           NOTEBOOK ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                        FRONTEND (Next.js 15)                 │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │    │
│  │  │ Editor  │ │ Graph   │ │ Audio   │ │ Search  │            │    │
│  │  │ (Tiptap)│ │(React   │ │ Player  │ │ Modal   │            │    │
│  │  │         │ │ Flow)   │ │         │ │         │            │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │    │
│  │                                                              │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │              UI Components (shadcn/ui)               │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      API LAYER (FastAPI)                     │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │    │
│  │  │ Notes   │ │ Content │ │ AI      │ │ Audio   │            │    │
│  │  │ CRUD    │ │ Ingest  │ │ Synth   │ │ Generate│            │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│         ┌────────────────────┼────────────────────┐                 │
│         ▼                    ▼                    ▼                 │
│  ┌───────────┐       ┌───────────────┐    ┌───────────────┐        │
│  │ PostgreSQL│       │   LangChain   │    │  Meilisearch  │        │
│  │ + pgvector│       │  (AI Router)  │    │  (Full-text)  │        │
│  └───────────┘       └───────────────┘    └───────────────┘        │
│                              │                                       │
│         ┌────────────────────┼────────────────────┐                 │
│         ▼                    ▼                    ▼                 │
│  ┌───────────┐       ┌───────────┐        ┌───────────┐            │
│  │  OpenAI   │       │ Anthropic │        │   Ollama  │            │
│  │           │       │           │        │  (Local)  │            │
│  └───────────┘       └───────────┘        └───────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Models

```sql
-- Core notebook structure
CREATE TABLE notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes with vector embeddings
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID NOT NULL REFERENCES notebooks(id),
    title VARCHAR(500) NOT NULL,
    content JSONB NOT NULL, -- Tiptap JSON format
    content_text TEXT GENERATED ALWAYS AS (content->>'text') STORED,
    embedding vector(1536), -- OpenAI ada-002 dimensions
    source_type VARCHAR(50), -- 'manual', 'web', 'pdf', 'audio', 'video'
    source_url TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bidirectional note links
CREATE TABLE note_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_note_id UUID NOT NULL REFERENCES notes(id),
    target_note_id UUID NOT NULL REFERENCES notes(id),
    link_type VARCHAR(50) DEFAULT 'reference', -- 'reference', 'citation', 'related'
    context TEXT, -- Surrounding text where link appears
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_note_id, target_note_id)
);

-- AI-generated content
CREATE TABLE syntheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID NOT NULL REFERENCES notebooks(id),
    type VARCHAR(50) NOT NULL, -- 'summary', 'podcast', 'mindmap', 'slides'
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    source_notes UUID[] NOT NULL,
    ai_provider VARCHAR(50),
    ai_model VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notes_embedding ON notes USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_notes_notebook ON notes(notebook_id);
CREATE INDEX idx_notes_fulltext ON notes USING gin(to_tsvector('english', content_text));
```

---

## 5. Feature Prioritization

### MVP Features (Phase 1)

| Priority | Feature | User Value | Complexity |
|----------|---------|------------|------------|
| P0 | **Note Editor** | Core functionality | Medium |
| P0 | **Notebook Organization** | Content structure | Low |
| P0 | **Full-text Search** | Find anything fast | Medium |
| P0 | **Dark/Light Mode** | User comfort | Low |
| P1 | **Web Scraping** | Content ingestion | Medium |
| P1 | **PDF Import** | Research workflow | Medium |
| P1 | **AI Summaries** | Time savings | Medium |
| P1 | **Basic Graph View** | Connection discovery | High |

### Post-MVP Features (Phase 2+)

| Priority | Feature | User Value | Complexity |
|----------|---------|------------|------------|
| P2 | **AI Podcast Generation** | Content transformation | High |
| P2 | **Multi-speaker Audio** | Premium content | Very High |
| P2 | **Mindmap Generation** | Visual learning | High |
| P2 | **Slide Generation** | Presentation prep | Medium |
| P2 | **YouTube Transcription** | Video learning | Medium |
| P3 | **Collaboration** | Team usage | Very High |
| P3 | **Mobile App** | On-the-go access | Very High |
| P3 | **API & Webhooks** | Integration | Medium |

---

## 6. Success Metrics

### Primary KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Notes Created** | 10+ per active user/week | Database count |
| **AI Features Used** | 50% of users use AI weekly | Feature analytics |
| **Session Duration** | 15+ minutes average | Analytics |
| **Weekly Active Users** | 70% of registered users | DAU/WAU ratio |
| **Search Success Rate** | 80% find what they need | User surveys |

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Core Web Vitals** | All green (LCP <2.5s, FID <100ms, CLS <0.1) | Lighthouse |
| **Accessibility** | WCAG 2.1 AA compliance | Automated testing |
| **Error Rate** | <0.1% of requests | Error monitoring |
| **AI Response Time** | <3 seconds for summaries | APM |

---

## 7. Development Roadmap

### Milestone 1: Foundation (Weeks 1-3)
- Project scaffolding (Next.js + FastAPI)
- Design system implementation
- Database schema + migrations
- Authentication flow
- Basic note CRUD

### Milestone 2: Core Features (Weeks 4-6)
- Rich text editor (Tiptap)
- Notebook organization
- Full-text search
- Web scraping integration
- PDF import

### Milestone 3: AI Integration (Weeks 7-9)
- LangChain multi-provider setup
- AI summarization
- Semantic search (embeddings)
- Basic graph visualization

### Milestone 4: Polish & Launch (Weeks 10-12)
- UI polish and animations
- Performance optimization
- Testing and bug fixes
- Documentation
- Beta launch

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI API costs exceed budget | Medium | High | Implement usage limits, offer Ollama fallback |
| Web scraping blocked by sites | High | Medium | Respectful scraping, user-provided API keys |
| Graph performance with 10k+ notes | Medium | High | Virtual rendering, lazy loading, pagination |
| Privacy concerns with cloud AI | Medium | High | Self-hosted Ollama option, clear data policies |
| Complex UI overwhelms new users | Medium | Medium | Progressive disclosure, onboarding flow |

---

## Next Steps

1. **Phase 2: Design System** - Create comprehensive component library
2. **Phase 3: Implementation** - Build MVP following this strategy
3. **User Testing** - Validate assumptions with real users
4. **Iterate** - Refine based on feedback

---

*Document created: Phase 1 Complete*
*Last updated: December 2024*
