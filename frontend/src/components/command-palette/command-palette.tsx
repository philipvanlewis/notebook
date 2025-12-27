"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  BookOpen,
  Calendar,
  FileText,
  Hash,
  MessageSquare,
  Moon,
  Network,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useNotesStore } from "@/lib/stores";
import { useNotesWithFallback } from "@/lib/hooks";

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { setSelectedNoteId } = useNotesStore();
  const { notes, createNote, deleteNote } = useNotesWithFallback();

  // Use controlled or internal state
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Listen for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }

      // Escape to close
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    [setOpen]
  );

  // Filter notes based on search
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden shadow-2xl max-w-xl">
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4"
          loop
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Quick Actions">
              <CommandItem
                icon={Plus}
                onSelect={() =>
                  runCommand(async () => {
                    const note = await createNote();
                    if (note) {
                      setSelectedNoteId(note.id);
                      router.push("/notes");
                    }
                  })
                }
              >
                Create new note
              </CommandItem>
              <CommandItem
                icon={Calendar}
                onSelect={() => runCommand(() => router.push("/daily"))}
              >
                Open today's journal
              </CommandItem>
              <CommandItem
                icon={Search}
                onSelect={() => runCommand(() => router.push("/search"))}
              >
                Search all notes
              </CommandItem>
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Navigation">
              <CommandItem
                icon={FileText}
                onSelect={() => runCommand(() => router.push("/notes"))}
              >
                Go to Notes
              </CommandItem>
              <CommandItem
                icon={Calendar}
                onSelect={() => runCommand(() => router.push("/daily"))}
              >
                Go to Daily Journal
              </CommandItem>
              <CommandItem
                icon={Network}
                onSelect={() => runCommand(() => router.push("/graph"))}
              >
                Go to Knowledge Graph
              </CommandItem>
              <CommandItem
                icon={MessageSquare}
                onSelect={() => runCommand(() => router.push("/chat"))}
              >
                Go to AI Chat
              </CommandItem>
              <CommandItem
                icon={Settings}
                onSelect={() => runCommand(() => router.push("/settings"))}
              >
                Go to Settings
              </CommandItem>
            </Command.Group>

            {/* Theme */}
            <Command.Group heading="Appearance">
              <CommandItem
                icon={Sun}
                onSelect={() => runCommand(() => setTheme("light"))}
              >
                Switch to Light Mode
              </CommandItem>
              <CommandItem
                icon={Moon}
                onSelect={() => runCommand(() => setTheme("dark"))}
              >
                Switch to Dark Mode
              </CommandItem>
            </Command.Group>

            {/* Recent Notes */}
            {search && filteredNotes.length > 0 && (
              <Command.Group heading="Notes">
                {filteredNotes.slice(0, 5).map((note) => (
                  <CommandItem
                    key={note.id}
                    icon={note.is_pinned ? BookOpen : FileText}
                    onSelect={() =>
                      runCommand(() => {
                        setSelectedNoteId(note.id);
                        router.push("/notes");
                      })
                    }
                  >
                    <span className="flex-1 truncate">{note.title || "Untitled"}</span>
                    {note.tags.length > 0 && (
                      <span className="flex items-center gap-1 ml-2 text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        {note.tags[0]}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ↵
              </kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
              <span>Close</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

interface CommandItemProps {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  disabled?: boolean;
}

function CommandItem({
  children,
  icon: Icon,
  onSelect,
  disabled,
}: CommandItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none",
        "aria-selected:bg-accent aria-selected:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      )}
    >
      {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
      {children}
    </Command.Item>
  );
}
