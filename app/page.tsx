"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Home, BookOpen, User, Settings, Camera, Loader2, 
  Utensils, Type, Pencil, RotateCcw, ChevronLeft, Check, Plus
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";

// --- 상수 정의 ---
// Image 7: 사용자님이 보내주신 고화질 식빵 에셋
const BREAD_ASSET = "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000"; 

type AppView = "home" | "eat";
type EditMode = "none" | "typing" | "drawing";

export default function AmgiBreadV2() {
  // --- 상태 관리 ---
  const [view, setView] = useState<AppView>("home");
  const [tab, setTab] = useState("home");
  const [editMode, setEditMode] = useState<EditMode>("none");
  
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiContent, setAiContent] = useState("");
  const [userText, setUserText] = useState("");
  const [biteCount, setBiteCount] = useState(0); // 0~4단계 (먹기 애니메이션)

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AI 분석 로직 (사용자님 제공 정석 규격) ---
  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });
      const imageData = base64Image.split(",")[1];

      // 모델명: gemini-3-flash-preview 고정
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{
          role: "user",
          parts: [
            { text: "이 이미지를 스캔해서 공부하기 좋게 요약해줘. 중요한 개념 위주로 정리해줘." },
            { inlineData: { data: imageData, mimeType: "image/jpeg" } },
          ],
        }],
      });

      if (response && response.text) {
        setAiContent(response.text);
      }
    } catch (error) {
      console.error("AI 스캔 에러:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 그리기 로직 (Canvas) ---
  const startDrawing = (e: any) => {
    if (editMode !== "drawing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
    ctx?.beginPath();
    ctx?.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing || editMode !== "drawing") return;
    const ctx = canvasRef.current?.getContext("2d");
    const rect = canvasRef.current?.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
    ctx?.lineTo(x, y);
    ctx!.strokeStyle = "#5a3e1b";
    ctx!.lineWidth = 3;
    ctx?.stroke();
  };

  // --- 화면 렌더링 ---
  return (
    <div className="flex justify-center bg-[#FDFBF7] min-h-screen font-sans text-[#5a3e1b]">
      <div className="relative w-full max-w-[430px] bg-[#FFFCF5] shadow-2xl min-h-screen flex flex-col overflow-hidden">
        
        {/* 헤더 */}
        <header className="px-6 py-4 flex justify-between items-center bg-white/80 border-b">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black">암기빵</h1>
          </div>
          <Settings className="text-gray-300" />
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-40">
          <AnimatePresence mode="wait">
            
            {/* [홈 화면] 빵이 크게 있고 모든 입력이 여기서 이뤄짐 */}
            {view === "home" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
                <div className="text-center py-2">
                  <h2 className="text-2xl font-black">무엇을 암기할까요?</h2>
                  <p className="text-gray-400 text-sm">책이나 노트를 찍어보세요!</p>
                </div>

                {/* 메인 빵 영역 (Image 7 배경) */}
                <div className="relative w-full aspect-[4/5] rounded-[50px] shadow-2xl border-x-4 border-b-8 border-[#d97706] overflow-hidden bg-white">
                  <img src={BREAD_ASSET} className="absolute inset-0 w-full h-full object-cover opacity-90" alt="bread-bg" />
                  
                  {/* 1층: 업로드된 이미지 (스캔 결과물) */}
                  {image && <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-multiply" />}
                  
                  {/* 2층: AI 분석 텍스트 */}
                  <div className="absolute inset-0 p-10 overflow-y-auto no-scrollbar pointer-events-none">
                    <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{aiContent}</p>
                  </div>

                  {/* 3층: 타이핑 레이어 */}
                  {editMode === "typing" && (
                    <textarea 
                      value={userText}
                      onChange={(e) => setUserText(e.target.value)}
                      placeholder="여기에 내용을 입력하세요..."
                      className="absolute inset-0 bg-transparent p-10 text-sm font-bold border-none focus:ring-0 resize-none z-20"
                    />
                  )}
                  {editMode !== "typing" && userText && (
                    <div className="absolute inset-0 p-10 text-sm font-bold whitespace-pre-wrap pointer-events-none z-20">
                      {userText}
                    </div>
                  )}

                  {/* 4층: 그리기 레이어 (Canvas) */}
                  <canvas 
                    ref={canvasRef} width={400} height={500}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)}
                    className={`absolute inset-0 w-full h-full z-30 ${editMode === 'drawing' ? 'cursor-crosshair' : 'pointer-events-none'}`}
                  />

                  {/* 초기 업로드 가이드 */}
                  {!image && !aiContent && !userText && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer z-10"
                    >
                      <div className="p-6 bg-orange-50/50 rounded-full border-2 border-dashed border-orange-200">
                        <Camera size={48} className="text-orange-300" />
                      </div>
                      <p className="mt-4 font-black text-orange-400">사진 찍기 / 업로드</p>
                    </div>
                  )}

                  {loading && (
                    <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center z-50">
                      <Loader2 className="animate-spin text-orange-500 mb-2" size={40} />
                      <p className="font-black text-orange-600">AI 스캔 중...</p>
                    </div>
                  )}
                </div>

                {/* 모드 선택 버튼 */}
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setEditMode("typing")}
                    className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border-2 transition-all ${editMode === 'typing' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-400 border-orange-100'}`}
                  >
                    <Type size={20} /> 직접 쓰기
                  </button>
                  <button 
                    onClick={() => setEditMode("drawing")}
                    className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border-2 transition-all ${editMode === 'drawing' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-400 border-orange-100'}`}
                  >
                    <Pencil size={20} /> 그리기
                  </button>
                </div>

                {/* 완성 버튼 */}
                <button 
                  onClick={() => setView("eat")}
                  className="w-full py-5 bg-[#5a3e1b] text-white rounded-[24px] font-black text-xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  <Check size={24} /> 완성! 암기빵 굽기
                </button>

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

            {/* [먹기 화면] V1의 냠냠 기능 */}
            {view === "eat" && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-8">
                <div className="text-center py-4">
                  <h2 className="text-2xl font-black">맛있게 암기하세요!</h2>
                  <p className="text-gray-400 text-sm">빵을 눌러 한 입씩 먹어보세요</p>
                </div>

                <div 
                  onClick={() => {
                    if(biteCount < 4) setBiteCount(prev => prev + 1);
                  }}
                  className={`relative w-full aspect-[4/5] rounded-[50px] shadow-2xl border-x-4 border-b-8 border-[#d97706] overflow-hidden bg-white transition-all duration-300 ${biteCount > 0 ? 'bite-active' : ''}`}
                  style={{ clipPath: getBiteClipPath(biteCount) }}
                >
                  <img src={BREAD_ASSET} className="absolute inset-0 w-full h-full object-cover" />
                  {image && <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-multiply" />}
                  <div className="absolute inset-0 p-10 overflow-y-auto no-scrollbar text-sm font-bold whitespace-pre-wrap">
                    {aiContent}
                    {"\n\n"}
                    {userText}
                  </div>
                </div>

                {biteCount >= 4 ? (
                  <button 
                    onClick={() => {
                      setView("home"); setBiteCount(0); setImage(null); setAiContent(""); setUserText(""); setEditMode("none");
                    }}
                    className="w-full py-5 bg-orange-500 text-white rounded-[24px] font-black text-xl shadow-xl flex items-center justify-center gap-3 animate-bounce"
                  >
                    <RotateCcw size={24} /> 다시 굽기
                  </button>
                ) : (
                  <p className="text-orange-400 font-black animate-pulse">빵을 눌러서 한 입 냠!</p>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* 하단 탭 바 (홈 화면에서만) */}
        <nav className="h-24 bg-white border-t border-orange-50 flex justify-around items-center px-10 pb-6 rounded-t-[40px] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] absolute bottom-0 w-full z-50">
          <button onClick={() => { setTab("home"); setView("home"); }} className={`flex flex-col items-center gap-1 ${tab === "home" ? "text-orange-500" : "text-gray-300"}`}>
            <Home size={28} strokeWidth={3} /><span className="text-[10px] font-black">홈</span>
          </button>
          <button onClick={() => setTab("notes")} className={`flex flex-col items-center gap-1 ${tab === "notes" ? "text-orange-500" : "text-gray-300"}`}>
            <BookOpen size={28} strokeWidth={3} /><span className="text-[10px] font-black">노트</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-300">
            <User size={28} strokeWidth={3} /><span className="text-[10px] font-black">내정보</span>
          </button>
        </nav>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        textarea::placeholder { color: #d1d5db; }
      `}</style>
    </div>
  );
}

// V1의 한입 베어물기 효과를 위한 ClipPath 함수
function getBiteClipPath(count: number) {
  if (count === 0) return "none";
  if (count === 1) return "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 25%, 15% 15%, 0% 5%)";
  if (count === 2) return "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 45%, 25% 30%, 0% 15%, 0% 25%, 15% 15%, 0% 5%)";
  if (count === 3) return "polygon(0% 0%, 85% 5%, 100% 20%, 85% 35%, 100% 50%, 85% 65%, 100% 100%, 0% 100%, 0% 45%, 25% 30%, 0% 15%, 0% 25%, 15% 15%, 0% 5%)";
  return "polygon(20% 20%, 80% 25%, 75% 50%, 80% 75%, 20% 80%, 25% 50%)"; // 다 먹음
}