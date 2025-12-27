"use client";

import { useState, useCallback, useMemo } from "react";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "../queries";
import type { Note, UpdateNoteInput, CreateNoteInput } from "../api";

// Mock data for development when API is not available
const mockNotes: Note[] = [
  {
    id: "1",
    title: "Welcome to Notebook",
    content: "<p>This is your first note. Start writing!</p>",
    content_html: "<p>This is your first note. Start writing!</p>",
    tags: ["getting-started"],
    is_pinned: true,
    is_archived: false,
    is_daily: false,
    daily_date: null,
    owner_id: "mock-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    backlinks: [],
    forward_links: [],
  },
  {
    id: "2",
    title: "Ideas for the project",
    content: "<ul><li>Feature A</li><li>Feature B</li><li>Feature C</li></ul>",
    content_html: "<ul><li>Feature A</li><li>Feature B</li><li>Feature C</li></ul>",
    tags: ["ideas", "project"],
    is_pinned: false,
    is_archived: false,
    is_daily: false,
    daily_date: null,
    owner_id: "mock-user",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    backlinks: [],
    forward_links: [],
  },
  {
    id: "3",
    title: "Meeting Notes",
    content: "<p>Discussed the roadmap for Q1.</p><p>Key takeaways:</p><ul><li>Focus on core features</li><li>User testing in February</li></ul>",
    content_html: "<p>Discussed the roadmap for Q1.</p><p>Key takeaways:</p><ul><li>Focus on core features</li><li>User testing in February</li></ul>",
    tags: ["meetings", "work"],
    is_pinned: false,
    is_archived: false,
    is_daily: false,
    daily_date: null,
    owner_id: "mock-user",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    backlinks: [],
    forward_links: [],
  },
];

interface UseNotesWithFallbackOptions {
  useMockData?: boolean;
}

export function useNotesWithFallback(options: UseNotesWithFallbackOptions = {}) {
  // Try to use real API
  const { data: apiResponse, isLoading, isError, error } = useNotes();
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();

  // Local state for mock mode
  const [localNotes, setLocalNotes] = useState<Note[]>(mockNotes);

  // Determine if we should use mock data
  const useMock = options.useMockData ?? (isError || !apiResponse);

  // Get the notes to use
  const notes = useMock ? localNotes : (apiResponse?.items ?? []);

  // Create note handler
  const createNote = useCallback(
    async (data?: CreateNoteInput) => {
      const noteData = data || {
        title: "Untitled",
        content: "",
        tags: [],
      };

      if (useMock) {
        const newNote: Note = {
          id: crypto.randomUUID(),
          title: noteData.title,
          content: noteData.content || "",
          content_html: null,
          tags: noteData.tags || [],
          is_pinned: noteData.is_pinned || false,
          is_archived: false,
          is_daily: noteData.is_daily || false,
          daily_date: noteData.daily_date || null,
          owner_id: "mock-user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          backlinks: [],
          forward_links: [],
        };
        setLocalNotes((prev) => [newNote, ...prev]);
        return newNote;
      }

      return createNoteMutation.mutateAsync(noteData);
    },
    [useMock, createNoteMutation]
  );

  // Update note handler
  const updateNote = useCallback(
    async (id: string, data: UpdateNoteInput) => {
      if (useMock) {
        setLocalNotes((prev) =>
          prev.map((note) =>
            note.id === id
              ? { ...note, ...data, updated_at: new Date().toISOString() }
              : note
          )
        );
        return;
      }

      return updateNoteMutation.mutateAsync({ id, data });
    },
    [useMock, updateNoteMutation]
  );

  // Delete note handler
  const deleteNote = useCallback(
    async (id: string) => {
      if (useMock) {
        setLocalNotes((prev) => prev.filter((note) => note.id !== id));
        return;
      }

      return deleteNoteMutation.mutateAsync(id);
    },
    [useMock, deleteNoteMutation]
  );

  // Toggle pin handler
  const togglePin = useCallback(
    (note: Note) => {
      updateNote(note.id, { is_pinned: !note.is_pinned });
    },
    [updateNote]
  );

  // Toggle archive handler
  const toggleArchive = useCallback(
    (note: Note) => {
      updateNote(note.id, { is_archived: !note.is_archived });
    },
    [updateNote]
  );

  return {
    notes,
    isLoading: useMock ? false : isLoading,
    isError: useMock ? false : isError,
    error: useMock ? null : error,
    isMockMode: useMock,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
}
