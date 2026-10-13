import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as useHigherBitsMcp } from "../use/route";
import { GET as checkHigherBitsMcp } from "../check/route";

const mocks = vi.hoisted(() => {
  const chainable: any = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  };

  chainable.select.mockReturnValue(chainable);
  chainable.eq.mockReturnValue(chainable);
  chainable.update.mockReturnValue(chainable);
  chainable.insert.mockReturnValue(chainable);
  chainable.maybeSingle = chainable.single;
  
  // Make the chainable object itself thenable so `await ...update().eq()` resolves successfully
  chainable.then = function (resolve: any) {
    resolve({ data: null, error: null });
  };

  return {
    mockFrom: vi.fn().mockReturnValue(chainable),
    mockSelect: chainable.select,
    mockEq: chainable.eq,
    mockSingle: chainable.single,
    mockUpdate: chainable.update,
    mockInsert: chainable.insert,
    mockRpc: vi.fn(),
    mockAuth: vi.fn(),
  };
});

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    from: mocks.mockFrom,
    select: mocks.mockSelect,
    eq: mocks.mockEq,
    single: mocks.mockSingle,
    update: mocks.mockUpdate,
    insert: mocks.mockInsert,
    rpc: mocks.mockRpc,
  },
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.mockAuth }));

// Provide destructured access for the tests
const { mockFrom, mockSelect, mockEq, mockSingle, mockUpdate, mockInsert, mockRpc } = mocks;

describe("HigherBits MCP API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockAuth.mockResolvedValue({ userId: null });
  });

  describe("GET /api/higherbits-mcp/check", () => {
    it("should return 401 if API key is missing", async () => {
      const req = new NextRequest("http://localhost/api/higherbits-mcp/check");
      const res = await checkHigherBitsMcp(req);
      expect(res.status).toBe(401);
    });

    it("should return success if API key is valid", async () => {
      mockSingle.mockResolvedValueOnce({ data: { user_id: "user_123" }, error: null });

      const req = new NextRequest("http://localhost/api/higherbits-mcp/check", {
        headers: { authorization: "Bearer valid-key" },
      });
      const res = await checkHigherBitsMcp(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(res.headers.get("cache-control")).toBe("private, no-store");
      expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    });

    it("does not accept query keys or internal middleware tokens as identity", async () => {
      const headerCases: HeadersInit[] = [{}, { "x-internal-token": "synthetic" }];
      for (const headers of headerCases) {
        const req = new NextRequest("http://localhost/api/higherbits-mcp/check?apikey=valid-key", { headers });
        const res = await checkHigherBitsMcp(req);
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({ error: "sign_in_required" });
        expect(res.headers.get("cache-control")).toBe("private, no-store");
      }
    });

    it("retains upstream header conflicts and identity failure handling", async () => {
      const conflict = await checkHigherBitsMcp(new NextRequest("http://localhost/api/higherbits-mcp/check", {
        headers: { authorization: "Bearer first", "x-api-key": "second" },
      }));
      expect(conflict.status).toBe(401);
      expect(await conflict.json()).toEqual({ error: "conflicting_identity" });
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: "private" } });
      const unavailable = await checkHigherBitsMcp(new NextRequest("http://localhost/api/higherbits-mcp/check", {
        headers: { "x-api-key": "valid-key" },
      }));
      expect(unavailable.status).toBe(503);
      expect(await unavailable.json()).toEqual({ error: "identity_unavailable" });
    });

    it("retains upstream Clerk session identity", async () => {
      mocks.mockAuth.mockResolvedValueOnce({ userId: "session-user" });
      const res = await checkHigherBitsMcp(new NextRequest("http://localhost/api/higherbits-mcp/check"));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true, message: "API key is valid and active" });
    });
  });

  describe("POST /api/higherbits-mcp/use", () => {
    it("should return 401 if API key is missing", async () => {
      const req = new NextRequest("http://localhost/api/higherbits-mcp/use");
      const res = await useHigherBitsMcp(req);
      expect(res.status).toBe(401);
    });

    it("should deduct usage if within limits", async () => {
      // Mock api_keys table check
      mockSingle.mockResolvedValueOnce({ data: { id: "key_1", user_id: "user_123", requests_count: 5 }, error: null });
      // Mock rate limit RPC
      mockRpc.mockResolvedValueOnce({ data: true, error: null });
      // Mock increment RPC
      mockRpc.mockResolvedValueOnce({ data: { success: true, remaining: 4, usage: 6, limit: 10 }, error: null });

      const req = new NextRequest("http://localhost/api/higherbits-mcp/use?apikey=valid-key");
      const res = await useHigherBitsMcp(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.remaining).toBe(4);
    });

    it("should return 403 if usage limit exceeded", async () => {
      // Mock api_keys table check
      mockSingle.mockResolvedValueOnce({ data: { id: "key_1", user_id: "user_123" }, error: null });
      // Mock rate limit RPC
      mockRpc.mockResolvedValueOnce({ data: true, error: null });
      // Mock increment RPC
      mockRpc.mockResolvedValueOnce({ data: { success: false, error: "Usage limit exceeded", usage: 10, limit: 10, remaining: 0 }, error: null });

      const req = new NextRequest("http://localhost/api/higherbits-mcp/use?apikey=valid-key");
      const res = await useHigherBitsMcp(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toBe("Usage limit exceeded");
    });
  });
});
