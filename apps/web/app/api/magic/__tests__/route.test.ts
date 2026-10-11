import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as useMagic } from "../use/route";
import { GET as checkMagic } from "../check/route";

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
  
  // Make the chainable object itself thenable so `await ...update().eq()` resolves successfully
  chainable.then = function (resolve: any) {
    resolve({ data: null, error: null });
  };

  return {
    auth: vi.fn(),
    mockFrom: vi.fn().mockReturnValue(chainable),
    mockEq: chainable.eq,
    mockSingle: chainable.single,
    mockMaybeSingle: chainable.maybeSingle,
    mockRpc: vi.fn(),
  };
});

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    from: mocks.mockFrom,
    rpc: mocks.mockRpc,
  },
}));

// Provide destructured access for the tests
const { mockEq, mockSingle, mockMaybeSingle, mockRpc } = mocks;

describe("Magic API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: null });
  });

  describe("GET /api/magic/check", () => {
    it("should return 401 if API key is missing", async () => {
      const req = new NextRequest("http://localhost/api/magic/check");
      const res = await checkMagic(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe("sign_in_required");
    });

    it("should return success if API key is valid", async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: { user_id: "user_123" }, error: null });

      const req = new NextRequest("http://localhost/api/magic/check", {
        headers: {
          Authorization: "Bearer valid-key",
        },
      });
      const res = await checkMagic(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(mockEq).toHaveBeenCalledWith("key", "valid-key");
      expect(mockEq).toHaveBeenCalledWith("is_active", true);
    });
  });

  describe("POST /api/magic/use", () => {
    it("should return 401 if API key is missing", async () => {
      const req = new NextRequest("http://localhost/api/magic/use");
      const res = await useMagic(req);
      expect(res.status).toBe(401);
    });

    it("should deduct usage if within limits", async () => {
      // Mock api_keys table check
      mockSingle.mockResolvedValueOnce({ data: { id: "key_1", user_id: "user_123", requests_count: 5 }, error: null });
      // Mock rate limit RPC
      mockRpc.mockResolvedValueOnce({ data: true, error: null });
      // Mock increment RPC
      mockRpc.mockResolvedValueOnce({ data: { success: true, remaining: 4, usage: 6, limit: 10 }, error: null });

      const req = new NextRequest("http://localhost/api/magic/use?apikey=valid-key");
      const res = await useMagic(req);
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

      const req = new NextRequest("http://localhost/api/magic/use?apikey=valid-key");
      const res = await useMagic(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toBe("Usage limit exceeded");
    });
  });
});
