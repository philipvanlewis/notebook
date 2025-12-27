/**
 * Chat Query Hooks
 *
 * TanStack Query hooks for AI chat functionality following patterns from:
 * - open-notebook: mutation structure, error handling
 * - This project's notes.ts (query key patterns)
 */

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  chatApi,
  type ChatRequest,
  type ChatResponse,
  type ChatMessage,
} from "../api";

// ============================================================================
// Query Keys (following open-notebook pattern)
// ============================================================================

export const chatKeys = {
  all: ["chat"] as const,
  history: () => [...chatKeys.all, "history"] as const,
};

// ============================================================================
// Chat Mutation Hook
// ============================================================================

/**
 * Send a message to the AI chat
 * Returns the response with sources
 *
 * Note: Chat history is managed in component state since it's ephemeral
 * and doesn't need persistence or cache invalidation
 */
export function useSendMessage() {
  return useMutation({
    mutationFn: (request: ChatRequest) => chatApi.ask(request),
    onError: (error) => {
      toast.error("Chat failed", {
        description:
          error instanceof Error ? error.message : "Failed to get response",
      });
    },
  });
}

/**
 * Send a streaming message to the AI chat
 * Returns an async generator for progressive responses
 */
export function useSendStreamingMessage() {
  return useMutation({
    mutationFn: (request: ChatRequest) => chatApi.askStream(request),
    onError: (error) => {
      toast.error("Chat failed", {
        description:
          error instanceof Error ? error.message : "Failed to get response",
      });
    },
  });
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extended message type with sources for display
 */
export interface DisplayMessage extends ChatMessage {
  sources?: ChatResponse["sources"];
}

/**
 * Create a user message object
 */
export function createUserMessage(content: string): DisplayMessage {
  return { role: "user", content };
}

/**
 * Create an assistant message from response
 */
export function createAssistantMessage(response: ChatResponse): DisplayMessage {
  return {
    role: "assistant",
    content: response.answer,
    sources: response.sources,
  };
}
