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

  const backendUrl = apiBaseUrl.replace("/back-api", "");
  const imageUrl = `${backendUrl}/uploads/${filename}`;

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      // If not found in /uploads, try /filedata as per backend app.ts config
      const filedataUrl = `${backendUrl}/filedata/${filename}`;
      const filedataResponse = await fetch(filedataUrl);

      if (!filedataResponse.ok) {
        return new NextResponse("Image not found", { status: 404 });
      }

      const data = await filedataResponse.arrayBuffer();
      const contentType =
        filedataResponse.headers.get("content-type") ||
        guessContentType(filename);

      return new NextResponse(data, {
        headers: buildFileHeaders(filename, contentType),
      });
    }

    const data = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") || guessContentType(filename);

    return new NextResponse(data, {
      headers: buildFileHeaders(filename, contentType),
    });
  } catch (error) {
    console.error("Error streaming image:", error);
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
