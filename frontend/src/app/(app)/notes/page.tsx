"use client";

import { useEffect } from "react";
import { NoteList } from "@/components/notes/note-list";
import { NoteEditor } from "@/components/notes/note-editor";
import { EmptyState } from "@/components/notes/empty-state";
import { useNotesWithFallback } from "@/lib/hooks";
import { useNotesStore } from "@/lib/stores";
import { Loader2 } from "lucide-react";

export default function NotesPage() {
  const { selectedNoteId, setSelectedNoteId } = useNotesStore();
  const {
    notes,
    isLoading,
    isMockMode,
    createNote,
    updateNote,
    deleteNote,
  } = useNotesWithFallback();

  // Select first note on initial load if none selected
  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId, setSelectedNoteId]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const handleCreateNote = async () => {
    const newNote = await createNote();
    if (newNote) {
      setSelectedNoteId(newNote.id);
    }
  };

  const handleUpdateNote = (id: string, updates: Parameters<typeof updateNote>[1]) => {
    updateNote(id, updates);
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    if (selectedNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setSelectedNoteId(remaining[0]?.id ?? null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Development mode indicator */}
      {isMockMode && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 text-amber-950 text-xs px-3 py-1 rounded-b-md font-medium">
          Development Mode - Using Local Data
        </div>
      )}

      {/* Note list sidebar */}
      <div className="w-80 border-r bg-muted/30 flex-shrink-0">
        <NoteList
          notes={notes}
          selectedId={selectedNoteId}
          onSelect={setSelectedNoteId}
          onCreate={handleCreateNote}
          onDelete={handleDeleteNote}
        />
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onUpdate={(updates) => handleUpdateNote(selectedNote.id, updates)}
          />
        ) : (
          <EmptyState onCreateNote={handleCreateNote} />
        )}
      </div>
    </div>
  );
}
