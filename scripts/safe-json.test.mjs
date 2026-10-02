// Regression tests for lib/apiClient.mjs `readJsonSafe`.
//
// Context: WebKit (Safari on macOS/iOS, and every browser on iOS) throws
// "The string did not match the expected pattern." when `Response.json()`
// is called on an empty or non-JSON body. The production login flow hit
// exactly that string in a red error banner while the dashboard partially
// loaded. `readJsonSafe` must therefore:
//   1. never call `Response.json()` (bypasses the WebKit parser error), and
//   2. throw clear, actionable errors for empty / non-JSON bodies.
//
// Run: npm test   (node --test scripts/safe-json.test.mjs)

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readJsonSafe } from "../lib/apiClient.mjs";

function mockResponse({ status = 200, url = "/api/user/dashboard?uid=abc", body = "", contentType = "application/json" } = {}) {
  return {
    status,
    url: `https://example.com${url}`,
    headers: { get: (name) => (String(name).toLowerCase() === "content-type" ? contentType : null) },
    text: async () => body,
    json: async () => {
      throw new Error("readJsonSafe must never call Response.json()");
    },
  };
}

describe("readJsonSafe", () => {
  it("returns parsed JSON for a valid body", async () => {
    const res = mockResponse({ body: JSON.stringify({ success: true, dashboard: { role: "user" } }) });
    const data = await readJsonSafe(res);
    assert.equal(data.success, true);
    assert.equal(data.dashboard.role, "user");
  });

  it("throws a clear error (not the WebKit string) for an empty 200 body", async () => {
    const res = mockResponse({ status: 200, body: "" });
    await assert.rejects(() => readJsonSafe(res), (err) => {
      assert.match(err.message, /empty response/i);
      assert.match(err.message, /200/);
      assert.doesNotMatch(err.message, /expected pattern/);
      return true;
    });
  });

  it("throws a clear error for an empty gateway-error body", async () => {
    const res = mockResponse({ status: 502, url: "/api/user/dashboard?uid=abc", body: "" });
    await assert.rejects(() => readJsonSafe(res), (err) => {
      assert.match(err.message, /empty response/i);
      assert.match(err.message, /502/);
      assert.match(err.message, /\/api\/user\/dashboard/);
      return true;
    });
  });

  it("throws a clear error for a whitespace-only body", async () => {
    const res = mockResponse({ body: "   \n  " });
    await assert.rejects(() => readJsonSafe(res), /empty response/i);
  });

  it("throws a clear error for an HTML gateway page instead of JSON", async () => {
    const res = mockResponse({
      status: 502,
      body: "<html><body>Bad Gateway</body></html>",
      contentType: "text/html",
    });
    await assert.rejects(() => readJsonSafe(res), (err) => {
      assert.match(err.message, /Unexpected server response/i);
      assert.match(err.message, /502/);
      assert.doesNotMatch(err.message, /expected pattern/);
      return true;
    });
  });

  it("throws a clear error when the body stream itself fails", async () => {
    const res = mockResponse();
    res.text = async () => {
      throw new Error("network abort");
    };
    await assert.rejects(() => readJsonSafe(res), /failed while reading/i);
  });

  it("never surfaces the raw browser parser message", async () => {
    // Simulates a WebKit-style failure: even if the runtime's own json()
    // threw "The string did not match the expected pattern.", our helper
    // must not propagate that text because it never calls json().
    const res = mockResponse({ body: "" });
    res.json = async () => {
      throw new Error("The string did not match the expected pattern.");
    };
    await assert.rejects(() => readJsonSafe(res), (err) => {
      assert.doesNotMatch(err.message, /expected pattern/);
      return true;
    });
  });

  it("handles responses without url/headers gracefully", async () => {
    const data = await readJsonSafe({ status: 200, text: async () => '{"ok":true}' });
    assert.equal(data.ok, true);
    await assert.rejects(() => readJsonSafe({ status: 200, text: async () => "" }), /empty response/i);
  });

  it("works with real WHATWG Response objects", async () => {
    const ok = await readJsonSafe(new Response(JSON.stringify({ success: true })));
    assert.equal(ok.success, true);
    await assert.rejects(() => readJsonSafe(new Response("", { status: 200 })), /empty response/i);
    await assert.rejects(
      () => readJsonSafe(new Response("<html></html>", { status: 502, headers: { "content-type": "text/html" } })),
      /Unexpected server response/i
    );
  });
});
