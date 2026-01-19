import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  FileText, Star, StarOff, Trash2, Download, Eye, Clock, 
  Hash, Image, CheckCircle2, RefreshCw, Copy, ChevronDown, 
  ChevronUp, Filter, Heart
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { SCENARIOS, EMOTIONS, type Scenario, type Emotion } from "@shared/xhs";

type Content = {
  id: number;
  title: string;
  note: string;
  hashtags: string[] | null;
  coverMainText: string | null;
  coverSubText: string | null;
  coverColorScheme: { primary: string; secondary: string; highlight: string; text: string; background: string } | null;
  coverLayout: string | null;
  coverType: string | null;
  scenario: string | null;
  emotion: string | null;
  personaType: string | null;
  schoolName: string | null;
  isFavorite: boolean | null;
  isExported: boolean | null;
  exportedAt: Date | null;
  createdAt: Date;
};

export default function History() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterScenario, setFilterScenario] = useState<string | null>(null);
  const [filterEmotion, setFilterEmotion] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { data: contents, isLoading, refetch } = trpc.content.list.useQuery(
    { limit: 200 },
    { enabled: isAuthenticated }
  );
  const { data: favorites } = trpc.content.favorites.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: feishuConfig } = trpc.feishu.getConfig.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const toggleFavorite = trpc.content.toggleFavorite.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("操作成功");
    },
  });

  const deleteContent = trpc.content.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("删除成功");
    },
  });

  const batchExport = trpc.feishu.batchExport.useMutation({
    onSuccess: () => {
      toast.success("导出成功");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const markBatchExported = trpc.content.markBatchExported.useMutation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <FileText className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">请先登录</h2>
        <p className="text-muted-foreground">登录后可查看您的内容历史记录</p>
        <Button asChild>
          <a href={getLoginUrl()}>立即登录</a>
        </Button>
      </div>
    );
  }

  // 过滤数据
  const filterData = (data: Content[] | undefined) => {
    if (!data) return [];
    let filtered = [...data];
    if (filterScenario) {
      filtered = filtered.filter(c => c.scenario === filterScenario);
    }
    if (filterEmotion) {
      filtered = filtered.filter(c => c.emotion === filterEmotion);
    }
    return filtered;
  };

  const displayData = activeTab === "favorites" 
    ? filterData(favorites) 
    : filterData(contents);

  const handleSelectAll = () => {
    if (selectedIds.length === displayData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayData.map(c => c.id));
    }
  };

  const handleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchExport = async () => {
    if (selectedIds.length === 0) {
      toast.error("请先选择要导出的内容");
      return;
    }
    if (!feishuConfig?.configured || !feishuConfig?.hasAppToken || !feishuConfig?.hasTableId) {
      toast.error("请先配置飞书多维表格");
      return;
    }

    const selectedContents = displayData.filter(c => selectedIds.includes(c.id));
    const items = selectedContents.map(c => ({
      title: c.title,
      note: c.note,
      hashtags: c.hashtags || [],
      coverText: c.coverMainText || "",
      coverSubText: c.coverSubText || "",
      scenario: c.scenario || "",
      emotion: c.emotion || "",
      personaType: c.personaType || "",
      schoolName: c.schoolName || "",
    }));

    await batchExport.mutateAsync({ items });
    await markBatchExported.mutateAsync({ ids: selectedIds });
    setSelectedIds([]);
  };

  const handleCopyContent = (content: Content) => {
    const text = `${content.title}\n\n${content.note}\n\n${(content.hashtags || []).map(t => `#${t}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  const getScenarioLabel = (scenario: string | null) => {
    if (!scenario) return "未知";
    return SCENARIOS[scenario as Scenario]?.label || scenario;
  };

  const getEmotionLabel = (emotion: string | null) => {
    if (!emotion) return "未知";
    return EMOTIONS[emotion as Emotion]?.label || emotion;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">内容管理</h1>
            <p className="text-muted-foreground">管理您生成的所有内容，支持筛选、收藏和批量导出</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-1" />
              筛选
              {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              刷新
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">场景</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={filterScenario === null ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setFilterScenario(null)}
                    >
                      全部
                    </Badge>
                    {Object.entries(SCENARIOS).map(([key, s]) => (
                      <Badge 
                        key={key}
                        variant={filterScenario === key ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setFilterScenario(key)}
                      >
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">情绪</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={filterEmotion === null ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setFilterEmotion(null)}
                    >
                      全部
                    </Badge>
                    {Object.entries(EMOTIONS).map(([key, e]) => (
                      <Badge 
                        key={key}
                        variant={filterEmotion === key ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setFilterEmotion(key)}
                      >
                        {e.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 操作栏 */}
        <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-4">
            <Checkbox 
              checked={displayData.length > 0 && selectedIds.length === displayData.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              已选择 {selectedIds.length} 项
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={selectedIds.length === 0 || batchExport.isPending}
              onClick={handleBatchExport}
            >
              {batchExport.isPending ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              导出到飞书 ({selectedIds.length})
            </Button>
          </div>
        </div>

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              全部内容 ({contents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-1" />
              收藏 ({favorites?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ContentList 
              data={displayData}
              isLoading={isLoading}
              selectedIds={selectedIds}
              expandedId={expandedId}
              onSelect={handleSelect}
              onExpand={setExpandedId}
              onToggleFavorite={(id, isFavorite) => toggleFavorite.mutate({ id, isFavorite })}
              onDelete={(id) => deleteContent.mutate({ id })}
              onCopy={handleCopyContent}
              getScenarioLabel={getScenarioLabel}
              getEmotionLabel={getEmotionLabel}
            />
          </TabsContent>

          <TabsContent value="favorites">
            <ContentList 
              data={displayData}
              isLoading={isLoading}
              selectedIds={selectedIds}
              expandedId={expandedId}
              onSelect={handleSelect}
              onExpand={setExpandedId}
              onToggleFavorite={(id, isFavorite) => toggleFavorite.mutate({ id, isFavorite })}
              onDelete={(id) => deleteContent.mutate({ id })}
              onCopy={handleCopyContent}
              getScenarioLabel={getScenarioLabel}
              getEmotionLabel={getEmotionLabel}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 内容列表组件
function ContentList({
  data,
  isLoading,
  selectedIds,
  expandedId,
  onSelect,
  onExpand,
  onToggleFavorite,
  onDelete,
  onCopy,
  getScenarioLabel,
  getEmotionLabel,
}: {
  data: Content[];
  isLoading: boolean;
  selectedIds: number[];
  expandedId: number | null;
  onSelect: (id: number) => void;
  onExpand: (id: number | null) => void;
  onToggleFavorite: (id: number, isFavorite: boolean) => void;
  onDelete: (id: number) => void;
  onCopy: (content: Content) => void;
  getScenarioLabel: (s: string | null) => string;
  getEmotionLabel: (e: string | null) => string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mb-4" />
        <p>暂无内容</p>
        <p className="text-sm mt-2">生成内容后会自动保存到这里</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((content) => (
        <Card 
          key={content.id} 
          className={`transition-all ${selectedIds.includes(content.id) ? 'ring-2 ring-primary' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* 选择框 */}
              <Checkbox 
                checked={selectedIds.includes(content.id)}
                onCheckedChange={() => onSelect(content.id)}
                className="mt-1"
              />

              {/* 主要内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* 标题 */}
                    <h3 className="font-semibold text-lg truncate">{content.title}</h3>
                    
                    {/* 标签 */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {getScenarioLabel(content.scenario)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getEmotionLabel(content.emotion)}
                      </Badge>
                      {content.schoolName && (
                        <Badge variant="outline" className="text-xs">
                          {content.schoolName}
                        </Badge>
                      )}
                      {content.isExported && (
                        <Badge variant="default" className="text-xs bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          已导出
                        </Badge>
                      )}
                    </div>

                    {/* 时间 */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(content.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleFavorite(content.id, !content.isFavorite)}
                      title={content.isFavorite ? "取消收藏" : "收藏"}
                    >
                      {content.isFavorite ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onCopy(content)}
                      title="复制内容"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onExpand(expandedId === content.id ? null : content.id)}
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("确定要删除这条内容吗？")) {
                          onDelete(content.id);
                        }
                      }}
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* 展开详情 */}
                {expandedId === content.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {/* 正文 */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        正文内容
                      </h4>
                      <div className="bg-muted/50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                        {content.note}
                      </div>
                    </div>

                    {/* 话题标签 */}
                    {content.hashtags && content.hashtags.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          话题标签
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {content.hashtags.map((tag, i) => (
                            <Badge key={i} variant="secondary">#{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 封面信息 */}
                    {content.coverMainText && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          封面文案
                        </h4>
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="font-semibold">{content.coverMainText}</p>
                          {content.coverSubText && (
                            <p className="text-sm text-muted-foreground mt-1">{content.coverSubText}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
