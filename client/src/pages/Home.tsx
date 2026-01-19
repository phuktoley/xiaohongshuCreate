import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { 
  Sparkles, 
  FileText, 
  Hash, 
  Image, 
  History, 
  TrendingUp, 
  User,
  ArrowRight,
  Zap,
  Target,
  Heart
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "智能标题生成",
    description: "基于人设风格生成5-10个爆款标题，严格控制18字符以内",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: FileText,
    title: "笔记正文生成",
    description: "300-500字高质量笔记，包含开头、正文和互动引导",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Hash,
    title: "话题标签推荐",
    description: "智能推荐相关话题标签，按场景、学校、申诉分类",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Image,
    title: "封面文案生成",
    description: "生成吸睛封面文案，支持多种类型和配色方案",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

const SCENARIOS = [
  { label: "延期", emoji: "⏰" },
  { label: "退学", emoji: "🚪" },
  { label: "学术不端", emoji: "📝" },
  { label: "挂科", emoji: "📉" },
  { label: "休学", emoji: "🏠" },
  { label: "撤课", emoji: "📚" },
];

const EMOTIONS = [
  { label: "共鸣型", emoji: "😭", color: "bg-pink-500" },
  { label: "警示型", emoji: "⚠️", color: "bg-red-500" },
  { label: "求助型", emoji: "🙏", color: "bg-blue-500" },
  { label: "成功型", emoji: "✅", color: "bg-green-500" },
  { label: "吐槽型", emoji: "😅", color: "bg-purple-500" },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container py-20 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 gradient-primary text-white border-0">
              <Zap className="w-3 h-3 mr-1" />
              AI 驱动的内容创作
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              小红书爆款内容
              <span className="text-primary">生成助手</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              专为留学生打造的申诉内容创作工具，一键生成高互动的小红书标题、笔记、标签和封面文案
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button asChild size="lg" className="gradient-primary text-lg px-8">
                  <Link href="/generator">
                    <Sparkles className="w-5 h-5 mr-2" />
                    开始创作
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="gradient-primary text-lg px-8">
                  <a href={getLoginUrl()}>
                    <Sparkles className="w-5 h-5 mr-2" />
                    立即开始
                  </a>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link href="/hot-database">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  查看爆款案例
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">核心功能</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              从标题到封面，全方位覆盖小红书内容创作需求
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => (
              <Card key={index} className="card-hover border-0 shadow-sm">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios & Emotions Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Scenarios */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">6大业务场景</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                覆盖留学生最常遇到的学业问题场景
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SCENARIOS.map((scenario, index) => (
                  <Card key={index} className="card-hover">
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-2xl">{scenario.emoji}</span>
                      <span className="font-medium">{scenario.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Emotions */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">5种情绪类型</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                精准把握读者情绪，提升内容互动率
              </p>
              <div className="flex flex-wrap gap-3">
                {EMOTIONS.map((emotion, index) => (
                  <Badge 
                    key={index} 
                    className={`${emotion.color} text-white text-sm py-2 px-4`}
                  >
                    <span className="mr-2">{emotion.emoji}</span>
                    {emotion.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">快速入口</h2>
            <p className="text-muted-foreground">
              {isAuthenticated ? `欢迎回来，${user?.name || "用户"}！选择功能开始创作` : "登录后解锁全部功能"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-hover group">
              <Link href="/generator">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">内容生成</h3>
                  <p className="text-sm text-muted-foreground">
                    一站式生成标题、正文、标签和封面
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="card-hover group">
              <Link href="/personas">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-blue-500/10">
                      <User className="w-6 h-6 text-blue-500" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">人设管理</h3>
                  <p className="text-sm text-muted-foreground">
                    创建和管理你的创作人设
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="card-hover group">
              <Link href="/history">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-green-500/10">
                      <History className="w-6 h-6 text-green-500" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">历史记录</h3>
                  <p className="text-sm text-muted-foreground">
                    查看和管理生成历史
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="card-hover group">
              <Link href="/hot-database">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-orange-500/10">
                      <TrendingUp className="w-6 h-6 text-orange-500" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">爆款数据库</h3>
                  <p className="text-sm text-muted-foreground">
                    学习高互动内容模式
                  </p>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          <p>小红书爆款内容生成助手 - 专为留学生打造</p>
        </div>
      </footer>
    </div>
  );
}
