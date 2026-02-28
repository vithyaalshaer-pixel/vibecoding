// 前端服务层：通过后端 API 代理调用 Gemini，不在浏览器中持有任何 API Key

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

export async function autoScoutYouTubeVideos(customQuery?: string): Promise<VideoData[]> {
  const res = await fetch('/api/scout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customQuery: customQuery || '' }),
  });

  if (res.status === 429) {
    throw new Error('API 请求频率过高，已超出免费额度。请稍后重试。(Rate limit exceeded)');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `自动抓取失败: HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data || [];
}

export async function generateVideoDetails(
  video: VideoData
): Promise<{ timestamps: Timestamp[]; detailedEditorialSummary: string }> {
  const res = await fetch('/api/details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video }),
  });

  if (res.status === 429) {
    throw new Error('API 请求频率过高，已超出免费额度。请稍后重试。(Rate limit exceeded)');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `详情生成失败: HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data || { timestamps: [], detailedEditorialSummary: '' };
}
