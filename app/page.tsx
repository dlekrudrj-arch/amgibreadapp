"use client";

import React, { useState, useRef } from "react";
import { 
  Home, BookOpen, User, Settings, Camera, Loader2, 
  Utensils, PenTool, RotateCcw, ChevronLeft, Plus, Search, MoreVertical
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";

// --- 상수 정의 ---
const BREAD_IMG = "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000";

type ViewState = "home" | "canvas" | "result";

export default function AmgiBreadV2() {
  // --- 상태 관리 ---
  const [view, setView] = useState<ViewState>("home");
  const [tab, setTab] = useState("home");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>(""); // 항상 string 보장
  const [isEaten, setIsEaten] = useState(0);
  const [quizCount, setQuizCount] = useState(5);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AI 분석 로직 (에러 해결 지점) ---
  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        alert("API 키가 없습니다. .env.local 파일을 확인해주세요.");
        return;
      }

      // 1. GoogleGenAI 인스턴스 생성
      const ai = new GoogleGenAI({ apiKey });
      
      
      // 2. 모델 가져오기 (이 부분에서 에러가 날 경우 genAI.getGenerativeModel 형식을 유지)
      Response = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const imageData = base64Image.split(",")[1];
      const prompt = `이미지 내용을 체계적으로 요약하고, 중요한 부분은 [괄호]로 표시해줘. 마지막엔 ${quizCount}개의 퀴즈를 만들어줘.`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: imageData, mimeType: "image/jpeg" } }
      ]);

      const text = result.response.text();
      setContent(text || "분석된 내용이 없습니다.");
      setView("result");
    } catch (error) {
      console.error("AI 에러:", error);
      alert("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // --- 캔버스 그리기 ---
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!ctx || !rect) return;
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#5a3e1b";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  return (
    <div className="flex justify-center bg-[#FDFBF7] min-h-screen">
      <div className="w-full max-w-[430px] bg-[#FFFCF5] shadow-2xl min-h-screen flex flex-col relative overflow-hidden">
        
        {/* 헤더 */}
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("home")}>
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-bold text-[#5a3e1b]">암기빵</h1>
          </div>
          <Settings className="text-gray-400" />
        </header>

        <main className="flex-1 p-6 pb-32">
          <AnimatePresence mode="wait">
            
            {/* 홈 & 노트 탭 */}
            {view === "home" && (
              tab === "home" ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center">
                  <div className="py-4">
                    <h2 className="text-2xl font-bold">무엇을 암기할까요?</h2>
                    <p className="text-gray-400">책이나 노트를 찍어보세요!</p>
                  </div>
                  <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-[4/5] border-4 border-dashed border-orange-200 rounded-[40px] flex flex-col items-center justify-center bg-white cursor-pointer relative">
                    <Camera size={60} className="text-orange-300 mb-4" />
                    <p className="text-lg font-bold text-orange-400">사진 찍기 / 업로드</p>
                    {loading && (
                      <div className="absolute inset-0 bg-white/90 rounded-[40px] flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-orange-500 mb-2" />
                        <p className="font-bold">AI 암기빵 굽는 중...</p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setView("canvas")} className="w-full py-4 bg-white border-2 border-orange-100 rounded-2xl font-bold text-orange-500 flex items-center justify-center gap-2">
                    <PenTool size={18} /> 직접 쓰기 모드
                  </button>
                  <div className="flex justify-center items-center gap-4 bg-orange-50 p-3 rounded-2xl">
                    <span className="text-sm font-bold text-orange-700">퀴즈:</span>
                    {[5, 10, 15].map(n => (
                      <button key={n} onClick={() => setQuizCount(n)} className={`px-3 py-1 rounded-full text-xs font-bold ${quizCount === n ? 'bg-orange-500 text-white' : 'bg-white text-orange-300'}`}>
                        {n}개
                      </button>
                    ))}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if(file) {
                      const reader = new FileReader();
                      reader.onload = () => analyzeImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h2 className="text-2xl font-bold">내 빵 노트</h2>
                  <div className="space-y-4">
                    {["광합성 정리", "영단어 Day 12", "한국사 핵심"].map((title, i) => (
                      <div key={i} className="bg-white p-4 rounded-3xl shadow-sm border border-orange-50 flex items-center gap-4">
                        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-xl">🍞</div>
                        <div><h4 className="font-bold">{title}</h4><p className="text-[10px] text-gray-300">2024.05.20</p></div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            )}

            {/* 캔버스 모드 */}
            {view === "canvas" && (
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="space-y-4">
                <div className="flex justify-between items-center">
                  <ChevronLeft onClick={() => setView("home")} className="cursor-pointer" />
                  <h2 className="font-bold">직접 쓰기</h2>
                  <button onClick={() => setView("home")} className="text-orange-500 font-bold">완료</button>
                </div>
                <div className="relative w-full aspect-[3/4] bg-white rounded-[40px] shadow-xl overflow-hidden border-4 border-orange-50">
                  <img src={BREAD_IMG} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="bread" />
                  <canvas 
                    ref={canvasRef} width={380} height={500}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)}
                    className="relative z-10 w-full h-full touch-none"
                  />
                </div>
              </motion.div>
            )}

            {/* 결과 모드 */}
            {view === "result" && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <div className={`relative transition-all duration-500 ${isEaten > 0 ? 'bite-effect' : ''}`}>
                   <div className="w-full aspect-[3/4] bg-[#fdf8e9] rounded-[50px] border-x-8 border-b-[12px] border-[#d97706] shadow-2xl p-8 overflow-hidden">
                      <div className="relative z-10 h-full overflow-y-auto no-scrollbar">
                        <h3 className="text-xl font-black mb-4">암기빵 완성! ✨</h3>
                        <div className="text-sm leading-relaxed text-[#5a3e1b] font-medium whitespace-pre-wrap">{content}</div>
                      </div>
                   </div>
                </div>
                <button 
                  onClick={() => {
                    if(isEaten < 3) setIsEaten(prev => prev + 1);
                    else { alert("암기 완료!"); setView("home"); setIsEaten(0); }
                  }}
                  className="w-full mt-8 py-4 bg-orange-500 text-white rounded-3xl font-bold shadow-lg"
                >
                  {isEaten === 0 ? "먹기 시작!" : "남냠... 맛있어!"}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* 하단 탭 */}
        <nav className="h-24 bg-white border-t border-orange-50 flex justify-around items-center px-10 pb-6 rounded-t-[40px] absolute bottom-0 w-full">
          <button onClick={() => {setTab("home"); setView("home");}} className={`flex flex-col items-center gap-1 ${tab === 'home' ? 'text-orange-500' : 'text-gray-300'}`}>
            <Home size={26} /><span className="text-[10px] font-bold">홈</span>
          </button>
          <button onClick={() => {setTab("notes"); setView("home");}} className={`flex flex-col items-center gap-1 ${tab === 'notes' ? 'text-orange-500' : 'text-gray-300'}`}>
            <BookOpen size={26} /><span className="text-[10px] font-bold">노트</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-300">
            <User size={26} /><span className="text-[10px] font-bold">내정보</span>
          </button>
        </nav>
      </div>

      <style jsx global>{`
        .bite-effect { clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 30%, 15% 20%, 0% 10%); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}