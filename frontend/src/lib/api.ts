/**
 * API Client for Notebook Backend
 *
 * Handles all HTTP requests to the FastAPI backend with proper
 * authentication and error handling.
 */

import { useAuthStore } from "@/lib/stores";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  skipAuth?: boolean;
}

/**
 * Get the current auth token from the store
 */
function getToken(): string | null {
  return useAuthStore.getState().token;
}

/**
 * Make an authenticated API request
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, body, skipAuth, ...init } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers: Record<string, string> = {};

  // Copy existing headers
  if (init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, init.headers);
    }
  }

  // Add Content-Type for JSON bodies
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Add auth token unless skipped
  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...init,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      data?.detail || response.statusText,
      data
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============================================================================
// Auth Types & API
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export const authApi = {
  /**
   * Login with email and password (OAuth2 password flow)
   */
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append("username", email); // OAuth2 uses "username"
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        data?.detail || "Invalid email or password",
        data
      );
    }

    return response.json();
  },

  /**
   * Register a new user
   */
  register: (data: RegisterInput): Promise<User> =>
    request<User>("/auth/register", {
      method: "POST",
      body: data,
      skipAuth: true,
    }),

  /**
   * Get the current user's profile
   */
  me: (): Promise<User> => request<User>("/users/me"),
};

// ============================================================================
// Note Types & API
// ============================================================================

export interface Note {
  id: string;
  title: string;
  content: string;
  content_html: string | null;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  is_daily: boolean;
  daily_date: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  backlinks: NoteLink[];
  forward_links: NoteLink[];
}

export interface NoteLink {
  id: string;
  title: string;
}

export interface NoteList {
  items: Note[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  tags?: string[];
  is_pinned?: boolean;
  is_daily?: boolean;
  daily_date?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  content_html?: string;
  tags?: string[];
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface NotesListParams {
  page?: number;
  page_size?: number;
  search?: string;
  tag?: string;
  archived?: boolean;
  pinned_only?: boolean;
}

export const notesApi = {
  /**
   * List notes with pagination and filtering
   */
  list: (params?: NotesListParams): Promise<NoteList> =>
    request<NoteList>("/notes", { params: params as Record<string, string> }),

  /**
   * Get a single note by ID
   */
  get: (id: string): Promise<Note> => request<Note>(`/notes/${id}`),

  /**
   * Create a new note
   */
  create: (data: CreateNoteInput): Promise<Note> =>
    request<Note>("/notes", {
      method: "POST",
      body: data,
    }),

  /**
   * Update an existing note
   */
  update: (id: string, data: UpdateNoteInput): Promise<Note> =>
    request<Note>(`/notes/${id}`, {
      method: "PATCH",
      body: data,
    }),

  /**
   * Delete a note
   */
  delete: (id: string): Promise<void> =>
    request<void>(`/notes/${id}`, {
      method: "DELETE",
    }),

  /**
   * Archive a note
   */
  archive: (id: string): Promise<Note> =>
    request<Note>(`/notes/${id}/archive`, {
      method: "POST",
    }),

  /**
   * Unarchive a note
   */
  unarchive: (id: string): Promise<Note> =>
    request<Note>(`/notes/${id}/unarchive`, {
      method: "POST",
    }),
};

// ============================================================================
// Search Types & API
// ============================================================================

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  similarity: number;
  created_at: string;
  updated_at: string;
}

export interface SemanticSearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

export interface SimilarNotesResponse {
  note_id: string;
  similar_notes: SearchResult[];
}

export const searchApi = {
  /**
   * Semantic search using AI embeddings
   */
  semantic: (
    query: string,
    options?: { limit?: number; threshold?: number }
  ): Promise<SemanticSearchResponse> =>
    request<SemanticSearchResponse>("/notes/search/semantic", {
      params: {
        q: query,
        limit: options?.limit,
        threshold: options?.threshold,
      },
    }),

  /**
   * Get notes similar to a specific note
   */
  similar: (
    noteId: string,
    options?: { limit?: number; threshold?: number }
  ): Promise<SimilarNotesResponse> =>
    request<SimilarNotesResponse>(`/notes/${noteId}/similar`, {
      params: {
        limit: options?.limit,
        threshold: options?.threshold,
      },
    }),
};

// ============================================================================
// Daily Notes API
// ============================================================================

export const dailyApi = {
  /**
   * Get daily note for a specific date
   * Uses the regular notes API with is_daily=true filter
   */
  get: (date: string): Promise<NoteList> =>
    request<NoteList>("/notes", {
      params: {
        search: date,
        // Will filter to daily notes on the frontend
      },
    }),

  /**
   * Create or get a daily note for a date
   */
  create: (date: string): Promise<Note> =>
    request<Note>("/notes", {
      method: "POST",
      body: {
        title: `Daily Note - ${date}`,
        content: "",
        is_daily: true,
        daily_date: date,
      },
    }),
};

// ============================================================================
// User Profile API
// ============================================================================

export interface UpdateProfileInput {
  name?: string;
  avatar_url?: string;
}

export interface UpdatePasswordInput {
  current_password: string;
  new_password: string;
}

export const usersApi = {
  /**
   * Get current user profile
   */
  me: (): Promise<User> => request<User>("/users/me"),

  /**
   * Update current user profile
   */
  updateProfile: (data: UpdateProfileInput): Promise<User> =>
    request<User>("/users/me", {
      method: "PATCH",
      body: data,
    }),

  /**
   * Update password
   */
  updatePassword: (data: UpdatePasswordInput): Promise<void> =>
    request<void>("/users/me/password", {
      method: "POST",
      body: data,
    }),
};

// ============================================================================
// Chat Types & API
// ============================================================================

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  question: string;
  history?: ChatMessage[];
}

export interface ChatSource {
  id: string;
  title: string;
  similarity: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export const chatApi = {
  /**
   * Ask a question about your notes
   */
  ask: (data: ChatRequest): Promise<ChatResponse> =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: data,
    }),

  /**
   * Ask a question with streaming response
   * Returns an async generator that yields content chunks
   */
  askStream: async function* (
    data: ChatRequest
  ): AsyncGenerator<string, void, unknown> {
    const token = useAuthStore.getState().token;

    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        errorData?.detail || "Failed to get streaming response",
        errorData
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              yield parsed.content;
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }
    }
  },
};

// ============================================================================
// Source Types & API (Following HyperbookLM pattern)
// ============================================================================

export type SourceStatus = "idle" | "loading" | "success" | "error";

export interface Source {
  id: string;
  source_type: string;
  url: string | null;
  filename: string | null;
  title: string;
  content: string;
  page_count: number | null;
  word_count: number | null;
  status: SourceStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
  // Optional extra data for source-type-specific metadata (e.g., YouTube)
  extra_data?: {
    video_id?: string;
    channel?: string;
    duration_seconds?: number;
    thumbnail_url?: string;
    language?: string;
  };
}

export interface SourceList {
  items: Source[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface SourceUploadResponse {
  id: string;
  title: string;
  text: string;
  content: string;
  filename: string;
  pages: number | null;
  status: SourceStatus;
}

export interface SourceScrapeResponse {
  id: string;
  title: string;
  content: string;
  text: string;
  url: string;
  status: SourceStatus;
}

export interface SourceYouTubeResponse {
  id: string;
  title: string;
  content: string;
  text: string;
  url: string;
  video_id: string;
  channel: string;
  duration_seconds: number;
  thumbnail_url: string;
  language: string;
  word_count: number;
  status: SourceStatus;
}

export interface SourcesListParams {
  page?: number;
  page_size?: number;
  source_type?: string;
}

export type SummaryType = "comprehensive" | "key_points" | "brief";

export interface SummaryRequest {
  source_ids: string[];
  summary_type?: SummaryType;
}

export interface SummaryResponse {
  summary: string;
  source_count: number;
  summary_type: string;
}

export type TTSProvider = "openai" | "elevenlabs";

export interface AudioRequest {
  source_ids: string[];
  provider?: TTSProvider;
}

export interface AudioResponse {
  blob: Blob;
  url: string;
}

export interface SlidesRequest {
  source_ids: string[];
  num_slides?: number;
}

export interface SlideData {
  slide_type: string;
  title: string;
  content: string | string[];
  notes: string | null;
}

export interface SlidesResponse {
  slides: SlideData[];
  source_count: number;
}

export interface PodcastRequest {
  source_ids: string[];
  provider?: TTSProvider;
}

export interface PodcastResponse {
  blob: Blob;
  url: string;
}

export const sourcesApi = {
  /**
   * List sources with pagination
   */
  list: (params?: SourcesListParams): Promise<SourceList> =>
    request<SourceList>("/sources", { params: params as Record<string, string> }),

  /**
   * Get a single source by ID
   */
  get: (id: string): Promise<Source> => request<Source>(`/sources/${id}`),

  /**
   * Upload a file (PDF or TXT)
   * Following HyperbookLM's upload pattern
   */
  upload: async (file: File): Promise<SourceUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_BASE_URL}/sources/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        data?.detail || "Failed to upload file",
        data
      );
    }

    return response.json();
  },

  /**
   * Scrape content from a URL
   * Following HyperbookLM's scrape pattern
   */
  scrapeUrl: (url: string): Promise<SourceScrapeResponse> =>
    request<SourceScrapeResponse>("/sources/url", {
      method: "POST",
      body: { url },
    }),

  /**
   * Create a text source
   */
  createText: (title: string, content: string): Promise<Source> =>
    request<Source>("/sources/text", {
      method: "POST",
      body: { title, content },
    }),

  /**
   * Delete a source
   */
  delete: (id: string): Promise<void> =>
    request<void>(`/sources/${id}`, {
      method: "DELETE",
    }),

  /**
   * Generate a summary from sources
   */
  generateSummary: (data: SummaryRequest): Promise<SummaryResponse> =>
    request<SummaryResponse>("/sources/summary", {
      method: "POST",
      body: data,
    }),

  /**
   * Generate a summary with streaming response
   * Returns an async generator that yields content chunks
   */
  generateSummaryStream: async function* (
    data: SummaryRequest
  ): AsyncGenerator<string, void, unknown> {
    const token = useAuthStore.getState().token;

    const response = await fetch(`${API_BASE_URL}/sources/summary/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        errorData?.detail || "Failed to generate summary",
        errorData
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              yield parsed.content;
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }
    }
  },

  /**
   * Generate audio overview from sources
   * Returns audio blob and object URL for playback
   */
  generateAudio: async (data: AudioRequest): Promise<AudioResponse> => {
    const token = useAuthStore.getState().token;

    const response = await fetch(`${API_BASE_URL}/sources/audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        errorData?.detail || "Failed to generate audio",
        errorData
      );
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    return { blob, url };
  },

  /**
   * Generate presentation slides from sources
   */
  generateSlides: (data: SlidesRequest): Promise<SlidesResponse> =>
    request<SlidesResponse>("/sources/slides", {
      method: "POST",
      body: data,
    }),

  /**
   * Generate slides with streaming response
   * Returns an async generator that yields content chunks
   */
  generateSlidesStream: async function* (
    data: SlidesRequest
  ): AsyncGenerator<string, void, unknown> {
    const token = useAuthStore.getState().token;

    const response = await fetch(`${API_BASE_URL}/sources/slides/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        errorData?.detail || "Failed to generate slides",
        errorData
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              yield parsed.content;
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }
    }
  },

  /**
   * Generate podcast from sources
   * Returns audio blob and object URL for playback
   */
  generatePodcast: async (data: PodcastRequest): Promise<PodcastResponse> => {
    const token = useAuthStore.getState().token;

    const response = await fetch(`${API_BASE_URL}/sources/podcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        errorData?.detail || "Failed to generate podcast",
        errorData
      );
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    return { blob, url };
  },
};

// ============================================================================
// LLM Status Types & API
// ============================================================================

export type LLMProvider = "openai" | "anthropic" | "google" | "ollama";

export interface LLMStatusResponse {
  provider: LLMProvider;
  model: string;
  available: boolean;
  message: string | null;
}

export interface OllamaStatusResponse {
  available: boolean;
  base_url: string;
  models: string[];
  message: string | null;
}

export interface OllamaModelsResponse {
  models: string[];
}

export const llmApi = {
  /**
   * Get current LLM provider status
   */
  getStatus: (): Promise<LLMStatusResponse> =>
    request<LLMStatusResponse>("/llm/status"),

  /**
   * Get Ollama server status and available models
   */
  getOllamaStatus: (): Promise<OllamaStatusResponse> =>
    request<OllamaStatusResponse>("/llm/ollama/status"),

  /**
   * List available Ollama models
   */
  listOllamaModels: (): Promise<OllamaModelsResponse> =>
    request<OllamaModelsResponse>("/llm/ollama/models"),
};

// ============================================================================
// Export all APIs
// ============================================================================

export const api = {
  auth: authApi,
  notes: notesApi,
  search: searchApi,
  daily: dailyApi,
  users: usersApi,
  chat: chatApi,
  sources: sourcesApi,
  llm: llmApi,
};
