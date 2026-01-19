import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// 模拟用户数据，用于本地开发
const MOCK_USER: User = {
  id: 1,
  openId: "local-dev-user",
  name: "本地用户",
  email: "local@dev.com",
  loginMethod: "local",
  role: "user",
  lastSignedIn: new Date(),
  createdAt: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    // 本地开发模式：使用模拟用户
    user = MOCK_USER;
  }

  // 如果仍然没有用户，使用模拟用户（本地开发模式）
  if (!user) {
    user = MOCK_USER;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
