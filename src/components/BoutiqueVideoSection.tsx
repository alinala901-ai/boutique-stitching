import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  getYouTubeVideoId,
  isDirectVideoUrl,
  getBoutiqueVideos,
  saveBoutiqueVideos,
  BoutiqueVideoItem,
} from '../config/video';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Sparkles,
  Scissors,
  Crown,
  Layers,
  CheckCircle2,
  AlertCircle,
  Film,
  Settings,
  Clock,
  Shirt,
  Calendar,
  Check,
  ExternalLink,
  Edit3,
  X,
  RotateCcw,
} from 'lucide-react';

interface BoutiqueVideoSectionProps {
  onOpenBooking: (serviceName?: string) => void;
  onOpenAdminSettings?: () => void;
}

export const BoutiqueVideoSection: React.FC<BoutiqueVideoSectionProps> = ({
  onOpenBooking,
  onOpenAdminSettings,
}) => {
  const { t, language, formatText } = useLanguage();
  const { isAdmin } = useAuth();
  const [videosList, setVideosList] = useState<BoutiqueVideoItem[]>(getBoutiqueVideos);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  // Edit Video Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editUrl, setEditUrl] = useState<string>('');
  const [editSuccessMsg, setEditSuccessMsg] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync videos from localStorage or events
  useEffect(() => {
    const handleUpdate = () => {
      setVideosList(getBoutiqueVideos());
    };
    window.addEventListener('boutique_videos_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('boutique_videos_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const currentVideo: BoutiqueVideoItem =
    videosList[activeVideoIndex] || videosList[0] || ({} as BoutiqueVideoItem);

  const youtubeId = getYouTubeVideoId(currentVideo.videoUrl);
  const isDirectVideo = isDirectVideoUrl(currentVideo.videoUrl);

  const handleSelectVideo = (idx: number, autoStart = true) => {
    if (idx === activeVideoIndex && isPlaying) return;
    setActiveVideoIndex(idx);
    setCurrentTime(0);
    setHasError(false);
    setIsLoading(false);
    if (autoStart) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasError(false);
        })
        .catch((err) => {
          console.error('Video play error:', err);
          setHasError(true);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      setHasError(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVideoTitle = (item: BoutiqueVideoItem) => {
    if (language === 'ur' && item.title_urdu) return item.title_urdu;
    if (language === 'roman_ur' && item.title_roman_urdu) return item.title_roman_urdu;
    return item.title;
  };

  const getVideoSubtitle = (item: BoutiqueVideoItem) => {
    if (language === 'ur' && item.subtitle_urdu) return item.subtitle_urdu;
    if (language === 'roman_ur' && item.subtitle_roman_urdu) return item.subtitle_roman_urdu;
    return item.subtitle;
  };

  const getVideoDesc = (item: BoutiqueVideoItem) => {
    if (language === 'ur' && item.description_urdu) return item.description_urdu;
    if (language === 'roman_ur' && item.description_roman_urdu) return item.description_roman_urdu;
    return item.description;
  };

  const getVideoCategory = (item: BoutiqueVideoItem) => {
    if (language === 'ur' && item.categoryLabel_urdu) return item.categoryLabel_urdu;
    return item.categoryLabel;
  };

  // Quick URL Update Handler
  const handleOpenEditModal = () => {
    setEditUrl(currentVideo.videoUrl || '');
    setEditSuccessMsg('');
    setIsEditModalOpen(true);
  };

  const handleSaveVideoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUrl.trim()) return;

    const updated = [...videosList];
    updated[activeVideoIndex] = {
      ...updated[activeVideoIndex],
      videoUrl: editUrl.trim(),
    };

    saveBoutiqueVideos(updated);
    setVideosList(updated);
    setEditSuccessMsg(
      formatText(
        'Video URL updated and loaded successfully!',
        'ویڈیو کا پتہ کامیابی سے تبدیل ہو گیا!',
        'Video URL kamyabi se update ho gaya!'
      )
    );
    setIsPlaying(true);
    setTimeout(() => {
      setIsEditModalOpen(false);
      setEditSuccessMsg('');
    }, 1200);
  };

  return (
    <section
      id="boutique-video"
      className="py-16 md:py-24 bg-gradient-to-b from-white via-blue-50/20 to-white border-b border-blue-100 overflow-hidden relative"
      dir={language === 'ur' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold mb-4 shadow-2xs">
            <Film className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {formatText(
                '4 Boutique Craftsmanship Videos',
                'بوتیک کی ۴ خصوصی کٹنگ اور سلائی ویڈیوز',
                'Boutique Ki 4 Khasusi Craftsmanship Videos'
              )}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif-display font-bold text-blue-950 tracking-tight leading-tight mb-4">
            {formatText(
              'Artistry in Motion — Boutique Video Showcase',
              'ہماری بوتیک کی سلائی و ڈیزائننگ کا ویڈیو مظاہرہ',
              'Boutique Stitching & Designing Video Showcase'
            )}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {formatText(
              'Watch authentic boutique stitching in action: master pattern cutting, bridal zardozi embroidery, luxury 3-piece ladies suits, and gentle kids finishes.',
              'دیکھیں اصلی بوتیک سلائی کا مظاہرہ: ماہر ماسٹر کٹنگ، برائیڈل زردوزی کڑھائی، خواتین کے تھری پیس سوٹس اور بچوں کی نازک فنشنگ۔',
              'Asal boutique silai ka live mushahida: Master cutting, bridal zardozi karhai, ladies designer suits aur bachon ki nafis stitching.'
            )}
          </p>
        </div>

        {/* 4 Interactive Video Tabs Switcher */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1.5 bg-blue-100/60 rounded-2xl border border-blue-200">
            {videosList.map((item, idx) => {
              const isActive = idx === activeVideoIndex;
              return (
                <button
                  key={item.id || idx}
                  type="button"
                  onClick={() => handleSelectVideo(idx, true)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-700 hover:text-blue-900 hover:bg-white/70'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-amber-300' : 'bg-blue-400'}`} />
                  <span className="truncate max-w-[140px] text-center sm:text-left">
                    {getVideoTitle(item).split(' ')[0]} {getVideoTitle(item).split(' ')[1] || ''}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-blue-800 text-blue-100' : 'bg-blue-200/60 text-slate-600'}`}>
                    {item.duration}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Actions Bar */}
        <div className="max-w-5xl mx-auto mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">
              {formatText('Now Playing:', 'اب چل رہی ہے:', 'Now Playing:')}{' '}
              <span className="text-blue-700">{getVideoTitle(currentVideo)}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {youtubeId && (
              <a
                href={`https://www.youtube.com/watch?v=${youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{formatText('Watch on YouTube', 'یوٹیوب پر کھولیں', 'YouTube Par Kholein')}</span>
              </a>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{formatText('Change Video Link', 'ویڈیو لنک تبدیل کریں', 'Change Video Link')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Video Theater Player */}
        <div className="max-w-5xl mx-auto mb-10">
          <div
            ref={containerRef}
            onMouseMove={() => setShowControls(true)}
            className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border-2 border-blue-200/80 group select-none"
          >
            {/* 1. YOUTUBE EMBED PLAYER */}
            {youtubeId ? (
              <div className="w-full h-full relative">
                {isPlaying ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                    title={getVideoTitle(currentVideo)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0 absolute inset-0"
                  />
                ) : (
                  <div className="w-full h-full relative">
                    <img
                      src={
                        currentVideo.posterUrl ||
                        `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
                      }
                      alt={getVideoTitle(currentVideo)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/45 hover:bg-slate-950/35 transition-colors flex flex-col items-center justify-center p-4">
                      {/* Floating Badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-xs shadow-md">
                          {getVideoCategory(currentVideo)}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-black/60 text-white font-semibold text-xs backdrop-blur-xs flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-300" />
                          <span>{currentVideo.duration}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPlaying(true)}
                        className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-xl shadow-blue-900/50 transform group-hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                        aria-label={t('videoPlay')}
                      >
                        <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" />
                      </button>
                      <p className="mt-4 text-white text-base sm:text-lg font-bold drop-shadow-md text-center max-w-md px-4">
                        {getVideoTitle(currentVideo)}
                      </p>
                      <p className="mt-1 text-slate-300 text-xs text-center">
                        {formatText('Click play to watch video', 'ویڈیو چلانے کے لیے کلک کریں', 'Play button dabayein')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : isDirectVideo ? (
              /* 2. DIRECT HTML5 VIDEO PLAYER */
              <div className="w-full h-full relative flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={currentVideo.videoUrl}
                  poster={currentVideo.posterUrl}
                  playsInline
                  preload="metadata"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onWaiting={() => setIsLoading(true)}
                  onPlaying={() => {
                    setIsLoading(false);
                    setIsPlaying(true);
                  }}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    setIsPlaying(false);
                    setShowControls(true);
                  }}
                  onError={() => {
                    setHasError(true);
                    setIsLoading(false);
                  }}
                  className="w-full h-full object-cover"
                />

                {/* Big Initial Play Button Overlay */}
                {!isPlaying && !isLoading && !hasError && (
                  <div className="absolute inset-0 bg-slate-950/40 flex flex-col items-center justify-center p-4 z-20">
                    <button
                      type="button"
                      onClick={handlePlayPause}
                      className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-xl shadow-blue-900/40 transform group-hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                      aria-label={t('videoPlay')}
                    >
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" />
                    </button>
                    <p className="mt-4 text-white text-sm sm:text-base font-semibold drop-shadow-md">
                      {getVideoTitle(currentVideo)}
                    </p>
                  </div>
                )}

                {/* Loading Spinner */}
                {isLoading && (
                  <div className="absolute inset-0 bg-slate-950/50 flex flex-col items-center justify-center z-20">
                    <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <p className="mt-3 text-white text-xs sm:text-sm font-medium">
                      {t('videoLoading')}
                    </p>
                  </div>
                )}

                {/* Error Banner */}
                {hasError && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-30">
                    <AlertCircle className="w-10 h-10 text-rose-400 mb-2" />
                    <p className="text-white text-sm sm:text-base font-medium max-w-md">
                      {formatText(
                        'Video playback error. Please check video URL or update it.',
                        'ویڈیو چلانے میں مسئلہ ہوا۔ براۂ کرم ویڈیو کا پتہ چیک کریں۔',
                        'Video play error. Meharbani farma kar link check karein.'
                      )}
                    </p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleOpenEditModal}
                        className="mt-3 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                      >
                        {formatText('Change URL', 'لنک تبدیل کریں', 'URL Change Karein')}
                      </button>
                    )}
                  </div>
                )}

                {/* Video Controls Bar */}
                <div
                  className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-4 transition-opacity duration-300 ${
                    showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {/* Progress Seek Bar */}
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-300 min-w-[36px]">
                      {formatTime(currentTime)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-[11px] font-mono text-slate-400 min-w-[36px]">
                      {formatTime(duration)}
                    </span>
                  </div>

                  {/* Playback Button Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handlePlayPause}
                        className="text-white hover:text-blue-400 transition-colors p-1"
                      >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="text-white hover:text-blue-400 transition-colors p-1"
                        >
                          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 sm:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="text-white hover:text-blue-400 transition-colors p-1"
                    >
                      <Maximize className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Fallback when URL is not set or custom */
              <div className="w-full h-full relative">
                <img
                  src={currentVideo.posterUrl}
                  alt={getVideoTitle(currentVideo)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center p-6 text-center">
                  <Film className="w-12 h-12 text-blue-400 mb-3" />
                  <h3 className="text-white text-lg font-bold mb-2">
                    {getVideoTitle(currentVideo)}
                  </h3>
                  <p className="text-slate-300 text-xs max-w-md mb-4">
                    {getVideoDesc(currentVideo)}
                  </p>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleOpenEditModal}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      {formatText('Insert Boutique Video Link', 'بوتیک ویڈیو لنک درج کریں', 'Video Link Dalein')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Information & Highlights */}
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-blue-100 p-6 md:p-8 shadow-sm mb-12">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-blue-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                  {getVideoCategory(currentVideo)}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{currentVideo.duration}</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                  {currentVideo.tag}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {getVideoTitle(currentVideo)}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                {getVideoDesc(currentVideo)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onOpenBooking(getVideoTitle(currentVideo))}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Scissors className="w-4 h-4" />
                <span>
                  {formatText('Book This Stitching Style', 'اس ڈیزائن کی سلائی بک کریں', 'Yeh Style Silwayein')}
                </span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {formatText('Edit Video Link', 'ویڈیو لنک بدلیں', 'Video Link Badlein')}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Features bullet highlights */}
          <div className="pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {formatText('Craftsmanship Highlights', 'اس ویڈیو کی اہم خصوصیات', 'Key Highlights')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentVideo.features?.map((feat, i) => (
                <div
                  key={i}
                  className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-2.5 text-xs text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4 BOUTIQUE VIDEOS REEL & CARDS GALLERY */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl font-serif-display font-bold text-slate-900 flex items-center gap-2">
              <Film className="w-5 h-5 text-blue-600" />
              <span>
                {formatText('All 4 Boutique Videos Collection', 'تمام ۴ بوتیک ویڈیوز کی لسٹ', 'Tamam 4 Boutique Videos')}
              </span>
            </h3>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              4 Distinct Videos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videosList.map((item, idx) => {
              const isSelected = idx === activeVideoIndex;
              return (
                <div
                  key={item.id || idx}
                  onClick={() => handleSelectVideo(idx, true)}
                  className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1 ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                      : 'border-blue-100 hover:border-blue-300 shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                    <img
                      src={item.posterUrl}
                      alt={getVideoTitle(item)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Duration chip */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 text-white text-[11px] font-mono backdrop-blur-xs flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-blue-300" />
                      <span>{item.duration}</span>
                    </div>

                    {/* Category pill */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      {getVideoCategory(item)}
                    </div>

                    {/* Play button overlay */}
                    <div
                      className={`absolute inset-0 m-auto w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white scale-110 shadow-lg'
                          : 'bg-black/50 text-white group-hover:bg-blue-600 group-hover:scale-110'
                      }`}
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>

                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>Active</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 mb-1.5">
                        {getVideoTitle(item)}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {getVideoSubtitle(item)}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                      <span>{isSelected ? (isPlaying ? 'Playing Now' : 'Click to Play') : 'Play This Video'}</span>
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* QUICK VIDEO URL EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-100 relative">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {formatText('Change Video Link', 'ویڈیو لنک تبدیل کریں', 'Video Link Change Karein')}
                </h4>
                <p className="text-xs text-slate-500">
                  {getVideoTitle(currentVideo)}
                </p>
              </div>
            </div>

            {editSuccessMsg && (
              <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveVideoUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {formatText(
                    'YouTube or MP4 Video URL:',
                    'یوٹیوب یا MP4 ویڈیو کا لنک:',
                    'YouTube ya MP4 Video URL:'
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... ya .mp4"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Aap koi bhi YouTube watch link, YouTube shorts, ya direct MP4 video link paste kar sakte hain.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {formatText('Cancel', 'منسوخ کریں', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
                >
                  {formatText('Save & Play Video', 'محفوظ کریں اور چلائیں', 'Save & Play Karein')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
