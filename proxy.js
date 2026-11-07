import { NextResponse } from "next/server";

// In-memory rate limiter (per-instance; suitable for single-node/dev deployments).
const buckets = new Map();

function getClientIp(request) {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function rateLimit(request, { key, limit, windowMs }) {
  const ip = getClientIp(request);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const entry = buckets.get(bucketKey) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  buckets.set(bucketKey, entry);
  if (entry.count > limit) {
    return new NextResponse(
      JSON.stringify({ success: false, message: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) } }
    );
  }
  return null;
}

// Path -> { limit, windowMs } rules. More specific first.
const RULES = [
  { match: (p) => p.startsWith("/api/auth/"), limit: 20, windowMs: 60_000 },
  { match: (p) => p.startsWith("/api/user/deposit"), limit: 10, windowMs: 60_000 },
  { match: (p) => p.startsWith("/api/user/withdrawal"), limit: 10, windowMs: 60_000 },
  { match: (p) => p.startsWith("/api/chat/"), limit: 60, windowMs: 60_000 },
  { match: (p) => p.startsWith("/api/admin/whatsapp/test"), limit: 5, windowMs: 60_000 },
  { match: (p) => p.startsWith("/api/"), limit: 120, windowMs: 60_000 },
];

const MAX_JSON_BYTES = 1 * 1024 * 1024; // 1 MB for JSON routes
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB for uploads

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Rate limiting
  const rule = RULES.find((r) => r.match(pathname));
  if (rule) {
    const blocked = rateLimit(request, { key: pathname.split("/").slice(0, 4).join("/"), limit: rule.limit, windowMs: rule.windowMs });
    if (blocked) return blocked;
  }

  // Body size limits
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = Number(contentLength);
    if (Number.isFinite(size)) {
      const isUpload = pathname.includes("upload") || pathname.includes("avatar");
      const max = isUpload ? MAX_UPLOAD_BYTES : MAX_JSON_BYTES;
      if (size > max) {
        return new NextResponse(
          JSON.stringify({ success: false, message: "Request body too large." }),
          { status: 413, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
