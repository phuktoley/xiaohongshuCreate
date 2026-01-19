import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Content Management", () => {
  it("content.list returns array structure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.content.list({ limit: 10 });
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("content.favorites returns array structure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.content.favorites();
    
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Feishu Config", () => {
  it("feishu.getConfig returns config status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feishu.getConfig();
    
    expect(result).toHaveProperty("configured");
    expect(result).toHaveProperty("hasAppToken");
    expect(result).toHaveProperty("hasTableId");
  });
});

describe("School Data", () => {
  it("config.getSchools returns school data by region", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.config.getSchools();
    
    expect(result).toHaveProperty("uk");
    expect(result).toHaveProperty("us");
    expect(result).toHaveProperty("au");
    expect(result.uk).toHaveProperty("label");
    expect(result.uk).toHaveProperty("schools");
    expect(Array.isArray(result.uk.schools)).toBe(true);
  });
});
