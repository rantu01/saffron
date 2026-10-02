// Shared client/server-safe helper for reading JSON API responses.
//
// Why this exists:
// WebKit (Safari on macOS/iOS, and every browser on iOS) throws the
// cryptic message "The string did not match the expected pattern." when
// `Response.json()` is called on an empty or non-JSON response body
// (e.g. a dropped/truncated response, an empty gateway reply, or an HTML
// error page from the hosting proxy). Other engines throw a different
// message for the same situation, so the raw parser error is both
// confusing and device-dependent.
//
// Every API route in this project returns JSON, so an empty or non-JSON
// body is always a transport-level failure. This helper detects those
// cases up front (via `text()` + explicit checks, never `json()`) and
// throws a clear, actionable error instead of leaking the
// browser-specific parser message into the UI.

function shortPath(url) {
  try {
    const parsed = new URL(String(url), "http://localhost");
    return parsed.pathname && parsed.pathname !== "/"
      ? parsed.pathname.slice(0, 80)
      : String(url).split("?")[0].slice(0, 80);
  } catch {
    return String(url || "request").split("?")[0].slice(0, 80);
  }
}

export async function readJsonSafe(res) {
  const status = res?.status ?? 0;
  const path = shortPath(res?.url || "request");

  let text = "";
  try {
    text = await res.text();
  } catch {
    throw new Error(
      `Request to ${path} failed while reading the server response (status ${status}). ` +
        "Please check your connection and try again."
    );
  }

  if (!text || !text.trim()) {
    throw new Error(
      `Server returned an empty response for ${path} (status ${status}). ` +
        "Please check your connection and try again."
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    let contentType = "unknown type";
    try {
      contentType = res?.headers?.get?.("content-type") || "unknown type";
    } catch {
      // ignore header access failures and keep the fallback label
    }
    throw new Error(
      `Unexpected server response for ${path} (status ${status}, ${contentType}). ` +
        "Please try again."
    );
  }
}
