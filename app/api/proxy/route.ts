import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const headerParam = req.nextUrl.searchParams.get("headers");
  
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }
  
  let customHeaders: Record<string, string> = {
    "User-Agent": "node",
    "Accept": "*/*"
  };

  try {
    if (headerParam) {
      customHeaders = JSON.parse(headerParam);
    }
  } catch(e) {
    console.error("Failed to parse headers", e);
  }

  const clientRange = req.headers.get("Range");
  if (clientRange) {
    customHeaders["Range"] = clientRange;
  }
  
  // NOTE: Skipping SSRF protection per user request

  try {
    const upstreamRes = await fetch(url, {
      headers: customHeaders,
      redirect: 'follow',
      // We don't cache this fetch directly, let Next.js or browser handle caching
      cache: 'no-store' 
    });

    if (!upstreamRes.ok && upstreamRes.status >= 400) {
      return new NextResponse(`Proxy upstream failed with ${upstreamRes.status}. URL: ${url}`, { status: upstreamRes.status });
    }

    const contentType = upstreamRes.headers.get("content-type") || "";

    // If it's an m3u8 playlist, we need to rewrite it
    if (contentType.includes("mpegurl") || url.includes(".m3u8")) {
      const text = await upstreamRes.text();
      const baseUrl = new URL(url);
      const basePath = url.substring(0, url.lastIndexOf('/') + 1);
      
      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('#')) return line;
        let absoluteUrl = trimmed;
        if (!trimmed.startsWith('http')) {
          if (trimmed.startsWith('//')) absoluteUrl = baseUrl.protocol + trimmed;
          else if (trimmed.startsWith('/')) absoluteUrl = baseUrl.origin + trimmed;
          else absoluteUrl = basePath + trimmed;
        }
        return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}&headers=${encodeURIComponent(headerParam || '')}`;
      }).join('\n');
      
      return new NextResponse(rewritten, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        }
      });
    }

    // For video streams and other binary files, stream directly
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType || "video/MP2T");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Cache-Control", "public, max-age=31536000");

    // Forward important headers from upstream
    const contentRange = upstreamRes.headers.get("Content-Range");
    if (contentRange) responseHeaders.set("Content-Range", contentRange);
    
    const contentLength = upstreamRes.headers.get("Content-Length");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);

    const acceptRanges = upstreamRes.headers.get("Accept-Ranges");
    if (acceptRanges) responseHeaders.set("Accept-Ranges", acceptRanges);

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("Proxy error:", err);
    return new NextResponse(err.message, { status: 500 });
  }
}
