// 内置的 Manus API 配置（使用 Gemini 模型）
const MANUS_API_URL = "https://api.manus.im/api/llm-proxy/v1";
const MANUS_API_KEY = process.env.OPENAI_API_KEY || "";

// 检查是否是占位符 API Key
const isPlaceholderKey = (key: string) => {
  const placeholders = ['your-api-key-here', 'your-api-key', 'sk-xxx', 'placeholder'];
  return placeholders.some(p => key.toLowerCase().includes(p.toLowerCase())) || key.length < 20;
};

// 获取有效的 API Key
const getValidApiKey = () => {
  const builtInKey = process.env.BUILT_IN_FORGE_API_KEY || "";
  const openaiKey = process.env.OPENAI_API_KEY || "";
  
  // 优先使用 BUILT_IN_FORGE_API_KEY
  if (builtInKey && !isPlaceholderKey(builtInKey)) {
    return builtInKey;
  }
  
  // 其次使用 OPENAI_API_KEY（如果不是占位符）
  if (openaiKey && !isPlaceholderKey(openaiKey)) {
    return openaiKey;
  }
  
  // 如果都是占位符，返回空字符串（会在运行时报错）
  return "";
};

// 获取有效的 API URL
const getValidApiUrl = () => {
  const builtInUrl = process.env.BUILT_IN_FORGE_API_URL || "";
  const openaiBaseUrl = process.env.OPENAI_BASE_URL || "";
  
  // 优先使用 BUILT_IN_FORGE_API_URL
  if (builtInUrl && builtInUrl.trim().length > 0) {
    return builtInUrl;
  }
  
  // 其次使用 OPENAI_BASE_URL
  if (openaiBaseUrl && openaiBaseUrl.trim().length > 0) {
    return openaiBaseUrl;
  }
  
  // 默认使用 Manus API
  return MANUS_API_URL;
};

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: getValidApiUrl(),
  forgeApiKey: getValidApiKey(),
};
