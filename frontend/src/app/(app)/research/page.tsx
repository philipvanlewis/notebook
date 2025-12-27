"use client";

/**
 * Research Page
 *
 * Following HyperbookLM's 3-column layout pattern:
 * - Left: Sources Panel (upload PDFs, URLs)
 * - Center: Chat interface
 * - Right: Output panel (summary, audio overview, slides)
 *
 * Uses TanStack Query mutations following patterns from:
 * - open-notebook: mutation structure, isPending states
 * - This project's sources.ts hooks
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  FileText,
  AlertCircle,
  BookMarked,
  Sparkles,
  Volume2,
  Pause,
  Play,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SourcesPanel } from "@/components/sources/sources-panel";
import { chatApi, sourcesApi, type ChatMessage, type ChatSource, type Source, type SummaryType } from "@/lib/api";
import {
  useGenerateAudio,
  useGeneratePodcast,
  useGenerateSlides,
} from "@/lib/queries";

// Helper to consume async generator for streaming
async function consumeStream(
  generator: AsyncGenerator<string, void, unknown>,
  onChunk: (chunk: string) => void
): Promise<void> {
  for await (const chunk of generator) {
    onChunk(chunk);
  }
}

interface Message extends ChatMessage {
  sources?: ChatSource[];
}

export default function ResearchPage() {
  // Sources and Chat state
  const [sources, setSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Summary state (streaming - not using mutation)
  const [summary, setSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Audio playback state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Podcast playback state
  const [podcastUrl, setPodcastUrl] = useState<string | null>(null);
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const podcastRef = useRef<HTMLAudioElement>(null);

  // TanStack Query mutations (following open-notebook patterns)
  const generateAudioMutation = useGenerateAudio();
  const generatePodcastMutation = useGeneratePodcast();
  const generateSlidesMutation = useGenerateSlides();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setInput("");
    setError(null);

    // Add user message
    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);

    // Add empty assistant message that we'll stream into
    const assistantMessageIndex = messages.length + 1; // After user message
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", sources: [] },
    ]);

    try {
      // Build context from sources
      const sourceContext = sources
        .map((s) => `Source: ${s.title}\n${s.content}`)
        .join("\n\n---\n\n");

      // Prepare history for context (exclude the empty assistant message)
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const stream = chatApi.askStream({
        question: sourceContext
          ? `Based on these sources:\n\n${sourceContext}\n\nQuestion: ${question}`
          : question,
        history,
      });

      // Stream the response
      await consumeStream(stream, (chunk) => {
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            lastMessage.content += chunk;
          }
          return newMessages;
        });
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to get response. Please try again."
      );
      // Remove the empty assistant message on error
      setMessages((prev) =>
        prev.filter((_, i) => i !== prev.length - 1 || prev[prev.length - 1].content !== "")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = async (summaryType: SummaryType = "comprehensive") => {
    if (sources.length === 0 || isGeneratingSummary) return;

    setSummary("");
    setSummaryError(null);
    setIsGeneratingSummary(true);

    try {
      const stream = sourcesApi.generateSummaryStream({
        source_ids: sources.map((s) => s.id),
        summary_type: summaryType,
      });

      await consumeStream(stream, (chunk) => {
        setSummary((prev) => prev + chunk);
      });
    } catch (err) {
      setSummaryError(
        err instanceof Error
          ? err.message
          : "Failed to generate summary. Please try again."
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateAudio = useCallback(() => {
    if (sources.length === 0 || generateAudioMutation.isPending) return;

    // Clean up previous audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlaying(false);

    generateAudioMutation.mutate(
      { source_ids: sources.map((s) => s.id) },
      {
        onSuccess: (response) => {
          setAudioUrl(response.url);
        },
      }
    );
  }, [sources, generateAudioMutation, audioUrl]);

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleGenerateSlides = useCallback(() => {
    if (sources.length === 0 || generateSlidesMutation.isPending) return;

    generateSlidesMutation.mutate({
      source_ids: sources.map((s) => s.id),
      num_slides: 8,
    });
  }, [sources, generateSlidesMutation]);

  const handleGeneratePodcast = useCallback(() => {
    if (sources.length === 0 || generatePodcastMutation.isPending) return;

    // Clean up previous podcast URL
    if (podcastUrl) {
      URL.revokeObjectURL(podcastUrl);
      setPodcastUrl(null);
    }
    setIsPodcastPlaying(false);

    generatePodcastMutation.mutate(
      { source_ids: sources.map((s) => s.id) },
      {
        onSuccess: (response) => {
          setPodcastUrl(response.url);
        },
      }
    );
  }, [sources, generatePodcastMutation, podcastUrl]);

  const togglePodcastPlayback = () => {
    if (!podcastRef.current) return;

    if (isPodcastPlaying) {
      podcastRef.current.pause();
    } else {
      podcastRef.current.play();
    }
    setIsPodcastPlaying(!isPodcastPlaying);
  };

  // Clean up audio URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (podcastUrl) {
        URL.revokeObjectURL(podcastUrl);
      }
    };
  }, [audioUrl, podcastUrl]);

  return (
    <div className="h-full flex">
      {/* Left Panel: Sources */}
      <div className="w-80 border-r flex-shrink-0 bg-muted/10">
        <SourcesPanel
          sources={sources}
          onSourcesChange={setSources}
          maxSources={5}
        />
      </div>

      {/* Center Panel: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Research Assistant</h1>
              <p className="text-sm text-muted-foreground">
                {sources.length > 0
                  ? `Ask questions about your ${sources.length} source${sources.length > 1 ? "s" : ""}`
                  : "Add sources to get started"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <BookMarked className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                Research your sources
              </h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Add PDFs, URLs, or text to the sources panel, then ask questions
                to get insights from your content.
              </p>
              <div className="grid gap-2 text-sm">
                <button
                  onClick={() => setInput("Summarize the main points")}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  Summarize the main points
                </button>
                <button
                  onClick={() => setInput("What are the key takeaways?")}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  What are the key takeaways?
                </button>
                <button
                  onClick={() => setInput("Compare and contrast the sources")}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  Compare and contrast the sources
                </button>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium mb-2 opacity-70">
                      Sources:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source) => (
                        <span
                          key={source.id}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-background/50"
                        >
                          <FileText className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">
                            {source.title || "Untitled"}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                sources.length > 0
                  ? "Ask a question about your sources..."
                  : "Add sources first, then ask questions..."
              }
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Right Panel: Output */}
      <div className="w-80 border-l flex-shrink-0 bg-muted/10 flex flex-col">
        <div className="border-b px-4 py-3 bg-muted/30">
          <h2 className="text-sm font-semibold">Output</h2>
          <p className="text-xs text-muted-foreground">
            Generate summaries, audio, and more
          </p>
        </div>

        <div className="p-4 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={sources.length === 0 || isGeneratingSummary}
            onClick={() => handleGenerateSummary("comprehensive")}
          >
            {isGeneratingSummary ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGeneratingSummary ? "Generating..." : "Generate Summary"}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={sources.length === 0 || generateAudioMutation.isPending}
            onClick={handleGenerateAudio}
          >
            {generateAudioMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            {generateAudioMutation.isPending ? "Generating..." : "Audio Overview"}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={sources.length === 0 || generateSlidesMutation.isPending}
            onClick={handleGenerateSlides}
          >
            {generateSlidesMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {generateSlidesMutation.isPending ? "Generating..." : "Generate Slides"}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={sources.length === 0 || generatePodcastMutation.isPending}
            onClick={handleGeneratePodcast}
          >
            {generatePodcastMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            {generatePodcastMutation.isPending ? "Generating..." : "Generate Podcast"}
          </Button>
        </div>

        {/* Summary Output */}
        {(summary || summaryError) && (
          <div className="p-4 border-t">
            {summaryError && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10 mb-3">
                <AlertCircle className="h-4 w-4" />
                {summaryError}
              </div>
            )}
            {summary && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Summary
                </h3>
                <div className="text-sm whitespace-pre-wrap max-h-48 overflow-auto">{summary}</div>
              </div>
            )}
          </div>
        )}

        {/* Audio Player */}
        {(audioUrl || generateAudioMutation.error) && (
          <div className="p-4 border-t">
            {generateAudioMutation.error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10 mb-3">
                <AlertCircle className="h-4 w-4" />
                {generateAudioMutation.error instanceof Error
                  ? generateAudioMutation.error.message
                  : "Failed to generate audio"}
              </div>
            )}
            {audioUrl && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Audio Overview
                </h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAudioPlayback}
                    className="flex-shrink-0"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    className="w-full"
                    controls
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Slides Output */}
        {(generateSlidesMutation.data?.slides || generateSlidesMutation.error) && (
          <div className="p-4 border-t flex-1 overflow-auto">
            {generateSlidesMutation.error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10 mb-3">
                <AlertCircle className="h-4 w-4" />
                {generateSlidesMutation.error instanceof Error
                  ? generateSlidesMutation.error.message
                  : "Failed to generate slides"}
              </div>
            )}
            {generateSlidesMutation.data?.slides && generateSlidesMutation.data.slides.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Slides ({generateSlidesMutation.data.slides.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {generateSlidesMutation.data.slides.map((slide, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/50 border text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          {slide.slide_type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          #{index + 1}
                        </span>
                      </div>
                      <p className="font-medium">{slide.title}</p>
                      {Array.isArray(slide.content) ? (
                        <ul className="mt-1 text-xs text-muted-foreground list-disc list-inside">
                          {slide.content.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {slide.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Podcast Player */}
        {(podcastUrl || generatePodcastMutation.error) && (
          <div className="p-4 border-t">
            {generatePodcastMutation.error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10 mb-3">
                <AlertCircle className="h-4 w-4" />
                {generatePodcastMutation.error instanceof Error
                  ? generatePodcastMutation.error.message
                  : "Failed to generate podcast"}
              </div>
            )}
            {podcastUrl && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Podcast
                </h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePodcastPlayback}
                    className="flex-shrink-0"
                  >
                    {isPodcastPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <audio
                    ref={podcastRef}
                    src={podcastUrl}
                    onEnded={() => setIsPodcastPlaying(false)}
                    onPause={() => setIsPodcastPlaying(false)}
                    onPlay={() => setIsPodcastPlaying(true)}
                    className="w-full"
                    controls
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {sources.length === 0 && !summary && !audioUrl && !generateSlidesMutation.data?.slides?.length && !podcastUrl && (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            Add sources to unlock output options
          </div>
        )}
      </div>
    </div>
  );
}
