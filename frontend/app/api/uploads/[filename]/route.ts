import { NextRequest, NextResponse } from "next/server";

function guessContentType(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

function buildFileHeaders(filename: string, contentType: string) {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (contentType === "application/pdf") {
    headers["Content-Disposition"] = `inline; filename="${filename}"`;
  }

  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!filename) {
    return new NextResponse("Filename is required", { status: 400 });
  }

  // Determine the backend URL
  // Priority: API_BASE_URL (server-side env) -> NEXT_PUBLIC_API_BASE_URL -> fallback
  let apiBaseUrl =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:4000/back-api";

  // If it's a relative URL, assume it's on localhost:4000 (common dev setup)
  if (apiBaseUrl.startsWith("/")) {
    apiBaseUrl = `http://localhost:4000${apiBaseUrl}`;
  }

  // Strip a trailing slash so we don't build "//uploads".
  apiBaseUrl = apiBaseUrl.replace(/\/+$/, "");
  const backendRoot = apiBaseUrl.replace(/\/back-api$/, "");

  // Build every plausible location the file could be served from. The backend
  // mounts these dirs both at the root (direct-to-backend, dev) and under
  // /back-api (through the production reverse proxy), so try all of them and
  // use the first that responds. This keeps the proxy working regardless of
  // how the backend is exposed in a given environment.
  const encoded = encodeURIComponent(filename);
  const candidates = [
    `${apiBaseUrl}/uploads/${encoded}`,
    `${apiBaseUrl}/filedata/${encoded}`,
    `${backendRoot}/uploads/${encoded}`,
    `${backendRoot}/filedata/${encoded}`,
  ];
  // De-duplicate (backendRoot === apiBaseUrl when there is no /back-api suffix).
  const urls = [...new Set(candidates)];

  let lastError: unknown = null;
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.arrayBuffer();
      const contentType =
        response.headers.get("content-type") || guessContentType(filename);

      return new NextResponse(data, {
        headers: buildFileHeaders(filename, contentType),
      });
    } catch (error) {
      // Network error against this candidate (e.g. wrong port) — keep trying.
      lastError = error;
    }
  }

  if (lastError) {
    console.error("Error streaming image:", lastError, "tried:", urls);
    return new NextResponse("Error fetching image", { status: 502 });
  }
  return new NextResponse("Image not found", { status: 404 });
}
