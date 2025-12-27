# Notebook Frontend - Feature Plan & Pattern Audit

> **Objective**: Ensure all features use consistent patterns from reference projects (hyperbooklm, open-notebook)
>
> **Primary Patterns**:
> - TanStack Query v5 for all data fetching and mutations
> - Query key factories (`{feature}Keys`)
> - `useMutation` with `isPending` (not manual `isLoading` state)
> - Optimistic updates with rollback
> - Toast notifications via `sonner`
> - Zustand for global state only (auth, selections)

---

## Feature Inventory

### ✅ Features Using Correct Patterns

| Feature | Location | Hooks File | Status |
|---------|----------|------------|--------|
| Notes CRUD | `app/(app)/notes/`, `components/notes/` | `lib/queries/notes.ts` | ✅ Complete |
| Search (text, semantic) | `app/(app)/search/` | `lib/queries/search.ts` | ✅ Complete |
| Daily Notes | `app/(app)/daily/` | `lib/queries/daily.ts` | ✅ Complete |
| Sources Management | `components/sources/` | `lib/queries/sources.ts` | ✅ Complete |
| Audio Generation | `components/audio/` | `lib/queries/sources.ts` | ✅ Complete |

### ❌ Features Needing Migration

| Feature | Location | Issue | Priority |
|---------|----------|-------|----------|
| Chat/AI Assistant | `app/(app)/chat/page.tsx` | Direct API calls, manual state | HIGH |
| Research Page | `app/(app)/research/page.tsx` | 15+ manual state variables | HIGH |
| Settings Dialog | `components/settings/settings-dialog.tsx` | Direct API calls | MEDIUM |
| Auth Flow | `lib/stores/auth.ts` | Zustand (acceptable) | LOW |

---

## Detailed Feature Analysis

### 1. Notes Management ✅

**Location**: `lib/queries/notes.ts`

**Hooks Implemented**:
- `useNotes(params?)` - List notes with filtering
- `useNote(id)` - Single note fetch
- `useCreateNote()` - Create with invalidation
- `useUpdateNote()` - Update with optimistic updates
- `useDeleteNote()` - Delete with optimistic updates

**Pattern Reference** (lines 24-73):
```typescript
export const notesKeys = {
  all: ["notes"] as const,
  lists: () => [...notesKeys.all, "list"] as const,
  list: (params?) => [...notesKeys.lists(), params] as const,
  details: () => [...notesKeys.all, "detail"] as const,
  detail: (id: string) => [...notesKeys.details(), id] as const,
};
```

---

### 2. Search ✅

**Location**: `lib/queries/search.ts`

**Hooks Implemented**:
- `useTextSearch(query, params)` - Full-text search
- `useSemanticSearch(query, params)` - Vector search
- `useSimilarNotes(noteId, params)` - Similar notes

**Pattern**: Uses `enabled` option for conditional queries.

---

### 3. Daily Notes ✅

**Location**: `lib/queries/daily.ts`

**Hooks Implemented**:
- `useDailyNote(date)` - Fetch daily note
- `useUpdateDailyNote()` - Update with optimistic updates
- `useDailyNotes(params)` - List all daily notes

---

### 4. Sources Management ✅

**Location**: `lib/queries/sources.ts`

**Hooks Implemented**:
- `useSources(params?)` - List sources
- `useSource(id)` - Single source
- `useSourceStatus(id)` - Poll for processing status
- `useScrapeUrl()` - Add URL source
- `useUploadSource()` - Upload file source
- `useDeleteSource()` - Delete with optimistic updates
- `useGenerateAudio()` - Audio narration
- `useGeneratePodcast()` - Podcast generation
- `useGenerateSummary()` - Summary generation

---

### 5. Chat/AI Assistant ❌ NEEDS MIGRATION

**Location**: `app/(app)/chat/page.tsx`

**Current Issues**:
```typescript
// ❌ Manual state management
const [messages, setMessages] = useState<Message[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// ❌ Direct API calls
const response = await chatApi.ask({ question, history });
```

**Required Changes**:
1. Create `lib/queries/chat.ts`
2. Implement `useChatHistory()` query
3. Implement `useSendMessage()` mutation with streaming support
4. Handle streaming responses with mutation + local state

**Target Pattern**:
```typescript
// lib/queries/chat.ts
export const chatKeys = {
  all: ["chat"] as const,
  history: () => [...chatKeys.all, "history"] as const,
};

export function useSendMessage() {
  return useMutation({
    mutationFn: (request: ChatRequest) => chatApi.ask(request),
    // Note: Streaming handled via onSuccess + local state append
  });
}
```

---

### 6. Research Page ❌ NEEDS MAJOR REFACTORING

**Location**: `app/(app)/research/page.tsx`

**Current Issues** (15+ manual state variables):
```typescript
// ❌ All of these should be replaced with mutation hooks
const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
const [summaryError, setSummaryError] = useState<string | null>(null);
const [summary, setSummary] = useState<string | null>(null);

const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
const [audioError, setAudioError] = useState<string | null>(null);
const [audioUrl, setAudioUrl] = useState<string | null>(null);

const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
const [slidesError, setSlidesError] = useState<string | null>(null);
const [slides, setSlides] = useState<Slide[] | null>(null);

// ... more state variables
```

**Required Changes**:
1. Add to `lib/queries/sources.ts`:
   - `useGenerateSlides()` mutation
2. Refactor component to use existing hooks:
   - `useGenerateSummary()` (already exists)
   - `useGenerateAudio()` (already exists)
   - `useGeneratePodcast()` (already exists)
3. Replace manual state with `mutation.isPending`, `mutation.data`, `mutation.error`

**Target Pattern**:
```typescript
// In component
const summaryMutation = useGenerateSummary();
const audioMutation = useGenerateAudio();
const slidesMutation = useGenerateSlides();

// Usage
<Button
  disabled={summaryMutation.isPending}
  onClick={() => summaryMutation.mutate({ source_ids })}
>
  {summaryMutation.isPending ? "Generating..." : "Generate Summary"}
</Button>

{summaryMutation.data && <SummaryDisplay content={summaryMutation.data} />}
```

---

### 7. Settings Dialog ❌ NEEDS MIGRATION

**Location**: `components/settings/settings-dialog.tsx`

**Current Issues**:
```typescript
// ❌ Manual state for API data
const [llmStatus, setLlmStatus] = useState<LLMStatusResponse | null>(null);
const [ollamaStatus, setOllamaStatus] = useState<OllamaStatusResponse | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// ❌ useEffect with manual API calls
useEffect(() => {
  if (isOpen) fetchStatus();
}, [isOpen]);

const fetchStatus = async () => {
  // Direct API calls
};
```

**Required Changes**:
1. Create `lib/queries/llm.ts`
2. Implement `useLLMStatus()` query
3. Implement `useOllamaStatus()` query
4. Use `enabled: isOpen` for conditional fetching

**Target Pattern**:
```typescript
// lib/queries/llm.ts
export const llmKeys = {
  all: ["llm"] as const,
  status: () => [...llmKeys.all, "status"] as const,
  ollamaStatus: () => [...llmKeys.all, "ollama"] as const,
};

export function useLLMStatus(enabled = true) {
  return useQuery({
    queryKey: llmKeys.status(),
    queryFn: () => api.llm.getStatus(),
    enabled,
  });
}

// In component
const { data: llmStatus, isLoading, error, refetch } = useLLMStatus(isOpen);
const { data: ollamaStatus } = useOllamaStatus(isOpen);
```

---

### 8. Auth Flow ✅ (Acceptable)

**Location**: `lib/stores/auth.ts`

**Current State**: Uses Zustand store for auth state management.

**Rationale**: Auth is global state (token, user) that needs to persist across components. Zustand is appropriate here per open-notebook patterns.

---

## Migration Priority Order

### Phase 1: High Priority (Affects Core UX)
1. **Chat Page** - Core feature, direct user interaction
2. **Research Page** - Complex component, most manual state

### Phase 2: Medium Priority
3. **Settings Dialog** - Read-only queries, simpler migration

### Phase 3: Low Priority / Optional
4. **Auth** - Already using Zustand (acceptable)

---

## Reference Patterns from Source Projects

### Query Key Factory (open-notebook)
```typescript
export const sourceKeys = {
  all: ["sources"] as const,
  lists: () => [...sourceKeys.all, "list"] as const,
  list: (params?: SourcesListParams) => [...sourceKeys.lists(), params] as const,
  details: () => [...sourceKeys.all, "detail"] as const,
  detail: (id: string) => [...sourceKeys.details(), id] as const,
};
```

### Mutation with Optimistic Updates (open-notebook)
```typescript
export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sourcesApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: sourceKeys.lists() });
      const previousSources = queryClient.getQueryData(sourceKeys.lists());

      queryClient.setQueryData(sourceKeys.lists(), (old) =>
        old ? { ...old, items: old.items.filter((s) => s.id !== id) } : old
      );

      return { previousSources };
    },
    onError: (err, id, context) => {
      if (context?.previousSources) {
        queryClient.setQueryData(sourceKeys.lists(), context.previousSources);
      }
      toast.error("Failed to delete");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sourceKeys.lists() });
    },
  });
}
```

### Mutation in Component (hyperbooklm)
```typescript
const generateAudioMutation = useGenerateAudio();

// Derive loading from mutation
const isGenerating = generateAudioMutation.isPending;

// Use mutation
const handleGenerate = () => {
  generateAudioMutation.mutate(
    { source_ids, provider },
    {
      onSuccess: (result) => {
        setAudioResult({ url: result.url, blob: result.blob });
      },
    }
  );
};
```

---

## Files to Create/Modify

### New Files
- [ ] `lib/queries/chat.ts` - Chat hooks
- [ ] `lib/queries/llm.ts` - LLM status hooks

### Files to Refactor
- [ ] `app/(app)/chat/page.tsx` - Use chat hooks
- [ ] `app/(app)/research/page.tsx` - Use existing + new hooks
- [ ] `components/settings/settings-dialog.tsx` - Use LLM hooks

### Files Already Complete
- [x] `lib/queries/notes.ts`
- [x] `lib/queries/search.ts`
- [x] `lib/queries/daily.ts`
- [x] `lib/queries/sources.ts`
- [x] `components/audio/audio-generation-panel.tsx`
- [x] `components/sources/sources-panel.tsx`

---

## Progress Tracking

| Task | Status | Notes |
|------|--------|-------|
| Create feature plan | ✅ | This file |
| Review reference patterns | ⏳ | In progress |
| Create `chat.ts` hooks | ⬜ | Pending |
| Create `llm.ts` hooks | ⬜ | Pending |
| Refactor Chat page | ⬜ | Pending |
| Refactor Research page | ⬜ | Pending |
| Refactor Settings dialog | ⬜ | Pending |

---

*Last Updated: Session continuation - Feature audit complete*
