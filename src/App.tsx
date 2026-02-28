import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { autoScoutYouTubeVideos, generateVideoDetails, VideoData } from './geminiService';
import { Loader2, Search, Play, ChevronLeft, Heart, MessageCircle, RefreshCw } from 'lucide-react';

function cleanVideoId(idOrUrl: string): string | null {
  if (!idOrUrl) return null;

  // The ultimate YouTube ID regex
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = idOrUrl.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback for cases where the regex might fail (e.g., just the ID string)
  if (idOrUrl.length === 11 && !idOrUrl.includes('/') && !idOrUrl.includes('?')) {
    return idOrUrl;
  }

  return null;
}

export default function App() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [progress, setProgress] = useState(0);

  const handleAutoScout = async () => {
    setIsLoading(true);
    setError(null);
    setVideos([]);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 95));
    }, 400);

    try {
      const result = await autoScoutYouTubeVideos(customQuery);
      clearInterval(progressInterval);
      setProgress(100);
      if (result && result.length > 0) {
        setVideos(result);
      } else {
        setError('未找到符合严格标准的视频 (No videos found matching criteria).');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || '自动抓取失败 (Auto-scout failed)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVideo = async (video: VideoData) => {
    setSelectedVideo(video);
    setDetailError(null);
    if (!video.detailedEditorialSummary) {
      setIsDetailLoading(true);
      try {
        const details = await generateVideoDetails(video);
        const updatedVideo = { ...video, ...details };
        setSelectedVideo(updatedVideo);
        setVideos(prevVideos => prevVideos.map(v => v.videoId === video.videoId ? updatedVideo : v));
      } catch (e: any) {
        console.error("Failed to generate details", e);
        setDetailError("深度报告生成失败，请稍后重试。(Failed to generate details)");
      } finally {
        setIsDetailLoading(false);
      }
    }
  };


  if (selectedVideo) {
    const videoId = cleanVideoId(selectedVideo.videoId);

    return (
      <div className="min-h-screen bg-white text-[#1D1D1F] font-serif selection:bg-red-100">
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setSelectedVideo(null)}
              className="flex items-center text-gray-500 hover:text-black transition-colors font-sans text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <div className="font-sans font-bold text-lg tracking-tight">Vibe Coding Scout</div>
            <button className="bg-[#E22D32] text-white px-4 py-1.5 rounded-full font-sans text-sm font-medium hover:bg-[#d81e23] transition-colors">
              Subscribe
            </button>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-6 py-12">
          {/* Video Player */}
          <div className="mb-12 rounded-xl overflow-hidden shadow-2xl shadow-black/10">
            <div className="aspect-video w-full bg-black">
              {videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50 font-sans">
                  Invalid Video ID
                </div>
              )}
            </div>
          </div>

          {/* Content Body */}
          {isDetailLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#E22D32]" />
              <p className="font-sans text-lg">正在生成深度解析报告 (Generating detailed report)...</p>
            </div>
          ) : detailError ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <p className="text-red-500 font-sans text-lg mb-4">{detailError}</p>
              <button
                onClick={() => handleSelectVideo(selectedVideo)}
                className="bg-[#0071E3] text-white px-6 py-2 rounded-full font-sans text-sm font-medium hover:bg-[#0077ED] transition-colors"
              >
                重试 (Retry)
              </button>
            </div>
          ) : (
            <div className="prose-substack">
              <p className="text-sm uppercase tracking-widest text-gray-500 font-sans font-semibold">Podcast</p>
              <h1 className="text-4xl md:text-5xl font-bold font-sans text-[#1D1D1F] leading-tight mt-2 mb-4">
                {selectedVideo.titleEn}
              </h1>
              <div className="flex items-center gap-4 mb-8 text-gray-500 font-sans text-sm">
                <img src="https://pbs.twimg.com/profile_images/1785752493991972864/iP135SjJ_400x400.jpg" alt="Peter Yang" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold text-gray-800">PETER YANG</p>
                  <p>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()} · PAID</p>
                </div>
              </div>

              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedVideo.detailedEditorialSummary || ''}
              </ReactMarkdown>

              {/* Timestamps Section */}
              {selectedVideo.timestamps && selectedVideo.timestamps.length > 0 && (
                <div className="my-12 not-italic">
                  <p className="font-sans text-lg mb-4">Nat and I talked about:</p>
                  <ul className="space-y-2 list-none pl-0">
                    {selectedVideo.timestamps.map((ts, i) => (
                      <li key={i} className="font-sans text-lg leading-relaxed flex items-start">
                        <span className="w-4 h-4 bg-black rounded-full mr-4 mt-[7px] flex-shrink-0"></span>
                        <div>
                          <span className="text-red-600 font-semibold">({ts.time})</span> {ts.label}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* NotebookLM 按钮 */}
              {videoId && (
                <div className="my-8 flex justify-center">
                  <a
                    href={`https://notebooklm.google.com/notebook/new?source=https://www.youtube.com/watch?v=${videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6 py-3 rounded-full font-sans text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                    </svg>
                    在 NotebookLM 中深度提炼
                  </a>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-blue-200">
      <header className="pt-24 pb-16 text-center px-6">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#1D1D1F] mb-6">
          Vibe Coding Scout
        </h1>
        <p className="text-xl text-[#86868B] max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover the best AI engineering and Vibe Coding videos on YouTube, curated and analyzed by Gemini.
        </p>

        <div className="max-w-2xl mx-auto mb-8 relative">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="补充你想看的方向，例如：Cursor 实战、React 项目、或者留空看热门..."
            className="w-full px-6 py-4 rounded-full border border-gray-200 shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-transparent transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleAutoScout();
              }
            }}
          />
        </div>

        <button
          onClick={handleAutoScout}
          disabled={isLoading}
          className="inline-flex items-center gap-3 bg-[#0071E3] hover:bg-[#0077ED] text-white px-8 py-4 rounded-full font-medium text-lg transition-all shadow-[0_4px_14px_rgba(0,113,227,0.3)] hover:shadow-[0_6px_20px_rgba(0,113,227,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
          {isLoading ? '正在全网侦察... (Scouting...)' : '开始侦察 (Start Scout)'}
        </button>

        {isLoading && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-500 mb-2 font-medium">
              <span>正在全网深度检索与分析...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#0071E3] h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 text-red-500 bg-red-50 px-6 py-3 rounded-full inline-block text-sm font-medium">
            {error}
          </div>
        )}
      </header>

      {videos.length > 0 && !isLoading && (
        <main className="max-w-[1400px] mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video, idx) => {
              const videoId = cleanVideoId(video.videoId);
              return (
                <div
                  key={video.videoId || idx}
                  onClick={() => handleSelectVideo(video)}
                  className="bg-white rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 cursor-pointer border border-gray-100 flex flex-col h-full group"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    {videoId ? (
                      <img
                        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        }}
                        alt={video.titleEn}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        No Thumbnail
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-transparent transition-colors duration-300">
                      <div className="bg-[#FF0000] text-white rounded-2xl px-5 py-3 shadow-lg transform transition-transform duration-300 group-hover:scale-110">
                        <Play className="w-8 h-8 fill-current" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex flex-wrap gap-2 mb-5">
                      {video.tags.map(tag => (
                        <span key={tag} className="bg-[#E8F0FE] text-[#1967D2] px-3 py-1 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-[#0044CC] font-semibold text-xl leading-tight mb-2 line-clamp-2">
                      {video.titleEn}
                    </h3>
                    <h3 className="text-[#0044CC] font-semibold text-xl leading-tight mb-6 line-clamp-2">
                      {video.titleZh}
                    </h3>

                    <p className="text-[#6699FF] text-sm uppercase tracking-wider mb-1 font-medium line-clamp-1">
                      {video.channelEn}
                    </p>
                    <p className="text-[#6699FF] text-sm mb-6 line-clamp-1">
                      {video.channelZh}
                    </p>

                    <div className="mt-auto">
                      <p className="text-[#0044CC] text-sm opacity-80 line-clamp-2 mb-2">
                        {video.descriptionEn}
                      </p>
                      <p className="text-[#0044CC] text-sm opacity-80 line-clamp-2">
                        {video.descriptionZh}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
}
