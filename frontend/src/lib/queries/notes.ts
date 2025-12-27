import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  notesApi,
  type Note,
  type NoteList,
  type CreateNoteInput,
  type UpdateNoteInput,
  type NotesListParams,
} from "../api";
import { useNotesStore } from "../stores";

// Query Keys
export const notesKeys = {
  all: ["notes"] as const,
  lists: () => [...notesKeys.all, "list"] as const,
  list: (params?: NotesListParams) => [...notesKeys.lists(), params] as const,
  details: () => [...notesKeys.all, "detail"] as const,
  detail: (id: string) => [...notesKeys.details(), id] as const,
};

// Hooks
export function useNotes(params?: NotesListParams) {
  const { pendingUpdates } = useNotesStore();

  return useQuery({
    queryKey: notesKeys.list(params),
    queryFn: () => notesApi.list(params),
    select: (response) => {
      // Apply optimistic updates to items
      const notes = response.items.map((note) => {
        const pending = pendingUpdates.get(note.id);
        return pending ? { ...note, ...pending } : note;
      });
      return { ...response, items: notes };
    },
  });
}

export function useNote(id: string | null) {
  return useQuery({
    queryKey: notesKeys.detail(id!),
    queryFn: () => notesApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const { setSelectedNoteId } = useNotesStore();

  return useMutation({
    mutationFn: (data: CreateNoteInput) => notesApi.create(data),
    onSuccess: (newNote) => {
      // Add to cache
      queryClient.setQueryData<NoteList>(notesKeys.lists(), (old) =>
        old
          ? { ...old, items: [newNote, ...old.items], total: old.total + 1 }
          : { items: [newNote], total: 1, page: 1, page_size: 20, has_more: false }
      );
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      // Select the new note
      setSelectedNoteId(newNote.id);
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  const { addPendingUpdate, removePendingUpdate } = useNotesStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteInput }) =>
      notesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: notesKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: notesKeys.lists() });

      // Add to pending updates for optimistic UI
      addPendingUpdate(id, data);

      // Get previous values
      const previousNote = queryClient.getQueryData<Note>(notesKeys.detail(id));
      const previousNotes = queryClient.getQueryData<Note[]>(notesKeys.lists());

      // Optimistically update the cache
      if (previousNote) {
        queryClient.setQueryData<Note>(notesKeys.detail(id), {
          ...previousNote,
          ...data,
          updated_at: new Date().toISOString(),
        });
      }

      if (previousNotes) {
        queryClient.setQueryData<NoteList>(notesKeys.lists(), (old) =>
          old
            ? {
                ...old,
                items: old.items.map((note) =>
                  note.id === id
                    ? { ...note, ...data, updated_at: new Date().toISOString() }
                    : note
                ),
              }
            : old
        );
      }

      return { previousNote, previousNotes };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousNote) {
        queryClient.setQueryData(notesKeys.detail(id), context.previousNote);
      }
      if (context?.previousNotes) {
        queryClient.setQueryData(notesKeys.lists(), context.previousNotes);
      }
      removePendingUpdate(id);
    },
    onSettled: (data, error, { id }) => {
      removePendingUpdate(id);
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: notesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { selectedNoteId, setSelectedNoteId } = useNotesStore();

  return useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notesKeys.lists() });

      const previousNotes = queryClient.getQueryData<NoteList>(notesKeys.lists());

      // Optimistically remove from list
      queryClient.setQueryData<NoteList>(notesKeys.lists(), (old) =>
        old
          ? { ...old, items: old.items.filter((note) => note.id !== id), total: old.total - 1 }
          : old
      );

      // If deleting the selected note, select another
      if (selectedNoteId === id && previousNotes) {
        const remaining = previousNotes.items.filter((n) => n.id !== id);
        setSelectedNoteId(remaining[0]?.id ?? null);
      }

      return { previousNotes };
    },
    onError: (err, id, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(notesKeys.lists(), context.previousNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
    },
  });
}

// Hook for toggling pin status
export function useTogglePin() {
  const updateNote = useUpdateNote();

  return (note: Note) => {
    updateNote.mutate({
      id: note.id,
      data: { is_pinned: !note.is_pinned },
    });
  };
}

// Hook for toggling archive status
export function useToggleArchive() {
  const updateNote = useUpdateNote();

  return (note: Note) => {
    updateNote.mutate({
      id: note.id,
      data: { is_archived: !note.is_archived },
    });
  };
}
