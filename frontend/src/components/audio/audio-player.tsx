"use client";

/**
 * AudioPlayer Component
 *
 * A modern audio player with playback controls, progress bar,
 * volume control, download functionality, and robust error handling.
 *
 * Features (based on NotebookLM patterns):
 * - URL expiration detection with auto-refresh
 * - Error retry with exponential backoff
 * - Toast notifications for user feedback
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  RotateCcw,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AudioPlayerProps {
  src: string;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  className?: string;
  autoPlay?: boolean;
  /** Callback to refresh the audio URL if it expires */
  onUrlRefresh?: () => Promise<string | null>;
  /** Maximum retry attempts for failed loads */
  maxRetries?: number;
}

export function AudioPlayer({
  src,
  title = "Audio",
  subtitle,
  onClose,
  className,
  autoPlay = false,
  onUrlRefresh,
  maxRetries = 3,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format time as mm:ss or hh:mm:ss
  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Update currentSrc when src prop changes
  useEffect(() => {
    setCurrentSrc(src);
    setRetryCount(0);
    setError(null);
  }, [src]);

  // Check if error is likely due to URL expiration
  const isUrlExpiredError = useCallback((errorEvent: Event) => {
    const audio = errorEvent.target as HTMLAudioElement;
    const mediaError = audio?.error;
    // Network errors (code 2) or decode errors (code 3) may indicate expired URLs
    return mediaError?.code === MediaError.MEDIA_ERR_NETWORK ||
           mediaError?.code === MediaError.MEDIA_ERR_DECODE;
  }, []);

  // Retry with exponential backoff
  const retryWithBackoff = useCallback(async () => {
    if (retryCount >= maxRetries) {
      setError("Failed to load audio after multiple attempts");
      toast.error("Audio playback failed", {
        description: "Please try refreshing the audio",
      });
      return;
    }

    const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 8000);

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, backoffDelay));

    setRetryCount(prev => prev + 1);

    // Try to refresh URL if callback provided
    if (onUrlRefresh) {
      setIsRefreshing(true);
      try {
        const newUrl = await onUrlRefresh();
        if (newUrl) {
          setCurrentSrc(newUrl);
          setError(null);
          toast.success("Audio refreshed");
        }
      } catch (err) {
        console.error("Failed to refresh audio URL:", err);
      } finally {
        setIsRefreshing(false);
      }
    } else {
      // Just reload with current src
      audioRef.current?.load();
    }
  }, [retryCount, maxRetries, onUrlRefresh]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    if (!onUrlRefresh) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const newUrl = await onUrlRefresh();
      if (newUrl) {
        setCurrentSrc(newUrl);
        setRetryCount(0);
        toast.success("Audio refreshed successfully");
      } else {
        toast.error("Failed to refresh audio");
      }
    } catch (err) {
      toast.error("Failed to refresh audio");
      console.error("Failed to refresh audio URL:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [onUrlRefresh]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      if (autoPlay) {
        audio.play().catch(() => {});
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      setIsLoading(false);

      // Check if it's a URL expiration error and we can retry
      if (isUrlExpiredError(e) && retryCount < maxRetries) {
        retryWithBackoff();
      } else if (retryCount >= maxRetries) {
        setError("Failed to load audio after multiple attempts");
      } else {
        setError("Failed to load audio");
      }
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [autoPlay, isUrlExpiredError, retryCount, maxRetries, retryWithBackoff]);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        setError("Failed to play audio");
      });
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentSrc;
    link.download = `${title.replace(/[^a-z0-9]/gi, "_")}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border bg-card p-4 text-center",
          className
        )}
      >
        <p className="text-sm text-destructive">{error}</p>
        <div className="flex gap-2 justify-center mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              setIsLoading(true);
              setRetryCount(0);
              audioRef.current?.load();
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          {onUrlRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh URL
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm",
        className
      )}
    >
      <audio ref={audioRef} src={currentSrc} preload="metadata" />

      {/* Title */}
      <div className="mb-3">
        <h3 className="font-medium text-sm truncate">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          disabled={isLoading}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Restart */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRestart}
            disabled={isLoading}
            title="Restart"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Play/Pause */}
          <Button
            variant="default"
            size="icon"
            className="h-10 w-10"
            onClick={togglePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          {/* Download */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}
