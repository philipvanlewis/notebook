"use client";

import { useState } from "react";
import { formatRelativeDate, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { Note } from "@/lib/api";

interface NoteListProps {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function NoteList({
  notes,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
}: NoteListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter notes by search query
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate pinned and unpinned notes
  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.is_pinned);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="font-semibold">Notes</h2>
        <Button size="icon" variant="ghost" onClick={onCreate}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? "No notes match your search" : "No notes yet"}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* Pinned section */}
            {pinnedNotes.length > 0 && (
              <>
                <div className="px-2 py-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pinned
                  </span>
                </div>
                {pinnedNotes.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    isSelected={note.id === selectedId}
                    isHovered={note.id === hoveredId}
                    onSelect={() => onSelect(note.id)}
                    onDelete={() => onDelete(note.id)}
                    onMouseEnter={() => setHoveredId(note.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                ))}
              </>
            )}

            {/* All notes section */}
            {unpinnedNotes.length > 0 && (
              <>
                {pinnedNotes.length > 0 && (
                  <div className="px-2 py-1 mt-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      All Notes
                    </span>
                  </div>
                )}
                {unpinnedNotes.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    isSelected={note.id === selectedId}
                    isHovered={note.id === hoveredId}
                    onSelect={() => onSelect(note.id)}
                    onDelete={() => onDelete(note.id)}
                    onMouseEnter={() => setHoveredId(note.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-3">
        <p className="text-xs text-muted-foreground text-center">
          {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

interface NoteListItemProps {
  note: Note;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function NoteListItem({
  note,
  isSelected,
  isHovered,
  onSelect,
  onDelete,
  onMouseEnter,
  onMouseLeave,
}: NoteListItemProps) {
  // Get preview text from content (first 100 chars)
  const preview = note.content.slice(0, 100).replace(/\n/g, " ");

  return (
    <div
      className={cn(
        "group relative rounded-lg p-3 cursor-pointer transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted"
      )}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Title */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm line-clamp-1 flex-1">
          {note.title || "Untitled"}
        </h3>
        {note.is_pinned && (
          <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
      </div>

      {/* Preview */}
      {preview && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {preview}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(note.updated_at)}
        </span>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex gap-1">
            {note.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{note.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions (show on hover) */}
      {isHovered && (
        <div className="absolute right-2 top-2 flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
