import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock LLM 调用
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          titles: [
            { text: "被退学后我做了这件事", score: 9, emoji: "😭", reason: "情绪共鸣强" },
            { text: "学术不端申诉成功", score: 8, emoji: "💪", reason: "正能量" },
          ]
        })
      }
    }]
  })
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("xhs content generator", () => {
  describe("school data", () => {
    it("returns school database with regions and schools", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.config.getSchools();

      expect(result).toBeDefined();
      expect(result.us).toBeDefined();
      expect(result.us.label).toBe("美国");
      expect(result.us.schools).toBeInstanceOf(Array);
      expect(result.us.schools.length).toBeGreaterThan(0);
      expect(result.us.schools[0]).toHaveProperty("name");
      expect(result.us.schools[0]).toHaveProperty("abbr");
    });

    it("includes UK schools", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.config.getSchools();

      expect(result.uk).toBeDefined();
      expect(result.uk.label).toBe("英国");
      expect(result.uk.schools.length).toBeGreaterThan(0);
    });
  });

  describe("title generation", () => {
    it("generates titles with required fields", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.generate.titles({
        scenario: "dropout",
        emotion: "empathy",
        personaType: "senior_sister",
      });

      expect(result).toBeDefined();
      expect(result.titles).toBeInstanceOf(Array);
      expect(result.titles.length).toBeGreaterThan(0);
      expect(result.titles[0]).toHaveProperty("text");
      expect(result.titles[0]).toHaveProperty("score");
      expect(result.titles[0]).toHaveProperty("emoji");
      expect(result.titles[0]).toHaveProperty("reason");
    });
  });
});

describe("persona management", () => {
  it("lists personas for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.persona.list();

    expect(result).toBeInstanceOf(Array);
  });
});

describe("feishu integration", () => {
  it("returns feishu config status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feishu.getConfig();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("configured");
  });
});
