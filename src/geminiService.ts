import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Timestamp {
  time: string;
  label: string;
}

export interface VideoData {
  videoId: string;
  titleEn: string;
  titleZh: string;
  channelEn: string;
  channelZh: string;
  descriptionEn: string;
  descriptionZh: string;
  tags: string[];
  score: number;
  timestamps?: Timestamp[];
  detailedEditorialSummary?: string;
}

function parseJSONResponse(text: string): any {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      return JSON.parse(objMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON parse error", e);
    return null;
  }
}

export async function autoScoutYouTubeVideos(customQuery?: string, retries = 2): Promise<VideoData[]> {
  const baseQuery = customQuery ? customQuery : '"Vibe Coding" OR "Mckay Wrigley" OR "Building apps with AI" OR "Cursor AI tutorial" OR "Claude Code" OR "AI Agent coding"';
  const prompt = `
  你是一名顶尖的“AI 开发者侦察员”和“Vibe Coding 趋势专家”。
  
  【核心任务】：
  请使用 Google Search 工具，在 YouTube 上搜索与以下视频风格高度相似的最新优质视频：
  参考视频：https://youtu.be/Pb6XHGi542A (Mckay Wrigley - How I use AI to build software)
  
  搜索关键词：site:youtube.com ${baseQuery}
  
  【极其重要】：你必须从 Google Search 的结果中提取真实的 YouTube 视频 ID（Video ID）！
  1. 视频 ID 是 YouTube 链接中 v= 后面的 11 位字符，或者是 youtu.be/ 后面的 11 位字符。
  2. 例如：链接 https://www.youtube.com/watch?v=dQw4w9WgXcQ 的 ID 是 "dQw4w9WgXcQ"。
  3. 绝对不要返回频道链接、搜索结果页链接、或播放列表链接。必须是真实的、公开可播放的单个视频 ID。
  
  请返回 JSON 数组（6个视频），每个对象包含：
  - videoId: 真实的 11 位 YouTube 视频 ID（例如 "dQw4w9WgXcQ"）
  - titleEn: 视频英文标题
  - titleZh: 视频中文标题翻译
  - channelEn: 频道英文名称
  - channelZh: 频道中文名称翻译
  - descriptionEn: 简短的英文简介
  - descriptionZh: 简短的中文简介翻译
  - tags: 包含 2-3 个标签的数组，必须中英双语
  - score: Builder 评分（1-10的数字）
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              videoId: { type: Type.STRING, description: "The 11-character YouTube video ID" },
              titleEn: { type: Type.STRING },
              titleZh: { type: Type.STRING },
              channelEn: { type: Type.STRING },
              channelZh: { type: Type.STRING },
              descriptionEn: { type: Type.STRING },
              descriptionZh: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              score: { type: Type.NUMBER }
            },
            required: ["videoId", "titleEn", "titleZh", "channelEn", "channelZh", "descriptionEn", "descriptionZh", "tags", "score"]
          }
        }
      },
    });
    return parseJSONResponse(response.text || "[]") || [];
  } catch (error: any) {
    console.error("Error auto-scouting:", error);
    if (error.toString().includes("429") || error.toString().includes("RESOURCE_EXHAUSTED")) {
      throw new Error("API 请求频率过高，已超出免费额度。请稍后重试。(Rate limit exceeded)");
    }
    if (retries > 0 && error?.status === "INTERNAL") {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return autoScoutYouTubeVideos(customQuery, retries - 1);
    }
    throw new Error("自动抓取失败，请重试。");
  }
}

export async function generateVideoDetails(video: VideoData): Promise<{timestamps: Timestamp[], detailedEditorialSummary: string}> {
  const prompt = `
    你是一名顶尖的“AI 开发者侦察员”和“技术博主”，为付费订阅者撰写深度技术文章。
    你的风格类似于 Peter Yang 的 Substack，内容深刻、结构清晰、专业。

    **分析以下 YouTube 视频数据：**
    - 标题: ${video.titleEn} / ${video.titleZh}
    - 频道: ${video.channelEn}
    - 简介: ${video.descriptionEn}
    - 标签: ${video.tags.join(', ')}

    **你的任务和输出格式：**
    返回一个 JSON 对象，包含 "timestamps" 和 "detailedEditorialSummary" 两个键。

    1.  **"detailedEditorialSummary" (string):**
        -   **引言:** 以 "Dear subscribers," 或类似的专业、亲切的问候开头，撰写一个简短的引言段落。
        -   **核心内容:** 
            -   创建一个名为 "### 深入解读：核心技术与实现" (In-depth Analysis: Core Concepts & Implementation) 的二级标题。
            -   在此标题下，识别出视频中 **3 到 5 个最关键的技术要点或核心概念**。
            -   以 Markdown **数字列表** (1., 2., 3., ...) 的形式呈现这些要点。
            -   **对于每一个要点**，进行详细的、深入的阐述。如果一个要点包含多个步骤或组成部分，请使用 **字母列表** (a., b., c., ...) 进行拆解说明，就像范例中对“三层内存系统”的解释一样。
            -   内容必须具有深度，为 AI 工程师或开发者提供真正的价值。
            -   使用 **粗体** 强调关键词。

    2.  **"timestamps" (array of objects):**
        -   创建一个包含 5-8 个视频关键时刻的列表。
        -   数组中的每个对象都必须有一个 "time" 键 (字符串, e.g., "03:49") 和一个 "label" 键 (字符串, 对那一刻的简洁描述)。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timestamps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  label: { type: Type.STRING }
                },
                required: ["time", "label"]
              }
            },
            detailedEditorialSummary: { type: Type.STRING }
          },
          required: ["timestamps", "detailedEditorialSummary"]
        }
      },
    });
    return parseJSONResponse(response.text || "{}") || { timestamps: [], detailedEditorialSummary: "" };
  } catch (error: any) {
    console.error("Error generating details:", error);
    if (error.toString().includes("429") || error.toString().includes("RESOURCE_EXHAUSTED")) {
      throw new Error("API 请求频率过高，已超出免费额度。请稍后重试。(Rate limit exceeded)");
    }
    throw error;
  }
}
