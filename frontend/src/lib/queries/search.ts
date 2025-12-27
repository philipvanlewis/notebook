import { useQuery } from "@tanstack/react-query";
import { searchApi, notesApi } from "../api";

// Query Keys
export const searchKeys = {
  all: ["search"] as const,
  query: (q: string) => [...searchKeys.all, "query", q] as const,
  semantic: (q: string) => [...searchKeys.all, "semantic", q] as const,
  similar: (noteId: string) => [...searchKeys.all, "similar", noteId] as const,
};

// Text search using notes API with search param
export function useSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: searchKeys.query(query),
    queryFn: () => notesApi.list({ search: query }),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Semantic search using AI embeddings
export function useSemanticSearch(
  query: string,
  options?: { limit?: number; threshold?: number },
  enabled = true
) {
  return useQuery({
    queryKey: searchKeys.semantic(query),
    queryFn: () => searchApi.semantic(query, options),
    enabled: enabled && query.length >= 3,
    staleTime: 1000 * 60 * 5, // 5 minutes (semantic search is more expensive)
  });
}

// Find similar notes to a given note
export function useSimilarNotes(
  noteId: string | null,
  options?: { limit?: number; threshold?: number },
  enabled = true
) {
  return useQuery({
    queryKey: searchKeys.similar(noteId!),
    queryFn: () => searchApi.similar(noteId!, options),
    enabled: enabled && !!noteId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
