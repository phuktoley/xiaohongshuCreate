import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

// 模拟用户数据，用于本地开发
const MOCK_USER = {
  id: 1,
  openId: "local-dev-user",
  name: "本地用户",
  email: "local@dev.com",
  loginMethod: "local",
  lastSignedIn: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  // 尝试获取真实用户，但不依赖它
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      // 忽略错误，本地模式不需要真正登出
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // 如果有真实用户数据就用真实的，否则用模拟数据
    const user = meQuery.data ?? MOCK_USER;
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(user)
    );
    return {
      user: user,
      loading: false, // 始终返回 false，不阻塞页面
      error: null,
      isAuthenticated: true, // 始终返回 true，跳过登录检查
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  // 禁用重定向逻辑
  useEffect(() => {
    // 本地开发模式不需要重定向
  }, []);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
