/**
 * In-process realtime hub for Server-Sent Events (SSE).
 * Works for single-instance Next.js deployments (dev + standalone).
 * For multi-instance production, replace with Redis pub/sub.
 */

const GLOBAL_KEY = "__saffron_realtime_hub__";

function getHub() {
  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = {
      /** Set of listener callbacks: (event) => void, event = { type, payload } */
      listeners: new Set(),
      seq: 0,
    };
  }
  return globalThis[GLOBAL_KEY];
}

/**
 * Publish a realtime event to all connected SSE clients.
 * @param {string} type - e.g. "chat-message", "notification", "counts-changed"
 * @param {object} payload
 */
export function publishRealtime(type, payload = {}) {
  try {
    const hub = getHub();
    hub.seq += 1;
    const event = { type, payload, seq: hub.seq, at: Date.now() };
    for (const listener of hub.listeners) {
      try {
        listener(event);
      } catch {
        // ignore faulty listener
      }
    }
  } catch {
    // never break request flow because of realtime
  }
}

/** Subscribe to realtime events. Returns unsubscribe fn. */
export function subscribeRealtime(listener) {
  const hub = getHub();
  hub.listeners.add(listener);
  return () => {
    hub.listeners.delete(listener);
  };
}

export function formatSSE({ event, data, id }) {
  let out = "";
  if (id !== undefined) out += `id: ${id}\n`;
  if (event) out += `event: ${event}\n`;
  out += `data: ${JSON.stringify(data)}\n\n`;
  return out;
}
