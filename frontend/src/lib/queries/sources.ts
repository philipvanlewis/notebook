/**
 * Sources Query Hooks
 *
 * TanStack Query hooks for source management following patterns from:
 * - open-notebook: use-sources.ts (query structure, status polling)
 * - This project's notes.ts (query key patterns, optimistic updates)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  sourcesApi,
  type Source,
  type SourceList,
  type SourcesListParams,
  type SourceUploadResponse,
  type SourceScrapeResponse,
  type SourceYouTubeResponse,
  type AudioRequest,
  type AudioResponse,
  type PodcastRequest,
  type PodcastResponse,
  type SummaryRequest,
  type SummaryResponse,
  type TTSProvider,
} from "../api";

// ============================================================================
// Query Keys (following open-notebook pattern)
// ============================================================================

export const sourcesKeys = {
  all: ["sources"] as const,
  lists: () => [...sourcesKeys.all, "list"] as const,
  list: (params?: SourcesListParams) => [...sourcesKeys.lists(), params] as const,
  details: () => [...sourcesKeys.all, "detail"] as const,
  detail: (id: string) => [...sourcesKeys.details(), id] as const,
  status: (id: string) => [...sourcesKeys.all, id, "status"] as const,
  // Audio generation keys
  audio: () => [...sourcesKeys.all, "audio"] as const,
  podcast: () => [...sourcesKeys.all, "podcast"] as const,
};

// ============================================================================
// Source List Hooks
// ============================================================================

/**
 * Fetch sources list with optional filtering
 */
export function useSources(params?: SourcesListParams) {
  return useQuery({
    queryKey: sourcesKeys.list(params),
    queryFn: () => sourcesApi.list(params),
    staleTime: 5 * 1000, // 5 seconds (sources change frequently)
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch a single source by ID
 */
export function useSource(id: string | null) {
  return useQuery({
    queryKey: sourcesKeys.detail(id!),
    queryFn: () => sourcesApi.get(id!),
    enabled: !!id,
  });
}

/**
 * Poll source status for active processing
 * Following open-notebook's useSourceStatus pattern
 */
export function useSourceStatus(sourceId: string, enabled = true) {
  return useQuery({
    queryKey: sourcesKeys.status(sourceId),
    queryFn: () => sourcesApi.get(sourceId),
    enabled: !!sourceId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data as Source | undefined;
      // Keep polling while source is loading
      if (data?.status === "loading") {
        return 2000; // Poll every 2 seconds
      }
      return false; // Stop polling when done
    },
    staleTime: 0,
  });
}

// ============================================================================
// Source Creation Hooks
// ============================================================================

/**
 * Upload a file source (PDF, TXT, MD)
 */
export function useUploadSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => sourcesApi.upload(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: sourcesKeys.lists() });
      toast.success("File uploaded", {
        description: result.title,
      });
    },
    onError: (error) => {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Failed to upload file",
      });
    },
  });
}

/**
 * Scrape a URL source
 */
export function useScrapeUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => sourcesApi.scrapeUrl(url),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: sourcesKeys.lists() });

      // Check if it's a YouTube response
      const isYouTube = "video_id" in result;
      toast.success(isYouTube ? "YouTube video added" : "URL added", {
        description: result.title,
      });
    },
    onError: (error) => {
      toast.error("Failed to fetch URL", {
        description: error instanceof Error ? error.message : "Could not scrape the URL",
      });
    },
  });
}

/**
 * Create a text source
 */
export function useCreateTextSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, content }: { title: string; content: string }) =>
      sourcesApi.createText(title, content),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: sourcesKeys.lists() });
      toast.success("Text source added", {
        description: result.title,
      });
    },
    onError: (error) => {
      toast.error("Failed to create source", {
        description: error instanceof Error ? error.message : "Could not create text source",
      });
    },
  });
}

// ============================================================================
// Source Deletion Hook
// ============================================================================

/**
 * Delete a source
 */
export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sourcesApi.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: sourcesKeys.lists() });

      // Get previous value for rollback
      const previousSources = queryClient.getQueryData<SourceList>(sourcesKeys.lists());

      // Optimistically remove from list
      queryClient.setQueryData<SourceList>(sourcesKeys.lists(), (old) =>
        old
          ? {
              ...old,
              items: old.items.filter((source) => source.id !== id),
              total: old.total - 1,
            }
          : old
      );

      return { previousSources };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousSources) {
        queryClient.setQueryData(sourcesKeys.lists(), context.previousSources);
      }
      toast.error("Failed to delete source", {
        description: error instanceof Error ? error.message : "Could not delete the source",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sourcesKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Source deleted");
    },
  });
}

// ============================================================================
// Audio Generation Hooks (following open-notebook's podcast patterns)
// ============================================================================

export interface GenerateAudioOptions {
  source_ids: string[];
  provider?: TTSProvider;
}

/**
 * Generate audio narration from sources
 * Returns blob URL for playback
 */
export function useGenerateAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: GenerateAudioOptions) => sourcesApi.generateAudio(options),
    onSuccess: () => {
      toast.success("Audio generated", {
        description: "Your audio narration is ready to play",
      });
    },
    onError: (error) => {
      toast.error("Audio generation failed", {
        description: error instanceof Error ? error.message : "Could not generate audio",
      });
    },
  });
}

/**
 * Generate podcast from sources
 * Returns blob URL for playback
 */
export function useGeneratePodcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: GenerateAudioOptions) => sourcesApi.generatePodcast(options),
    onSuccess: () => {
      toast.success("Podcast generated", {
        description: "Your podcast is ready to play",
      });
    },
    onError: (error) => {
      toast.error("Podcast generation failed", {
        description: error instanceof Error ? error.message : "Could not generate podcast",
      });
    },
  });
}

// ============================================================================
// Summary Generation Hook
// ============================================================================

/**
 * Generate summary from sources
 */
export function useGenerateSummary() {
  return useMutation({
    mutationFn: (options: SummaryRequest) => sourcesApi.generateSummary(options),
    onSuccess: () => {
      toast.success("Summary generated");
    },
    onError: (error) => {
      toast.error("Summary generation failed", {
        description: error instanceof Error ? error.message : "Could not generate summary",
      });
    },
  });
}

// ============================================================================
// Slides Generation Hook
// ============================================================================

export interface GenerateSlidesOptions {
  source_ids: string[];
  num_slides?: number;
}

/**
 * Generate presentation slides from sources
 */
export function useGenerateSlides() {
  return useMutation({
    mutationFn: (options: GenerateSlidesOptions) => sourcesApi.generateSlides(options),
    onSuccess: () => {
      toast.success("Slides generated", {
        description: "Your presentation slides are ready",
      });
    },
    onError: (error) => {
      toast.error("Slides generation failed", {
        description: error instanceof Error ? error.message : "Could not generate slides",
      });
    },
  });
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Helper type for source with YouTube metadata
 */
export function isYouTubeSource(source: Source): boolean {
  return source.source_type === "youtube" && !!source.extra_data?.video_id;
}

/**
 * Get valid sources (status === 'success')
 */
export function getValidSources(sources: Source[]): Source[] {
  return sources.filter((s) => s.status === "success");
}

/**
 * Check if any sources are still loading
 */
export function hasLoadingSources(sources: Source[]): boolean {
  return sources.some((s) => s.status === "loading");
}
