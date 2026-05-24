#!/usr/bin/env python3
"""
Web Content Download - 网页内容下载器

Extracts clean Markdown content from any web page and downloads images locally.
Supports anti-scraping protection (Cloudflare, WeChat MP, etc.).

Usage:
    python3 web_content_download.py <url> [max_chars] [--download-images] [--output-dir ./images]

Examples:
    python3 web_content_download.py "https://mp.weixin.qq.com/s/xxx"
    python3 web_content_download.py "https://example.com/article" 15000 --download-images
    python3 web_content_download.py "https://mp.weixin.qq.com/s/xxx" 30000 --download-images --output-dir ./imgs
"""

import sys
import os
import re
import hashlib
from urllib.parse import urljoin, urlparse, unquote
from scrapling import Fetcher
import html2text

# Try to import requests for image downloading
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False


def sanitize_filename(name: str, max_len: int = 50) -> str:
    """Sanitize string for use as filename."""
    # Remove invalid chars
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    # Replace spaces with underscores
    name = name.replace(' ', '_')
    # Replace other problematic chars
    name = name.replace('/', '_')
    name = name.replace('\\', '_')
    # Limit length
    if len(name) > max_len:
        name = name[:max_len]
    return name


def sanitize_title_for_dir(title: str, max_len: int = 80) -> str:
    """Sanitize page title for use as directory name."""
    # Remove invalid chars for directory names
    name = re.sub(r'[<>:"|?*]', '', title)
    name = name.replace('/', '_')
    name = name.replace('\\', '_')
    # Replace multiple spaces with single space
    name = re.sub(r'\s+', ' ', name)
    name = name.strip()
    # Limit length
    if len(name) > max_len:
        name = name[:max_len]
    return name


def download_image(url: str, output_dir: str, index: int, referer: str = None) -> dict:
    """
    Download an image and return info dict.
    
    Args:
        url: Image URL
        output_dir: Directory to save images
        index: Image index for naming
        referer: Referer header for anti-hotlinking
    
    Returns:
        dict with original_url, local_path, filename, success
    """
    result = {
        'original_url': url,
        'local_path': url,  # Default to original URL if download fails
        'filename': '',
        'success': False
    }
    
    if not HAS_REQUESTS:
        return result
    
    try:
        # Create output directory if not exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate filename from URL
        parsed = urlparse(url)
        path_parts = parsed.path.split('/')
        original_name = path_parts[-1] if path_parts else f'image_{index}'
        
        # Get extension
        ext = os.path.splitext(original_name)[1]
        if not ext or len(ext) > 10 or not re.match(r'\.[a-zA-Z0-9]+$', ext):
            # Try to get from content type or default to jpg
            ext = '.jpg'
        
        # Use index for sequential naming
        filename = f"img_{index:03d}{ext}"
        filepath = os.path.join(output_dir, filename)
        
        # Download with headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        }
        if referer:
            headers['Referer'] = referer
        
        response = requests.get(url, headers=headers, timeout=30, stream=True)
        response.raise_for_status()
        
        # Save file
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        result['local_path'] = filepath
        result['filename'] = filename
        result['success'] = True
        
        return result
        
    except Exception as e:
        print(f"# Warning: Failed to download {url}: {e}", file=sys.stderr)
        return result


def extract_title(response) -> str:
    """Extract page title from response."""
    # Try <title> tag first
    title_el = response.css('title')
    if title_el and len(title_el) > 0:
        title = title_el[0].get_all_text().strip()
        if title:
            return title
    
    # Try <h1> tag
    h1_el = response.css('h1')
    if h1_el and len(h1_el) > 0:
        title = h1_el[0].get_all_text().strip()
        if title:
            return title
    
    # Try meta og:title
    og_title = response.css('meta[property="og:title"]')
    if og_title and len(og_title) > 0:
        content = og_title[0].attrib.get('content', '')
        if content:
            return content
    
    return ''


def extract_content(url: str, max_chars: int = 30000, download_images: bool = False, 
                    output_dir: str = None, verbose: bool = True) -> str:
    """
    Extract clean Markdown content from a URL.
    
    Args:
        url: The URL to fetch
        max_chars: Maximum characters to return (default: 30000)
        download_images: Whether to download images locally (default: False)
        output_dir: Directory to save images (default: ./images)
        verbose: Print status messages (default: True)
    
    Returns:
        Clean Markdown content with image paths/URLs
    """
    if output_dir is None:
        output_dir = './images'
    
    # Initialize Fetcher
    fetcher = Fetcher()
    
    # Fetch the page
    if verbose:
        print(f"# Fetching: {url}", file=sys.stderr)
    
    try:
        response = fetcher.get(url, timeout=30, verify=False)
    except Exception as e:
        return f"Error: Failed to fetch {url}: {e}"
    
    if not response:
        return f"Error: Failed to fetch content from {url}"
    
    if verbose:
        print(f"# Status: {response.status} - {len(response.html_content)} bytes", file=sys.stderr)
    
    # Extract page title
    page_title = extract_title(response)
    if verbose and page_title:
        print(f"# Title: {page_title}", file=sys.stderr)
    
    # Get HTML content from response
    html_content = getattr(response, 'html_content', None)
    if not html_content:
        return f"Error: No content returned from {url}"
    
    # Priority-based content selection
    selectors = [
        '#js_content',         # WeChat MP
        '.rich_media_content', # WeChat MP
        'article',
        'main',
        '.post-content',
        '.article-body',
        '#content',
        '[class*="body"]',
        '[class*="article"]',
        '[class*="post"]',
        '[class*="content"]',
    ]
    
    content_element = None
    for selector in selectors:
        element = response.css(selector)
        if element and len(element) > 0:
            content_element = element.first
            if verbose:
                print(f"# Found content with selector: {selector}", file=sys.stderr)
            break
    
    # Fallback to full page
    if not content_element:
        content_element = response.css('body').first
        if not content_element:
            content_element = response
    
    # Get HTML content from element
    if content_element and hasattr(content_element, 'html_content'):
        html_content = content_element.html_content
    
    # If downloading images, process them first
    img_map = {}  # original_url -> local_path
    if download_images:
        if verbose:
            print(f"# Downloading images to: {output_dir}", file=sys.stderr)
        
        # Extract image URLs from HTML (check both src and data-src for WeChat MP)
        img_pattern = r'<img[^>]+(?:data-)?src=["\']([^"\']+)["\']'
        img_urls = re.findall(img_pattern, html_content)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_imgs = []
        for img_url in img_urls:
            img_url = urljoin(url, img_url)
            if img_url not in seen:
                seen.add(img_url)
                unique_imgs.append(img_url)
        
        if verbose:
            print(f"# Found {len(unique_imgs)} unique images", file=sys.stderr)
        
        # Download images and build mapping
        for i, img_url in enumerate(unique_imgs, 1):
            result = download_image(img_url, output_dir, i, referer=url)
            if result['success']:
                # Use relative path for markdown reference
                img_map[img_url] = f"./images/{result['filename']}"
                if verbose:
                    print(f"# Downloaded [{i}/{len(unique_imgs)}]: {result['filename']} ({os.path.getsize(result['local_path']) / 1024:.1f}KB)", file=sys.stderr)
        
        # Replace image tags in HTML with Markdown syntax BEFORE converting
        if img_map:
            def replace_img_tag(match):
                full_tag = match.group(0)
                # Extract alt text if available
                alt_match = re.search(r'alt=["\']([^"\']*)["\']', full_tag)
                alt = alt_match.group(1) if alt_match else ''
                
                # Find the src (either src or data-src)
                src_match = re.search(r'(?:data-)?src=["\']([^"\']+)["\']', full_tag)
                if src_match:
                    original_url = src_match.group(1)
                    local_path = img_map.get(original_url, original_url)
                    return f'![{alt}]({local_path})'
                return full_tag
            
            html_content = re.sub(r'<img[^>]*>', replace_img_tag, html_content)

    # Strip inline numbering prefixes from <li> elements to prevent duplicate
    # numbering when html2text converts <ol> (e.g., "1. xxx" inside <li> + html2text's
    # "1." → "1. 1. xxx").
    # The numbering pattern inside <li> can appear after wrapper tags like
    # <section><span>, so we strip it from the leading text of each <li>.
    _li_num_re = re.compile(
        r'<li\b([^>]*)>',
        re.IGNORECASE
    )
    _inline_num_re = re.compile(
        r'^(\s*(?:<[^>]+>\s*)*?)'  # capture leading whitespace + opening wrapper tags
        r'(?:'
        r'(?<=\d)[\.、\)\]]\s*'    # after a digit: . 、 ) ] space
        r'|(?<=\d)'                 # or the digit itself at start
        r')'
        r'|'
        r'^(\s*(?:<[^>]+>\s*)*?)'  # leading whitespace + opening wrapper tags
        r'(?:'
        r'\d+[\.、\)\]]\s*'        # 1. 1、 1) 1]
        r'|[一二三四五六七八九十百零]+[\.、\)\]]\s*'  # 一、 二.
        r'|[①②③④⑤⑥⑦⑧⑨⑩]\s*'  # ① ②
        r'|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ][\.、\)]\s*'  # Ⅰ. Ⅱ.
        r'|[•·・]\s*'              # bullet points
        r')',
        re.DOTALL
    )

    def _strip_li_inline(html_content: str) -> str:
        """Remove inline numbering from <li> content to avoid duplication with <ol> numbering."""
        result = []
        pos = 0
        for m in _li_num_re.finditer(html_content):
            li_start = m.start()
            result.append(html_content[pos:li_start])

            li_tag = m.group(0)  # e.g., "<li>" or "<li style='...'>"

            # Find the closing </li>
            close_tag = r'</li>'
            close_match = re.search(close_tag, html_content[m.end():], re.IGNORECASE)
            if not close_match:
                result.append(li_tag)
                pos = m.end()
                continue

            inner_end = m.end() + close_match.start()
            inner = html_content[m.end():inner_end]

            # Strip inline numbering prefix from inner content
            # Match: optional leading whitespace + wrapper open tags + numbering pattern
            stripped = re.sub(
                r'^(\s*(?:<[a-z][^>]*>\s*)*?)'  # leading whitespace + wrapper open tags
                r'(?:'
                r'\d+[\.、\)\]]\s*'           # 1. 1、 1) 1]
                r'|[一二三四五六七八九十百零]+[\.、\)\]]\s*'  # 一、 二.
                r'|[①②③④⑤⑥⑦⑧⑨⑩]\s*'     # ① ②
                r'|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ][\.、\)]\s*'  # Ⅰ. Ⅱ.
                r'|[•·・]\s*'                # bullet
                r')',
                r'\1',
                inner,
                count=1,
                flags=re.DOTALL
            )

            result.append(li_tag)
            result.append(stripped)
            pos = inner_end

        result.append(html_content[pos:])
        return ''.join(result)

    html_content = _strip_li_inline(html_content)

    # Convert HTML to Markdown
    h = html2text.HTML2Text()
    h.ignore_links = False
    h.ignore_images = True  # We already handled images
    h.ignore_emphasis = False
    h.body_width = 0
    h.escape_snob = True
    h.mark_code = True
    
    markdown = h.handle(html_content)
    
    # Unescape markdown image syntax (html2text escapes special chars)
    if download_images:
        # Simple approach: remove all backslashes that are escaping markdown chars
        markdown = markdown.replace('\\', '')
    
    # Add page title as H1 at the beginning if available
    if page_title:
        markdown = f"# {page_title}\n\n{markdown}"
    
    # Truncate if needed
    if len(markdown) > max_chars:
        markdown = markdown[:max_chars] + "\n\n[... content truncated ...]"
    
    return markdown


def download_to_file(url: str, output_base: str = None, max_chars: int = 50000, 
                     download_images: bool = True, verbose: bool = True) -> dict:
    """
    Download web page content to a directory named after the page title.
    
    Args:
        url: URL to fetch
        output_base: Base directory for output (default: ./downloads)
        max_chars: Maximum characters for content
        download_images: Whether to download images
        verbose: Print status messages
    
    Returns:
        dict with output_dir, markdown_file, images_dir
    """
    if output_base is None:
        output_base = '/Users/onlyone/ai_zhushou/data/web-content-download'
    
    # First fetch to get title
    fetcher = Fetcher()
    if verbose:
        print(f"# Fetching: {url}", file=sys.stderr)
    
    response = fetcher.get(url, timeout=30, verify=False)
    page_title = extract_title(response)
    
    if not page_title:
        page_title = "untitled"
    
    # Create output directory with sanitized title
    safe_title = sanitize_title_for_dir(page_title)
    timestamp = __import__('datetime').datetime.now().strftime("%Y-%m-%d")
    output_dir = os.path.join(output_base, f"{timestamp}_{safe_title}")
    images_dir = os.path.join(output_dir, "images")
    markdown_file = os.path.join(output_dir, "article.md")
    
    # Create directories
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(images_dir, exist_ok=True)
    
    if verbose:
        print(f"# Output directory: {output_dir}", file=sys.stderr)
        print(f"# Title: {page_title}", file=sys.stderr)
    
    # Extract content with images
    content = extract_content(
        url=url,
        max_chars=max_chars,
        download_images=download_images,
        output_dir=images_dir,
        verbose=verbose
    )
    
    # Write markdown file
    # Fix escaped newlines from html2text output
    content = content.replace('\\n\\n', '\n\n').replace('\\n', '\n').replace('\\u2028', '\n')
    with open(markdown_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    if verbose:
        print(f"# Saved: {markdown_file}", file=sys.stderr)
        if download_images:
            img_count = len([f for f in os.listdir(images_dir) if f.endswith(('.jpg', '.png', '.gif', '.webp'))])
            print(f"# Downloaded {img_count} images to: {images_dir}", file=sys.stderr)
    
    return {
        'output_dir': output_dir,
        'markdown_file': markdown_file,
        'images_dir': images_dir,
        'title': page_title
    }


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Download web page content as Markdown with optional images',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Quick download (auto-saves to ./downloads/<title>_<timestamp>/)
  %(prog)s "https://mp.weixin.qq.com/s/xxx" --save
  
  # Download with custom output base
  %(prog)s "https://example.com" --save --output-base ./my_downloads
  
  # Legacy mode (output to stdout)
  %(prog)s "https://example.com/article" 15000
  %(prog)s "https://example.com" 30000 --download-images --output-dir ./imgs
        '''
    )
    
    parser.add_argument('url', help='URL to fetch')
    parser.add_argument('max_chars', nargs='?', type=int, default=50000,
                        help='Maximum characters (default: 50000)')
    parser.add_argument('--download-images', '-i', action='store_true',
                        help='Download images locally')
    parser.add_argument('--output-dir', '-o', default='./images',
                        help='Output directory for images (default: ./images)')
    parser.add_argument('--output-base', '-b', default='/Users/onlyone/ai_zhushou/data/web-content-download',
                        help='Base directory for auto-save (default: /Users/onlyone/ai_zhushou/data/web-content-download)')
    parser.add_argument('--save', '-s', action='store_true', default=True,
                        help='Auto-save to ./downloads/<title>_<timestamp>/ (default: True)')
    parser.add_argument('--no-images', action='store_true',
                        help='Skip image downloading')
    parser.add_argument('--quiet', '-q', action='store_true',
                        help='Suppress status messages')
    
    args = parser.parse_args()
    
    try:
        if args.save:
            # Auto-save mode: create directory with title, save markdown and images
            result = download_to_file(
                url=args.url,
                output_base=args.output_base,
                max_chars=args.max_chars,
                download_images=not args.no_images,
                verbose=not args.quiet
            )
            print(f"Downloaded to: {result['output_dir']}")
        else:
            # Legacy mode: output to stdout
            content = extract_content(
                url=args.url,
                max_chars=args.max_chars,
                download_images=args.download_images,
                output_dir=args.output_dir,
                verbose=not args.quiet
            )
            sys.stdout.write(content)
            sys.stdout.flush()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
