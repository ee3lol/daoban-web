import { NextRequest, NextResponse } from "next/server";
import https from "https";

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
  
  console.log("PROXY URL:", url);
  console.log("PROXY HEADERS:", customHeaders);

  return new Promise<Response>((resolve) => {
    https.get(url, { headers: customHeaders }, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        resolve(new NextResponse(`Proxy upstream failed with ${res.statusCode}. URL: ${url}`, { status: res.statusCode }));
        return;
      }

      const contentType = res.headers["content-type"] || "";
      let bodyData = Buffer.alloc(0);

      res.on("data", (chunk) => {
        bodyData = Buffer.concat([bodyData, chunk]);
      });

      res.on("end", () => {
        if (contentType.includes("mpegurl") || url.includes(".m3u8")) {
          const text = bodyData.toString('utf8');
          const finalUrl = res.url || url; // Native https might not track redirect url easily if it doesn't follow redirects, but assuming no redirect for this specific URL. Wait, https.get does NOT follow redirects!
          // Actually, if we need redirects we should handle them, but let's try raw first
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
          
          resolve(new NextResponse(rewritten, {
            headers: {
              "Content-Type": "application/vnd.apple.mpegurl",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-store",
            }
          }));
        } else {
          resolve(new NextResponse(bodyData, {
            headers: {
              "Content-Type": contentType || "video/MP2T",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=31536000",
            }
          }));
        }
      });
    }).on("error", (err) => {
      resolve(new NextResponse(err.message, { status: 500 }));
    });
  });
}
