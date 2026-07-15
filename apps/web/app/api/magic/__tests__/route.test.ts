import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as useMagic } from "../use/route";
import { GET as checkMagic } from "../check/route";

const mocks = vi.hoisted(() => {
  const chainable: any = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
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
    mockFrom: vi.fn().mockReturnValue(chainable),
    mockSelect: chainable.select,
    mockEq: chainable.eq,
    mockSingle: chainable.single,
    mockUpdate: chainable.update,
    mockInsert: chainable.insert,
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
  },
}));

// Provide destructured access for the tests
const { mockFrom, mockSelect, mockEq, mockSingle, mockUpdate, mockInsert } = mocks;

describe("Magic API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/magic/check", () => {
    it("should return 401 if API key is missing", async () => {
      const req = new NextRequest("http://localhost/api/magic/check");
      const res = await checkMagic(req);
      expect(res.status).toBe(401);
    });

    it("should return success if API key is valid", async () => {
      mockSingle.mockResolvedValueOnce({ data: { user_id: "user_123" }, error: null });

      const req = new NextRequest("http://localhost/api/magic/check?apikey=valid-key");
      const res = await checkMagic(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
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
      // Mock usages table check
      mockSingle.mockResolvedValueOnce({ data: { usage: 5, limit: 10 }, error: null });

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
      // Mock usages table check
      mockSingle.mockResolvedValueOnce({ data: { usage: 10, limit: 10 }, error: null });

      const req = new NextRequest("http://localhost/api/magic/use?apikey=valid-key");
      const res = await useMagic(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toBe("Usage limit exceeded");
    });
  });
});
