import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dailyApi, notesApi, type Note, type NoteList } from "../api";
import { format } from "date-fns";

// Query Keys
export const dailyKeys = {
  all: ["daily"] as const,
  lists: () => [...dailyKeys.all, "list"] as const,
  list: (start: string, end: string) =>
    [...dailyKeys.lists(), start, end] as const,
  detail: (date: string) => [...dailyKeys.all, "detail", date] as const,
};

// Helper to get today's date in ISO format
export function getTodayDate() {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Get a daily note for a specific date.
 * Returns the NoteList and filters for daily notes matching the date.
 */
export function useDailyNote(date: string) {
  return useQuery({
    queryKey: dailyKeys.detail(date),
    queryFn: async () => {
      const response = await dailyApi.get(date);
      // Filter to find the daily note for this specific date
      const dailyNote = response.items.find(
        (note) => note.is_daily && note.daily_date === date
      );
      return dailyNote ?? null;
    },
    retry: (failureCount, error) => {
      // Don't retry on 404 (no daily note exists yet)
      if (error instanceof Error && "status" in error) {
        if ((error as { status: number }).status === 404) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
}

export function useTodayNote() {
  const today = getTodayDate();
  return useDailyNote(today);
}

/**
 * Create or get a daily note for a specific date
 */
export function useCreateDailyNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => dailyApi.create(date),
    onSuccess: (note, date) => {
      // Update the cache with the new/returned note
      queryClient.setQueryData(dailyKeys.detail(date), note);
      // Invalidate lists to include the new note
      queryClient.invalidateQueries({ queryKey: dailyKeys.lists() });
    },
  });
}

/**
 * Update a daily note's content
 */
export function useUpdateDailyNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      notesApi.update(id, { content }),
    onMutate: async ({ id, content }) => {
      // Get the date from the note to update the right cache entry
      const allQueries = queryClient.getQueriesData<Note>({
        queryKey: dailyKeys.all,
      });

      let date: string | null = null;
      let previousNote: Note | null = null;

      // Find the note in cache to get its date
      for (const [key, note] of allQueries) {
        if (note && note.id === id) {
          date = note.daily_date;
          previousNote = note;
          break;
        }
      }

      if (date && previousNote) {
        await queryClient.cancelQueries({ queryKey: dailyKeys.detail(date) });

        // Optimistic update
        queryClient.setQueryData<Note>(dailyKeys.detail(date), {
          ...previousNote,
          content,
          updated_at: new Date().toISOString(),
        });

        return { previousNote, date };
      }

      return { previousNote: null, date: null };
    },
    onError: (err, variables, context) => {
      if (context?.previousNote && context?.date) {
        queryClient.setQueryData(
          dailyKeys.detail(context.date),
          context.previousNote
        );
      }
    },
    onSettled: (data, error, variables, context) => {
      if (context?.date) {
        queryClient.invalidateQueries({ queryKey: dailyKeys.detail(context.date) });
      }
    },
  });
}
