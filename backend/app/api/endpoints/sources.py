"""
Sources Endpoints

API routes for multi-source ingestion (PDF upload, web scraping).
Following HyperbookLM's upload and scrape route patterns.
"""

import logging
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.models.source import Source, SourceStatus, SourceType
from app.schemas.source import (
    SourceList,
    SourceRead,
    SourceScrapeResponse,
    SourceTextCreate,
    SourceUpdate,
    SourceUploadResponse,
    SourceURLCreate,
    SourceYouTubeResponse,
)
from app.services.embeddings import embedding_service
from app.services.podcast import podcast_service
from app.services.slides import slides_service
from app.services.sources import sources_service
from app.services.summary import summary_service
from app.services.tts import tts_service
from app.services.youtube import youtube_service

logger = logging.getLogger(__name__)

router = APIRouter()


class SummaryRequest(BaseModel):
    """Request for generating a summary from sources."""
    source_ids: list[UUID]
    summary_type: Literal["comprehensive", "key_points", "brief"] = "comprehensive"

# Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024
# Allowed file types
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}


async def generate_source_embedding(db: DbSession, source_id: UUID) -> None:
    """Background task to generate and store embedding for a source."""
    try:
        result = await db.execute(select(Source).where(Source.id == source_id))
        source = result.scalar_one_or_none()

        if not source:
            logger.warning(f"Source {source_id} not found for embedding generation")
            return

        # Prepare text for embedding
        text = f"{source.title}\n\n{source.content}"

        # Truncate if too long (embedding models have token limits)
        if len(text) > 8000:
            text = text[:8000]

        embedding = await embedding_service.generate_embedding(text)
        source.embedding = embedding
        await db.commit()
        logger.info(f"Generated embedding for source {source_id}")

    except Exception as e:
        logger.error(f"Failed to generate embedding for source {source_id}: {e}")
        await db.rollback()


@router.get("", response_model=SourceList)
async def list_sources(
    db: DbSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    source_type: str | None = None,
) -> SourceList:
    """List user's sources with pagination."""
    query = select(Source).where(Source.owner_id == current_user.id)

    if source_type:
        query = query.where(Source.source_type == source_type)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Apply pagination
    query = (
        query.order_by(Source.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = await db.execute(query)
    sources = result.scalars().all()

    return SourceList(
        items=sources,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )


@router.post("/upload", response_model=SourceUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    db: DbSession,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
) -> SourceUploadResponse:
    """
    Upload a file (PDF or TXT) and extract its content.

    Following HyperbookLM's upload route pattern:
    - Accepts PDF and TXT files
    - Returns: id, title, text, content, filename, pages, status
    """
    # Validate file extension
    filename = file.filename or "upload"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB",
        )

    # Create source record with loading status
    source = Source(
        owner_id=current_user.id,
        source_type=SourceType.PDF.value if ext == ".pdf" else SourceType.FILE.value,
        filename=filename,
        title=filename,
        content="",
        status=SourceStatus.LOADING.value,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)

    try:
        # Extract text based on file type
        if ext == ".pdf":
            extracted = await sources_service.extract_pdf_text(content, filename)
        else:
            extracted = await sources_service.extract_txt_content(content, filename)

        # Update source with extracted content
        source.title = extracted["title"]
        source.content = extracted["text"]
        source.page_count = extracted.get("pages")
        source.word_count = extracted.get("word_count")
        source.status = SourceStatus.SUCCESS.value

        await db.commit()
        await db.refresh(source)

        # Generate embedding in background
        if settings.OPENAI_API_KEY:
            background_tasks.add_task(generate_source_embedding, db, source.id)

        return SourceUploadResponse(
            id=source.id,
            title=source.title,
            text=source.content,
            content=source.content,
            filename=filename,
            pages=source.page_count,
            status=source.status,
        )

    except Exception as e:
        logger.error(f"Failed to process uploaded file: {e}")
        source.status = SourceStatus.ERROR.value
        source.error = str(e)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process file: {str(e)}",
        )


@router.post("/url", status_code=status.HTTP_201_CREATED)
async def scrape_url(
    db: DbSession,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
    data: SourceURLCreate,
) -> SourceScrapeResponse | SourceYouTubeResponse:
    """
    Scrape content from a URL or extract YouTube transcript.

    Automatically detects YouTube URLs and extracts transcripts.
    For regular URLs, fetches and parses web page content.

    Following HyperbookLM's scrape route pattern:
    - Returns: id, title, content, text, url, status
    """
    # Auto-detect YouTube URLs and route to YouTube handler
    if youtube_service.is_youtube_url(data.url):
        return await extract_youtube_transcript(db, current_user, background_tasks, data)

    # Create source record with loading status for regular URLs
    source = Source(
        owner_id=current_user.id,
        source_type=SourceType.URL.value,
        url=data.url,
        title=data.url,
        content="",
        status=SourceStatus.LOADING.value,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)

    try:
        # Scrape the URL
        scraped = await sources_service.scrape_url(data.url)

        # Update source with scraped content
        source.title = scraped["title"]
        source.content = scraped["content"]
        source.word_count = scraped.get("word_count")
        source.status = SourceStatus.SUCCESS.value

        await db.commit()
        await db.refresh(source)

        # Generate embedding in background
        if settings.OPENAI_API_KEY:
            background_tasks.add_task(generate_source_embedding, db, source.id)

        return SourceScrapeResponse(
            id=source.id,
            title=source.title,
            content=source.content,
            text=scraped["text"],
            url=data.url,
            status=source.status,
        )

    except Exception as e:
        logger.error(f"Failed to scrape URL: {e}")
        # Rollback any pending failed transaction first
        await db.rollback()

        # Update the source with error status in a fresh transaction
        source.status = SourceStatus.ERROR.value
        source.error = str(e)[:500] if str(e) else "Unknown error"
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to scrape URL: {str(e)}",
        )


@router.post("/text", response_model=SourceRead, status_code=status.HTTP_201_CREATED)
async def create_text_source(
    db: DbSession,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
    data: SourceTextCreate,
) -> Source:
    """Create a source from plain text."""
    source = Source(
        owner_id=current_user.id,
        source_type=SourceType.TEXT.value,
        title=data.title,
        content=data.content,
        word_count=len(data.content.split()),
        status=SourceStatus.SUCCESS.value,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)

    # Generate embedding in background
    if settings.OPENAI_API_KEY:
        background_tasks.add_task(generate_source_embedding, db, source.id)

    return source


@router.post("/youtube", response_model=SourceYouTubeResponse, status_code=status.HTTP_201_CREATED)
async def extract_youtube_transcript(
    db: DbSession,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
    data: SourceURLCreate,
) -> SourceYouTubeResponse:
    """
    Extract transcript from a YouTube video.

    Supports various YouTube URL formats:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/shorts/VIDEO_ID

    Returns the video metadata and full transcript text.
    """
    # Validate it's a YouTube URL
    if not youtube_service.is_youtube_url(data.url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not a valid YouTube URL. Please provide a youtube.com or youtu.be URL.",
        )

    # Create source record with loading status
    source = Source(
        owner_id=current_user.id,
        source_type=SourceType.YOUTUBE.value,
        url=data.url,
        title="Loading...",
        content="",
        status=SourceStatus.LOADING.value,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)

    try:
        # Extract YouTube video data
        extracted = await youtube_service.extract_for_source(data.url)

        # Update source with extracted content
        source.title = extracted["title"]
        source.content = extracted["content"]
        source.word_count = extracted["word_count"]
        source.extra_data = extracted["extra_data"]
        source.url = extracted["url"]  # Use canonical URL
        source.status = SourceStatus.SUCCESS.value

        await db.commit()
        await db.refresh(source)

        # Generate embedding in background
        if settings.OPENAI_API_KEY:
            background_tasks.add_task(generate_source_embedding, db, source.id)

        extra = extracted["extra_data"]
        return SourceYouTubeResponse(
            id=source.id,
            title=source.title,
            content=source.content,
            text=extracted["text"],
            url=extracted["url"],
            video_id=extra.get("video_id", ""),
            channel=extra.get("channel", "Unknown"),
            duration_seconds=extra.get("duration_seconds", 0),
            thumbnail_url=extra.get("thumbnail_url", ""),
            language=extra.get("language", "en"),
            word_count=source.word_count or 0,
            status=source.status,
        )

    except ValueError as e:
        # Handle known errors (no transcript, disabled captions, etc.)
        logger.warning(f"YouTube extraction failed: {e}")
        source.status = SourceStatus.ERROR.value
        source.error = str(e)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to extract YouTube transcript: {e}")
        source.status = SourceStatus.ERROR.value
        source.error = str(e)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract YouTube transcript: {str(e)}",
        )


@router.get("/{source_id}", response_model=SourceRead)
async def get_source(
    db: DbSession,
    current_user: CurrentUser,
    source_id: UUID,
) -> Source:
    """Get a specific source by ID."""
    result = await db.execute(
        select(Source).where(
            Source.id == source_id,
            Source.owner_id == current_user.id,
        )
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found",
        )

    return source


@router.patch("/{source_id}", response_model=SourceRead)
async def update_source(
    db: DbSession,
    current_user: CurrentUser,
    source_id: UUID,
    data: SourceUpdate,
    background_tasks: BackgroundTasks,
) -> Source:
    """Update a source."""
    result = await db.execute(
        select(Source).where(
            Source.id == source_id,
            Source.owner_id == current_user.id,
        )
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    content_changed = "content" in update_data or "title" in update_data

    for field, value in update_data.items():
        setattr(source, field, value)

    if "content" in update_data:
        source.word_count = len(update_data["content"].split())

    await db.commit()
    await db.refresh(source)

    # Regenerate embedding if content changed
    if content_changed and settings.OPENAI_API_KEY:
        background_tasks.add_task(generate_source_embedding, db, source.id)

    return source


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source(
    db: DbSession,
    current_user: CurrentUser,
    source_id: UUID,
) -> None:
    """Delete a source."""
    result = await db.execute(
        select(Source).where(
            Source.id == source_id,
            Source.owner_id == current_user.id,
        )
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found",
        )

    await db.delete(source)
    await db.commit()


class SummaryResponse(BaseModel):
    """Response for summary generation."""
    summary: str
    source_count: int
    summary_type: str


@router.post("/summary", response_model=SummaryResponse)
async def generate_summary(
    db: DbSession,
    current_user: CurrentUser,
    request: SummaryRequest,
) -> SummaryResponse:
    """
    Generate an AI summary from multiple sources.

    Following HyperbookLM's summary generation pattern.
    """
    # Fetch the sources
    result = await db.execute(
        select(Source).where(
            Source.id.in_(request.source_ids),
            Source.owner_id == current_user.id,
        )
    )
    sources = result.scalars().all()

    if not sources:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sources found",
        )

    # Prepare sources for summary service
    source_data = [
        {
            "id": str(s.id),
            "title": s.title,
            "content": s.content,
        }
        for s in sources
    ]

    try:
        summary = await summary_service.generate_summary(
            sources=source_data,
            summary_type=request.summary_type,
        )

        return SummaryResponse(
            summary=summary,
            source_count=len(sources),
            summary_type=request.summary_type,
        )

    except Exception as e:
        logger.error(f"Failed to generate summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}",
        )


@router.post("/summary/stream")
async def generate_summary_stream(
    db: DbSession,
    current_user: CurrentUser,
    request: SummaryRequest,
) -> StreamingResponse:
    """
    Generate an AI summary from multiple sources with streaming response.

    Returns a Server-Sent Events stream.
    """
    # Fetch the sources
    result = await db.execute(
        select(Source).where(
            Source.id.in_(request.source_ids),
            Source.owner_id == current_user.id,
        )
    )
    sources = result.scalars().all()

    if not sources:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sources found",
        )

    # Prepare sources for summary service
    source_data = [
        {
            "id": str(s.id),
            "title": s.title,
            "content": s.content,
        }
        for s in sources
    ]

    return StreamingResponse(
        summary_service.generate_summary_stream(
            sources=source_data,
            summary_type=request.summary_type,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


class AudioRequest(BaseModel):
    """Request for generating audio from sources."""
    source_ids: list[UUID]
    provider: Literal["openai", "elevenlabs"] | None = None


class SlidesRequest(BaseModel):
    """Request for generating slides from sources."""
    source_ids: list[UUID]
    num_slides: int = 8


class PodcastRequest(BaseModel):
    """Request for generating podcast from sources."""
    source_ids: list[UUID]
    provider: Literal["openai", "elevenlabs"] | None = None


class SlideData(BaseModel):
    """A single slide."""
    slide_type: str
    title: str
    content: str | list[str]
    notes: str | None = None


class SlidesResponse(BaseModel):
    """Response for slides generation."""
    slides: list[SlideData]
    source_count: int


@router.post("/audio")
async def generate_audio_overview(
    db: DbSession,
    current_user: CurrentUser,
    request: AudioRequest,
) -> StreamingResponse:
    """
    Generate an audio overview from multiple sources.

    Returns MP3 audio data.
    """
    # Fetch the sources
    result = await db.execute(
        select(Source).where(
            Source.id.in_(request.source_ids),
            Source.owner_id == current_user.id,
        )
    )
    sources = result.scalars().all()

    if not sources:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sources found",
        )

    # Prepare sources for TTS service
    source_data = [
        {
            "id": str(s.id),
            "title": s.title,
            "content": s.content,
        }
        for s in sources
    ]

    try:
        audio_bytes = await tts_service.generate_overview_audio(
            sources=source_data,
            provider=request.provider,
        )

        return StreamingResponse(
            iter([audio_bytes]),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=audio-overview.mp3",
                "Content-Length": str(len(audio_bytes)),
            },
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to generate audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate audio: {str(e)}",
        )


@router.post("/slides", response_model=SlidesResponse)
async def generate_slides(
    db: DbSession,
    current_user: CurrentUser,
    request: SlidesRequest,
) -> SlidesResponse:
    """
    Generate presentation slides from multiple sources.

    Uses AI to create a structured slide deck from the source content.
    """
    # Fetch the sources
    result = await db.execute(
        select(Source).where(
            Source.id.in_(request.source_ids),
            Source.owner_id == current_user.id,
        )
    )
    sources = result.scalars().all()

    if not sources:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sources found",
        )

    # Prepare sources for slides service
    source_data = [
        {
            "id": str(s.id),
            "title": s.title,
            "content": s.content,
        }
        for s in sources
    ]

    try:
        slides = await slides_service.generate_slides(
            sources=source_data,
            num_slides=request.num_slides,
        )

        return SlidesResponse(
            slides=[SlideData(**slide) for slide in slides],
            source_count=len(sources),
        )

    except Exception as e:
        logger.error(f"Failed to generate slides: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate slides: {str(e)}",
        )


@router.post("/slides/stream")
async def generate_slides_stream(
    db: DbSession,
    current_user: CurrentUser,
    request: SlidesRequest,
) -> StreamingResponse:
    """
    Generate slides from sources with streaming response.

    Returns a Server-Sent Events stream.
    """
    # Fetch the sources
    result = await db.execute(
        select(Source).where(
            Source.id.in_(request.source_ids),
            Source.owner_id == current_user.id,
        )
    )
    sources = result.scalars().all()

    if not sources:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sources found",
        )

    # Prepare sources for slides service
    source_data = [
        {
            "id": str(s.id),
            "title": s.title,
            "content": s.content,
        }
        for s in sources
    ]

    return StreamingResponse(
        slides_service.generate_slides_stream(
            sources=source_data,
            num_slides=request.num_slides,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/podcast")
async def generate_podcast(
    db: DbSession,
    current_user: CurrentUser,
    request: PodcastRequest,
) -> StreamingResponse:
    """
    Generate a podcast-style audio from multiple sources.

    Creates a dialogue script and synthesizes multi-voice audio.
    Returns MP3 audio data.
    """
    # Fetch the sources
    result = await db.execute(
        select(Source).where(
            Source.id.in_(request.source_ids),
            Source.owner_id == current_user.id,
        )
    )
    sources = result.scalars().all()

    if not sources:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sources found",
        )

    # Prepare sources for podcast service
    source_data = [
        {
            "id": str(s.id),
            "title": s.title,
            "content": s.content,
        }
        for s in sources
    ]

    try:
        audio_bytes = await podcast_service.generate_podcast(
            sources=source_data,
            provider=request.provider,
        )

        return StreamingResponse(
            iter([audio_bytes]),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=podcast.mp3",
                "Content-Length": str(len(audio_bytes)),
            },
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to generate podcast: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate podcast: {str(e)}",
        )
