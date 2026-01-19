import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  isLoading: boolean;
  steps?: string[];
  currentStep?: number;
  estimatedTime?: number; // 预计时间（秒）
  title?: string;
}

export default function ProgressIndicator({
  isLoading,
  steps = [],
  currentStep = 0,
  estimatedTime = 10,
  title = "正在生成中...",
}: ProgressIndicatorProps) {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setElapsedTime(0);
      return;
    }

    // 模拟进度
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // 进度最多到 95%，剩下的等实际完成
        if (prev >= 95) return 95;
        // 根据预计时间计算增量
        const increment = 95 / (estimatedTime * 10);
        return Math.min(prev + increment, 95);
      });
    }, 100);

    // 计时器
    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(timeInterval);
    };
  }, [isLoading, estimatedTime]);

  if (!isLoading) return null;

  const remainingTime = Math.max(0, estimatedTime - elapsedTime);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <Progress value={progress} className="h-2 mb-3" />

        <div className="flex justify-between text-sm text-muted-foreground mb-4">
          <span>{Math.round(progress)}%</span>
          <span>
            {remainingTime > 0 
              ? `预计还需 ${remainingTime} 秒` 
              : "即将完成..."}
          </span>
        </div>

        {steps.length > 0 && (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm ${
                  index < currentStep
                    ? "text-green-600"
                    : index === currentStep
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    index < currentStep
                      ? "bg-green-100 text-green-600"
                      : index === currentStep
                      ? "bg-primary/10 text-primary"
                      : "bg-muted"
                  }`}
                >
                  {index < currentStep ? "✓" : index + 1}
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4 text-center">
          AI 正在努力工作中，请稍候...
        </p>
      </div>
    </div>
  );
}

// 简单的行内进度提示
export function InlineProgress({
  isLoading,
  text = "生成中...",
  estimatedTime = 5,
}: {
  isLoading: boolean;
  text?: string;
  estimatedTime?: number;
}) {
  const [dots, setDots] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setDots("");
      setElapsed(0);
      return;
    }

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    const timeInterval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(timeInterval);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  const remaining = Math.max(0, estimatedTime - elapsed);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{text}{dots}</span>
      {remaining > 0 && (
        <span className="text-xs">（约 {remaining} 秒）</span>
      )}
    </div>
  );
}

// 批量生成进度
export function BatchProgress({
  current,
  total,
  isLoading,
}: {
  current: number;
  total: number;
  isLoading: boolean;
}) {
  if (!isLoading) return null;

  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          正在生成第 {current + 1}/{total} 篇
        </span>
        <span className="text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
