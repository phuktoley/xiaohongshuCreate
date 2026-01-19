import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Sparkles, User, MapPin, School, Heart, FileText, Hash, Image, 
  ChevronRight, Check, Copy, RefreshCw, Download, Star, Loader2,
  Settings, ExternalLink, Layers, Upload, Table2, HelpCircle, Trash2
} from "lucide-react";
import CoverPreview from "@/components/CoverPreview";
import ProgressIndicator, { BatchProgress } from "@/components/ProgressIndicator";

type Scenario = "delay" | "dropout" | "misconduct" | "fail" | "leave" | "withdraw";
type Emotion = "empathy" | "warning" | "help" | "success" | "critic";
type PersonaType = "senior_sister" | "professional" | "anxious" | "critic";
type SchoolRegion = "uk" | "au" | "us" | "ca" | "hk" | "sg" | "eu";

const SCENARIOS: Record<Scenario, { label: string; keywords: string[] }> = {
  delay: { label: "延期", keywords: ["延期入学", "考试延期", "deadline延期", "EC申请"] },
  dropout: { label: "退学", keywords: ["被退学", "劝退", "开除", "复学"] },
  misconduct: { label: "学术不端", keywords: ["抄袭", "AI检测", "cheating", "作弊", "Turnitin"] },
  fail: { label: "挂科", keywords: ["挂科", "补考", "成绩复议", "重修"] },
  leave: { label: "休学", keywords: ["休学", "gap year", "中断学业", "LOA"] },
  withdraw: { label: "撤课", keywords: ["撤课", "withdraw", "退课", "非常规撤课"] },
};

const EMOTIONS: Record<Emotion, { label: string; color: string; emoji: string[] }> = {
  empathy: { label: "共鸣型", color: "#FF6B9D", emoji: ["😭", "🥺", "💔", "😢"] },
  warning: { label: "警示型", color: "#FF4D4F", emoji: ["⚠️", "❌", "🚫", "‼️"] },
  help: { label: "求助型", color: "#1890FF", emoji: ["🙏", "🆘", "❓", "😰"] },
  success: { label: "成功型", color: "#52C41A", emoji: ["✅", "🎉", "💪", "🔥"] },
  critic: { label: "吐槽型", color: "#722ED1", emoji: ["😅", "🤡", "💀", "🙄"] },
};

const PERSONAS: Record<PersonaType, { name: string; description: string }> = {
  senior_sister: { name: "过来人学姐", description: "亲历者视角，真实经验分享" },
  professional: { name: "专业顾问", description: "专业人士视角，干货输出" },
  anxious: { name: "焦虑求助者", description: "正在经历困境的留学生" },
  critic: { name: "吐槽达人", description: "犀利点评，揭露行业乱象" },
};

interface BatchItem {
  title: string;
  note: string;
  hashtags: string[];
  cover: {
    mainText: string;
    subText: string;
    colorScheme: { primary: string; secondary: string; highlight: string; text: string; background: string };
    layout: string;
    coverType: string;
  };
  scenario: string;
  emotion: string;
  personaType: string;
  schoolName?: string;
}

export default function Generator() {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [step, setStep] = useState(1);
  
  // 配置选项
  const [scenario, setScenario] = useState<Scenario | "">("");
  const [emotion, setEmotion] = useState<Emotion | "">("");
  const [personaType, setPersonaType] = useState<PersonaType | "">("");
  const [schoolRegion, setSchoolRegion] = useState<SchoolRegion | "">("");
  const [schoolName, setSchoolName] = useState("");
  const [customInput, setCustomInput] = useState("");
  
  // 批量生成数量
  const [batchCount, setBatchCount] = useState(3);
  
  // 生成结果
  const [selectedTitle, setSelectedTitle] = useState<{ text: string; emoji: string } | null>(null);
  const [generatedContent, setGeneratedContent] = useState<{
    titles?: { titles: Array<{ text: string; score: number; emoji: string; reason: string }> };
    note?: { content: string; structure: { opening: string; body: string; interaction: string } };
    hashtags?: { hashtags: string[]; categories: Record<string, string[]> };
    cover?: { 
      mainText: string; 
      subText: string; 
      colorScheme: { primary: string; secondary: string; highlight: string; text: string; background: string }; 
      layout: string; 
      coverType: string; 
      designTips?: string[];
      template?: string;
      highlightWords?: string[];
    };
  }>({});
  
  // 批量生成结果
  const [batchResults, setBatchResults] = useState<BatchItem[]>([]);
  const [selectedBatchItems, setSelectedBatchItems] = useState<Set<number>>(new Set());
  
  // 离开确认弹窗
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // 飞书配置
  const [feishuDialogOpen, setFeishuDialogOpen] = useState(false);
  const [feishuAppId, setFeishuAppId] = useState("");
  const [feishuAppSecret, setFeishuAppSecret] = useState("");
  const [feishuAppToken, setFeishuAppToken] = useState("");
  const [feishuTableId, setFeishuTableId] = useState("");
  
  // 获取学校数据
  const { data: schoolData } = trpc.config.getSchools.useQuery();
  
  // 获取飞书配置状态
  const { data: feishuConfig, refetch: refetchFeishuConfig } = trpc.feishu.getConfig.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  // 生成 mutations
  const generateTitles = trpc.generate.titles.useMutation();
  const generateNote = trpc.generate.note.useMutation();
  const generateHashtags = trpc.generate.hashtags.useMutation();
  const generateCover = trpc.generate.cover.useMutation();
  const generateBatch = trpc.generate.batch.useMutation();
  const saveFeishuConfigMutation = trpc.feishu.saveConfig.useMutation();
  const exportToFeishu = trpc.feishu.export.useMutation();
  const batchExportToFeishu = trpc.feishu.batchExport.useMutation();
  
  // 当前地区的学校列表
  const schools = useMemo(() => {
    if (!schoolRegion || !schoolData) return [];
    return schoolData[schoolRegion]?.schools || [];
  }, [schoolRegion, schoolData]);

  // 计算是否正在生成
  const isGenerating = generateTitles.isPending || generateNote.isPending || 
    generateHashtags.isPending || generateCover.isPending || generateBatch.isPending;
  
  // 计算是否正在导出
  const isExporting = exportToFeishu.isPending || batchExportToFeishu.isPending;

  // 生成步骤描述
  const getGenerationSteps = () => {
    if (mode === "batch") {
      return ["AI 正在分析场景...", "生成标题和正文...", "生成标签和封面...", "整理结果..."];
    }
    if (generateTitles.isPending) return ["分析场景和人设...", "生成候选标题...", "评分和排序..."];
    if (generateNote.isPending) return ["构建内容结构...", "生成正文内容...", "优化表达..."];
    if (generateHashtags.isPending) return ["分析内容主题...", "匹配热门标签..."];
    if (generateCover.isPending) return ["设计封面文案...", "生成配色方案..."];
    return [];
  };

  // 预估生成时间（秒）
  const getEstimatedTime = () => {
    if (mode === "batch") return batchCount * 8;
    if (generateTitles.isPending) return 8;
    if (generateNote.isPending) return 10;
    if (generateHashtags.isPending) return 5;
    if (generateCover.isPending) return 5;
    return 10;
  };
  
  // 检查配置是否完整
  const isConfigComplete = scenario && emotion && personaType;
  
  // 生成标题（单篇模式）
  const handleGenerateTitles = async () => {
    if (!scenario || !emotion || !personaType) {
      toast.error("请先完成基础配置");
      return;
    }
    
    try {
      const result = await generateTitles.mutateAsync({
        scenario,
        emotion,
        personaType,
        schoolRegion: schoolRegion || undefined,
        schoolName: schoolName || undefined,
        customInput: customInput || undefined,
      });
      setGeneratedContent(prev => ({ ...prev, titles: result }));
      setStep(2);
      toast.success("标题生成成功！");
    } catch (error) {
      toast.error("标题生成失败，请重试");
    }
  };
  
  // 批量生成
  const handleBatchGenerate = async () => {
    if (!scenario || !emotion || !personaType) {
      toast.error("请先完成基础配置");
      return;
    }
    
    try {
      const result = await generateBatch.mutateAsync({
        count: batchCount,
        scenario,
        emotion,
        personaType,
        schoolRegion: schoolRegion || undefined,
        schoolName: schoolName || undefined,
        customInput: customInput || undefined,
      });
      setBatchResults(result.items);
      setSelectedBatchItems(new Set(result.items.map((_, i) => i)));
      toast.success(`成功生成 ${result.count} 篇内容！`);
    } catch (error) {
      toast.error("批量生成失败，请重试");
    }
  };
  
  // 生成正文
  const handleGenerateNote = async () => {
    if (!selectedTitle || !scenario || !emotion || !personaType) {
      toast.error("请先选择一个标题");
      return;
    }
    
    try {
      const result = await generateNote.mutateAsync({
        title: `${selectedTitle.emoji} ${selectedTitle.text}`,
        scenario,
        emotion,
        personaType,
        schoolName: schoolName || undefined,
        customInput: customInput || undefined,
      });
      setGeneratedContent(prev => ({ ...prev, note: result }));
      setStep(3);
      toast.success("正文生成成功！");
    } catch (error) {
      toast.error("正文生成失败，请重试");
    }
  };
  
  // 生成标签
  const handleGenerateHashtags = async () => {
    if (!selectedTitle || !scenario) {
      toast.error("请先生成标题和正文");
      return;
    }
    
    try {
      const result = await generateHashtags.mutateAsync({
        scenario,
        title: selectedTitle.text,
        schoolRegion: schoolRegion || undefined,
        schoolName: schoolName || undefined,
      });
      setGeneratedContent(prev => ({ ...prev, hashtags: result }));
      setStep(4);
      toast.success("标签生成成功！");
    } catch (error) {
      toast.error("标签生成失败，请重试");
    }
  };
  
  // 生成封面
  const handleGenerateCover = async () => {
    if (!selectedTitle || !scenario || !emotion) {
      toast.error("请先完成前面的步骤");
      return;
    }
    
    try {
      const result = await generateCover.mutateAsync({
        title: selectedTitle.text,
        scenario,
        emotion,
      });
      setGeneratedContent(prev => ({ ...prev, cover: result }));
      setStep(5);
      toast.success("封面文案生成成功！");
    } catch (error) {
      toast.error("封面生成失败，请重试");
    }
  };
  
  // 保存飞书配置
  const handleSaveFeishuConfig = async () => {
    if (!feishuAppId || !feishuAppSecret) {
      toast.error("请填写飞书应用的 App ID 和 App Secret");
      return;
    }
    
    try {
      const result = await saveFeishuConfigMutation.mutateAsync({
        appId: feishuAppId,
        appSecret: feishuAppSecret,
        appToken: feishuAppToken || undefined,
        tableId: feishuTableId || undefined,
      });
      toast.success(result.message || "飞书配置保存成功！");
      setFeishuDialogOpen(false);
      refetchFeishuConfig();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "配置保存失败";
      toast.error(errorMessage);
    }
  };
  
  // 导出到飞书（单篇）
  const handleExportToFeishu = async () => {
    if (!feishuConfig?.configured || !feishuConfig?.hasAppToken || !feishuConfig?.hasTableId) {
      setFeishuDialogOpen(true);
      toast.error("请先完成飞书多维表格配置");
      return;
    }
    
    if (!selectedTitle || !generatedContent.note || !generatedContent.hashtags || !generatedContent.cover) {
      toast.error("请先完成所有内容生成");
      return;
    }
    
    try {
      const result = await exportToFeishu.mutateAsync({
        title: `${selectedTitle.emoji} ${selectedTitle.text}`,
        note: generatedContent.note.content,
        hashtags: generatedContent.hashtags.hashtags,
        coverText: generatedContent.cover.mainText,
        coverSubText: generatedContent.cover.subText,
        scenario: scenario || "",
        emotion: emotion || "",
        personaType: personaType || "",
        schoolName: schoolName || undefined,
      });
      toast.success("导出成功！");
      window.open(result.url, "_blank");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "导出失败";
      toast.error(errorMessage);
    }
  };
  
  // 批量导出到飞书
  const handleBatchExportToFeishu = async () => {
    if (!feishuConfig?.configured || !feishuConfig?.hasAppToken || !feishuConfig?.hasTableId) {
      setFeishuDialogOpen(true);
      toast.error("请先完成飞书多维表格配置");
      return;
    }
    
    const selectedItems = batchResults.filter((_, i) => selectedBatchItems.has(i));
    if (selectedItems.length === 0) {
      toast.error("请至少选择一篇内容导出");
      return;
    }
    
    try {
      const items = selectedItems.map(item => ({
        title: item.title,
        note: item.note,
        hashtags: item.hashtags,
        coverText: item.cover.mainText,
        coverSubText: item.cover.subText,
        scenario: item.scenario,
        emotion: item.emotion,
        personaType: item.personaType,
        schoolName: item.schoolName,
      }));
      
      const result = await batchExportToFeishu.mutateAsync({ items });
      toast.success(`成功导出 ${result.count} 篇内容到飞书！`);
      window.open(result.url, "_blank");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "批量导出失败";
      toast.error(errorMessage);
    }
  };
  
  // 复制内容
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}已复制到剪贴板`);
  };
  
  // 复制全部内容
  const copyAllContent = () => {
    if (!selectedTitle || !generatedContent.note || !generatedContent.hashtags) {
      toast.error("内容不完整");
      return;
    }
    
    const fullContent = `${selectedTitle.emoji} ${selectedTitle.text}

${generatedContent.note.content}

${generatedContent.hashtags.hashtags.join(" ")}`;
    
    navigator.clipboard.writeText(fullContent);
    toast.success("全部内容已复制到剪贴板");
  };
  
  // 切换批量选择
  const toggleBatchItem = (index: number) => {
    const newSelected = new Set(selectedBatchItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedBatchItems(newSelected);
  };
  
  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedBatchItems.size === batchResults.length) {
      setSelectedBatchItems(new Set());
    } else {
      setSelectedBatchItems(new Set(batchResults.map((_, i) => i)));
    }
  };

  // 清空批量结果
  const handleClearBatchResults = () => {
    if (batchResults.length > 0) {
      if (confirm("确定要清空所有生成结果吗？此操作不可恢复。")) {
        setBatchResults([]);
        setSelectedBatchItems(new Set());
        toast.success("已清空所有结果");
      }
    }
  };

  // 清空单篇结果
  const handleClearSingleResults = () => {
    if (generatedContent.titles || generatedContent.note || generatedContent.hashtags || generatedContent.cover) {
      if (confirm("确定要清空当前生成结果吗？此操作不可恢复。")) {
        setGeneratedContent({});
        setSelectedTitle(null);
        setStep(1);
        toast.success("已清空当前结果");
      }
    }
  };

  // 检查是否有未保存的内容
  const hasUnsavedContent = batchResults.length > 0 || 
    generatedContent.titles || generatedContent.note || 
    generatedContent.hashtags || generatedContent.cover;

  // 离开页面前提示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedContent) {
        e.preventDefault();
        e.returnValue = "您有未导出的内容，确定要离开吗？";
        return e.returnValue;
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedContent]);
  
  if (!isAuthenticated) {
    return (
      <div className="container py-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>请先登录</CardTitle>
            <CardDescription>登录后即可使用内容生成功能</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="gradient-primary">
              <a href={getLoginUrl()}>立即登录</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      {/* 生成进度提示 */}
      <ProgressIndicator
        isLoading={isGenerating}
        title={mode === "batch" ? `正在批量生成 ${batchCount} 篇内容...` : "正在生成内容..."}
        steps={getGenerationSteps()}
        currentStep={1}
        estimatedTime={getEstimatedTime()}
      />
      
      {/* 导出进度提示 */}
      <ProgressIndicator
        isLoading={isExporting}
        title="正在导出到飞书..."
        steps={["连接飞书服务...", "写入多维表格..."]}
        currentStep={1}
        estimatedTime={5}
      />

      {/* 页面标题和模式切换 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">内容生成工作台</h1>
          <p className="text-muted-foreground">一站式生成小红书爆款内容</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 模式切换 */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as "single" | "batch")}>
            <TabsList>
              <TabsTrigger value="single" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                单篇生成
              </TabsTrigger>
              <TabsTrigger value="batch" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                批量生成
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* 飞书配置按钮 */}
          <Dialog open={feishuDialogOpen} onOpenChange={setFeishuDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                飞书配置
                {feishuConfig?.configured && feishuConfig?.hasAppToken && feishuConfig?.hasTableId && (
                  <Check className="w-4 h-4 ml-2 text-green-500" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Table2 className="w-5 h-5" />
                  飞书多维表格配置
                </DialogTitle>
                <DialogDescription>
                  配置飞书应用以导出生成内容到多维表格
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    配置说明
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>在<a href="https://open.feishu.cn/app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">飞书开放平台</a>创建应用</li>
                    <li>获取 App ID 和 App Secret</li>
                    <li>创建多维表格并获取 App Token（URL 中的 base 后面的字符串）</li>
                    <li>获取数据表 Table ID（URL 中的 table 参数）</li>
                    <li>给应用添加多维表格的读写权限</li>
                  </ol>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>App ID <span className="text-destructive">*</span></Label>
                  <Input 
                    value={feishuAppId}
                    onChange={(e) => setFeishuAppId(e.target.value)}
                    placeholder="cli_xxxxxxxxxx"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>App Secret <span className="text-destructive">*</span></Label>
                  <Input 
                    type="password"
                    value={feishuAppSecret}
                    onChange={(e) => setFeishuAppSecret(e.target.value)}
                    placeholder="xxxxxxxxxxxxxxxx"
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>多维表格 App Token <span className="text-destructive">*</span></Label>
                  <Input 
                    value={feishuAppToken}
                    onChange={(e) => setFeishuAppToken(e.target.value)}
                    placeholder="bascnxxxxxxxxxx（从多维表格 URL 获取）"
                  />
                  <p className="text-xs text-muted-foreground">
                    例如 URL: https://xxx.feishu.cn/base/<span className="text-primary">bascnXXXXXX</span>?table=...
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>数据表 Table ID <span className="text-destructive">*</span></Label>
                  <Input 
                    value={feishuTableId}
                    onChange={(e) => setFeishuTableId(e.target.value)}
                    placeholder="tblxxxxxxxxxx（从多维表格 URL 获取）"
                  />
                  <p className="text-xs text-muted-foreground">
                    例如 URL: ...?table=<span className="text-primary">tblXXXXXX</span>&view=...
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setFeishuDialogOpen(false)}>
                  取消
                </Button>
                <Button 
                  onClick={handleSaveFeishuConfig}
                  disabled={saveFeishuConfigMutation.isPending}
                >
                  {saveFeishuConfigMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  保存配置
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {mode === "single" ? (
        <>
          {/* 单篇模式：进度指示器 */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { num: 1, label: "配置", icon: Settings },
              { num: 2, label: "标题", icon: FileText },
              { num: 3, label: "正文", icon: FileText },
              { num: 4, label: "标签", icon: Hash },
              { num: 5, label: "封面", icon: Image },
            ].map((item, index) => (
              <div key={item.num} className="flex items-center">
                <button
                  onClick={() => step >= item.num && setStep(item.num)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    step === item.num
                      ? "bg-primary text-primary-foreground"
                      : step > item.num
                      ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > item.num ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <item.icon className="w-4 h-4" />
                  )}
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
                {index < 4 && <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground" />}
              </div>
            ))}
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 左侧：配置面板 */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    基础配置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 业务场景 */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      业务场景
                    </Label>
                    <Select value={scenario} onValueChange={(v) => setScenario(v as Scenario)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择业务场景" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SCENARIOS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span>{value.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {value.keywords.slice(0, 3).join("、")}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* 目标情绪 */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      目标情绪
                    </Label>
                    <Select value={emotion} onValueChange={(v) => setEmotion(v as Emotion)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择目标情绪" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EMOTIONS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <span>{value.emoji[0]}</span>
                              <span>{value.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* 人设类型 */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      人设类型
                    </Label>
                    <Select value={personaType} onValueChange={(v) => setPersonaType(v as PersonaType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择人设类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PERSONAS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span>{value.name}</span>
                              <span className="text-xs text-muted-foreground">{value.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  {/* 留学地区 */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      留学地区（可选）
                    </Label>
                    <Select 
                      value={schoolRegion} 
                      onValueChange={(v) => {
                        setSchoolRegion(v as SchoolRegion);
                        setSchoolName(""); // 重置学校选择
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择留学地区" />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolData && Object.entries(schoolData).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* 学校名称 */}
                  {schoolRegion && schools.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <School className="w-4 h-4" />
                        学校名称（可选）
                      </Label>
                      <Select value={schoolName} onValueChange={setSchoolName}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择学校" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-[200px]">
                            {schools.map((school) => (
                              <SelectItem key={school.name} value={school.name}>
                                <div className="flex flex-col">
                                  <span>{school.name}</span>
                                  {school.abbr && (
                                    <span className="text-xs text-muted-foreground">{school.abbr}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* 补充信息 */}
                  <div className="space-y-2">
                    <Label>补充信息（可选）</Label>
                    <Textarea 
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="输入更多背景信息，帮助生成更精准的内容..."
                      rows={3}
                    />
                  </div>
                  
                  {/* 生成按钮 */}
                  <Button 
                    className="w-full gradient-primary"
                    onClick={handleGenerateTitles}
                    disabled={!isConfigComplete || generateTitles.isPending}
                  >
                    {generateTitles.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    开始生成标题
                  </Button>
                </CardContent>
              </Card>
              
              {/* 快捷操作 */}
              {step >= 5 && generatedContent.cover && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      导出内容
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={copyAllContent}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      复制全部内容
                    </Button>
                    <Button 
                      className="w-full"
                      onClick={handleExportToFeishu}
                      disabled={exportToFeishu.isPending}
                    >
                      {exportToFeishu.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      导出到飞书多维表格
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* 右侧：生成结果 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 2: 标题选择 */}
              {step >= 2 && generatedContent.titles && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        选择标题
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleGenerateTitles}
                        disabled={generateTitles.isPending}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${generateTitles.isPending ? "animate-spin" : ""}`} />
                        重新生成
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {generatedContent.titles.titles.map((title, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedTitle({ text: title.text, emoji: title.emoji })}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedTitle?.text === title.text
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-lg">
                                {title.emoji} {title.text}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">{title.reason}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                <Star className="w-3 h-3 mr-1" />
                                {title.score}/10
                              </Badge>
                              {selectedTitle?.text === title.text && (
                                <Check className="w-5 h-5 text-primary" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {selectedTitle && (
                      <Button 
                        className="w-full mt-4"
                        onClick={handleGenerateNote}
                        disabled={generateNote.isPending}
                      >
                        {generateNote.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ChevronRight className="w-4 h-4 mr-2" />
                        )}
                        使用此标题生成正文
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Step 3: 正文 */}
              {step >= 3 && generatedContent.note && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        笔记正文
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.note!.content, "正文")}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          复制
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleGenerateNote}
                          disabled={generateNote.isPending}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${generateNote.isPending ? "animate-spin" : ""}`} />
                          重新生成
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                        {generatedContent.note.content}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 text-sm text-muted-foreground">
                      <Badge variant="outline">
                        字数：{generatedContent.note.content.length}
                      </Badge>
                    </div>
                    
                    <Button 
                      className="w-full mt-4"
                      onClick={handleGenerateHashtags}
                      disabled={generateHashtags.isPending}
                    >
                      {generateHashtags.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      )}
                      生成话题标签
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Step 4: 标签 */}
              {step >= 4 && generatedContent.hashtags && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Hash className="w-5 h-5" />
                        话题标签
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.hashtags!.hashtags.join(" "), "标签")}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        复制全部
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.hashtags.hashtags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => copyToClipboard(tag, "标签")}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full mt-4"
                      onClick={handleGenerateCover}
                      disabled={generateCover.isPending}
                    >
                      {generateCover.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      )}
                      生成封面文案
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Step 5: 封面 */}
              {step >= 5 && generatedContent.cover && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        封面设计
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleGenerateCover}
                        disabled={generateCover.isPending}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${generateCover.isPending ? "animate-spin" : ""}`} />
                        重新生成
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CoverPreview 
                      mainText={generatedContent.cover.mainText}
                      subText={generatedContent.cover.subText}
                      highlightWords={generatedContent.cover.highlightWords}
                      template={generatedContent.cover.template}
                      colorScheme={generatedContent.cover.colorScheme}
                    />
                  </CardContent>
                </Card>
              )}
              
              {/* 初始状态提示 */}
              {step === 1 && (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">开始创作</h3>
                    <p className="text-muted-foreground">
                      在左侧完成基础配置后，点击"开始生成标题"按钮
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      ) : (
        /* 批量模式 */
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧：配置面板 */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  批量生成配置
                </CardTitle>
                <CardDescription>
                  一次生成多篇完整内容，支持一键导出到飞书
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 生成数量 */}
                <div className="space-y-2">
                  <Label>生成数量</Label>
                  <Select value={String(batchCount)} onValueChange={(v) => setBatchCount(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5, 8, 10, 20, 30, 50].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} 篇
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                {/* 业务场景 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    业务场景
                  </Label>
                  <Select value={scenario} onValueChange={(v) => setScenario(v as Scenario)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择业务场景" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SCENARIOS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* 目标情绪 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    目标情绪
                  </Label>
                  <Select value={emotion} onValueChange={(v) => setEmotion(v as Emotion)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择目标情绪" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EMOTIONS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            {value.emoji[0]} {value.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* 人设类型 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    人设类型
                  </Label>
                  <Select value={personaType} onValueChange={(v) => setPersonaType(v as PersonaType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择人设类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PERSONAS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                {/* 留学地区 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    留学地区（可选）
                  </Label>
                  <Select 
                    value={schoolRegion} 
                    onValueChange={(v) => {
                      setSchoolRegion(v as SchoolRegion);
                      setSchoolName("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择留学地区" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolData && Object.entries(schoolData).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* 学校名称 */}
                {schoolRegion && schools.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <School className="w-4 h-4" />
                      学校名称（可选）
                    </Label>
                    <Select value={schoolName} onValueChange={setSchoolName}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择学校" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {schools.map((school) => (
                            <SelectItem key={school.name} value={school.name}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* 补充信息 */}
                <div className="space-y-2">
                  <Label>补充信息（可选）</Label>
                  <Textarea 
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="输入更多背景信息..."
                    rows={2}
                  />
                </div>
                
                {/* 生成按钮 */}
                <Button 
                  className="w-full gradient-primary"
                  onClick={handleBatchGenerate}
                  disabled={!isConfigComplete || generateBatch.isPending}
                >
                  {generateBatch.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  批量生成 {batchCount} 篇内容
                </Button>
              </CardContent>
            </Card>
            
            {/* 导出操作 */}
            {batchResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    批量导出
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>已选择 {selectedBatchItems.size} / {batchResults.length} 篇</span>
                    <Button variant="link" size="sm" onClick={toggleSelectAll}>
                      {selectedBatchItems.size === batchResults.length ? "取消全选" : "全选"}
                    </Button>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={handleBatchExportToFeishu}
                    disabled={batchExportToFeishu.isPending || selectedBatchItems.size === 0}
                  >
                    {batchExportToFeishu.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    导出到飞书多维表格
                  </Button>
                  <Separator />
                  <Button 
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={handleClearBatchResults}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    清空所有结果
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* 右侧：批量结果 */}
          <div className="lg:col-span-2">
            {batchResults.length > 0 ? (
              <div className="space-y-4">
                {batchResults.map((item, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all ${
                      selectedBatchItems.has(index) ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => toggleBatchItem(index)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{SCENARIOS[item.scenario as Scenario]?.label}</Badge>
                            <Badge variant="outline">{EMOTIONS[item.emotion as Emotion]?.label}</Badge>
                            <Badge variant="outline">{PERSONAS[item.personaType as PersonaType]?.name}</Badge>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedBatchItems.has(index) 
                            ? "bg-primary border-primary text-primary-foreground" 
                            : "border-muted-foreground"
                        }`}>
                          {selectedBatchItems.has(index) && <Check className="w-4 h-4" />}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">正文预览</p>
                          <p className="text-sm line-clamp-3">{item.note}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">话题标签</p>
                          <div className="flex flex-wrap gap-1">
                            {item.hashtags.slice(0, 5).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                            {item.hashtags.length > 5 && (
                              <Badge variant="secondary" className="text-xs">+{item.hashtags.length - 5}</Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">封面文案</p>
                          <p className="text-sm">{item.cover.mainText}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">批量生成模式</h3>
                  <p className="text-muted-foreground">
                    配置参数后，一次生成多篇完整内容<br />
                    支持一键导出到飞书多维表格
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
