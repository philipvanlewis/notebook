"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNotesStore } from "../stores";
import { matchesShortcut } from "../utils";

interface ShortcutHandler {
  key: string;
  modifiers?: { cmd?: boolean; shift?: boolean; alt?: boolean };
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

/**
 * Hook that provides global keyboard shortcuts
 * Shortcuts are active when the editor is not focused
 */
export function useKeyboardShortcuts() {
  const router = useRouter();
  const { toggleSidebar, isEditorFocused } = useNotesStore();

  const shortcuts: ShortcutHandler[] = [
    {
      key: "n",
      modifiers: { cmd: true },
      description: "Create new note",
      action: () => {
        // Navigate to notes page and trigger new note creation
        // This will be handled by the notes page
        router.push("/notes?new=true");
      },
      preventDefault: true,
    },
    {
      key: "\\",
      modifiers: { cmd: true },
      description: "Toggle sidebar",
      action: toggleSidebar,
      preventDefault: true,
    },
    {
      key: "1",
      modifiers: { cmd: true },
      description: "Go to Notes",
      action: () => router.push("/notes"),
      preventDefault: true,
    },
    {
      key: "2",
      modifiers: { cmd: true },
      description: "Go to Daily Journal",
      action: () => router.push("/daily"),
      preventDefault: true,
    },
    {
      key: "3",
      modifiers: { cmd: true },
      description: "Go to Knowledge Graph",
      action: () => router.push("/graph"),
      preventDefault: true,
    },
    {
      key: "4",
      modifiers: { cmd: true },
      description: "Go to Search",
      action: () => router.push("/search"),
      preventDefault: true,
    },
    {
      key: "/",
      modifiers: { cmd: true },
      description: "Focus search",
      action: () => router.push("/search"),
      preventDefault: true,
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Allow Cmd+\ to toggle sidebar even when in input
      const isToggleSidebar =
        matchesShortcut(event, "\\", { cmd: true });

      if (isInput && !isToggleSidebar) {
        return;
      }

      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut.key, shortcut.modifiers)) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}

/**
 * Hook for editor-specific keyboard shortcuts
 */
export function useEditorShortcuts(onSave?: () => void) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Cmd+S to save
      if (matchesShortcut(event, "s", { cmd: true }) && onSave) {
        event.preventDefault();
        onSave();
      }
    },
    [onSave]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Get all available keyboard shortcuts for display
 */
export function getKeyboardShortcuts() {
  const isMac =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");

  const cmd = isMac ? "⌘" : "Ctrl";
  const shift = isMac ? "⇧" : "Shift";
  const alt = isMac ? "⌥" : "Alt";

  return [
    { keys: `${cmd} K`, description: "Open command palette" },
    { keys: `${cmd} N`, description: "Create new note" },
    { keys: `${cmd} \\`, description: "Toggle sidebar" },
    { keys: `${cmd} 1`, description: "Go to Notes" },
    { keys: `${cmd} 2`, description: "Go to Daily Journal" },
    { keys: `${cmd} 3`, description: "Go to Knowledge Graph" },
    { keys: `${cmd} 4`, description: "Go to Search" },
    { keys: `${cmd} /`, description: "Focus search" },
    { keys: `${cmd} S`, description: "Save current note" },
    { keys: `${cmd} B`, description: "Toggle bold" },
    { keys: `${cmd} I`, description: "Toggle italic" },
    { keys: `${cmd} E`, description: "Toggle code" },
    { keys: `${cmd} Z`, description: "Undo" },
    { keys: `${cmd} ${shift} Z`, description: "Redo" },
  ];
}
