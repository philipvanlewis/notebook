"use client";

import { Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/settings/settings-dialog";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      {/* Left side */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Center - Search trigger */}
      <button
        onClick={() => {
          // TODO: Open command palette
          console.log("Open command palette");
        }}
        className="hidden sm:flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search notes...</span>
        <kbd className="ml-4 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Settings */}
        <SettingsDialog />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User avatar placeholder */}
        <Button variant="ghost" size="icon" className="rounded-full">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">U</span>
          </div>
        </Button>
      </div>
    </header>
  );
}
