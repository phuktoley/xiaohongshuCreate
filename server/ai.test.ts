import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateTitles, generateNote, generateHashtags, generateCover } from "./ai";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";

const mockInvokeLLM = vi.mocked(invokeLLM);

describe("AI Generation Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateTitles", () => {
    it("should generate titles with correct structure", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                titles: [
                  { text: "被UCL退学后我做了这件事", score: 95, emoji: "😱", reason: "悬念+学校名" },
                  { text: "学术不端申诉成功经验分享", score: 88, emoji: "✅", reason: "成功案例" },
                ],
              }),
            },
          },
        ],
      };
      mockInvokeLLM.mockResolvedValue(mockResponse);

      const result = await generateTitles({
        scenario: "misconduct",
        emotion: "empathy",
        personaType: "senior_sister",
      });

      expect(result).toHaveProperty("titles");
      expect(Array.isArray(result.titles)).toBe(true);
      expect(result.titles.length).toBeGreaterThan(0);
      expect(result.titles[0]).toHaveProperty("text");
      expect(result.titles[0]).toHaveProperty("score");
      expect(result.titles[0]).toHaveProperty("emoji");
      expect(result.titles[0]).toHaveProperty("reason");
    });

    it("should include school name when provided", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                titles: [
                  { text: "UCL挂科申诉全攻略", score: 90, emoji: "📚", reason: "包含学校名" },
                ],
              }),
            },
          },
        ],
      };
      mockInvokeLLM.mockResolvedValue(mockResponse);

      const result = await generateTitles({
        scenario: "fail",
        emotion: "help",
        personaType: "professional",
        schoolName: "UCL",
      });

      expect(mockInvokeLLM).toHaveBeenCalled();
      expect(result.titles).toBeDefined();
    });

    it("should handle LLM errors gracefully", async () => {
      mockInvokeLLM.mockRejectedValue(new Error("LLM service unavailable"));

      await expect(
        generateTitles({
          scenario: "misconduct",
          emotion: "empathy",
          personaType: "senior_sister",
        })
      ).rejects.toThrow();
    });
  });

  describe("generateNote", () => {
    it("should generate note with correct structure", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                content: "hi姐妹们，今天来分享一下我的申诉经历...",
                structure: {
                  opening: "hi姐妹们",
                  body: "今天来分享一下我的申诉经历",
                  interaction: "有问题评论区见",
                },
              }),
            },
          },
        ],
      };
      mockInvokeLLM.mockResolvedValue(mockResponse);

      const result = await generateNote({
        title: "被UCL退学后我做了这件事",
        scenario: "dropout",
        emotion: "empathy",
        personaType: "senior_sister",
      });

      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("structure");
      expect(result.structure).toHaveProperty("opening");
      expect(result.structure).toHaveProperty("body");
      expect(result.structure).toHaveProperty("interaction");
    });
  });

  describe("generateHashtags", () => {
    it("should generate hashtags with categories", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                hashtags: ["#留学生", "#学术申诉", "#英国留学"],
                categories: {
                  general: ["#留学生", "#留学"],
                  scenario: ["#学术申诉", "#学术不端"],
                  school: ["#英国留学"],
                  appeal: ["#申诉成功"],
                },
              }),
            },
          },
        ],
      };
      mockInvokeLLM.mockResolvedValue(mockResponse);

      const result = await generateHashtags({
        scenario: "misconduct",
        title: "学术不端申诉成功",
        schoolRegion: "uk",
      });

      expect(result).toHaveProperty("hashtags");
      expect(result).toHaveProperty("categories");
      expect(Array.isArray(result.hashtags)).toBe(true);
    });
  });

  describe("generateCover", () => {
    it("should generate cover with color scheme", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                mainText: "被退学怎么办？",
                subText: "申诉成功经验分享",
                colorScheme: {
                  primary: "#FF6B6B",
                  secondary: "#FFE66D",
                  text: "#FFFFFF",
                },
                layout: "居中大字",
                coverType: "大字型",
              }),
            },
          },
        ],
      };
      mockInvokeLLM.mockResolvedValue(mockResponse);

      const result = await generateCover({
        title: "被退学后我是这样申诉的",
        scenario: "dropout",
        emotion: "success",
      });

      expect(result).toHaveProperty("mainText");
      expect(result).toHaveProperty("colorScheme");
      expect(result.colorScheme).toHaveProperty("primary");
      expect(result.colorScheme).toHaveProperty("secondary");
      expect(result.colorScheme).toHaveProperty("text");
      expect(result).toHaveProperty("coverType");
    });
  });
});
