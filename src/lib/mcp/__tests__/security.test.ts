import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";
import { hashKey, timingSafeCompare, escapeLike } from "../crypto";

describe("hashKey", () => {
  it("returns a 64-char hex string (HMAC-SHA256)", () => {
    expect(hashKey("test-key")).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns consistent output for same input", () => {
    expect(hashKey("abc")).toBe(hashKey("abc"));
  });

  it("returns different output for different inputs", () => {
    expect(hashKey("abc")).not.toBe(hashKey("def"));
  });

  it("returns different output than plain SHA-256 (HMAC adds key)", () => {
    const plain = createHash("sha256").update("test-key").digest("hex");
    expect(hashKey("test-key")).not.toBe(plain);
  });
});

describe("timingSafeCompare", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeCompare("abc", "abc")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(timingSafeCompare("abc", "abd")).toBe(false);
  });

  it("returns false for different lengths (padded comparison)", () => {
    expect(timingSafeCompare("abc", "abcdef")).toBe(false);
  });

  it("returns true for empty strings", () => {
    expect(timingSafeCompare("", "")).toBe(true);
  });

  it("equal content with null padding returns true (padded to same length)", () => {
    expect(timingSafeCompare("abc", "abc\0\0\0")).toBe(true);
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

describe("rate limiter (atomic RPC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows first attempt (count=1 from RPC)", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: 1, error: null }),
    };

    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(mockSupabase as any, "test-key");

    expect(result.allowed).toBe(true);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("rate_limit_check", {
      p_key: "test-key",
      p_window_ms: 60000,
    });
  });

  it("allows when count is below limit", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: 5, error: null }),
    };

    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(mockSupabase as any, "test-key");

    expect(result.allowed).toBe(true);
  });

  it("blocks when count exceeds limit (count=11 > MAX_ATTEMPTS=10)", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: 11, error: null }),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { window_start: new Date().toISOString() },
              error: null,
            }),
          }),
        }),
      }),
    };

    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(mockSupabase as any, "test-key");

    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThanOrEqual(0);
  });

  it("allows when RPC returns error (fail-open)", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "db down" } }),
    };

    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(mockSupabase as any, "test-key");

    expect(result.allowed).toBe(true);
  });

  it("deletes record on success", async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null });
    const deleteFn = vi.fn().mockReturnValue({ eq: eqFn });
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: deleteFn,
      }),
    };

    const { recordSuccess } = await import("../rate-limit");
    await recordSuccess(mockSupabase as any, "test-key");

    expect(deleteFn).toHaveBeenCalled();
    expect(eqFn).toHaveBeenCalledWith("key", "test-key");
  });
});

describe("cross-user IDOR protection", () => {
  it("get_todo returns 'not found' when user A tries to read user B's todo", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Row not found" },
    });
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      }),
    };

    const { registerGetTodo } = await import("../tools/get-todo");
    const server = { registerTool: vi.fn() };
    registerGetTodo(server as any, { userId: "user-A", supabase: mockSupabase as any });

    const handler = server.registerTool.mock.calls[0][2];
    const result = await handler({ id: "550e8400-e29b-41d4-a716-446655440000" });

    expect(result.content[0].text).toBe("Todo not found.");
    expect(mockSupabase.from).toHaveBeenCalledWith("todos");
    expect(mockSupabase.from().select).toHaveBeenCalled();
  });

  it("search_todos returns empty when user A searches", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          gt: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          is: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    };

    const { registerSearchTodos } = await import("../tools/search-todos");
    const server = { registerTool: vi.fn() };
    registerSearchTodos(server as any, { userId: "user-A", supabase: mockSupabase as any });

    const handler = server.registerTool.mock.calls[0][2];
    const result = await handler({ query: "secret" });

    expect(result.content[0].text).toContain("No todos matching");
    expect(mockSupabase.from).toHaveBeenCalledWith("todos");
  });

  it("list_todos returns empty when user A lists with no todos", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    };

    const { registerListTodos } = await import("../tools/list-todos");
    const server = { registerTool: vi.fn() };
    registerListTodos(server as any, { userId: "user-A", supabase: mockSupabase as any });

    const handler = server.registerTool.mock.calls[0][2];
    const result = await handler({});

    expect(result.content[0].text).toBe("No todos found.");
    expect(mockSupabase.from).toHaveBeenCalledWith("todos");
  });

  it("get_todo returns data when user reads their own todo", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "todo-1", title: "My own todo", user_id: "user-A" },
        error: null,
      }),
    };
    // Sub-task query returns empty array
    chain.order.mockResolvedValue({ data: [], error: null });

    const mockSupabase = {
      from: vi.fn().mockReturnValue(chain),
    };

    const { registerGetTodo } = await import("../tools/get-todo");
    const server = { registerTool: vi.fn() };
    registerGetTodo(server as any, { userId: "user-A", supabase: mockSupabase as any });

    const handler = server.registerTool.mock.calls[0][2];
    const result = await handler({ id: "550e8400-e29b-41d4-a716-446655440000" });

    expect(result.content[0].text).toContain("My own todo");
  });
});
