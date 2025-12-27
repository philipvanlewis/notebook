"use client";

/**
 * SourcesPanel Component
 *
 * Following HyperbookLM's SourcesPanel pattern with TanStack Query hooks:
 * - Tab-based UI for URL vs File upload
 * - Drag-and-drop file upload zone
 * - Source list with status indicators (loading/success/error)
 * - Max 5 files limit
 *
 * Patterns from:
 * - open-notebook: TanStack Query mutations with toast notifications
 * - hyperbooklm: Controlled sources state, max sources limit
 */

import { useState, useRef, useCallback } from "react";
import {
  Link,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Trash2,
  Globe,
  Youtube,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  type Source,
  type SourceScrapeResponse,
  type SourceYouTubeResponse,
} from "@/lib/api";
import {
  useScrapeUrl,
  useUploadSource,
  useDeleteSource,
} from "@/lib/queries";
import { AudioGenerationPanel } from "@/components/audio";

interface SourcesPanelProps {
  sources: Source[];
  onSourcesChange: (sources: Source[]) => void;
  maxSources?: number;
}

type TabType = "url" | "file";

export function SourcesPanel({
  sources,
  onSourcesChange,
  maxSources = 5,
}: SourcesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("url");
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TanStack Query mutations (following open-notebook patterns)
  const scrapeUrlMutation = useScrapeUrl();
  const uploadSourceMutation = useUploadSource();
  const deleteSourceMutation = useDeleteSource();

  // Derive loading state from mutations
  const isLoading = scrapeUrlMutation.isPending || uploadSourceMutation.isPending;

  // Check if response is a YouTube response
  const isYouTubeResponse = (
    result: SourceScrapeResponse | SourceYouTubeResponse
  ): result is SourceYouTubeResponse => {
    return "video_id" in result;
  };

  // Format duration for display (e.g., "5:32" or "1:05:32")
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle URL submission using TanStack Query mutation
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || isLoading) return;

    if (sources.length >= maxSources) {
      return; // Toast notification handled by mutation hook
    }

    scrapeUrlMutation.mutate(urlInput.trim(), {
      onSuccess: (result) => {
        // Handle YouTube sources with extra metadata
        if (isYouTubeResponse(result)) {
          const newSource: Source = {
            id: result.id,
            source_type: "youtube",
            url: result.url,
            filename: null,
            title: result.title,
            content: result.content,
            page_count: null,
            word_count: result.word_count,
            status: result.status,
            error: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            extra_data: {
              video_id: result.video_id,
              channel: result.channel,
              duration_seconds: result.duration_seconds,
              thumbnail_url: result.thumbnail_url,
              language: result.language,
            },
          };
          onSourcesChange([...sources, newSource]);
        } else {
          // Regular URL source
          const newSource: Source = {
            id: result.id,
            source_type: "url",
            url: result.url,
            filename: null,
            title: result.title,
            content: result.content,
            page_count: null,
            word_count: result.content.split(/\s+/).length,
            status: result.status,
            error: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          onSourcesChange([...sources, newSource]);
        }
        setUrlInput("");
      },
    });
  };

  // Handle file upload using TanStack Query mutation
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxSources - sources.length;
    if (remainingSlots <= 0) {
      return; // Toast notification handled by mutation hook
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    let updatedSources = [...sources];

    // Process files sequentially using mutation
    filesToProcess.forEach((file) => {
      uploadSourceMutation.mutate(file, {
        onSuccess: (result) => {
          const newSource: Source = {
            id: result.id,
            source_type: file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "file",
            url: null,
            filename: result.filename,
            title: result.title,
            content: result.content,
            page_count: result.pages,
            word_count: result.content.split(/\s+/).length,
            status: result.status,
            error: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          updatedSources = [...updatedSources, newSource];
          onSourcesChange(updatedSources);
        },
      });
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [sources.length, maxSources]);

  // Remove source using TanStack Query mutation
  const handleRemoveSource = (id: string) => {
    deleteSourceMutation.mutate(id, {
      onSuccess: () => {
        onSourcesChange(sources.filter((s) => s.id !== id));
      },
    });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Get source icon
  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "url":
        return <Globe className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4 text-red-500" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 bg-muted/30">
        <h2 className="text-sm font-semibold">Sources</h2>
        <p className="text-xs text-muted-foreground">
          {sources.length}/{maxSources} sources added
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("url")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "url"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Link className="h-4 w-4 inline-block mr-2" />
          URL
        </button>
        <button
          onClick={() => setActiveTab("file")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "file"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Upload className="h-4 w-4 inline-block mr-2" />
          File
        </button>
      </div>

      {/* Input Area */}
      <div className="p-4 border-b">
        {activeTab === "url" ? (
          <form onSubmit={handleUrlSubmit} className="space-y-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter a URL..."
              disabled={isLoading || sources.length >= maxSources}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !urlInput.trim() || sources.length >= maxSources}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Add URL
                </>
              )}
            </Button>
          </form>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              sources.length >= maxSources && "opacity-50 cursor-not-allowed"
            )}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag & drop files here
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              PDF, TXT, MD (Max 10MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={isLoading || sources.length >= maxSources}
              className="hidden"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || sources.length >= maxSources}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Choose Files"
              )}
            </Button>
          </div>
        )}

        {/* Error messages handled via toast notifications */}
      </div>

      {/* Source List */}
      <div className="flex-1 overflow-auto p-2">
        {sources.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No sources added yet
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className={cn(
                  "flex items-start gap-2 p-3 rounded-lg border",
                  source.status === "error"
                    ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10"
                    : "border-border bg-muted/30"
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getSourceIcon(source.source_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{source.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {source.source_type === "youtube" && source.extra_data?.channel
                      ? source.extra_data.channel
                      : source.url || source.filename}
                  </p>
                  {source.word_count && (
                    <p className="text-xs text-muted-foreground">
                      {source.word_count.toLocaleString()} words
                      {source.page_count && ` • ${source.page_count} pages`}
                      {source.source_type === "youtube" &&
                        source.extra_data?.duration_seconds && (
                          <> • {formatDuration(source.extra_data.duration_seconds)}</>
                        )}
                    </p>
                  )}
                  {source.error && (
                    <p className="text-xs text-red-500 mt-1">{source.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(source.status)}
                  <button
                    onClick={() => handleRemoveSource(source.id)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="Remove source"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audio Generation Footer */}
      {sources.length > 0 && (
        <div className="border-t px-4 py-3 bg-muted/30">
          <Button
            onClick={() => setShowAudioPanel(true)}
            variant="outline"
            className="w-full"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Generate Audio
          </Button>
        </div>
      )}

      {/* Audio Generation Panel */}
      <AudioGenerationPanel
        sources={sources}
        isOpen={showAudioPanel}
        onClose={() => setShowAudioPanel(false)}
      />
    </div>
  );
}
