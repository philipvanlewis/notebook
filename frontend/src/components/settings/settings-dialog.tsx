"use client";

/**
 * SettingsDialog Component
 *
 * Displays LLM provider configuration and status.
 * Shows current provider, model, and connection status.
 * For Ollama: displays available models and server status.
 *
 * Following patterns from:
 * - open-notebook: TanStack Query hooks for data fetching
 * - hyperbooklm: Component structure
 */

import { useState } from "react";
import {
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Server,
  Cloud,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type LLMProvider } from "@/lib/api";
import { useLLMAndOllamaStatus } from "@/lib/queries";

interface ProviderInfo {
  id: LLMProvider;
  name: string;
  description: string;
  icon: React.ReactNode;
  isLocal: boolean;
}

const providers: ProviderInfo[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4, GPT-3.5 Turbo",
    icon: <Cloud className="h-5 w-5" />,
    isLocal: false,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5, Claude 3",
    icon: <Cloud className="h-5 w-5" />,
    isLocal: false,
  },
  {
    id: "google",
    name: "Google",
    description: "Gemini Pro, Gemini Flash",
    icon: <Cloud className="h-5 w-5" />,
    isLocal: false,
  },
  {
    id: "ollama",
    name: "Ollama",
    description: "Local LLMs (Llama, Mistral, etc.)",
    icon: <Cpu className="h-5 w-5" />,
    isLocal: true,
  },
];

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);

  // TanStack Query hooks (following open-notebook patterns)
  // Fetch status only when dialog is open
  const { llmStatus, ollamaStatus, isLoading, error, refetch } =
    useLLMAndOllamaStatus(isOpen);

  const getProviderStatus = (providerId: LLMProvider) => {
    if (!llmStatus.data) return null;

    if (llmStatus.data.provider === providerId) {
      return llmStatus.data.available ? "active" : "configured-unavailable";
    }

    // For Ollama, check if server is available even if not the current provider
    if (providerId === "ollama" && ollamaStatus.data) {
      return ollamaStatus.data.available ? "available" : "unavailable";
    }

    return "not-configured";
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        );
      case "configured-unavailable":
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            Unavailable
          </span>
        );
      case "available":
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <CheckCircle className="h-3 w-3" />
            Available
          </span>
        );
      case "unavailable":
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            <XCircle className="h-3 w-3" />
            Offline
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Settings">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            LLM Configuration
          </DialogTitle>
          <DialogDescription>
            View your AI provider status and configuration.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-4">
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error instanceof Error ? error.message : "Failed to fetch status"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Configuration */}
            {llmStatus.data && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Current Provider</h3>
                  {getStatusBadge(getProviderStatus(llmStatus.data.provider as LLMProvider))}
                </div>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Provider:</span>{" "}
                    <span className="font-medium capitalize">
                      {llmStatus.data.provider}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Model:</span>{" "}
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {llmStatus.data.model}
                    </span>
                  </p>
                  {llmStatus.data.message && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                      {llmStatus.data.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Provider List */}
            <div>
              <h3 className="text-sm font-medium mb-3">Available Providers</h3>
              <div className="space-y-2">
                {providers.map((provider) => {
                  const status = getProviderStatus(provider.id);
                  const isCurrentProvider = llmStatus.data?.provider === provider.id;

                  return (
                    <div
                      key={provider.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        isCurrentProvider
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            provider.isLocal
                              ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                              : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          )}
                        >
                          {provider.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{provider.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {provider.description}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ollama Details */}
            {ollamaStatus.data && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Ollama Server
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetch()}
                    className="h-8 px-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {ollamaStatus.data.available ? (
                      <span className="text-green-600 dark:text-green-400">
                        Connected
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        Disconnected
                      </span>
                    )}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">URL:</span>{" "}
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {ollamaStatus.data.base_url}
                    </span>
                  </p>

                  {ollamaStatus.data.available && ollamaStatus.data.models.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        Installed Models ({ollamaStatus.data.models.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ollamaStatus.data.models.map((model) => (
                          <span
                            key={model}
                            className="text-xs px-2 py-1 bg-muted rounded-md font-mono"
                          >
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {ollamaStatus.data.message && (
                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                      {ollamaStatus.data.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Configuration Note */}
            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <p>
                Provider settings are configured via environment variables on the
                server. To change providers, update <code>LLM_PROVIDER</code> in
                your backend <code>.env</code> file.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
