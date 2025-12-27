"use client";

import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateNote: () => void;
}

export function EmptyState({ onCreateNote }: EmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">No note selected</h2>
          <p className="text-muted-foreground">
            Select a note from the sidebar to view and edit it, or create a new
            one to get started.
          </p>
        </div>
        <Button onClick={onCreateNote} className="gap-2">
          <Plus className="h-4 w-4" />
          Create new note
        </Button>
      </div>
    </div>
  );
}
