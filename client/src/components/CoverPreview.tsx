import { useMemo } from "react";

interface CoverPreviewProps {
  mainText: string;
  subText?: string;
  highlightWords?: string[];
  template?: string;
  colorScheme: {
    primary: string;
    secondary: string;
    highlight: string;
    text: string;
    background: string;
  };
}

// 渲染带高亮的文本
function HighlightedText({ 
  text, 
  highlightWords, 
  highlightColor 
}: { 
  text: string; 
  highlightWords: string[]; 
  highlightColor: string;
}) {
  if (!highlightWords || highlightWords.length === 0) {
    return <>{text}</>;
  }

  // 创建正则表达式匹配所有高亮词
  const regex = new RegExp(`(${highlightWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const isHighlight = highlightWords.some(w => w.toLowerCase() === part.toLowerCase());
        if (isHighlight) {
          return (
            <span 
              key={index} 
              className="relative inline-block px-1"
            >
              <span 
                className="absolute inset-0 -skew-x-3 rounded-sm" 
                style={{ backgroundColor: highlightColor }}
              />
              <span className="relative">{part}</span>
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export default function CoverPreview({ 
  mainText, 
  subText, 
  highlightWords = [], 
  template = "notebook",
  colorScheme 
}: CoverPreviewProps) {
  
  // 根据模板渲染不同样式
  const renderCover = useMemo(() => {
    switch (template) {
      case "notebook":
        return (
          <div className="w-full h-full relative" style={{ backgroundColor: "#FFFFFF" }}>
            {/* 笔记本横线背景 */}
            <div className="absolute inset-0 flex flex-col justify-start pt-8">
              {Array.from({ length: 15 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-full border-b border-gray-200" 
                  style={{ height: "2rem" }}
                />
              ))}
            </div>
            {/* 顶部日期区域 */}
            <div className="absolute top-3 left-4 right-4 flex justify-between text-xs text-gray-400">
              <span>Date ___________</span>
              <span>Memo No. ___________</span>
            </div>
            {/* 主文案 */}
            <div className="absolute inset-0 flex flex-col items-start justify-center px-8">
              <p className="text-4xl font-black leading-tight" style={{ color: colorScheme.text }}>
                <HighlightedText 
                  text={mainText} 
                  highlightWords={highlightWords} 
                  highlightColor={colorScheme.highlight}
                />
              </p>
              {/* 小圆点装饰 */}
              <div className="flex gap-2 mt-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-black" />
                ))}
              </div>
            </div>
          </div>
        );

      case "handdrawn":
        return (
          <div className="w-full h-full relative p-4" style={{ backgroundColor: "#FFFFFF" }}>
            {/* 手绘边框 */}
            <div 
              className="absolute inset-4 rounded-lg"
              style={{ 
                border: `4px solid ${colorScheme.secondary}`,
                borderRadius: "8px",
              }}
            />
            {/* 顶部圆环装饰 */}
            <div className="absolute top-1 left-0 right-0 flex justify-center gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-4 h-4 rounded-full border-2"
                  style={{ borderColor: colorScheme.secondary }}
                />
              ))}
            </div>
            {/* 主文案 */}
            <div className="absolute inset-8 flex flex-col items-start justify-center">
              {mainText.split(/(?<=[\u4e00-\u9fa5]{2,4})/).filter(Boolean).map((line, i) => (
                <p key={i} className="text-3xl font-black leading-relaxed" style={{ color: colorScheme.text }}>
                  <HighlightedText 
                    text={line} 
                    highlightWords={highlightWords} 
                    highlightColor={i % 2 === 0 ? colorScheme.highlight : "#F48FB1"}
                  />
                </p>
              ))}
            </div>
          </div>
        );

      case "breaking":
        return (
          <div 
            className="w-full h-full relative flex flex-col items-start justify-center px-6"
            style={{ backgroundColor: colorScheme.primary }}
          >
            {/* 速报标签 */}
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <div 
                className="px-3 py-1 rounded-full text-white font-bold text-sm"
                style={{ backgroundColor: "#FF6B35" }}
              >
                速报
              </div>
              {/* 爆炸图标 */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF6B35">
                <path d="M12 2L9 9L2 12L9 15L12 22L15 15L22 12L15 9L12 2Z" />
              </svg>
            </div>
            {/* 主文案 */}
            <div className="mt-8">
              <p className="text-3xl font-black leading-tight" style={{ color: colorScheme.text }}>
                <HighlightedText 
                  text={mainText} 
                  highlightWords={highlightWords} 
                  highlightColor={colorScheme.highlight}
                />
              </p>
              {subText && (
                <p className="text-lg mt-4 opacity-80" style={{ color: colorScheme.text }}>
                  {subText}
                </p>
              )}
            </div>
          </div>
        );

      case "warning":
        return (
          <div 
            className="w-full h-full relative flex flex-col items-center justify-center px-6"
            style={{ backgroundColor: colorScheme.primary }}
          >
            {/* 警告图标 */}
            <div className="absolute top-6 right-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill={colorScheme.highlight}>
                <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 4v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
              </svg>
            </div>
            {/* 主文案 */}
            <p className="text-4xl font-black text-center leading-tight" style={{ color: colorScheme.text }}>
              <HighlightedText 
                text={mainText} 
                highlightWords={highlightWords} 
                highlightColor={colorScheme.highlight}
              />
            </p>
            {subText && (
              <p className="text-lg mt-4 text-center" style={{ color: colorScheme.text, opacity: 0.8 }}>
                {subText}
              </p>
            )}
          </div>
        );

      case "minimal":
      default:
        return (
          <div 
            className="w-full h-full relative flex flex-col items-center justify-center px-8"
            style={{ backgroundColor: colorScheme.background }}
          >
            {/* 主文案 */}
            <p className="text-4xl font-black text-center leading-tight" style={{ color: colorScheme.text }}>
              <HighlightedText 
                text={mainText} 
                highlightWords={highlightWords} 
                highlightColor={colorScheme.highlight}
              />
            </p>
            {subText && (
              <p className="text-lg mt-4 text-center opacity-80" style={{ color: colorScheme.text }}>
                {subText}
              </p>
            )}
          </div>
        );
    }
  }, [template, mainText, subText, highlightWords, colorScheme]);

  return (
    <div className="aspect-[3/4] max-w-[300px] mx-auto rounded-xl overflow-hidden shadow-lg border">
      {renderCover}
    </div>
  );
}
