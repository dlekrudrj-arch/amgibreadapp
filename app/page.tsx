"use client";

import React, { useState, useRef } from "react";
import { 
  Home, BookOpen, User, Settings, Camera, Loader2, 
  Utensils, PenTool, RotateCcw, ChevronLeft, AlertCircle 
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";

const BREAD_IMG = "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000";

type ViewState = "home" | "canvas" | "result";

export default function AmgiBreadV2() {
  const [view, setView] = useState<ViewState>("home");
  const [tab, setTab] = useState("home");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isEaten, setIsEaten] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- [수정] 보내주신 예시(ai.models.generateContent) 규격 그대로 적용 ---
  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API 키가 설정되지 않았습니다.");

      // 1. 초기화 (제공해주신 예시 규격)
      const ai = new GoogleGenAI({ apiKey }); 
      const imageData = base64Image.split(",")[1];

      // 2. 모델 인스턴스 생성 없이 직접 호출하는 방식 적용
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash", // 사용자님 환경에 맞는 모델명
        contents: [
          {
            role: "user",
            parts: [
              { text: "이 공부 내용을 요약하고 암기용 퀴즈 3개를 한국어로 만들어줘. 중요한 단어는 [괄호]로 표시해줘." },
              {
                inlineData: {
                  data: imageData,
                  mimeType: "image/jpeg",
                },
              },
            ],
          },
        ],
      });

      // 3. 응답 텍스트 추출 (보내주신 예시의 response.text 방식)
      if (response && response.text) {
        setQuiz(response.text);
        setView("result");
      } else {
        throw new Error("AI 응답 데이터가 올바르지 않습니다.");
      }

    } catch (error: any) {
      console.error("AI 에러:", error);
      setErrorMsg(error.message || "분석 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  // --- 캔버스 드로잉 ---
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
        
        <header className="px-6 py-4 flex justify-between items-center bg-white border-b sticky top-0 z-50">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("home")}>
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black text-[#5a3e1b]">암기빵</h1>
          </div>
          <Settings className="text-gray-400" />
        </header>

        <main className="flex-1 p-6 pb-32 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8">
                <div className="text-center">
                  <h2 className="text-2xl font-black">무엇을 암기할까요?</h2>
                  <p className="text-gray-400 text-sm">공부할 내용을 찍어주세요</p>
                </div>
                <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-square bg-[#FFF9E6] border-4 border-dashed border-orange-200 rounded-[40px] flex items-center justify-center cursor-pointer relative overflow-hidden">
                  {image ? <img src={image} className="w-full h-full object-cover" /> : <Camera size={48} className="text-orange-300" />}
                  {loading && (
                    <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center">
                      <Loader2 className="animate-spin text-orange-500 mb-2" size={40} />
                      <p className="font-bold text-orange-600">분석 중...</p>
                    </div>
                  )}
                </div>
                <button onClick={() => setView("canvas")} className="w-full py-4 bg-white border-2 border-orange-100 rounded-2xl font-bold text-orange-500 flex items-center justify-center gap-2">
                  <PenTool size={18} /> 직접 쓰기 모드
                </button>
                {errorMsg && (
                  <div className="w-full p-4 bg-red-50 text-red-600 rounded-2xl flex gap-2 text-sm border border-red-100">
                    <AlertCircle size={18} className="shrink-0" />
                    <p>{errorMsg}</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if(file) {
                    const r = new FileReader();
                    r.onload = () => { setImage(r.result as string); analyzeImage(r.result as string); };
                    r.readAsDataURL(file);
                  }
                }} />
              </motion.div>
            )}

            {view === "canvas" && (
              <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <ChevronLeft onClick={() => setView("home")} className="cursor-pointer" />
                  <h3 className="font-black">직접 쓰기</h3>
                  <button onClick={() => setView("home")} className="text-orange-500 font-bold">완료</button>
                </div>
                <div className="relative w-full aspect-[3/4] bg-white rounded-[40px] shadow-xl overflow-hidden border-4 border-orange-50">
                  <img src={BREAD_IMG} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  <canvas ref={canvasRef} width={380} height={500} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)} className="relative z-10 w-full h-full touch-none" />
                </div>
              </motion.div>
            )}

            {view === "result" && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <div className={`relative transition-all duration-500 ${isEaten > 0 ? 'bite-mask' : ''}`}>
                   <div className="w-full aspect-[3/4] bg-[#fdf8e9] rounded-[50px] border-x-8 border-b-[12px] border-[#d97706] shadow-2xl p-8 overflow-hidden">
                      <div className="relative z-10 h-full overflow-y-auto no-scrollbar">
                        <h3 className="text-xl font-black mb-4">암기빵 완성! ✨</h3>
                        <div className="text-sm leading-relaxed text-[#5a3e1b] font-medium whitespace-pre-wrap">{quiz}</div>
                      </div>
                   </div>
                </div>
                <button onClick={() => { if(isEaten < 3) setIsEaten(prev => prev + 1); else { alert("암기 완료!"); setView("home"); setIsEaten(0); } }} className="w-full mt-8 py-4 bg-orange-500 text-white rounded-3xl font-bold shadow-lg">
                  {isEaten === 0 ? "먹기 시작" : "냠냠... 맛있어!"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <nav className="h-20 bg-white border-t flex justify-around items-center absolute bottom-0 w-full rounded-t-[32px] shadow-lg">
          <button onClick={() => setTab("home")} className={`flex flex-col items-center ${tab === 'home' ? 'text-orange-500' : 'text-gray-300'}`}><Home size={24}/><span className="text-[10px]">홈</span></button>
          <button onClick={() => setTab("notes")} className={`flex flex-col items-center ${tab === 'notes' ? 'text-orange-500' : 'text-gray-300'}`}><BookOpen size={24}/><span className="text-[10px]">노트</span></button>
          <button className="flex flex-col items-center text-gray-300"><User size={24}/><span className="text-[10px]">정보</span></button>
        </nav>
      </div>

      <style jsx global>{`
        .bite-mask { clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 30%, 15% 20%, 0% 10%); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}