import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Heart, Filter } from "lucide-react";
import { SCENARIOS, EMOTIONS, type Scenario, type Emotion } from "@shared/xhs";

export default function HotDatabase() {
  const [scenarioFilter, setScenarioFilter] = useState<Scenario | "all">("all");
  const [emotionFilter, setEmotionFilter] = useState<Emotion | "all">("all");

  const { data: hotContent, isLoading } = trpc.hotContent.list.useQuery({
    scenario: scenarioFilter === "all" ? undefined : scenarioFilter,
    emotion: emotionFilter === "all" ? undefined : emotionFilter,
  });

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      empathy: "bg-pink-500",
      warning: "bg-red-500",
      help: "bg-blue-500",
      success: "bg-green-500",
      critic: "bg-purple-500",
    };
    return colors[emotion] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">爆款内容数据库</h1>
          <p className="text-muted-foreground">分析高互动小红书帖子，学习爆款标题模式</p>
        </div>

        {/* 筛选器 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <Select 
                  value={scenarioFilter} 
                  onValueChange={(v) => setScenarioFilter(v as Scenario | "all")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择场景" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部场景</SelectItem>
                    {Object.entries(SCENARIOS).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select 
                  value={emotionFilter} 
                  onValueChange={(v) => setEmotionFilter(v as Emotion | "all")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择情绪" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部情绪</SelectItem>
                    {Object.entries(EMOTIONS).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{config.emoji[0]}</span>
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总案例数</p>
                  <p className="text-2xl font-bold">{hotContent?.length || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">平均点赞</p>
                  <p className="text-2xl font-bold">
                    {hotContent && hotContent.length > 0
                      ? Math.round(hotContent.reduce((sum, item) => sum + item.likes, 0) / hotContent.length)
                      : 0}
                  </p>
                </div>
                <Heart className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">最高点赞</p>
                  <p className="text-2xl font-bold">
                    {hotContent && hotContent.length > 0
                      ? Math.max(...hotContent.map(item => item.likes))
                      : 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">标题模式</p>
                  <p className="text-2xl font-bold">
                    {hotContent 
                      ? new Set(hotContent.map(item => item.pattern)).size
                      : 0}
                  </p>
                </div>
                <Filter className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 内容列表 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : hotContent && hotContent.length > 0 ? (
          <div className="space-y-4">
            {hotContent.map((item, index) => (
              <Card key={index} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <h3 className="text-lg font-medium">{item.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary">
                          {SCENARIOS[item.scenario as keyof typeof SCENARIOS]?.label || item.scenario}
                        </Badge>
                        <Badge className={`${getEmotionColor(item.emotion)} text-white`}>
                          {EMOTIONS[item.emotion as keyof typeof EMOTIONS]?.emoji[0]}{" "}
                          {EMOTIONS[item.emotion as keyof typeof EMOTIONS]?.label || item.emotion}
                        </Badge>
                        <Badge variant="outline">{item.pattern}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-red-500">
                        <Heart className="w-5 h-5 fill-current" />
                        <span className="text-xl font-bold">{item.likes.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">点赞数</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">暂无数据</h3>
            <p className="text-muted-foreground">调整筛选条件试试</p>
          </div>
        )}
      </div>
    </div>
  );
}
