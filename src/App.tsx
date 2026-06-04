import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Scissors, FileAudio, CheckCircle2, Download, Moon, Sun, Loader2, AlertCircle, History, Info, X, User } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { trimAudio } from './lib/audio';

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    } catch {
      return 'dark';
    }
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<'menu' | 'history' | 'about' | 'developer'>('menu');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const [history, setHistory] = useState<{name: string, date: string, time: string}[]>(() => {
    try {
      const stored = localStorage.getItem('audio_cut_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isHovering, setIsHovering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Apply dark mode to HTML tag
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('audio/')) {
      setErrorMsg('দয়া করে একটি সঠিক ডাটা ফরম্যাট (অডিও) আপলোড করুন।');
      return;
    }
    setFile(selectedFile);
    setErrorMsg('');
    setResultUrl(null);
    setProgress(0);

    const objUrl = URL.createObjectURL(selectedFile);
    setFileUrl(objUrl);
    const audio = new Audio(objUrl);
    
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      setStartTime(0);
      setEndTime(audio.duration);
    };
    audio.onerror = () => {
        setErrorMsg('অডিও ফাইল পড়তে সমস্যা হয়েছে, অন্য একটি ফাইল ব্যবহার করুন।');
    };
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setErrorMsg('');
    setResultUrl(null);

    if (endTime <= startTime) {
      setErrorMsg('শেষের সময় শুরুর সময় থেকে বেশি হতে হবে।');
      setIsProcessing(false);
      return;
    }

    try {
      const audioUrl = await trimAudio(file, startTime, endTime, (p) => setProgress(p));
      setResultUrl(audioUrl);
      setProgress(100);
      
      const newHistory = [{
        name: `cut_${file.name}`,
        date: new Date().toLocaleDateString('bn-BD'),
        time: formatTime(endTime - startTime)
      }, ...history].slice(0, 50);
      setHistory(newHistory);
      try {
        localStorage.setItem('audio_cut_history', JSON.stringify(newHistory));
      } catch {}
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'অডিও কাটার সময় সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setStartTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultUrl(null);
    setFileUrl(null);
    setProgress(0);
    setDuration(0);
    setStartTime(0);
    setEndTime(0);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] transition-colors duration-500 overflow-hidden relative selection:bg-cyan-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60 dark:opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Navigation Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-[#121214] border-r border-gray-200 dark:border-white/10 z-50 p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  {drawerView !== 'menu' && (
                    <button onClick={() => setDrawerView('menu')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                  )}
                  {drawerView === 'menu' && (
                    <div className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                      <Scissors className="text-[#09090b]" size={20} strokeWidth={2.5} />
                    </div>
                  )}
                  <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                    {drawerView === 'history' ? 'হিস্ট্রি' : drawerView === 'about' ? 'অ্যাপ সম্পর্কে' : drawerView === 'developer' ? 'ডেভেলপার সম্পর্কে' : 'অডিও কাটার'}
                  </h2>
                </div>
                <button onClick={() => { setIsDrawerOpen(false); setDrawerView('menu'); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {drawerView === 'menu' && (
                <div className="flex flex-col gap-2 flex-grow">
                  <button onClick={() => setDrawerView('history')} className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-all font-medium border border-transparent hover:border-gray-200 dark:hover:border-white/5 text-left">
                    <span className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <History size={18} />
                    </span>
                    হিস্ট্রি
                  </button>
                  <button onClick={() => setDrawerView('about')} className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-all font-medium border border-transparent hover:border-gray-200 dark:hover:border-white/5 text-left">
                    <span className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Info size={18} />
                    </span>
                    অ্যাপ সম্পর্কে
                  </button>
                  <button onClick={() => setDrawerView('developer')} className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-all font-medium border border-transparent hover:border-gray-200 dark:hover:border-white/5 text-left font-display">
                    <span className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <User size={18} />
                    </span>
                    ডেভেলপার সম্পর্কে
                  </button>
                </div>
              )}

              {drawerView === 'history' && (
                <div className="flex flex-col gap-3 flex-grow overflow-y-auto">
                  {history.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 flex flex-col items-center justify-center h-full opacity-60">
                      <History size={40} className="mb-4 text-gray-400" />
                      <p>কোনো হিস্ট্রি পাওয়া যায়নি</p>
                    </div>
                  ) : (
                    <>
                      {history.map((h, i) => (
                        <div key={i} className="p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:border-cyan-200 dark:hover:border-cyan-900/50 transition-colors">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={h.name}>{h.name}</div>
                          <div className="flex justify-between items-center mt-2 text-xs text-gray-500 gap-2">
                            <span className="flex-shrink-0">{h.date}</span>
                            <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded truncate">{h.time}</span>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => { setHistory([]); try { localStorage.setItem('audio_cut_history', JSON.stringify([])); } catch {} }}
                        className="mt-2 text-sm text-red-500 hover:text-red-600 dark:text-red-400 font-medium py-2 text-center"
                      >
                        হিস্ট্রি মুছুন
                      </button>
                    </>
                  )}
                </div>
              )}

              {drawerView === 'about' && (
                <div className="flex flex-col gap-4 flex-grow text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  <div className="p-5 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 rounded-2xl border border-cyan-100 dark:border-cyan-900/30">
                    <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl flex items-center justify-center mb-4 text-cyan-600 dark:text-cyan-400">
                      <Scissors size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base">১০০% প্রাইভেট ও নিরাপদ</h3>
                    <p>এই অ্যাপটি অডিও কাটার জন্য কোনো সার্ভার ব্যবহার করে না। আপনার আপলোড করা ফাইল সম্পূর্ণ নিরাপদে আপনার পার্সোনাল ডিভাইসে এই অ্যাপেই প্রসেস করা হয়।</p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                      <FileAudio size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base">দ্রুত ও কার্যকরী</h3>
                    <p>ডিভাইসের লোকাল প্রসেসর ব্যবহার করার কারণে অডিও এক্সট্রাকশন ও কাটিং দ্রুত হয়। যেকোনো সাইজের ফাইল সহজেই ম্যানেজ করা যায়।</p>
                  </div>
                </div>
              )}

              {drawerView === 'developer' && (
                <div className="flex flex-col gap-4 flex-grow overflow-y-auto">
                  <DeveloperProfile />
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/10 text-center">
                <p className="text-xs text-gray-400 font-medium">ভিসন ১.০ • লোকাল প্রসেসিং</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 text-gray-900 dark:text-white">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 transition-transform cursor-pointer"
            aria-label="Open menu"
          >
            <Scissors className="text-[#09090b]" size={20} strokeWidth={2.5} />
          </button>
          <h1 className="text-xl font-display font-bold tracking-tight uppercase text-gray-900 dark:text-white">
            অডিও কাটার
          </h1>
        </div>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto px-6 pt-4 pb-24 min-h-[80vh] flex flex-col justify-center">
        
        <header className="text-center mb-8 mt-2">
          <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-3 text-gray-900 dark:text-white">
            অডিও কাটুন <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600">সহজেই</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto">
            সম্পূর্ণ অফলাইনে, পার্সোনাল ডিভাইসেই।
          </p>
        </header>

        <div className="w-full max-w-lg mx-auto relative perspective-1000 mt-4">
          <AnimatePresence mode="wait">
            
            {/* ERROR MSG */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-[-60px] left-0 right-0 max-w-md mx-auto bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 backdrop-blur-sm"
              >
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{errorMsg}</p>
              </motion.div>
            )}

            {!file ? (
              // UPLOAD STATE
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <div 
                  className={cn(
                    "relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-3xl p-12 md:p-20 text-center transition-all duration-300",
                    isHovering 
                      ? "border-cyan-400 bg-cyan-400/5 shadow-[0_0_30px_rgba(34,211,238,0.1)]" 
                      : "border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-gray-400 dark:hover:border-white/20"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInput}
                    accept="audio/*"
                    className="hidden"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 mb-6 rounded-full bg-cyan-100 dark:bg-cyan-400/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-inner">
                      <UploadCloud size={48} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-display font-medium mb-3 text-gray-900 dark:text-white">
                      অডিও ফাইল সিলেক্ট করুন
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      বা এখানে ড্র্যাগ অ্যান্ড ড্রপ করুন
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : !isProcessing && !resultUrl ? (
              // FILE SELECTED, READY TO CUT STATE
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 p-8 rounded-3xl shadow-xl flex flex-col items-center">
                  <div className="w-20 h-20 bg-cyan-100 dark:bg-cyan-400/10 border border-cyan-200 dark:border-cyan-400/20 rounded-full flex items-center justify-center mb-6 text-cyan-600 dark:text-cyan-400">
                    <FileAudio size={40} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-1 truncate max-w-[280px] md:max-w-md">
                    {file.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {formatTime(duration)}
                  </p>

                  {fileUrl && (
                    <div className="w-full max-w-sm mb-6 bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/10">
                      <audio 
                        ref={audioRef} 
                        src={fileUrl} 
                        className="w-full h-10" 
                        controls 
                        onTimeUpdate={(e) => {
                          const audio = e.currentTarget;
                          if (audio.currentTime < startTime - 0.2) {
                            audio.currentTime = startTime;
                          } else if (audio.currentTime > endTime) {
                            audio.pause();
                            audio.currentTime = startTime;
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="w-full max-w-sm space-y-6 mb-10 text-left">
                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span>শুরুর সময়</span>
                        <span className="text-cyan-600 dark:text-cyan-400 font-mono bg-cyan-50 dark:bg-cyan-400/10 px-2 py-0.5 rounded">{formatTime(startTime)}</span>
                      </label>
                      <input 
                        type="range" 
                        min={0} 
                        max={Math.max(0, endTime - 0.1)} 
                        step={0.1} 
                        value={startTime} 
                        onChange={handleStartTimeChange} 
                        className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span>শেষের সময়</span>
                        <span className="text-cyan-600 dark:text-cyan-400 font-mono bg-cyan-50 dark:bg-cyan-400/10 px-2 py-0.5 rounded">{formatTime(endTime)}</span>
                      </label>
                      <input 
                        type="range" 
                        min={Math.min(duration, startTime + 0.1)} 
                        max={duration} 
                        step={0.1} 
                        value={endTime} 
                        onChange={(e) => setEndTime(parseFloat(e.target.value))} 
                        className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>
                    <div className="pt-2 text-center">
                        <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 flex justify-center items-center rounded">
                            সর্বমোট: {formatTime(endTime - startTime)}
                        </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 w-full">
                    <button 
                      onClick={handleReset}
                      className="px-5 py-3 rounded-full font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors"
                    >
                      বাতিল
                    </button>
                    <button 
                      onClick={handleProcess}
                      className="px-8 py-3 rounded-full font-medium text-[#09090b] bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center gap-2 hover:scale-105"
                    >
                      <Scissors size={18} />
                      কাটুন
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : isProcessing ? (
              // PROCESSING STATE
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 p-12 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-gray-100 dark:border-white/5 rounded-full" />
                    <motion.div 
                      className="absolute inset-0 border-4 border-cyan-400 rounded-full border-t-transparent border-r-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-cyan-500 dark:text-cyan-400 font-bold">
                      {Math.round(progress)}%
                    </div>
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">
                    অডিও কাটা হচ্ছে...
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    এটি সম্পূর্ণ এই অ্যাপেই চলছে...
                  </p>
                </div>
              </motion.div>
            ) : (
              // RESULT STATE
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className="bg-white dark:bg-[#121214] border border-cyan-200 dark:border-cyan-900/50 p-8 rounded-3xl shadow-xl shadow-cyan-900/10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 shadow-inner rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
                    সম্পূর্ণ হয়েছে!
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-center">
                    আপনার অডিও সফলভাবে কাটা হয়েছে। এখন আপনি এটি ডাউনলোড করতে পারেন।
                  </p>
                  
                  {resultUrl && (
                    <audio src={resultUrl} controls className="mb-8 w-full max-w-sm appearance-none outline-none" />
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button 
                      onClick={handleReset}
                      className="px-6 py-3 rounded-full font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors"
                    >
                      নতুন অডিও
                    </button>
                    {resultUrl && (
                      <a 
                        href={resultUrl}
                        download={`cut_${file?.name || 'audio.wav'}`}
                        className="px-8 py-3 rounded-full font-medium text-[#09090b] bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={18} />
                        ডাউনলোড করুন
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Features Note */}
        <p className="text-xs text-center text-gray-500 mt-8 mx-auto max-w-lg font-medium leading-relaxed">
          আপনার প্রিয় গান বা রেকর্ডিং থেকে প্রয়োজনীয় অংশ কেটে রিংটোন বা প্রজেক্টের জন্য ব্যবহার করুন।
          <br className="hidden md:block" />
          কোনো ইন্টারনেট ছাড়াই ফাইল সম্পূর্ণ নিরাপদে আপনার পার্সোনাল ডিভাইসেই প্রসেস হয়।
        </p>
      </main>
    </div>
  );
}

function DeveloperProfile() {
  const [btnState, setBtnState] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleBtnClick = () => {
    if (btnState !== 'idle') return;
    setBtnState('loading');
    setTimeout(() => {
      setBtnState('done');
      window.open('https://asifio.blogspot.com', '_blank');
      // Reset button after 3 seconds so they can click again if desired
      setTimeout(() => setBtnState('idle'), 3000);
    }, 1200);
  };

  const socials = [
    { 
      url: "https://www.facebook.com/infoaiqbal", 
      path: "M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"
    },
    { 
      url: "https://www.instagram.com/infoaiqbal", 
      path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
    },
    { 
      url: "https://t.me/infoaiqbal", 
      path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.43.91-4.04 2.67-.38.26-.73.39-1.05.38-.35-.01-1.03-.2-1.53-.36-.61-.2-1.1-.31-1.06-.66.02-.18.27-.37.75-.56 2.94-1.28 4.9-2.13 5.88-2.54 2.79-1.17 3.37-1.37 3.75-1.38.08 0 .27.02.39.12.1.08.13.19.14.28-.01.05.01.17 0 .2z"
    },
    { 
      url: "mailto:web.asifio@gmail.com", 
      path: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
    }
  ];

  return (
    <div className="flex justify-center items-center py-10 w-full sm:mt-10 mt-6 relative">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-[360px] rounded-[20px] px-[25px] pt-[60px] pb-[35px] relative text-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-black/5 dark:border-white/5">
        
        <div className="w-[120px] h-[120px] rounded-full border-[4px] border-white dark:border-zinc-900 shadow-[0_8px_25px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.6)] absolute -top-[60px] left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 overflow-hidden flex justify-center items-center">
          <img 
            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhjnj7EEJ5DtXVggqXDKNdFdMLP59bgdBCG4sl3sCdA_9P8xDLLyVsEMXWlpLJ1jAP4btysooLOvHdsWLUwcGjaM4E1hyphenhyphennaqjmNKLLXcOLddCjLJhxvyJI_OdsB-7ywEylcZFOc4x1OpW8Uh19OHaWV0r5QonYf7YLc-udO8ynMWrN34i2U2K4zMu9PG2pc/s1884/IMG_20260328_233420_303.webp" 
            alt="Asif Iqbal" 
            className="w-full h-full object-cover pointer-events-none" 
          />
        </div>

        <h2 className="text-[26px] font-bold text-[#1a1a1a] dark:text-gray-100 mb-3 mt-[15px]" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>আসিফ ইকবাল</h2>
        
        <p className="text-[18px] text-[#555555] dark:text-gray-400 leading-relaxed mb-[30px] px-2" style={{ fontFamily: "'Kalpurush', sans-serif" }}>
          আমি একজন তালিবুল ইলম, নাশিদ শিল্পী, ডিজাইনার ও অ্যাপ ডেভেলপার। আমার সাথে যুক্ত হতে নিচের সোশ্যাল লিংকগুলো ফলো করুন।
        </p>

        <div className="flex justify-center gap-[15px] mb-[30px] flex-wrap">
          {socials.map((s, i) => (
            <a 
              key={i} 
              href={s.url} 
              target="_blank" 
              rel="noreferrer" 
              className="flex justify-center items-center w-[45px] h-[45px] rounded-full bg-[#f4f6f8] dark:bg-white/5 text-[#0d204a] dark:text-gray-300 decoration-none transition-all duration-300 hover:bg-[#035907] hover:text-white dark:hover:bg-[#035907] dark:hover:text-white hover:-translate-y-[5px] hover:shadow-[0_8px_15px_rgba(0,0,0,0.15)] focus:outline-none"
            >
              <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-current">
                <path d={s.path} />
              </svg>
            </a>
          ))}
        </div>

        <div className="flex justify-center">
          <button 
            onClick={handleBtnClick}
            className={cn(
              "h-[50px] border-none text-[15px] font-bold cursor-pointer relative transition-all duration-300 flex justify-center items-center font-display focus:outline-none",
              btnState === 'idle' ? "bg-[#0984e3] text-white w-[160px] rounded-[10px]" : "",
              btnState === 'loading' ? "bg-transparent sm:bg-[#0984e3] text-transparent w-[50px] rounded-[50px]" : "",
              btnState === 'done' ? "bg-[#29fd53] text-[#000000] w-[160px] rounded-[10px]" : ""
            )}
          >
            {btnState === 'loading' && (
              <div className="absolute w-[20px] h-[20px] border-[3px] border-white/30 border-t-[#0984e3] sm:border-t-white rounded-full animate-[spin_0.8s_linear_infinite]"></div>
            )}
            <span className={btnState === 'loading' ? 'opacity-0 scale-50 transition-all' : 'opacity-100 scale-100 transition-all delay-100'}>
              {btnState === 'done' ? 'দেখুন' : 'ওয়েব সাইট'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
