"use client";

/**
 * Chat Page
 *
 * AI-powered chat interface for asking questions about notes.
 * Following patterns from:
 * - open-notebook: TanStack Query mutations
 * - hyperbooklm: Component structure
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type ChatResponse } from "@/lib/api";
import {
  useSendMessage,
  type DisplayMessage,
  createUserMessage,
  createAssistantMessage,
} from "@/lib/queries";
import { useNotesStore } from "@/lib/stores";

export default function ChatPage() {
  const router = useRouter();
  const { setSelectedNoteId } = useNotesStore();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // TanStack Query mutation (following open-notebook patterns)
  const sendMessageMutation = useSendMessage();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || sendMessageMutation.isPending) return;

      const question = input.trim();
      setInput("");

      // Add user message immediately
      const userMessage = createUserMessage(question);
      setMessages((prev) => [...prev, userMessage]);

      // Prepare history for context
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Send message using mutation
      sendMessageMutation.mutate(
        { question, history },
        {
          onSuccess: (response: ChatResponse) => {
            const assistantMessage = createAssistantMessage(response);
            setMessages((prev) => [...prev, assistantMessage]);
          },
        }
      );
    },
    [input, messages, sendMessageMutation]
  );

  const handleSourceClick = (noteId: string) => {
    setSelectedNoteId(noteId);
    router.push("/notes");
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Chat</h1>
            <p className="text-sm text-muted-foreground">
              Ask questions about your notes
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Ask me about your notes
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              I can help you find information, summarize content, and answer
              questions based on your notes.
            </p>
            <div className="grid gap-2 text-sm">
              <button
                onClick={() =>
                  handleQuickQuestion("What are my most recent notes about?")
                }
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                What are my most recent notes about?
              </button>
              <button
                onClick={() => handleQuickQuestion("Summarize my notes on...")}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                Summarize my notes on...
              </button>
              <button
                onClick={() => handleQuickQuestion("Find notes related to...")}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                Find notes related to...
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
                      <button
                        key={source.id}
                        onClick={() => handleSourceClick(source.id)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-background/50 hover:bg-background transition-colors"
                      >
                        <FileText className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">
                          {source.title || "Untitled"}
                        </span>
                      </button>
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

        {sendMessageMutation.isPending && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-3">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}

        {sendMessageMutation.error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            {sendMessageMutation.error instanceof Error
              ? sendMessageMutation.error.message
              : "Failed to get response. Please try again."}
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
            placeholder="Ask a question about your notes..."
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={sendMessageMutation.isPending || !input.trim()}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI responses are based on your notes. For best results, create notes
          with clear content.
        </p>
      </div>
    </div>
  );
}
