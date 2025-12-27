"""
YouTube Service

Extracts transcripts and metadata from YouTube videos.
Supports various URL formats and language fallbacks.
"""

import logging
import re
from dataclasses import dataclass
from typing import Optional
from urllib.parse import parse_qs, urlparse

import httpx

logger = logging.getLogger(__name__)


@dataclass
class YouTubeTranscriptSegment:
    """A single segment of a YouTube transcript."""
    text: str
    start: float
    duration: float


@dataclass
class YouTubeVideo:
    """Extracted YouTube video data."""
    video_id: str
    title: str
    channel: str
    description: str
    transcript: str
    transcript_segments: list[YouTubeTranscriptSegment]
    duration_seconds: int
    thumbnail_url: str
    language: str
    word_count: int


class YouTubeService:
    """
    Service for extracting transcripts from YouTube videos.

    Supports various URL formats:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/v/VIDEO_ID
    - https://www.youtube.com/shorts/VIDEO_ID
    """

    # Regex patterns for extracting video IDs
    VIDEO_ID_PATTERNS = [
        # Standard youtube.com/watch?v=ID
        r'(?:youtube\.com/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})',
        # Short youtu.be/ID
        r'(?:youtu\.be/)([a-zA-Z0-9_-]{11})',
        # Embed youtube.com/embed/ID
        r'(?:youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
        # Old style youtube.com/v/ID
        r'(?:youtube\.com/v/)([a-zA-Z0-9_-]{11})',
        # Shorts youtube.com/shorts/ID
        r'(?:youtube\.com/shorts/)([a-zA-Z0-9_-]{11})',
        # Just the video ID
        r'^([a-zA-Z0-9_-]{11})$',
    ]

    # Preferred languages for transcript fallback (in order)
    PREFERRED_LANGUAGES = ['en', 'en-US', 'en-GB', 'en-AU', 'en-CA']

    def __init__(self):
        self._http_client: httpx.AsyncClient | None = None

    @property
    def http_client(self) -> httpx.AsyncClient:
        """Lazy initialization of HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(
                timeout=30.0,
                follow_redirects=True,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
            )
        return self._http_client

    def extract_video_id(self, url_or_id: str) -> str:
        """
        Extract YouTube video ID from various URL formats.

        Args:
            url_or_id: YouTube URL or video ID.

        Returns:
            11-character video ID.

        Raises:
            ValueError: If video ID cannot be extracted.
        """
        url_or_id = url_or_id.strip()

        for pattern in self.VIDEO_ID_PATTERNS:
            match = re.search(pattern, url_or_id)
            if match:
                return match.group(1)

        raise ValueError(
            f"Could not extract video ID from: {url_or_id}. "
            "Please provide a valid YouTube URL or video ID."
        )

    async def get_video_metadata(self, video_id: str) -> dict:
        """
        Fetch video metadata using YouTube's oEmbed API.

        Args:
            video_id: YouTube video ID.

        Returns:
            Dictionary with title, author_name, thumbnail_url.
        """
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"

        try:
            response = await self.http_client.get(oembed_url)
            response.raise_for_status()
            data = response.json()

            return {
                "title": data.get("title", "Untitled Video"),
                "channel": data.get("author_name", "Unknown Channel"),
                "thumbnail_url": data.get("thumbnail_url", f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"),
            }
        except Exception as e:
            logger.warning(f"Failed to fetch oEmbed metadata for {video_id}: {e}")
            # Fallback metadata
            return {
                "title": f"YouTube Video ({video_id})",
                "channel": "Unknown Channel",
                "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
            }

    async def get_transcript(
        self,
        video_id: str,
        languages: list[str] | None = None,
    ) -> tuple[list[YouTubeTranscriptSegment], str]:
        """
        Fetch transcript for a YouTube video.

        Uses the youtube-transcript-api library for reliable transcript extraction.

        Args:
            video_id: YouTube video ID.
            languages: List of language codes to try (in order of preference).

        Returns:
            Tuple of (transcript segments, language code used).

        Raises:
            ValueError: If transcript is unavailable.
        """
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            from youtube_transcript_api._errors import (
                TranscriptsDisabled,
                NoTranscriptFound,
                VideoUnavailable,
            )
        except ImportError:
            raise ImportError(
                "youtube-transcript-api is not installed. "
                "Install it with: pip install youtube-transcript-api"
            )

        languages = languages or self.PREFERRED_LANGUAGES

        try:
            # Try to get transcript with language preference
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

            # Try manual transcripts first (higher quality)
            transcript = None
            language_used = None

            try:
                # Try to find a manually created transcript
                for lang in languages:
                    try:
                        transcript = transcript_list.find_manually_created_transcript([lang])
                        language_used = lang
                        break
                    except NoTranscriptFound:
                        continue
            except Exception:
                pass

            if transcript is None:
                # Fall back to auto-generated transcripts
                try:
                    for lang in languages:
                        try:
                            transcript = transcript_list.find_generated_transcript([lang])
                            language_used = lang
                            break
                        except NoTranscriptFound:
                            continue
                except Exception:
                    pass

            if transcript is None:
                # Try to get any available transcript and translate if needed
                try:
                    # Get first available transcript
                    available = list(transcript_list)
                    if available:
                        first_transcript = available[0]
                        if first_transcript.is_translatable:
                            transcript = first_transcript.translate('en')
                            language_used = 'en'
                        else:
                            transcript = first_transcript
                            language_used = first_transcript.language_code
                except Exception:
                    pass

            if transcript is None:
                raise ValueError(f"No transcript available for video: {video_id}")

            # Fetch the actual transcript data
            transcript_data = transcript.fetch()

            segments = [
                YouTubeTranscriptSegment(
                    text=segment.get("text", ""),
                    start=segment.get("start", 0.0),
                    duration=segment.get("duration", 0.0),
                )
                for segment in transcript_data
            ]

            return segments, language_used or "en"

        except TranscriptsDisabled:
            raise ValueError(
                f"Transcripts are disabled for video: {video_id}. "
                "The video owner has not enabled captions."
            )
        except VideoUnavailable:
            raise ValueError(
                f"Video is unavailable: {video_id}. "
                "It may be private, deleted, or region-restricted."
            )
        except NoTranscriptFound:
            raise ValueError(
                f"No transcript found for video: {video_id}. "
                "The video may not have captions available."
            )
        except Exception as e:
            logger.error(f"Error fetching transcript for {video_id}: {e}")
            raise ValueError(f"Failed to fetch transcript: {str(e)}")

    def _format_transcript(
        self,
        segments: list[YouTubeTranscriptSegment],
        include_timestamps: bool = False,
    ) -> str:
        """
        Format transcript segments into readable text.

        Args:
            segments: List of transcript segments.
            include_timestamps: Whether to include timestamps.

        Returns:
            Formatted transcript text.
        """
        if include_timestamps:
            lines = []
            for segment in segments:
                minutes = int(segment.start // 60)
                seconds = int(segment.start % 60)
                timestamp = f"[{minutes:02d}:{seconds:02d}]"
                lines.append(f"{timestamp} {segment.text}")
            return "\n".join(lines)
        else:
            # Combine segments intelligently, respecting sentence boundaries
            texts = [segment.text for segment in segments]
            combined = " ".join(texts)

            # Clean up common issues
            combined = re.sub(r'\s+', ' ', combined)  # Normalize whitespace
            combined = re.sub(r'\[Music\]', '', combined, flags=re.IGNORECASE)  # Remove [Music] tags
            combined = re.sub(r'\[Applause\]', '', combined, flags=re.IGNORECASE)
            combined = re.sub(r'\[Laughter\]', '', combined, flags=re.IGNORECASE)

            return combined.strip()

    async def extract_video(
        self,
        url_or_id: str,
        include_timestamps: bool = False,
        languages: list[str] | None = None,
    ) -> YouTubeVideo:
        """
        Extract complete video data including transcript.

        Args:
            url_or_id: YouTube URL or video ID.
            include_timestamps: Whether to include timestamps in transcript.
            languages: List of language codes to try.

        Returns:
            YouTubeVideo with all extracted data.
        """
        # Extract video ID
        video_id = self.extract_video_id(url_or_id)

        # Fetch metadata and transcript concurrently would require asyncio.gather
        # but youtube-transcript-api is synchronous, so we do sequential
        metadata = await self.get_video_metadata(video_id)
        segments, language = await self.get_transcript(video_id, languages)

        # Format transcript
        transcript_text = self._format_transcript(segments, include_timestamps)

        # Calculate duration from segments
        duration = 0
        if segments:
            last_segment = segments[-1]
            duration = int(last_segment.start + last_segment.duration)

        return YouTubeVideo(
            video_id=video_id,
            title=metadata["title"],
            channel=metadata["channel"],
            description="",  # Not available via oEmbed
            transcript=transcript_text,
            transcript_segments=segments,
            duration_seconds=duration,
            thumbnail_url=metadata["thumbnail_url"],
            language=language,
            word_count=len(transcript_text.split()),
        )

    async def extract_for_source(self, url: str) -> dict:
        """
        Extract YouTube video data in source-compatible format.

        Returns data in the same format as other source extractors
        (PDF, URL scraping, text files).

        Args:
            url: YouTube URL.

        Returns:
            Dictionary with title, content, text, url, word_count, extra_data.
        """
        video = await self.extract_video(url)

        # Format content with video info header
        content_parts = [
            f"# {video.title}",
            f"**Channel:** {video.channel}",
            f"**Duration:** {video.duration_seconds // 60}:{video.duration_seconds % 60:02d}",
            f"**Language:** {video.language}",
            "",
            "## Transcript",
            "",
            video.transcript,
        ]
        content = "\n".join(content_parts)

        return {
            "title": video.title,
            "content": content,
            "text": video.transcript,
            "url": f"https://www.youtube.com/watch?v={video.video_id}",
            "word_count": video.word_count,
            "extra_data": {
                "video_id": video.video_id,
                "channel": video.channel,
                "duration_seconds": video.duration_seconds,
                "thumbnail_url": video.thumbnail_url,
                "language": video.language,
                "source_type": "youtube",
            },
        }

    @staticmethod
    def is_youtube_url(url: str) -> bool:
        """
        Check if a URL is a YouTube URL.

        Args:
            url: URL to check.

        Returns:
            True if URL is a YouTube URL.
        """
        youtube_patterns = [
            r'youtube\.com',
            r'youtu\.be',
        ]
        return any(re.search(pattern, url, re.IGNORECASE) for pattern in youtube_patterns)

    async def close(self):
        """Close the HTTP client."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None


# Global singleton instance
youtube_service = YouTubeService()
