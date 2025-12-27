/**
 * LLM Query Hooks
 *
 * TanStack Query hooks for LLM provider status following patterns from:
 * - open-notebook: query structure with conditional enabling
 * - This project's notes.ts (query key patterns)
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type LLMStatusResponse,
  type OllamaStatusResponse,
} from "../api";

// ============================================================================
// Query Keys (following open-notebook pattern)
// ============================================================================

export const llmKeys = {
  all: ["llm"] as const,
  status: () => [...llmKeys.all, "status"] as const,
  ollamaStatus: () => [...llmKeys.all, "ollama", "status"] as const,
};

// ============================================================================
// LLM Status Hooks
// ============================================================================

/**
 * Fetch current LLM provider status
 * Uses enabled option for conditional fetching (e.g., when dialog is open)
 */
export function useLLMStatus(enabled = true) {
  return useQuery({
    queryKey: llmKeys.status(),
    queryFn: () => api.llm.getStatus(),
    enabled,
    staleTime: 30 * 1000, // 30 seconds - status doesn't change often
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch Ollama server status
 * Uses enabled option for conditional fetching
 */
export function useOllamaStatus(enabled = true) {
  return useQuery({
    queryKey: llmKeys.ollamaStatus(),
    queryFn: () => api.llm.getOllamaStatus(),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch both LLM and Ollama status together
 * Useful for settings dialog that needs both
 */
export function useLLMAndOllamaStatus(enabled = true) {
  const llmStatus = useLLMStatus(enabled);
  const ollamaStatus = useOllamaStatus(enabled);

  return {
    llmStatus,
    ollamaStatus,
    isLoading: llmStatus.isLoading || ollamaStatus.isLoading,
    error: llmStatus.error || ollamaStatus.error,
    refetch: async () => {
      await Promise.all([llmStatus.refetch(), ollamaStatus.refetch()]);
    },
  };
}
