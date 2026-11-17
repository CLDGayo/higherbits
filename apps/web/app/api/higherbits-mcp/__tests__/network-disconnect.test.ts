/**
 * network-disconnect.test.ts
 *
 * This test proves only the actual route exports over a synthetic loopback HTTP bridge,
 * not Next.js/Clerk runtime.
 */

import http from "node:http";
import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from "../route";

// Mock only the API-key check handler and first-party data handlers with deterministic synthetic responses.
// Do not mock @higherbits-dev/cli/http or the MCP SDK transport.
vi.mock("@/app/api/higherbits-mcp/check/route", () => ({
  GET: vi.fn(async () => {
    return new Response(
      JSON.stringify({ ok: true, user: { id: "synthetic-test-user" } }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }),
}));

vi.mock("@/app/api/search/route", () => ({
  POST: vi.fn(async () => {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
}));

vi.mock("@/app/api/mcp/component-source/route", () => ({
  POST: vi.fn(async () => {
    return new Response(JSON.stringify({ source: "" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
}));

describe("actual route exports over synthetic loopback HTTP bridge (not Next.js/Clerk runtime)", () => {
  let server: http.Server | undefined;

  afterEach(async () => {
    if (server && server.listening) {
      await new Promise<void>((resolve) => {
        server!.close(() => resolve());
      });
    }
    server = undefined;
  });

  it("proves only the actual route exports over a synthetic loopback HTTP bridge, not Next.js/Clerk runtime: handles network disconnect gracefully", async () => {
    const BOUNDED_TIMEOUT_MS = 5000;

    let serverSocketClosed = false;
    let resolveServerSocketClosed!: () => void;
    const serverSocketClosePromise = new Promise<void>((resolve) => {
      resolveServerSocketClosed = () => {
        serverSocketClosed = true;
        resolve();
      };
    });

    let requestSignalAborted = false;
    let resolveRequestSignalAborted!: () => void;
    const requestSignalAbortPromise = new Promise<void>((resolve) => {
      resolveRequestSignalAborted = () => {
        requestSignalAborted = true;
        resolve();
      };
    });

    let readerCancelled = false;
    let resolveReaderCancelled!: () => void;
    const readerCancellationPromise = new Promise<void>((resolve) => {
      resolveReaderCancelled = () => {
        readerCancelled = true;
        resolve();
      };
    });

    const clientAbortController = new AbortController();
    let clientAborted = false;
    let resolveClientAborted!: () => void;
    const clientAbortPromise = new Promise<void>((resolve) => {
      resolveClientAborted = () => {
        clientAborted = true;
        resolve();
      };
    });

    clientAbortController.signal.addEventListener(
      "abort",
      () => {
        resolveClientAborted();
      },
      { once: true },
    );

    try {
      server = http.createServer(async (nodeReq, nodeRes) => {
        const socket = nodeReq.socket || nodeRes.socket;

        // Pass a Request AbortSignal that is aborted when the server response socket closes
        const requestAbortController = new AbortController();
        requestAbortController.signal.addEventListener(
          "abort",
          () => {
            resolveRequestSignalAborted();
          },
          { once: true },
        );

        let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
        let cancelInitiated = false;

        const cancelReader = async () => {
          if (cancelInitiated) return;
          cancelInitiated = true;
          if (reader) {
            try {
              await reader.cancel();
            } catch {
              // Expected when stream cancels
            }
            resolveReaderCancelled();
          }
        };

        const onSocketClose = () => {
          resolveServerSocketClosed();
          if (!requestAbortController.signal.aborted) {
            requestAbortController.abort();
          }
          void cancelReader();
        };

        socket?.on("close", onSocketClose);
        nodeRes.on("close", onSocketClose);

        // Adapt Node request to Web Request
        const host = nodeReq.headers.host || `127.0.0.1:${port}`;
        const url = `http://${host}${nodeReq.url || "/"}`;

        const headers = new Headers();
        for (const [key, value] of Object.entries(nodeReq.headers)) {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              for (const v of value) headers.append(key, v);
            } else {
              headers.set(key, value);
            }
          }
        }

        const webRequest = new Request(url, {
          method: nodeReq.method || "GET",
          headers,
          signal: requestAbortController.signal,
        });

        // Call the actual GET export from ../route
        const webResponse = await GET(webRequest);

        // Adapt Web Response to Node response
        nodeRes.statusCode = webResponse.status;
        webResponse.headers.forEach((value, key) => {
          nodeRes.setHeader(key, value);
        });

        if (webResponse.body) {
          reader = webResponse.body.getReader();

          if (cancelInitiated || socket?.destroyed || nodeRes.destroyed) {
            try {
              await reader.cancel();
            } catch {
              // Handled
            }
            resolveReaderCancelled();
          } else {
            nodeRes.flushHeaders();

            // Pump the stream to Node response
            (async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) {
                    if (!nodeRes.writableEnded) {
                      nodeRes.end();
                    }
                    break;
                  }
                  if (!nodeRes.writableEnded && !nodeRes.destroyed) {
                    nodeRes.write(value);
                  }
                }
              } catch {
                // Stream read ended or reader cancelled
              }
            })();
          }
        } else {
          nodeRes.end();
          resolveReaderCancelled();
        }
      });

      // Bind only to 127.0.0.1 on an ephemeral port
      await new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => reject(error);
        server!.once("error", onError);
        server!.listen(0, "127.0.0.1", () => {
          server!.off("error", onError);
          resolve();
        });
      });

      const address = server.address();
      const port =
        typeof address === "object" && address !== null ? address.port : 0;

      // Client connects, then triggers abort/disconnect upon receiving response
      const clientReq = http.request({
        hostname: "127.0.0.1",
        port,
        path: "/api/higherbits-mcp",
        method: "GET",
        headers: {
          authorization: "Bearer test-synthetic-api-key-12345",
          accept: "text/event-stream",
          connection: "close",
        },
        signal: clientAbortController.signal,
      });

      let clientDisconnected = false;
      const triggerClientDisconnect = () => {
        if (clientDisconnected) return;
        clientDisconnected = true;
        clientAbortController.abort();
        clientReq.destroy();
      };

      clientReq.on("response", (clientRes) => {
        // Trigger abort and close socket on receipt of response headers
        triggerClientDisconnect();
        clientRes.destroy();
      });

      clientReq.on("error", () => {
        // Expected client abort error
      });

      clientReq.end();

      // Assert client abort, server close, request signal abort, and reader cancellation all complete within bounded timeout
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              `Bounded timeout of ${BOUNDED_TIMEOUT_MS}ms exceeded waiting for disconnect lifecycle`,
            ),
          );
        }, BOUNDED_TIMEOUT_MS);
      });

      try {
        await Promise.race([
          Promise.all([
            clientAbortPromise,
            serverSocketClosePromise,
            requestSignalAbortPromise,
            readerCancellationPromise,
          ]),
          timeoutPromise,
        ]);
      } finally {
        clearTimeout(timeoutId!);
      }

      expect(clientAbortController.signal.aborted).toBe(true);
      expect(clientAborted).toBe(true);
      expect(serverSocketClosed).toBe(true);
      expect(requestSignalAborted).toBe(true);
      expect(readerCancelled).toBe(true);
    } finally {
      if (server && server.listening) {
        await new Promise<void>((resolve) => {
          server!.close(() => resolve());
        });
        server = undefined;
      }
    }
  });
});
