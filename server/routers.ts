import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { generateTitles, generateTitlesWithCount, generateNote, generateHashtags, generateCover, analyzeXhsAccount } from "./ai";
import { 
  createPersona, getPersonasByUserId, getPersonaById, updatePersona, deletePersona,
  createGeneration, getGenerationsByUserId, getFavoritesByUserId, toggleFavorite, deleteGeneration,
  getFeishuConfig, saveFeishuConfig,
  saveDraft, getDraftsByUserId, getDraftById, updateDraft, deleteDraft,
  saveContent, saveContents, getContentsByUserId, getContentById, toggleContentFavorite, 
  markContentExported, markContentsExported, deleteContent, getFavoriteContents
} from "./db";
import { DEFAULT_PERSONAS, HOT_CONTENT_DATABASE, SCENARIOS, EMOTIONS, HASHTAG_LIBRARY, SCHOOL_DATABASE, type PersonaType, type Scenario, type Emotion, type SchoolRegion } from "../shared/xhs";
import { exportToFeishu, batchExportToFeishu, validateFeishuConfig, getFeishuTables } from "./feishu";

// 简单并发池：用于批量生成（几十篇）时控制并发，避免把 LLM / 网络 / 飞书打爆。
async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const ret: R[] = new Array(array.length);
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    const p = (async () => {
      const r = await iteratorFn(item, i);
      ret[i] = r;
    })();

    let e: Promise<void>;
    e = p.finally(() => {
      executing.delete(e);
    });
    executing.add(e);

    if (executing.size >= poolLimit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return ret;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // 配置数据
  config: router({
    getSchools: publicProcedure.query(() => SCHOOL_DATABASE),
    getAll: publicProcedure.query(() => ({
      scenarios: SCENARIOS,
      emotions: EMOTIONS,
      hashtags: HASHTAG_LIBRARY,
      schools: SCHOOL_DATABASE,
      personas: DEFAULT_PERSONAS,
    })),
  }),

  // 人设管理
  persona: router({
    getDefaults: publicProcedure.query(() => DEFAULT_PERSONAS),
    
    list: protectedProcedure.query(async ({ ctx }) => {
      return getPersonasByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        type: z.enum(["senior_sister", "professional", "anxious", "critic"]),
        description: z.string().optional(),
        greetings: z.array(z.string()).optional(),
        toneWords: z.array(z.string()).optional(),
        emojiStyle: z.array(z.string()).optional(),
        samplePhrases: z.array(z.string()).optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createPersona({ userId: ctx.user.id, ...input });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        greetings: z.array(z.string()).optional(),
        toneWords: z.array(z.string()).optional(),
        emojiStyle: z.array(z.string()).optional(),
        samplePhrases: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updatePersona(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePersona(input.id);
        return { success: true };
      }),

    analyzeAccount: protectedProcedure
      .input(z.object({ accountUrl: z.string().url() }))
      .mutation(async ({ input }) => {
        return analyzeXhsAccount(input.accountUrl);
      }),
  }),

  // 内容生成
  generate: router({
    titles: protectedProcedure
      .input(z.object({
        scenario: z.enum(["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]),
        emotion: z.enum(["empathy", "warning", "help", "success", "critic"]),
        personaType: z.enum(["senior_sister", "professional", "anxious", "critic"]),
        schoolRegion: z.enum(["uk", "au", "us", "ca", "hk", "sg", "eu"]).optional(),
        schoolName: z.string().optional(),
        customInput: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await generateTitles(input);
        await createGeneration({
          userId: ctx.user.id,
          type: "title",
          scenario: input.scenario,
          emotion: input.emotion,
          input: JSON.stringify(input),
          output: result as Record<string, unknown>,
        });
        return result;
      }),

    note: protectedProcedure
      .input(z.object({
        title: z.string(),
        scenario: z.enum(["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]),
        emotion: z.enum(["empathy", "warning", "help", "success", "critic"]),
        personaType: z.enum(["senior_sister", "professional", "anxious", "critic"]),
        schoolName: z.string().optional(),
        customInput: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await generateNote(input);
        await createGeneration({
          userId: ctx.user.id,
          type: "note",
          scenario: input.scenario,
          emotion: input.emotion,
          input: JSON.stringify(input),
          output: result as Record<string, unknown>,
        });
        return result;
      }),

    hashtags: protectedProcedure
      .input(z.object({
        scenario: z.enum(["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]),
        title: z.string(),
        schoolRegion: z.enum(["uk", "au", "us", "ca", "hk", "sg", "eu"]).optional(),
        schoolName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await generateHashtags(input);
        await createGeneration({
          userId: ctx.user.id,
          type: "hashtag",
          scenario: input.scenario,
          input: JSON.stringify(input),
          output: result as Record<string, unknown>,
        });
        return result;
      }),

    cover: protectedProcedure
      .input(z.object({
        title: z.string(),
        scenario: z.enum(["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]),
        emotion: z.enum(["empathy", "warning", "help", "success", "critic"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await generateCover(input);
        await createGeneration({
          userId: ctx.user.id,
          type: "cover",
          scenario: input.scenario,
          emotion: input.emotion,
          input: JSON.stringify(input),
          output: result as Record<string, unknown>,
        });
        return result;
      }),

    // 批量生成多篇内容
    batch: protectedProcedure
      .input(z.object({
        // 产品诉求：一次性批量生成“几十篇”内容。
        // 这里放开到 50，避免单次请求过长导致超时/限流；更大规模建议拆分成多批。
        count: z.number().min(1).max(50),
        scenario: z.enum(["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]),
        emotion: z.enum(["empathy", "warning", "help", "success", "critic"]),
        personaType: z.enum(["senior_sister", "professional", "anxious", "critic"]),
        schoolRegion: z.enum(["uk", "au", "us", "ca", "hk", "sg", "eu"]).optional(),
        schoolName: z.string().optional(),
        customInput: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { count, ...generateInput } = input;

        // 1) 一次性生成 count 个标题（避免每篇都调用一次标题生成，成本和失败率会暴涨）
        const titlesResult = await generateTitlesWithCount(generateInput, count);
        const titles = titlesResult.titles.map(t => t.text).filter(Boolean);
        if (titles.length === 0) {
          throw new Error("标题生成失败：未返回有效标题");
        }

        // 2) 逐条生成正文/标签/封面（控制并发，避免被限流/超时）
        const concurrency = Number(process.env.BATCH_CONCURRENCY || 3);
        const rawResults = await asyncPool(
          Math.max(1, Math.min(10, concurrency)),
          titles,
          async (selectedTitle, i) => {
            try {
              const [noteResult, hashtagsResult, coverResult] = await Promise.all([
                generateNote({
                  title: selectedTitle,
                  scenario: input.scenario,
                  emotion: input.emotion,
                  personaType: input.personaType,
                  schoolName: input.schoolName,
                  customInput: input.customInput,
                }),
                generateHashtags({
                  scenario: input.scenario,
                  title: selectedTitle,
                  schoolRegion: input.schoolRegion,
                  schoolName: input.schoolName,
                }),
                generateCover({
                  title: selectedTitle,
                  scenario: input.scenario,
                  emotion: input.emotion,
                }),
              ]);

              const fullResult = {
                title: selectedTitle,
                note: noteResult.content,
                hashtags: hashtagsResult.hashtags,
                cover: coverResult,
                scenario: input.scenario,
                emotion: input.emotion,
                personaType: input.personaType,
                schoolName: input.schoolName,
              };

              // 保留你现有的“生成历史”逻辑（后续建议迁移到 contents 表，方便导出/状态管理）
              await createGeneration({
                userId: ctx.user.id,
                type: "title",
                scenario: input.scenario,
                emotion: input.emotion,
                input: JSON.stringify(input),
                output: fullResult as Record<string, unknown>,
              });

              return fullResult;
            } catch (error) {
              console.error(`[Batch] Failed to generate item ${i}:`, error);
              return null;
            }
          }
        );

        const results = rawResults.filter((item): item is NonNullable<typeof item> => item !== null);
        
        if (results.length === 0) {
          throw new Error("批量生成全部失败，请检查 AI 配置或网络状态");
        }
        
        return { items: results, count: results.length };
      }),

    // 一键生成全部内容（单篇）
    all: protectedProcedure
      .input(z.object({
        scenario: z.enum(["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]),
        emotion: z.enum(["empathy", "warning", "help", "success", "critic"]),
        personaType: z.enum(["senior_sister", "professional", "anxious", "critic"]),
        schoolRegion: z.enum(["uk", "au", "us", "ca", "hk", "sg", "eu"]).optional(),
        schoolName: z.string().optional(),
        customInput: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const titlesResult = await generateTitles(input);
        const selectedTitle = titlesResult.titles[0]?.text || "";
        
        const noteResult = await generateNote({
          title: selectedTitle,
          scenario: input.scenario,
          emotion: input.emotion,
          personaType: input.personaType,
          schoolName: input.schoolName,
          customInput: input.customInput,
        });
        
        const hashtagsResult = await generateHashtags({
          scenario: input.scenario,
          title: selectedTitle,
          schoolRegion: input.schoolRegion,
          schoolName: input.schoolName,
        });
        
        const coverResult = await generateCover({
          title: selectedTitle,
          scenario: input.scenario,
          emotion: input.emotion,
        });
        
        const fullResult = {
          titles: titlesResult,
          note: noteResult,
          hashtags: hashtagsResult,
          cover: coverResult,
          input,
        };
        
        await createGeneration({
          userId: ctx.user.id,
          type: "title",
          scenario: input.scenario,
          emotion: input.emotion,
          input: JSON.stringify(input),
          output: fullResult as Record<string, unknown>,
        });
        
        return fullResult;
      }),
  }),

  // 飞书集成
  feishu: router({
    // 获取飞书配置
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      const config = await getFeishuConfig(ctx.user.id);
      if (!config) return { configured: false };
      return { 
        configured: true, 
        appId: config.appId,
        hasAppToken: !!config.appToken,
        hasTableId: !!config.tableId,
        appToken: config.appToken || undefined,
        tableId: config.tableId || undefined,
      };
    }),

    // 保存飞书配置
    saveConfig: protectedProcedure
      .input(z.object({
        appId: z.string().min(1),
        appSecret: z.string().min(1),
        appToken: z.string().optional(),
        tableId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 验证配置
        const validation = await validateFeishuConfig({
          appId: input.appId,
          appSecret: input.appSecret,
          appToken: input.appToken,
          tableId: input.tableId,
        });
        
        if (!validation.valid) {
          throw new Error(validation.message);
        }
        
        await saveFeishuConfig(
          ctx.user.id, 
          input.appId, 
          input.appSecret,
          input.appToken,
          input.tableId
        );
        
        return { success: true, message: validation.message };
      }),

    // 获取多维表格的数据表列表
    getTables: protectedProcedure
      .input(z.object({ appToken: z.string() }))
      .query(async ({ ctx, input }) => {
        const config = await getFeishuConfig(ctx.user.id);
        if (!config) throw new Error("请先配置飞书应用");
        
        return getFeishuTables(
          { appId: config.appId, appSecret: config.appSecret },
          input.appToken
        );
      }),

    // 单条导出到飞书
    export: protectedProcedure
      .input(z.object({
        title: z.string(),
        note: z.string(),
        hashtags: z.array(z.string()),
        coverText: z.string(),
        coverSubText: z.string().optional(),
        scenario: z.string(),
        emotion: z.string(),
        personaType: z.string(),
        schoolName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await getFeishuConfig(ctx.user.id);
        if (!config) throw new Error("请先配置飞书应用信息");
        if (!config.appToken || !config.tableId) {
          throw new Error("请先配置多维表格的 App Token 和 Table ID");
        }
        
        return exportToFeishu(
          { 
            appId: config.appId, 
            appSecret: config.appSecret,
            appToken: config.appToken,
            tableId: config.tableId,
          },
          { ...input, createdAt: new Date().toISOString() }
        );
      }),

    // 批量导出到飞书
    batchExport: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          title: z.string(),
          note: z.string(),
          hashtags: z.array(z.string()),
          coverText: z.string(),
          coverSubText: z.string().optional(),
          scenario: z.string(),
          emotion: z.string(),
          personaType: z.string(),
          schoolName: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await getFeishuConfig(ctx.user.id);
        if (!config) throw new Error("请先配置飞书应用信息");
        if (!config.appToken || !config.tableId) {
          throw new Error("请先配置多维表格的 App Token 和 Table ID");
        }
        
        const contents = input.items.map(item => ({
          ...item,
          createdAt: new Date().toISOString(),
        }));
        
        return batchExportToFeishu(
          { 
            appId: config.appId, 
            appSecret: config.appSecret,
            appToken: config.appToken,
            tableId: config.tableId,
          },
          contents
        );
      }),
  }),

  // 历史记录
  history: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getGenerationsByUserId(ctx.user.id, input?.limit || 50);
      }),

    favorites: protectedProcedure.query(async ({ ctx }) => {
      return getFavoritesByUserId(ctx.user.id);
    }),

    toggleFavorite: protectedProcedure
      .input(z.object({ id: z.number(), isFavorite: z.boolean() }))
      .mutation(async ({ input }) => {
        await toggleFavorite(input.id, input.isFavorite);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteGeneration(input.id);
        return { success: true };
      }),
  }),

  // 爆款数据库
  hotContent: router({
    list: publicProcedure
      .input(z.object({
        scenario: z.enum(["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]).optional(),
        emotion: z.enum(["empathy", "warning", "help", "success", "critic"]).optional(),
      }).optional())
      .query(({ input }) => {
        let data = [...HOT_CONTENT_DATABASE];
        if (input?.scenario) data = data.filter(item => item.scenario === input.scenario);
        if (input?.emotion) data = data.filter(item => item.emotion === input.emotion);
        return data.sort((a, b) => b.likes - a.likes);
      }),

    getConfig: publicProcedure.query(() => ({
      scenarios: SCENARIOS,
      emotions: EMOTIONS,
    })),
  }),

  // 草稿箱管理
  draft: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getDraftsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getDraftById(input.id);
      }),

    save: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        items: z.array(z.object({
          title: z.string(),
          note: z.string(),
          hashtags: z.array(z.string()),
          cover: z.object({
            mainText: z.string(),
            subText: z.string(),
            colorScheme: z.object({
              primary: z.string(),
              secondary: z.string(),
              highlight: z.string(),
              text: z.string(),
              background: z.string(),
            }),
            layout: z.string(),
            coverType: z.string(),
          }),
          scenario: z.string(),
          emotion: z.string(),
          personaType: z.string(),
          schoolName: z.string().optional(),
        })),
        scenario: z.enum(["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]).optional(),
        emotion: z.enum(["empathy", "warning", "help", "success", "critic"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await saveDraft({
          userId: ctx.user.id,
          name: input.name || `草稿 ${new Date().toLocaleString('zh-CN')}`,
          items: input.items,
          scenario: input.scenario,
          emotion: input.emotion,
        });
        return { id, success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        items: z.array(z.object({
          title: z.string(),
          note: z.string(),
          hashtags: z.array(z.string()),
          cover: z.object({
            mainText: z.string(),
            subText: z.string(),
            colorScheme: z.object({
              primary: z.string(),
              secondary: z.string(),
              highlight: z.string(),
              text: z.string(),
              background: z.string(),
            }),
            layout: z.string(),
            coverType: z.string(),
          }),
          scenario: z.string(),
          emotion: z.string(),
          personaType: z.string(),
          schoolName: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        await updateDraft(input.id, {
          name: input.name,
          items: input.items,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteDraft(input.id);
        return { success: true };
      }),
  }),

  // 内容管理（完整内容列表）
  content: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getContentsByUserId(ctx.user.id, input?.limit || 100);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getContentById(input.id);
      }),

    save: protectedProcedure
      .input(z.object({
        title: z.string(),
        note: z.string(),
        hashtags: z.array(z.string()).optional(),
        coverMainText: z.string().optional(),
        coverSubText: z.string().optional(),
        coverColorScheme: z.object({
          primary: z.string(),
          secondary: z.string(),
          highlight: z.string(),
          text: z.string(),
          background: z.string(),
        }).optional(),
        coverLayout: z.string().optional(),
        coverType: z.string().optional(),
        scenario: z.enum(["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]).optional(),
        emotion: z.enum(["empathy", "warning", "help", "success", "critic"]).optional(),
        personaType: z.string().optional(),
        schoolName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await saveContent({
          userId: ctx.user.id,
          ...input,
        });
        return { id, success: true };
      }),

    saveBatch: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          title: z.string(),
          note: z.string(),
          hashtags: z.array(z.string()).optional(),
          coverMainText: z.string().optional(),
          coverSubText: z.string().optional(),
          coverColorScheme: z.object({
            primary: z.string(),
            secondary: z.string(),
            highlight: z.string(),
            text: z.string(),
            background: z.string(),
          }).optional(),
          coverLayout: z.string().optional(),
          coverType: z.string().optional(),
          scenario: z.enum(["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]).optional(),
          emotion: z.enum(["empathy", "warning", "help", "success", "critic"]).optional(),
          personaType: z.string().optional(),
          schoolName: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const dataList = input.items.map(item => ({
          userId: ctx.user.id,
          ...item,
        }));
        await saveContents(dataList);
        return { count: dataList.length, success: true };
      }),

    favorites: protectedProcedure.query(async ({ ctx }) => {
      return getFavoriteContents(ctx.user.id);
    }),

    toggleFavorite: protectedProcedure
      .input(z.object({ id: z.number(), isFavorite: z.boolean() }))
      .mutation(async ({ input }) => {
        await toggleContentFavorite(input.id, input.isFavorite);
        return { success: true };
      }),

    markExported: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markContentExported(input.id);
        return { success: true };
      }),

    markBatchExported: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        await markContentsExported(input.ids);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteContent(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
