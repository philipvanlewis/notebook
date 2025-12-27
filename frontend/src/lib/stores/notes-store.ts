import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotesState {
  // Selected note
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // View filters
  showArchived: boolean;
  toggleShowArchived: () => void;

  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Editor state
  isEditorFocused: boolean;
  setEditorFocused: (focused: boolean) => void;

  // Optimistic updates cache
  pendingUpdates: Map<string, Partial<Note>>;
  addPendingUpdate: (id: string, update: Partial<Note>) => void;
  removePendingUpdate: (id: string) => void;
  clearPendingUpdates: () => void;
}

export const useNotesStore = create<NotesState>()(
  devtools(
    persist(
      (set) => ({
        // Selected note
        selectedNoteId: null,
        setSelectedNoteId: (id) => set({ selectedNoteId: id }),

        // Search
        searchQuery: "",
        setSearchQuery: (query) => set({ searchQuery: query }),

        // View filters
        showArchived: false,
        toggleShowArchived: () =>
          set((state) => ({ showArchived: !state.showArchived })),

        // Sidebar state
        sidebarCollapsed: false,
        toggleSidebar: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }),

        // Editor state
        isEditorFocused: false,
        setEditorFocused: (focused) => set({ isEditorFocused: focused }),

        // Optimistic updates
        pendingUpdates: new Map(),
        addPendingUpdate: (id, update) =>
          set((state) => {
            const newMap = new Map(state.pendingUpdates);
            const existing = newMap.get(id) || {};
            newMap.set(id, { ...existing, ...update });
            return { pendingUpdates: newMap };
          }),
        removePendingUpdate: (id) =>
          set((state) => {
            const newMap = new Map(state.pendingUpdates);
            newMap.delete(id);
            return { pendingUpdates: newMap };
          }),
        clearPendingUpdates: () => set({ pendingUpdates: new Map() }),
      }),
      {
        name: "notebook-notes-store",
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          showArchived: state.showArchived,
        }),
      }
    )
  )
);
