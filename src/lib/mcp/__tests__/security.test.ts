import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";
import { hashKey, timingSafeCompare, escapeLike } from "../crypto";

describe("hashKey", () => {
  it("returns a hex string", () => {
    const hash = hashKey("test-key");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns consistent output for same input", () => {
    expect(hashKey("abc")).toBe(hashKey("abc"));
  });

  it("returns different output for different inputs", () => {
    expect(hashKey("abc")).not.toBe(hashKey("def"));
  });

  it("returns different output than plain SHA-256", () => {
    const plain = createHash("sha256").update("test-key").digest("hex");
    const hmac = hashKey("test-key");
    expect(hmac).not.toBe(plain);
  });
});

describe("timingSafeCompare", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeCompare("abc", "abc")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(timingSafeCompare("abc", "abd")).toBe(false);
  });

  it("returns false for different lengths without early exit", () => {
    expect(timingSafeCompare("abc", "abcdef")).toBe(false);
  });

  it("returns true for empty strings", () => {
    expect(timingSafeCompare("", "")).toBe(true);
  });

  it("pads shorter buffer — equal content after padding returns true", () => {
    const a = "abc";
    const b = "abc\0\0\0";
    expect(timingSafeCompare(a, b)).toBe(true);
  });
});

describe("escapeLike", () => {
  it("escapes percent", () => {
    expect(escapeLike("100%")).toBe("100\\%");
  });

  it("escapes underscore", () => {
    expect(escapeLike("a_b")).toBe("a\\_b");
  });

  it("escapes backslash", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
  });

  it("escapes multiple special chars", () => {
    expect(escapeLike("%_\\test")).toBe("\\%\\_\\\\test");
  });

  it("leaves normal text unchanged", () => {
    expect(escapeLike("hello world")).toBe("hello world");
  });
});

describe("rate limiter (Supabase-backed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildCheckMock(maybeSingleResult: { data: unknown; error: unknown }) {
    return {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue(maybeSingleResult),
                }),
              }),
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }),
    };
  }

  it("allows first attempt when no record exists", async () => {
    const mock = buildCheckMock({ data: null, error: null });

    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(mock as any, "test-key");

    expect(result.allowed).toBe(true);
    expect(mock.from).toHaveBeenCalledWith("rate_limits");
  });

  it("blocks after 10 attempts", async () => {
    const mock = buildCheckMock({
      data: { count: 10, window_start: new Date().toISOString() },
      error: null,
    });

    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(mock as any, "test-key");

    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThanOrEqual(0);
  });

  it("deletes record on success", async () => {
    const deleteFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mock = {
      from: vi.fn().mockReturnValue({
        delete: deleteFn,
      }),
    };

    const { recordSuccess } = await import("../rate-limit");
    await recordSuccess(mock as any, "test-key");

    expect(deleteFn).toHaveBeenCalled();
  });
});

describe("ownership checks", () => {
  it("get_todo filters main query by user_id", async () => {
    const singleFn = vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } });
    const eq2 = vi.fn().mockReturnValue({ single: singleFn });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const select = vi.fn().mockReturnValue({ eq: eq1 });
    const fromMock = vi.fn().mockReturnValue({ select });

    const mockSupabase = { from: fromMock };

    const { registerGetTodo } = await import("../tools/get-todo");
    const server = { registerTool: vi.fn() };
    registerGetTodo(server as any, { userId: "user-123", supabase: mockSupabase as any });

    const handler = server.registerTool.mock.calls[0][2];
    await handler({ id: "550e8400-e29b-41d4-a716-446655440000" });

    expect(fromMock).toHaveBeenCalledWith("todos");
  });

  it("search_todos filters by user_id", async () => {
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      }),
    });

    const mockSupabase = { from: fromMock };

    const { registerSearchTodos } = await import("../tools/search-todos");
    const server = { registerTool: vi.fn() };
    registerSearchTodos(server as any, { userId: "user-456", supabase: mockSupabase as any });

    const handler = server.registerTool.mock.calls[0][2];
    await handler({ query: "test" });

    expect(fromMock).toHaveBeenCalledWith("todos");
  });
});
