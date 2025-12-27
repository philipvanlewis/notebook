"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Search,
  Settings,
  Share2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { href: "/notes", icon: FileText, label: "Notes" },
  { href: "/daily", icon: CalendarDays, label: "Daily" },
  { href: "/research", icon: BookMarked, label: "Research" },
  { href: "/graph", icon: Share2, label: "Graph" },
  { href: "/search", icon: Search, label: "Search" },
];

const bottomNavItems = [
  { href: "/chat", icon: Sparkles, label: "AI Chat" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo and toggle */}
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-semibold">Notebook</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn("h-8 w-8", collapsed && "mx-auto")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* New note button */}
      <div className="p-3">
        <Button
          className={cn("w-full gap-2", collapsed && "px-0")}
          onClick={() => {
            // TODO: Create new note
            console.log("Create new note");
          }}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>New Note</span>}
        </Button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Favorites section */}
      {!collapsed && (
        <div className="px-3 py-2">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Favorites
            </span>
          </div>
          <div className="mt-1 space-y-1">
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No favorites yet
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="border-t p-3 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
