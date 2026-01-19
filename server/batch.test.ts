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

describe("config.getSchools", () => {
  it("returns school data with regions and schools", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.config.getSchools();

    // 验证返回的数据结构
    expect(result).toBeDefined();
    expect(result.uk).toBeDefined();
    expect(result.uk.label).toBe("英国");
    expect(Array.isArray(result.uk.schools)).toBe(true);
    expect(result.uk.schools.length).toBeGreaterThan(0);
    
    // 验证学校数据结构
    const firstSchool = result.uk.schools[0];
    expect(firstSchool).toHaveProperty("name");
    expect(firstSchool).toHaveProperty("abbr");
  });

  it("contains all expected regions", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.config.getSchools();

    const expectedRegions = ["uk", "au", "us", "ca", "hk", "sg", "eu"];
    for (const region of expectedRegions) {
      expect(result[region as keyof typeof result]).toBeDefined();
    }
  });
});

describe("feishu.getConfig", () => {
  it("returns config status for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feishu.getConfig();

    // 验证返回的数据结构
    expect(result).toBeDefined();
    expect(typeof result.configured).toBe("boolean");
    // 如果未配置，hasAppToken 和 hasTableId 可能不存在
    if (result.configured) {
      expect(typeof result.hasAppToken).toBe("boolean");
      expect(typeof result.hasTableId).toBe("boolean");
    }
  });
});

describe("feishu.saveConfig", () => {
  it("rejects invalid credentials", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 测试使用无效凭证会抛出错误
    await expect(
      caller.feishu.saveConfig({
        appId: "cli_invalid",
        appSecret: "invalid_secret",
        appToken: "bascn123",
        tableId: "tbl123",
      })
    ).rejects.toThrow();
  }, 15000); // 增加超时时间到 15 秒
});
