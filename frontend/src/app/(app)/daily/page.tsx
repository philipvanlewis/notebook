"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { NoteEditor } from "@/components/notes/note-editor";
import { CalendarDays, Loader2, Plus } from "lucide-react";
import { useTodayNote, useCreateDailyNote, getTodayDate } from "@/lib/queries";
import { useUpdateNote } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import type { UpdateNoteInput } from "@/lib/api";

export default function DailyNotePage() {
  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy");
  const todayDateStr = getTodayDate();

  const { data: dailyNote, isLoading, isError } = useTodayNote();
  const createDailyNote = useCreateDailyNote();
  const updateNote = useUpdateNote();

  // Auto-create daily note if it doesn't exist
  const handleCreateDaily = () => {
    createDailyNote.mutate(todayDateStr);
  };

  const handleUpdate = (updates: UpdateNoteInput) => {
    if (dailyNote) {
      updateNote.mutate({ id: dailyNote.id, data: updates });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{formattedDate}</h1>
              <p className="text-sm text-muted-foreground">Daily Journal</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!dailyNote) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{formattedDate}</h1>
              <p className="text-sm text-muted-foreground">Daily Journal</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">No journal entry for today</h2>
            <p className="text-muted-foreground mb-4">
              Start your daily journal to capture thoughts and ideas.
            </p>
          </div>
          <Button
            onClick={handleCreateDaily}
            disabled={createDailyNote.isPending}
            size="lg"
          >
            {createDailyNote.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Start Today's Journal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Daily note header */}
      <div className="border-b px-6 py-4 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{formattedDate}</h1>
            <p className="text-sm text-muted-foreground">Daily Journal</p>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <NoteEditor note={dailyNote} onUpdate={handleUpdate} />
      </div>
    </div>
  );
}
