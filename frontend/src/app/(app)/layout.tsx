"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/command-palette";
import { useKeyboardShortcuts } from "@/lib/hooks";
import { useNotesStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleSidebar } = useNotesStore();

  // Initialize global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Command Palette - Global */}
      <CommandPalette />

      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={toggleSidebar} />

        {/* Page content */}
        <main
          className={cn(
            "flex-1 overflow-auto",
            "transition-all duration-200 ease-out"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
