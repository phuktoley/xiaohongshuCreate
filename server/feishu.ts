/**
 * 飞书集成服务
 * 支持导出到飞书多维表格
 */

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  appToken?: string;  // 多维表格 App Token
  tableId?: string;   // 多维表格 Table ID
}

export interface FeishuExportContent {
  title: string;
  note: string;
  hashtags: string[];
  coverText: string;
  coverSubText?: string;
  scenario: string;
  emotion: string;
  personaType: string;
  schoolName?: string;
  createdAt?: string;
}

export interface FeishuBatchExportContent {
  items: FeishuExportContent[];
}

// 获取飞书 tenant_access_token
async function getTenantAccessToken(config: FeishuConfig): Promise<string> {
  const response = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret,
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取飞书 token 失败: ${data.msg}`);
  }
  return data.tenant_access_token;
}

// 向多维表格添加记录
async function addBitableRecords(
  token: string,
  appToken: string,
  tableId: string,
  records: Array<Record<string, unknown>>
): Promise<{ recordIds: string[] }> {
  const response = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        records: records.map(fields => ({ fields })),
      }),
    }
  );

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`添加多维表格记录失败: ${data.msg}`);
  }
  
  return {
    recordIds: data.data.records.map((r: { record_id: string }) => r.record_id),
  };
}

// 获取多维表格字段列表
async function getBitableFields(
  token: string,
  appToken: string,
  tableId: string
): Promise<Array<{ field_id: string; field_name: string; type: number }>> {
  const response = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取多维表格字段失败: ${data.msg}`);
  }
  
  return data.data.items || [];
}

// 创建多维表格字段（如果不存在）
async function ensureBitableFields(
  token: string,
  appToken: string,
  tableId: string
): Promise<void> {
  const existingFields = await getBitableFields(token, appToken, tableId);
  const existingFieldNames = new Set(existingFields.map(f => f.field_name));
  
  const requiredFields = [
    { field_name: "标题", type: 1 },      // 文本
    { field_name: "正文", type: 1 },      // 文本
    { field_name: "话题标签", type: 1 },  // 文本
    { field_name: "封面主文案", type: 1 }, // 文本
    { field_name: "封面副文案", type: 1 }, // 文本
    { field_name: "业务场景", type: 3 },  // 单选
    { field_name: "目标情绪", type: 3 },  // 单选
    { field_name: "人设类型", type: 3 },  // 单选
    { field_name: "学校", type: 1 },      // 文本
    { field_name: "创建时间", type: 5 },  // 日期
  ];
  
  for (const field of requiredFields) {
    if (!existingFieldNames.has(field.field_name)) {
      await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(field),
        }
      );
    }
  }
}

// 将内容转换为多维表格记录格式
function contentToRecord(content: FeishuExportContent): Record<string, unknown> {
  return {
    "标题": content.title,
    "正文": content.note,
    "话题标签": content.hashtags.join(" "),
    "封面主文案": content.coverText,
    "封面副文案": content.coverSubText || "",
    "业务场景": content.scenario,
    "目标情绪": content.emotion,
    "人设类型": content.personaType,
    "学校": content.schoolName || "",
    "创建时间": content.createdAt ? new Date(content.createdAt).getTime() : Date.now(),
  };
}

// 单条导出到飞书多维表格
export async function exportToFeishu(
  config: FeishuConfig,
  content: FeishuExportContent
): Promise<{ recordId: string; url: string }> {
  if (!config.appToken || !config.tableId) {
    throw new Error("请先配置多维表格的 App Token 和 Table ID");
  }
  
  const token = await getTenantAccessToken(config);
  
  // 确保字段存在
  await ensureBitableFields(token, config.appToken, config.tableId);
  
  // 添加记录
  const record = contentToRecord(content);
  const result = await addBitableRecords(token, config.appToken, config.tableId, [record]);
  
  const url = `https://www.feishu.cn/base/${config.appToken}?table=${config.tableId}&view=vewXXX`;
  
  return {
    recordId: result.recordIds[0],
    url,
  };
}

// 批量导出到飞书多维表格
export async function batchExportToFeishu(
  config: FeishuConfig,
  contents: FeishuExportContent[]
): Promise<{ recordIds: string[]; url: string; count: number }> {
  if (!config.appToken || !config.tableId) {
    throw new Error("请先配置多维表格的 App Token 和 Table ID");
  }
  
  if (contents.length === 0) {
    throw new Error("没有要导出的内容");
  }
  
  const token = await getTenantAccessToken(config);
  
  // 确保字段存在
  await ensureBitableFields(token, config.appToken, config.tableId);
  
  // 转换所有内容为记录格式
  const records = contents.map(contentToRecord);
  
  // 批量添加记录（飞书 API 限制每次最多 500 条）
  const batchSize = 500;
  const allRecordIds: string[] = [];
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const result = await addBitableRecords(token, config.appToken, config.tableId, batch);
    allRecordIds.push(...result.recordIds);
  }
  
  const url = `https://www.feishu.cn/base/${config.appToken}?table=${config.tableId}`;
  
  return {
    recordIds: allRecordIds,
    url,
    count: allRecordIds.length,
  };
}

// 验证飞书配置
export async function validateFeishuConfig(config: FeishuConfig): Promise<{ valid: boolean; message: string }> {
  try {
    const token = await getTenantAccessToken(config);
    
    // 如果配置了多维表格，验证表格访问权限
    if (config.appToken && config.tableId) {
      try {
        await getBitableFields(token, config.appToken, config.tableId);
        return { valid: true, message: "配置验证成功，多维表格可访问" };
      } catch (e) {
        return { valid: false, message: `多维表格访问失败: ${e instanceof Error ? e.message : '未知错误'}` };
      }
    }
    
    return { valid: true, message: "飞书应用配置验证成功" };
  } catch (e) {
    return { valid: false, message: `配置验证失败: ${e instanceof Error ? e.message : '未知错误'}` };
  }
}

// 获取多维表格列表
export async function getFeishuBitables(config: FeishuConfig): Promise<Array<{ app_token: string; name: string }>> {
  const token = await getTenantAccessToken(config);
  
  // 注意：飞书 API 不直接支持列出所有多维表格
  // 用户需要手动提供 app_token
  // 这里返回空数组，让用户手动输入
  return [];
}

// 获取多维表格的数据表列表
export async function getFeishuTables(
  config: FeishuConfig,
  appToken: string
): Promise<Array<{ table_id: string; name: string }>> {
  const token = await getTenantAccessToken(config);
  
  const response = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取数据表列表失败: ${data.msg}`);
  }
  
  return data.data.items || [];
}
