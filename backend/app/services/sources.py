"""
Sources Service

Handles PDF extraction and web scraping.
Following HyperbookLM's upload and scrape route patterns.
"""

import logging
import re
from io import BytesIO
from typing import Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class SourcesService:
    """
    Service for processing external content sources.

    Based on HyperbookLM's upload and scrape API routes.
    """

    def __init__(self):
        self.http_client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache"
            },
        )

    async def extract_pdf_text(
        self,
        file_content: bytes,
        filename: str,
    ) -> dict:
        """
        Extract text from PDF file.

        Following HyperbookLM's upload route pattern:
        - Returns: title, text, content, filename, pages
        """
        try:
            # Try PyMuPDF first (faster, better extraction)
            try:
                import fitz  # PyMuPDF

                pdf_doc = fitz.open(stream=file_content, filetype="pdf")
                text_parts = []

                for page in pdf_doc:
                    text_parts.append(page.get_text())

                text = "\n".join(text_parts)
                total_pages = len(pdf_doc)
                pdf_doc.close()

            except ImportError:
                # Fallback to pypdf
                try:
                    from pypdf import PdfReader

                    pdf_reader = PdfReader(BytesIO(file_content))
                    text_parts = []

                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text_parts.append(page_text)

                    text = "\n".join(text_parts)
                    total_pages = len(pdf_reader.pages)

                except ImportError:
                    raise ImportError(
                        "Neither PyMuPDF (fitz) nor pypdf is installed. "
                        "Install one with: pip install pymupdf or pip install pypdf"
                    )

            # Clean up the extracted text
            text = self._clean_text(text)

            # Generate title from filename
            title = filename.rsplit(".", 1)[0] if "." in filename else filename

            return {
                "title": title,
                "text": text,
                "content": text,
                "filename": filename,
                "pages": total_pages,
                "word_count": len(text.split()),
            }

        except Exception as e:
            logger.error(f"Failed to extract PDF text: {e}")
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

    async def extract_txt_content(
        self,
        file_content: bytes,
        filename: str,
    ) -> dict:
        """
        Extract content from text file.

        Following HyperbookLM's upload route pattern for TXT files.
        """
        try:
            # Try UTF-8 first, then fallback to latin-1
            try:
                text = file_content.decode("utf-8")
            except UnicodeDecodeError:
                text = file_content.decode("latin-1")

            text = self._clean_text(text)
            title = filename.rsplit(".", 1)[0] if "." in filename else filename

            return {
                "title": title,
                "text": text,
                "content": text,
                "filename": filename,
                "pages": None,
                "word_count": len(text.split()),
            }

        except Exception as e:
            logger.error(f"Failed to extract text file content: {e}")
            raise ValueError(f"Failed to extract text from file: {str(e)}")

    async def scrape_url(self, url: str) -> dict:
        """
        Scrape content from a URL.

        Following HyperbookLM's scrape route pattern:
        - Returns: title, content, text, url

        Uses Jina Reader API first (bypasses bot protection), falls back to direct fetch.
        """
        print(f"[DEBUG] scrape_url called with: {url}", flush=True)

        # Validate URL
        parsed = urlparse(url)
        if not parsed.scheme:
            url = f"https://{url}"
            parsed = urlparse(url)
        elif parsed.scheme not in ("http", "https"):
            raise ValueError("URL must use HTTP or HTTPS protocol")

        print(f"[DEBUG] Trying Jina Reader for: {url}", flush=True)

        # Try Jina Reader first (handles Cloudflare and bot protection)
        try:
            result = await self._scrape_with_jina(url, parsed)
            if result:
                print(f"[DEBUG] Jina Reader SUCCESS", flush=True)
                return result
            print(f"[DEBUG] Jina returned empty result", flush=True)
        except Exception as e:
            print(f"[DEBUG] Jina failed: {e}", flush=True)
            logger.warning(f"Jina Reader failed for {url}, trying direct fetch: {e}")

        # Fallback to direct fetch
        print(f"[DEBUG] Falling back to direct fetch", flush=True)
        return await self._scrape_direct(url, parsed)

    async def _scrape_with_jina(self, url: str, parsed) -> Optional[dict]:
        """
        Scrape using Jina Reader API (free, bypasses bot protection).
        https://jina.ai/reader/
        """
        jina_url = f"https://r.jina.ai/{url}"

        try:
            # Create a separate client for Jina to avoid compression issues
            async with httpx.AsyncClient(
                timeout=60.0,
                follow_redirects=True,
            ) as jina_client:
                response = await jina_client.get(
                    jina_url,
                    headers={
                        "Accept": "text/plain",
                        "User-Agent": "Mozilla/5.0 (compatible; NotebookApp/1.0)",
                    },
                )
                response.raise_for_status()

                # Get content and ensure it's valid UTF-8
                content = response.text

                # Remove null bytes and invalid characters
                content = content.replace('\x00', '')
                # Encode to UTF-8, ignoring errors, then decode back
                content = content.encode('utf-8', errors='ignore').decode('utf-8')

                if not content or len(content) < 50:
                    return None

                # Jina returns markdown with title on first line
                lines = content.split("\n")
                title = parsed.netloc

                # Try to extract title from first heading
                for line in lines[:5]:
                    if line.startswith("# "):
                        title = line[2:].strip()
                        break
                    elif line.startswith("Title:"):
                        title = line[6:].strip()
                        break

                text = self._clean_text(content)

                return {
                    "title": title,
                    "content": content,
                    "text": text,
                    "url": url,
                    "word_count": len(text.split()),
                }

        except Exception as e:
            logger.warning(f"Jina Reader error: {e}")
            raise

    async def _scrape_direct(self, url: str, parsed) -> dict:
        """Direct scraping with httpx + BeautifulSoup."""
        try:
            # Fetch the page
            response = await self.http_client.get(url)
            response.raise_for_status()

            # Parse HTML
            soup = BeautifulSoup(response.text, "html.parser")

            # Extract title
            title = None
            if soup.title:
                title = soup.title.string
            if not title:
                # Try Open Graph title
                og_title = soup.find("meta", property="og:title")
                if og_title:
                    title = og_title.get("content")
            if not title:
                title = parsed.netloc

            # Remove unwanted elements
            for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
                element.decompose()

            # Extract main content
            # Try to find main content area
            main_content = None
            for selector in ["article", "main", '[role="main"]', ".content", "#content"]:
                main_content = soup.select_one(selector)
                if main_content:
                    break

            if main_content:
                text = main_content.get_text(separator="\n", strip=True)
            else:
                # Fallback to body
                body = soup.find("body")
                text = body.get_text(separator="\n", strip=True) if body else ""

            # Clean up the text
            text = self._clean_text(text)

            # Also get markdown-like content
            content = self._html_to_markdown(soup)

            return {
                "title": str(title).strip() if title else parsed.netloc,
                "content": content or text,
                "text": text,
                "url": url,
                "word_count": len(text.split()),
            }

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error scraping URL {url}: {e}")
            raise ValueError(f"Failed to fetch URL: HTTP {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Request error scraping URL {url}: {e}")
            raise ValueError(f"Failed to fetch URL: {str(e)}")
        except Exception as e:
            logger.error(f"Error scraping URL {url}: {e}")
            raise ValueError(f"Failed to scrape URL: {str(e)}")

    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        # Normalize whitespace
        text = re.sub(r"\r\n", "\n", text)
        text = re.sub(r"\r", "\n", text)

        # Remove excessive blank lines
        text = re.sub(r"\n{3,}", "\n\n", text)

        # Remove excessive spaces
        text = re.sub(r"[ \t]{2,}", " ", text)

        # Strip lines
        lines = [line.strip() for line in text.split("\n")]
        text = "\n".join(lines)

        return text.strip()

    def _html_to_markdown(self, soup: BeautifulSoup) -> str:
        """
        Convert HTML to simple markdown-like format.

        This is a basic implementation - for production use markdownify.
        """
        result = []

        # Find main content
        main_content = None
        for selector in ["article", "main", '[role="main"]', ".content", "#content"]:
            main_content = soup.select_one(selector)
            if main_content:
                break

        if not main_content:
            main_content = soup.find("body") or soup

        # Process headings and paragraphs
        for element in main_content.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li"]):
            text = element.get_text(strip=True)
            if not text:
                continue

            if element.name == "h1":
                result.append(f"# {text}\n")
            elif element.name == "h2":
                result.append(f"## {text}\n")
            elif element.name == "h3":
                result.append(f"### {text}\n")
            elif element.name in ("h4", "h5", "h6"):
                result.append(f"#### {text}\n")
            elif element.name == "li":
                result.append(f"- {text}")
            else:
                result.append(f"{text}\n")

        return "\n".join(result)

    async def close(self):
        """Close the HTTP client."""
        await self.http_client.aclose()


# Singleton instance
sources_service = SourcesService()
