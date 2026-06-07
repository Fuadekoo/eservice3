import { NextRequest, NextResponse } from "next/server";

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
        filedataResponse.headers.get("content-type") || "image/jpeg";

      return new NextResponse(data, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const data = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error streaming image:", error);
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
