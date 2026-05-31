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
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
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
    localStorage.setItem('theme', theme);
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
      localStorage.setItem('audio_cut_history', JSON.stringify(newHistory));
      
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
                        onClick={() => { setHistory([]); localStorage.setItem('audio_cut_history', JSON.stringify([])); }}
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
                <div className="flex flex-col gap-4 flex-grow text-gray-600 dark:text-gray-300 text-sm leading-relaxed overflow-y-auto">
                  <div className="p-5 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 rounded-2xl border border-cyan-100 dark:border-cyan-900/30 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mb-4 text-[#09090b] shadow-lg text-2xl font-bold font-display">
                      MD
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">আসিফ ইকবাল</h3>
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium mb-3">ফুল স্ট্যাক ওয়েব ডেভেলপার</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 px-2 leading-relaxed">
                      আমি আধুনিক ওয়েব অ্যাপ্লিকেশন তৈরি করতে এবং উন্নত ইউজার এক্সপেরিয়েন্স ডিজাইন করতে পছন্দ করি।
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 space-y-3">
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </span>
                      <div className="truncate">
                        <p className="text-[10px] text-gray-400">ইমেইল</p>
                        <p className="text-xs font-semibold truncate">web.asifio@gmail.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <span className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/></svg>
                      </span>
                      <div className="truncate">
                        <p className="text-[10px] text-gray-400">গিথাব</p>
                        <p className="text-xs font-semibold">github.com/asifio</p>
                      </div>
                    </div>
                  </div>
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

      <main className="relative z-10 max-w-2xl mx-auto px-6 pt-16 pb-24 min-h-[85vh] flex flex-col justify-center">
        
        <header className="text-center mb-12 mt-8">
          <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight mb-4 text-gray-900 dark:text-white">
            যেকোনো অডিও থেকে <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600">পছন্দের অংশ কেটে নিন।</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
            ফাইলের যেকোনো অংশ কাটুন সম্পূর্ণ এই অ্যাপ ব্যবহার করে, কোনো ডাটা বাইরে পাঠানো হয় না।
          </p>
        </header>

        <div className="w-full max-w-lg mx-auto relative perspective-1000 mt-8">
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
