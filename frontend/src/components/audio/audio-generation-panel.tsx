"use client";

/**
 * AudioGenerationPanel Component
 *
 * Provides UI for generating audio narration or podcasts from sources.
 * Supports multiple TTS providers (OpenAI, ElevenLabs).
 */

import { useState, useCallback } from "react";
import {
  Mic,
  Radio,
  Loader2,
  Volume2,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AudioPlayer } from "./audio-player";
import { cn } from "@/lib/utils";
import { type TTSProvider, type Source } from "@/lib/api";
import { useGenerateAudio, useGeneratePodcast } from "@/lib/queries";

interface AudioGenerationPanelProps {
  sources: Source[];
  isOpen: boolean;
  onClose: () => void;
}

type GenerationType = "audio" | "podcast";

interface ProviderOption {
  id: TTSProvider;
  name: string;
  description: string;
}

const providers: ProviderOption[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "High-quality, natural voices",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    description: "Ultra-realistic voice synthesis",
  },
];

export function AudioGenerationPanel({
  sources,
  isOpen,
  onClose,
}: AudioGenerationPanelProps) {
  const [generationType, setGenerationType] = useState<GenerationType>("audio");
  const [selectedProvider, setSelectedProvider] = useState<TTSProvider>("openai");
  const [audioResult, setAudioResult] = useState<{
    url: string;
    blob: Blob;
    type: GenerationType;
  } | null>(null);
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  // TanStack Query mutations (following open-notebook patterns)
  const generateAudioMutation = useGenerateAudio();
  const generatePodcastMutation = useGeneratePodcast();

  // Derive loading state from mutations
  const isGenerating = generateAudioMutation.isPending || generatePodcastMutation.isPending;

  const validSources = sources.filter((s) => s.status === "success");
  const hasValidSources = validSources.length > 0;

  const handleGenerate = useCallback(() => {
    if (!hasValidSources) return;

    setAudioResult(null);
    const sourceIds = validSources.map((s) => s.id);

    if (generationType === "audio") {
      generateAudioMutation.mutate(
        { source_ids: sourceIds, provider: selectedProvider },
        {
          onSuccess: (result) => {
            setAudioResult({
              url: result.url,
              blob: result.blob,
              type: "audio",
            });
          },
        }
      );
    } else {
      generatePodcastMutation.mutate(
        { source_ids: sourceIds, provider: selectedProvider },
        {
          onSuccess: (result) => {
            setAudioResult({
              url: result.url,
              blob: result.blob,
              type: "podcast",
            });
          },
        }
      );
    }
  }, [validSources, generationType, selectedProvider, hasValidSources, generateAudioMutation, generatePodcastMutation]);

  const handleClose = () => {
    // Clean up object URL when closing
    if (audioResult?.url) {
      URL.revokeObjectURL(audioResult.url);
    }
    setAudioResult(null);
    // Reset mutations
    generateAudioMutation.reset();
    generatePodcastMutation.reset();
    onClose();
  };

  const selectedProviderInfo = providers.find((p) => p.id === selectedProvider);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Generate Audio
          </DialogTitle>
          <DialogDescription>
            Create audio narration or a podcast from your sources.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source Summary */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p>
              <span className="text-muted-foreground">Sources: </span>
              <span className="font-medium">{validSources.length}</span>
              {validSources.length !== sources.length && (
                <span className="text-muted-foreground">
                  {" "}
                  ({sources.length - validSources.length} excluded due to errors)
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {validSources.map((s) => s.title).join(", ")}
            </p>
          </div>

          {/* Generation Type Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Generation Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGenerationType("audio")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                  generationType === "audio"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <Mic
                  className={cn(
                    "h-6 w-6",
                    generationType === "audio"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Audio Narration</p>
                  <p className="text-xs text-muted-foreground">
                    Single voice overview
                  </p>
                </div>
              </button>

              <button
                onClick={() => setGenerationType("podcast")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                  generationType === "podcast"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <Radio
                  className={cn(
                    "h-6 w-6",
                    generationType === "podcast"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Podcast</p>
                  <p className="text-xs text-muted-foreground">
                    Two-host dialogue
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Voice Provider
            </label>
            <div className="relative">
              <button
                onClick={() => setShowProviderMenu(!showProviderMenu)}
                className="w-full flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {selectedProviderInfo?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProviderInfo?.description}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    showProviderMenu && "rotate-180"
                  )}
                />
              </button>

              {showProviderMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-10">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        setSelectedProvider(provider.id);
                        setShowProviderMenu(false);
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {provider.description}
                        </p>
                      </div>
                      {selectedProvider === provider.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error messages handled via toast notifications */}

          {/* Audio Player Result */}
          {audioResult && (
            <div className="pt-2">
              <AudioPlayer
                src={audioResult.url}
                title={
                  audioResult.type === "podcast"
                    ? "Generated Podcast"
                    : "Audio Narration"
                }
                subtitle={`Generated from ${validSources.length} source${validSources.length !== 1 ? "s" : ""}`}
                autoPlay
              />
            </div>
          )}

          {/* Generate Button */}
          {!audioResult && (
            <Button
              onClick={handleGenerate}
              disabled={!hasValidSources || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating {generationType === "podcast" ? "Podcast" : "Audio"}...
                </>
              ) : (
                <>
                  {generationType === "podcast" ? (
                    <Radio className="h-4 w-4 mr-2" />
                  ) : (
                    <Mic className="h-4 w-4 mr-2" />
                  )}
                  Generate {generationType === "podcast" ? "Podcast" : "Audio"}
                </>
              )}
            </Button>
          )}

          {/* Generate Another */}
          {audioResult && (
            <Button
              variant="outline"
              onClick={() => setAudioResult(null)}
              className="w-full"
            >
              Generate Another
            </Button>
          )}

          {/* Generation Time Notice */}
          {isGenerating && (
            <p className="text-xs text-center text-muted-foreground">
              {generationType === "podcast"
                ? "Podcast generation may take 1-3 minutes depending on content length."
                : "Audio generation typically takes 30-60 seconds."}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
