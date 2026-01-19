import { invokeLLM } from "./_core/llm";
import { DEFAULT_PERSONAS, SCENARIOS, EMOTIONS, HASHTAG_LIBRARY, HOT_CONTENT_DATABASE, SCHOOL_DATABASE, type Scenario, type Emotion, type PersonaType, type SchoolRegion } from "../shared/xhs";

interface TitleGenerationInput {
  scenario: Scenario;
  emotion: Emotion;
  personaType: PersonaType;
  schoolRegion?: SchoolRegion;
  schoolName?: string;
  customInput?: string;
}

interface NoteGenerationInput {
  title: string;
  scenario: Scenario;
  emotion: Emotion;
  personaType: PersonaType;
  schoolName?: string;
  customInput?: string;
}

interface HashtagGenerationInput {
  scenario: Scenario;
  title: string;
  schoolRegion?: SchoolRegion;
  schoolName?: string;
}

interface CoverGenerationInput {
  title: string;
  scenario: Scenario;
  emotion: Emotion;
}

/**
 * 预处理 AI 返回的内容，提取纯 JSON
 * 处理以下情况：
 * 1. AI 在 JSON 前加了"好的，..."等前缀
 * 2. AI 用 markdown 代码块包裹了 JSON
 * 3. JSON 后面有额外的文字
 */
function extractJSON(content: string): string {
  // 首先尝试直接解析
  try {
    JSON.parse(content);
    return content;
  } catch {
    // 继续处理
  }

  // 去除 markdown 代码块
  let cleaned = content;
  
  // 匹配 ```json ... ``` 或 ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch {
      // 继续处理
    }
  }

  // 尝试找到第一个 { 和最后一个 } 之间的内容
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      JSON.parse(jsonCandidate);
      return jsonCandidate;
    } catch {
      // 继续处理
    }
  }

  // 尝试找到第一个 [ 和最后一个 ] 之间的内容（数组情况）
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    // 检查是否 [ 在 { 之前（说明是数组）
    if (firstBrace === -1 || firstBracket < firstBrace) {
      const jsonCandidate = cleaned.substring(firstBracket, lastBracket + 1);
      try {
        JSON.parse(jsonCandidate);
        return jsonCandidate;
      } catch {
        // 继续处理
      }
    }
  }

  // 如果都失败了，返回原始内容让调用方处理错误
  return content;
}

/**
 * 安全解析 JSON，带有预处理
 */
function safeParseJSON<T>(content: string): T {
  const extracted = extractJSON(content);
  return JSON.parse(extracted) as T;
}

// 生成标题
export async function generateTitles(input: TitleGenerationInput): Promise<{
  titles: Array<{
    text: string;
    score: number;
    emoji: string;
    reason: string;
  }>;
}> {
  return generateTitlesWithCount(input, 10);
}

// 批量标题生成：一次性生成指定数量的标题（用于“几十篇”内容批量生产的入口）。
// 注：该方法会尽量生成不重复标题，但在极端输入（限制过多/字数过短）时仍可能出现相似标题。
export async function generateTitlesWithCount(
  input: TitleGenerationInput,
  count: number
): Promise<{
  titles: Array<{
    text: string;
    score: number;
    emoji: string;
    reason: string;
  }>;
}> {
  const persona = DEFAULT_PERSONAS[input.personaType];
  const scenario = SCENARIOS[input.scenario];
  const emotion = EMOTIONS[input.emotion];
  
  // 获取相关爆款案例
  const relevantHotContent = HOT_CONTENT_DATABASE.filter(
    item => item.scenario === input.scenario || item.emotion === input.emotion
  ).slice(0, 5);

  const clampedCount = Math.max(1, Math.min(count, 100));

  const prompt = `你是一个小红书爆款标题专家。请根据以下要求生成${clampedCount}个小红书标题。

【人设风格】
- 人设名称：${persona.name}
- 人设描述：${persona.description}
- 常用开头：${persona.greetings.join("、")}
- 语气词：${persona.toneWords.join("、")}
- emoji风格：${persona.emojiStyle.join("")}

【业务场景】
- 场景：${scenario.label}
- 关键词：${scenario.keywords.join("、")}
${input.schoolName ? `- 学校：${input.schoolName}` : ""}
${input.customInput ? `- 补充信息：${input.customInput}` : ""}

【目标情绪】
- 情绪类型：${emotion.label}
- 推荐emoji：${emotion.emoji.join("")}

【爆款参考】
${relevantHotContent.map(item => `- "${item.title}" (${item.likes}赞) - ${item.pattern}`).join("\n")}

【重要规则】
1. 标题必须严格控制在18个字符以内（含emoji）
2. 标题要有情绪价值，避免机械化语言
3. 可以使用网络用语和流行梗
4. 每个标题配一个最合适的emoji
5. 给每个标题打分（1-10分）并说明理由
6. 尽量避免标题重复或只换同义词

【输出要求】
请直接返回JSON格式，不要添加任何前缀文字或markdown代码块。格式如下：
{
  "titles": [
    {
      "text": "标题文本（不含emoji）",
      "score": 8,
      "emoji": "😭",
      "reason": "简短理由"
    }
  ]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "你是一个专业的小红书内容创作专家，擅长创作高互动的标题。请直接返回JSON格式，不要添加任何前缀文字、解释或markdown代码块。" },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "title_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            titles: {
              type: "array",
              minItems: clampedCount,
              maxItems: clampedCount,
              items: {
                type: "object",
                properties: {
                  text: { type: "string", description: "标题文本" },
                  score: { type: "integer", description: "评分1-10" },
                  emoji: { type: "string", description: "推荐emoji" },
                  reason: { type: "string", description: "评分理由" },
                },
                required: ["text", "score", "emoji", "reason"],
                additionalProperties: false,
              },
            },
          },
          required: ["titles"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("AI response is empty");
  
  return safeParseJSON(content);
}

// 生成笔记正文
export async function generateNote(input: NoteGenerationInput): Promise<{
  content: string;
  structure: {
    opening: string;
    body: string;
    interaction: string;
  };
}> {
  const persona = DEFAULT_PERSONAS[input.personaType];
  const scenario = SCENARIOS[input.scenario];
  const emotion = EMOTIONS[input.emotion];

  const prompt = `你是一个小红书爆款笔记创作专家。请根据以下要求生成一篇完整的小红书笔记正文。

【标题】${input.title}

【人设风格】
- 人设名称：${persona.name}
- 人设描述：${persona.description}
- 常用开头：${persona.greetings.join("、")}
- 语气词：${persona.toneWords.join("、")}
- emoji风格：${persona.emojiStyle.join("")}
- 示例语句：${persona.samplePhrases.join("；")}

【业务场景】${scenario.label}
【目标情绪】${emotion.label}
${input.schoolName ? `【学校】${input.schoolName}` : ""}
${input.customInput ? `【补充信息】${input.customInput}` : ""}

【写作要求】
1. 开头要吸引人，用人设的打招呼方式
2. 正文要有故事感，分享真实经历或干货
3. 结尾要有互动引导，邀请评论
4. 适当使用emoji增加趣味性
5. 语言要口语化，有情绪价值
6. 避免机械化和过于逻辑性的表达
7. 总字数控制在300-500字

【输出要求】
请直接返回JSON格式，不要添加任何前缀文字或markdown代码块：
{
  "content": "完整的笔记正文",
  "structure": {
    "opening": "开头部分",
    "body": "正文部分",
    "interaction": "互动引导部分"
  }
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "你是一个专业的小红书内容创作专家，擅长创作有情绪价值的笔记。请直接返回JSON格式，不要添加任何前缀文字、解释或markdown代码块。" },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "note_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            content: { type: "string", description: "完整笔记正文" },
            structure: {
              type: "object",
              properties: {
                opening: { type: "string", description: "开头部分" },
                body: { type: "string", description: "正文部分" },
                interaction: { type: "string", description: "互动引导" },
              },
              required: ["opening", "body", "interaction"],
              additionalProperties: false,
            },
          },
          required: ["content", "structure"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("AI response is empty");
  
  return safeParseJSON(content);
}

// 生成话题标签
export async function generateHashtags(input: HashtagGenerationInput): Promise<{
  hashtags: string[];
  categories: {
    general: string[];
    scenario: string[];
    school: string[];
    appeal: string[];
  };
}> {
  const scenarioTags = HASHTAG_LIBRARY.scenario[input.scenario] || [];
  
  // 根据地区获取学校标签
  let schoolTags: string[] = [];
  if (input.schoolRegion && input.schoolRegion in HASHTAG_LIBRARY.school) {
    const regionKey = input.schoolRegion as keyof typeof HASHTAG_LIBRARY.school;
    schoolTags = HASHTAG_LIBRARY.school[regionKey] || [];
  }
  
  // 如果有具体学校名，添加学校标签
  if (input.schoolName) {
    schoolTags = [`#${input.schoolName}`, ...schoolTags];
  }
  
  // 组合标签
  const categories = {
    general: HASHTAG_LIBRARY.general.slice(0, 3),
    scenario: scenarioTags.slice(0, 3),
    school: schoolTags.slice(0, 4),
    appeal: HASHTAG_LIBRARY.appeal.slice(0, 2),
  };
  
  const allHashtags = [
    ...categories.general,
    ...categories.scenario,
    ...categories.school,
    ...categories.appeal,
  ];

  return {
    hashtags: allHashtags,
    categories,
  };
}

// 封面设计模板配置
const COVER_TEMPLATES = {
  // 大字报型 - 笔记本风格
  notebook: {
    name: "笔记本风格",
    background: "#FFFFFF",
    pattern: "lines", // 横线背景
    textColor: "#1a1a1a",
    highlightColor: "#FFD54F", // 黄色高亮
    decoration: "dots", // 小圆点装饰
  },
  // 手绘边框型
  handdrawn: {
    name: "手绘边框",
    background: "#FFFFFF",
    borderColor: "#64B5F6", // 蓝色手绘边框
    textColor: "#1a1a1a",
    highlightColors: ["#FFD54F", "#F48FB1"], // 黄色+粉色高亮
    decoration: "rings", // 圆环装饰
  },
  // 速报型
  breaking: {
    name: "速报风格",
    background: "#FFF8E1",
    accentColor: "#FF6B35",
    textColor: "#1a1a1a",
    decoration: "burst", // 爆炸图标
  },
  // 清新简约型
  minimal: {
    name: "清新简约",
    background: "#F5F5F5",
    textColor: "#1a1a1a",
    accentColor: "#4CAF50",
  },
  // 警示型
  warning: {
    name: "警示风格",
    background: "#FFEBEE",
    textColor: "#C62828",
    accentColor: "#FF5252",
    decoration: "exclamation",
  },
};

// 情绪对应的配色方案
const EMOTION_COLOR_SCHEMES: Record<Emotion, {
  primary: string;
  secondary: string;
  highlight: string;
  text: string;
  background: string;
}> = {
  empathy: {
    primary: "#FFF8E1",
    secondary: "#FFE082",
    highlight: "#FFD54F",
    text: "#1a1a1a",
    background: "#FFFFFF",
  },
  warning: {
    primary: "#FFEBEE",
    secondary: "#FFCDD2",
    highlight: "#FF5252",
    text: "#C62828",
    background: "#FFFFFF",
  },
  help: {
    primary: "#E3F2FD",
    secondary: "#BBDEFB",
    highlight: "#2196F3",
    text: "#1a1a1a",
    background: "#FFFFFF",
  },
  success: {
    primary: "#E8F5E9",
    secondary: "#C8E6C9",
    highlight: "#4CAF50",
    text: "#1a1a1a",
    background: "#FFFFFF",
  },
  critic: {
    primary: "#F3E5F5",
    secondary: "#E1BEE7",
    highlight: "#9C27B0",
    text: "#1a1a1a",
    background: "#FFFFFF",
  },
};

// 生成封面文案
export async function generateCover(input: CoverGenerationInput): Promise<{
  mainText: string;
  subText: string;
  colorScheme: {
    primary: string;
    secondary: string;
    highlight: string;
    text: string;
    background: string;
  };
  layout: string;
  coverType: string;
  designTips: string[];
  template: string;
  highlightWords: string[];
}> {
  const emotion = EMOTIONS[input.emotion];
  const scenario = SCENARIOS[input.scenario];
  const colorScheme = EMOTION_COLOR_SCHEMES[input.emotion];

  const prompt = `你是一个小红书爆款封面设计专家。请根据以下标题生成封面文案和设计建议。

【标题】${input.title}
【场景】${scenario.label}
【情绪】${emotion.label}

【小红书爆款封面设计规律】

1. 大字报型（最常见）：
   - 简洁背景（纯色/笔记本纹理）
   - 超大粗体黑色文字
   - 关键词用黄色/粉色色块高亮
   - 小圆点装饰
   - 示例："后悔没有早点..." + 黄色高亮

2. 手绘边框型：
   - 白色背景 + 蓝色手绘边框
   - 圆环装饰在顶部
   - 多行文字，关键词用彩色高亮
   - 示例：蓝色手绘边框 + 黄色/粉色关键词

3. 速报型：
   - 模拟新闻标题
   - 爆炸图标/感叹号装饰
   - 紧迫感、时效性

【要求】
1. 主文案简短有力（3-8字）
2. 指定哪些词需要高亮显示
3. 副文案补充信息（可选）
4. 推荐最适合的模板风格
5. 给出具体设计建议

【输出要求】
请直接返回JSON格式，不要添加任何前缀文字或markdown代码块：
{
  "mainText": "封面主文案（3-8字）",
  "subText": "副文案（可选，10字以内）",
  "highlightWords": ["需要高亮的关键词1", "关键词2"],
  "layout": "布局建议",
  "coverType": "big_text/screenshot/comparison/chat",
  "template": "notebook/handdrawn/breaking/minimal/warning",
  "designTips": ["设计建议1", "设计建议2", "设计建议3"]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "你是一个专业的小红书封面设计专家，精通爆款封面的视觉设计。请直接返回JSON格式，不要添加任何前缀文字、解释或markdown代码块。" },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "cover_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            mainText: { type: "string", description: "封面主文案" },
            subText: { type: "string", description: "副文案" },
            highlightWords: { type: "array", items: { type: "string" }, description: "需要高亮的关键词" },
            layout: { type: "string", description: "布局建议" },
            coverType: { type: "string", description: "封面类型" },
            template: { type: "string", description: "模板风格" },
            designTips: { type: "array", items: { type: "string" }, description: "设计建议列表" },
          },
          required: ["mainText", "subText", "highlightWords", "layout", "coverType", "template", "designTips"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("AI response is empty");
  
  const result = safeParseJSON<{
    mainText: string;
    subText: string;
    highlightWords: string[];
    layout: string;
    coverType: string;
    template: string;
    designTips: string[];
  }>(content);

  return {
    ...result,
    colorScheme,
  };
}

// 分析小红书账号生成人设
export async function analyzeXhsAccount(accountUrl: string): Promise<{
  name: string;
  description: string;
  greetings: string[];
  toneWords: string[];
  emojiStyle: string[];
  samplePhrases: string[];
  analysisSource: string;
  suggestedType: PersonaType;
}> {
  // 由于无法直接爬取小红书，我们通过 AI 模拟分析
  // 实际应用中需要接入小红书 API 或爬虫服务
  
  const prompt = `你是一个小红书内容分析专家。用户想要分析一个小红书账号的写作风格来创建人设。

【账号链接】${accountUrl}

由于技术限制，我无法直接访问这个账号。但请你根据小红书留学申诉领域的常见账号风格，生成一个合理的人设分析结果。

请分析并生成以下内容：
1. 人设名称（简短有特色）
2. 人设描述（一句话概括风格）
3. 常用开头语（3-5个）
4. 语气词特点（5-8个）
5. emoji使用风格（5-8个常用emoji）
6. 典型句式示例（3-5个）
7. 最接近的预设人设类型

【输出要求】
请直接返回JSON格式，不要添加任何前缀文字或markdown代码块：
{
  "name": "人设名称",
  "description": "人设描述",
  "greetings": ["开头语1", "开头语2"],
  "toneWords": ["语气词1", "语气词2"],
  "emojiStyle": ["😊", "💪"],
  "samplePhrases": ["示例句式1", "示例句式2"],
  "analysisSource": "分析说明",
  "suggestedType": "senior_sister/professional/anxious/critic"
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "你是一个专业的小红书内容分析专家。请直接返回JSON格式，不要添加任何前缀文字、解释或markdown代码块。" },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "account_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            name: { type: "string", description: "人设名称" },
            description: { type: "string", description: "人设描述" },
            greetings: { type: "array", items: { type: "string" }, description: "开头语列表" },
            toneWords: { type: "array", items: { type: "string" }, description: "语气词列表" },
            emojiStyle: { type: "array", items: { type: "string" }, description: "emoji列表" },
            samplePhrases: { type: "array", items: { type: "string" }, description: "示例句式" },
            analysisSource: { type: "string", description: "分析说明" },
            suggestedType: { type: "string", description: "建议的人设类型" },
          },
          required: ["name", "description", "greetings", "toneWords", "emojiStyle", "samplePhrases", "analysisSource", "suggestedType"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("AI response is empty");
  
  return safeParseJSON(content);
}
