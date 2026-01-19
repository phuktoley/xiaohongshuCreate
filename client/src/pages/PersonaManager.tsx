import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, User, Sparkles, Search, Link2 } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { DEFAULT_PERSONAS, type PersonaType } from "@shared/xhs";

export default function PersonaManager() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "senior_sister" as PersonaType,
    description: "",
    greetings: "",
    toneWords: "",
    emojiStyle: "",
    samplePhrases: "",
  });

  // 账号分析状态
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  const [accountUrl, setAccountUrl] = useState("");

  const { data: personas, isLoading } = trpc.persona.list.useQuery();

  const createMutation = trpc.persona.create.useMutation({
    onSuccess: () => {
      utils.persona.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
      toast.success("人设创建成功！");
    },
    onError: (error) => {
      toast.error("创建失败：" + error.message);
    },
  });

  const updateMutation = trpc.persona.update.useMutation({
    onSuccess: () => {
      utils.persona.list.invalidate();
      setEditingPersona(null);
      resetForm();
      toast.success("人设更新成功！");
    },
    onError: (error) => {
      toast.error("更新失败：" + error.message);
    },
  });

  const deleteMutation = trpc.persona.delete.useMutation({
    onSuccess: () => {
      utils.persona.list.invalidate();
      toast.success("人设已删除");
    },
    onError: (error) => {
      toast.error("删除失败：" + error.message);
    },
  });

  // 账号分析 mutation
  const analyzeMutation = trpc.persona.analyzeAccount.useMutation({
    onSuccess: (data) => {
      // 将分析结果填充到表单
      setFormData({
        name: data.name,
        type: data.suggestedType as PersonaType,
        description: data.description,
        greetings: data.greetings.join("，"),
        toneWords: data.toneWords.join("，"),
        emojiStyle: data.emojiStyle.join(""),
        samplePhrases: data.samplePhrases.join("\n"),
      });
      setAnalyzeDialogOpen(false);
      setIsCreateOpen(true);
      toast.success("账号分析完成，请查看生成的人设");
    },
    onError: (error) => {
      toast.error("分析失败：" + error.message);
    },
  });

  const handleAnalyzeAccount = () => {
    if (!accountUrl.trim()) {
      toast.error("请输入小红书账号链接");
      return;
    }
    analyzeMutation.mutate({ accountUrl: accountUrl.trim() });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "senior_sister",
      description: "",
      greetings: "",
      toneWords: "",
      emojiStyle: "",
      samplePhrases: "",
    });
  };

  const handleCreate = () => {
    createMutation.mutate({
      name: formData.name,
      type: formData.type,
      description: formData.description || undefined,
      greetings: formData.greetings ? formData.greetings.split("，").map(s => s.trim()) : undefined,
      toneWords: formData.toneWords ? formData.toneWords.split("，").map(s => s.trim()) : undefined,
      emojiStyle: formData.emojiStyle ? Array.from(formData.emojiStyle).filter(s => s.trim()) : undefined,
      samplePhrases: formData.samplePhrases ? formData.samplePhrases.split("\n").map(s => s.trim()).filter(Boolean) : undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingPersona) return;
    updateMutation.mutate({
      id: editingPersona,
      name: formData.name,
      description: formData.description || undefined,
      greetings: formData.greetings ? formData.greetings.split("，").map(s => s.trim()) : undefined,
      toneWords: formData.toneWords ? formData.toneWords.split("，").map(s => s.trim()) : undefined,
      emojiStyle: formData.emojiStyle ? Array.from(formData.emojiStyle).filter(s => s.trim()) : undefined,
      samplePhrases: formData.samplePhrases ? formData.samplePhrases.split("\n").map(s => s.trim()).filter(Boolean) : undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个人设吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  const loadPreset = (type: PersonaType) => {
    const preset = DEFAULT_PERSONAS[type];
    setFormData({
      ...formData,
      type,
      name: preset.name,
      description: preset.description,
      greetings: preset.greetings.join("，"),
      toneWords: preset.toneWords.join("，"),
      emojiStyle: preset.emojiStyle.join(""),
      samplePhrases: preset.samplePhrases.join("\n"),
    });
  };

  const startEdit = (persona: NonNullable<typeof personas>[number]) => {
    setEditingPersona(persona.id);
    setFormData({
      name: persona.name,
      type: persona.type as PersonaType,
      description: persona.description || "",
      greetings: persona.greetings?.join("，") || "",
      toneWords: persona.toneWords?.join("，") || "",
      emojiStyle: persona.emojiStyle?.join("") || "",
      samplePhrases: persona.samplePhrases?.join("\n") || "",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">请先登录</CardTitle>
            <CardDescription>登录后管理你的人设</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild className="gradient-primary">
              <a href={getLoginUrl()}>立即登录</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const PersonaForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>人设类型</Label>
        <Select 
          value={formData.type} 
          onValueChange={(v) => {
            if (!isEdit) loadPreset(v as PersonaType);
            else setFormData({ ...formData, type: v as PersonaType });
          }}
          disabled={isEdit}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DEFAULT_PERSONAS).map(([key, persona]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <span>{persona.emojiStyle[0]}</span>
                  <span>{persona.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>人设名称</Label>
        <Input 
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="给你的人设起个名字"
        />
      </div>

      <div className="space-y-2">
        <Label>人设描述</Label>
        <Textarea 
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="描述这个人设的特点和风格"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>常用开头（用中文逗号分隔）</Label>
        <Input 
          value={formData.greetings}
          onChange={(e) => setFormData({ ...formData, greetings: e.target.value })}
          placeholder="hi大家，姐妹们，宝子们"
        />
      </div>

      <div className="space-y-2">
        <Label>语气词（用中文逗号分隔）</Label>
        <Input 
          value={formData.toneWords}
          onChange={(e) => setFormData({ ...formData, toneWords: e.target.value })}
          placeholder="说实话，有一说一，真的"
        />
      </div>

      <div className="space-y-2">
        <Label>常用emoji</Label>
        <Input 
          value={formData.emojiStyle}
          onChange={(e) => setFormData({ ...formData, emojiStyle: e.target.value })}
          placeholder="😊🙈💪✨🥹"
        />
      </div>

      <div className="space-y-2">
        <Label>示例语句（每行一句）</Label>
        <Textarea 
          value={formData.samplePhrases}
          onChange={(e) => setFormData({ ...formData, samplePhrases: e.target.value })}
          placeholder="说实话当时我也慌得一批&#10;这个坑我替你们踩过了"
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">人设管理</h1>
            <p className="text-muted-foreground">创建和管理你的内容创作人设</p>
          </div>
          <div className="flex gap-2">
            {/* 账号分析按钮 */}
            <Dialog open={analyzeDialogOpen} onOpenChange={setAnalyzeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setAccountUrl("")}>
                  <Search className="w-4 h-4 mr-2" />
                  分析账号
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    分析小红书账号
                  </DialogTitle>
                  <DialogDescription>
                    输入小红书账号链接，AI 将分析该账号的写作风格并生成人设
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>账号链接</Label>
                    <Input
                      placeholder="https://www.xiaohongshu.com/user/profile/..."
                      value={accountUrl}
                      onChange={(e) => setAccountUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      支持小红书用户主页链接或用户 ID
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">分析内容包括：</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 写作风格和语气特点</li>
                      <li>• 常用开头语和语气词</li>
                      <li>• emoji 使用习惯</li>
                      <li>• 典型句式示例</li>
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAnalyzeDialogOpen(false)}>
                    取消
                  </Button>
                  <Button 
                    onClick={handleAnalyzeAccount}
                    disabled={!accountUrl.trim() || analyzeMutation.isPending}
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        开始分析
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* 创建人设按钮 */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  创建人设
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>创建新人设</DialogTitle>
                <DialogDescription>
                  选择预设人设类型，或自定义你的创作风格
                </DialogDescription>
              </DialogHeader>
              <PersonaForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  取消
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!formData.name || createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "创建"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* 预设人设展示 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            预设人设模板
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(DEFAULT_PERSONAS).map(([key, persona]) => (
              <Card key={key} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{persona.emojiStyle[0]}</div>
                    <div>
                      <CardTitle className="text-lg">{persona.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">{key}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{persona.description}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">常用开头</p>
                      <p className="text-sm">{persona.greetings.slice(0, 2).join("、")}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">emoji风格</p>
                      <p className="text-lg">{persona.emojiStyle.join("")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 用户自定义人设 */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            我的人设
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : personas && personas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personas.map((persona) => (
                <Card key={persona.id} className="card-hover">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{persona.emojiStyle?.[0] || "👤"}</div>
                        <div>
                          <CardTitle className="text-lg">{persona.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1">{persona.type}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Dialog open={editingPersona === persona.id} onOpenChange={(open) => {
                          if (!open) {
                            setEditingPersona(null);
                            resetForm();
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => startEdit(persona)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>编辑人设</DialogTitle>
                            </DialogHeader>
                            <PersonaForm isEdit />
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {
                                setEditingPersona(null);
                                resetForm();
                              }}>
                                取消
                              </Button>
                              <Button 
                                onClick={handleUpdate}
                                disabled={!formData.name || updateMutation.isPending}
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "保存"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(persona.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {persona.description && (
                      <p className="text-sm text-muted-foreground mb-3">{persona.description}</p>
                    )}
                    <div className="space-y-2">
                      {persona.greetings && persona.greetings.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">常用开头</p>
                          <p className="text-sm">{persona.greetings.slice(0, 2).join("、")}</p>
                        </div>
                      )}
                      {persona.emojiStyle && persona.emojiStyle.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">emoji风格</p>
                          <p className="text-lg">{persona.emojiStyle.join("")}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">还没有自定义人设</h3>
                <p className="text-muted-foreground mb-4">
                  点击上方"创建人设"按钮，开始定制你的创作风格
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  创建第一个人设
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
