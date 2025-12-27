"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearch, useSemanticSearch } from "@/lib/queries";
import { formatRelativeDate, cn } from "@/lib/utils";
import type { Note, SearchResult } from "@/lib/api";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"text" | "semantic">("text");

  // Text search (basic)
  const {
    data: textResults,
    isLoading: isTextLoading,
    isError: isTextError,
  } = useSearch(query, searchMode === "text");

  // Semantic search (AI-powered)
  const {
    data: semanticResults,
    isLoading: isSemanticLoading,
    isError: isSemanticError,
  } = useSemanticSearch(query, { limit: 20 }, searchMode === "semantic");

  const isLoading = searchMode === "text" ? isTextLoading : isSemanticLoading;
  const isError = searchMode === "text" ? isTextError : isSemanticError;

  // Get results based on mode
  const results =
    searchMode === "text"
      ? textResults?.items ?? []
      : semanticResults?.results ?? [];

  const handleNoteClick = (noteId: string) => {
    router.push(`/notes?id=${noteId}`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search header */}
      <div className="border-b px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
              autoFocus
            />
          </div>

          {/* Search mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={searchMode === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("text")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Text Search
            </Button>
            <Button
              variant={searchMode === "semantic" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("semantic")}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI Search
            </Button>
          </div>
        </div>
      </div>

      {/* Search results */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          {!query ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Enter a search term to find notes.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchMode === "semantic"
                  ? "AI Search finds notes with similar meaning, even if they don't contain your exact words."
                  : "Text Search finds notes containing your exact search terms."}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Tip: Use Cmd+K to open quick search from anywhere.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                {searchMode === "semantic" ? "AI is thinking..." : "Searching..."}
              </span>
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-destructive">
              <p>Failed to search. Please try again.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No results found for &quot;{query}&quot;</p>
              <p className="text-sm mt-2">
                {searchMode === "text"
                  ? "Try different keywords or switch to AI Search."
                  : "Try rephrasing your search or switch to Text Search."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
              </p>
              <div className="space-y-2">
                {results.map((result) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    searchMode={searchMode}
                    onClick={() => handleNoteClick(result.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SearchResultItemProps {
  result: Note | SearchResult;
  searchMode: "text" | "semantic";
  onClick: () => void;
}

function SearchResultItem({ result, searchMode, onClick }: SearchResultItemProps) {
  // Get preview from content
  const preview = result.content.slice(0, 200).replace(/<[^>]*>/g, "").replace(/\n/g, " ");
  const similarity = "similarity" in result ? result.similarity : null;

  return (
    <div
      className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{result.title || "Untitled"}</h3>
        {similarity !== null && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
            {Math.round(similarity * 100)}% match
          </span>
        )}
      </div>

      {preview && (
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {preview}
        </p>
      )}

      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(result.updated_at)}
        </span>
        {result.tags.length > 0 && (
          <div className="flex gap-1">
            {result.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
