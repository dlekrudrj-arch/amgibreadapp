"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Home, BookOpen, User, Settings, Camera, Loader2, 
  AlertCircle, Utensils, PenTool, RotateCcw, Check, X, ChevronLeft, Plus 
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";

// --- 상수 및 타입 정의 ---
const BREAD_IMG = "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop"; // Image 7 대용 고화질 빵 배경

type ViewState = "home" | "canvas" | "result" | "notes" | "quiz" | "fill";

interface Note {
  id: string;
  title: string;
  category: string;
  date: string;
  content: string;
  quizData: any[];
}

export default function AmgiBreadV2() {
  // --- 상태 관리 ---
  const [view, setView] = useState<ViewState>("home");
  const [tab, setTab] = useState("home");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEaten, setIsEaten] = useState(0); // 0~3 (한입씩 베어물기 단계)
  
  // 캔버스 관련
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#5a3e1b");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AI 분석 로직 (정석) ---
  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API 키를 확인해주세요.");

      const client = new GoogleGenAI({ apiKey });
      const imageData = base64Image.split(",")[1];

      const response = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{
          role: "user",
          parts: [
            { text: "이 사진의 내용을 공부하기 좋게 체계적으로 요약해줘. 수식이나 간단한 그래프 묘사도 포함해줘. 마지막엔 관련 퀴즈 5개를 [질문|정답] 형식으로 만들어줘." },
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
          ]
        }]
      });

      setQuiz(response.text);
      setView("result");
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 캔버스 그리기 로직 ---
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  // --- 뷰 렌더링 ---
  return (
    <div className="flex justify-center bg-[#FDFBF7] min-h-screen text-[#5a3e1b] font-sans">
      <div className="relative w-full max-w-[430px] bg-[#FFFCF5] shadow-2xl min-h-screen flex flex-col overflow-hidden">
        
        {/* 상단 헤더 */}
        <header className="px-6 py-4 flex justify-between items-center bg-white/90 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("home")}>
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black">암기빵</h1>
          </div>
          <div className="flex gap-4">
             {view !== "home" && <ChevronLeft onClick={() => setView("home")} className="cursor-pointer" />}
             <Settings className="text-gray-400 cursor-pointer" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-32">
          <AnimatePresence mode="wait">
            
            {/* 1. 홈 화면 (Image 1 스타일) */}
            {view === "home" && tab === "home" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8">
                <div className="text-center mt-4">
                  <h2 className="text-2xl font-black">무엇을 암기할까요?</h2>
                  <p className="text-gray-400 text-sm">책이나 노트를 찍어보세요!</p>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/5] bg-white border-4 border-dashed border-orange-200 rounded-[40px] flex flex-col items-center justify-center cursor-pointer shadow-inner relative group hover:border-orange-400 transition-all"
                >
                  <div className="p-8 bg-orange-50 rounded-full group-hover:scale-110 transition-transform">
                    <Camera size={64} className="text-orange-300" />
                  </div>
                  <p className="mt-4 font-black text-orange-400 text-lg">사진 찍기 / 업로드</p>
                  <p className="text-xs text-gray-300 mt-1">또는 이미지를 드래그 해주세요</p>
                  
                  {loading && (
                    <div className="absolute inset-0 bg-white/80 rounded-[40px] flex flex-col items-center justify-center z-10">
                      <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
                      <p className="font-black text-orange-600">AI가 빵 굽는 중...</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setView("canvas")}
                  className="w-full py-4 bg-white border-2 border-orange-200 rounded-2xl font-black text-orange-500 shadow-sm flex items-center justify-center gap-2 hover:bg-orange-50"
                >
                  <PenTool size={20} /> 직접 쓰기 모드
                </button>
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if(file) {
                    const r = new FileReader();
                    r.onload = () => analyzeImage(r.result as string);
                    r.readAsDataURL(file);
                  }
                }} className="hidden" accept="image/*" />
              </motion.div>
            )}

            {/* 2. 직접 쓰기 모드 (Image 3 스타일) */}
            {view === "canvas" && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="font-black text-lg">직접 쓰기</h3>
                  <button onClick={() => setView("home")} className="px-4 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">완료</button>
                </div>
                
                <div className="relative w-full aspect-[3/4] bg-white rounded-[40px] shadow-2xl overflow-hidden border-4 border-orange-100">
                  <img src={BREAD_IMG} className="absolute inset-0 w-full h-full object-cover opacity-90" alt="bread bg" />
                  <canvas 
                    ref={canvasRef} 
                    width={380} height={500}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                    className="relative z-10 w-full h-full touch-none cursor-crosshair"
                  />
                </div>

                <div className="flex justify-around bg-white p-4 rounded-3xl shadow-lg border border-orange-50">
                  {["#5a3e1b", "#ef4444", "#3b82f6", "#facc15", "#22c55e"].map(color => (
                    <div 
                      key={color} 
                      onClick={() => setPenColor(color)}
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 ${penColor === color ? 'border-orange-500 scale-125' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <RotateCcw onClick={() => {
                    const ctx = canvasRef.current?.getContext("2d");
                    ctx?.clearRect(0, 0, 400, 600);
                  }} className="text-gray-400 cursor-pointer" />
                </div>
                <p className="text-center text-gray-400 text-xs font-bold">빵 위에 직접 필기해보세요!</p>
              </motion.div>
            )}

            {/* 3. 분석 결과 & 먹기 애니메이션 (Image 2, 4 스타일) */}
            {view === "result" && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                <div className="relative w-full">
                  {/* 베어물기 마스크 (Image 4 시뮬레이션) */}
                  <div className={`relative transition-all duration-500 ${isEaten > 0 ? 'clip-bite' : ''}`}>
                    <div className="relative w-full aspect-[3/4] bg-[#f9f3e4] rounded-[50px] border-x-[6px] border-b-[10px] border-[#d97706] shadow-2xl overflow-hidden p-8">
                       <img src={BREAD_IMG} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
                       <div className="relative z-10">
                          <h2 className="text-2xl font-black mb-4 flex items-center gap-2">광합성 정리 <span className="text-orange-400">✨</span></h2>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {quiz}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 w-full mt-8">
                  <button onClick={() => setView("home")} className="flex-1 py-4 bg-white border-2 border-orange-200 rounded-3xl font-black flex items-center justify-center gap-2">
                    <RotateCcw size={20}/> 다시 스캔
                  </button>
                  <button 
                    onClick={() => {
                      if(isEaten < 3) setIsEaten(prev => prev + 1);
                      else {
                        alert("다 먹었습니다! 머릿속에 저장 완료!");
                        setView("home");
                        setIsEaten(0);
                      }
                    }} 
                    className="flex-2 px-10 py-4 bg-orange-500 text-white rounded-3xl font-black shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Utensils size={20}/> {isEaten === 0 ? "먹기" : "꿀꺽!"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* 4. 내 빵 노트 (Image 5 스타일) */}
            {tab === "notes" && view === "home" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black">내 빵 노트</h2>
                  <div className="flex gap-3 text-gray-400"><Plus /></div>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {["전체", "과학", "영어", "역사", "기타"].map(c => (
                    <span key={c} className={`px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap ${c === "전체" ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {c}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} onClick={() => setView("result")} className="bg-white p-4 rounded-3xl shadow-md border border-orange-50 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform">
                      <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl">🍞</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">광합성 원리 요약</h4>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] bg-orange-100 px-2 py-0.5 rounded text-orange-600 font-bold">과학</span>
                          <span className="text-[10px] text-gray-300">2024.05.20</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* 하단 탭 바 */}
        <nav className="h-24 bg-white border-t border-orange-50 flex justify-around items-center px-8 pb-4 absolute bottom-0 w-full z-50 rounded-t-[40px] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          <button onClick={() => { setTab("home"); setView("home"); }} className={`flex flex-col items-center gap-1 ${tab === "home" ? "text-orange-500" : "text-gray-300"}`}>
            <Home size={28} strokeWidth={3} />
            <span className="text-[10px] font-black">홈</span>
          </button>
          <button onClick={() => { setTab("notes"); setView("home"); }} className={`flex flex-col items-center gap-1 ${tab === "notes" ? "text-orange-500" : "text-gray-300"}`}>
            <BookOpen size={28} strokeWidth={3} />
            <span className="text-[10px] font-black">노트</span>
          </button>
          <button onClick={() => setTab("profile")} className={`flex flex-col items-center gap-1 ${tab === "profile" ? "text-orange-500" : "text-gray-300"}`}>
            <User size={28} strokeWidth={3} />
            <span className="text-[10px] font-black">내정보</span>
          </button>
        </nav>
      </div>

      <style jsx global>{`
        .clip-bite {
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 30%, 15% 20%, 0% 10%);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}