"use client";

import React, { useState, useRef } from "react";
import { 
  Home, BookOpen, User, Camera, Loader2, 
  Type, Pencil, RotateCcw, Check
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";

// [고정] 사용자 제공 오리지널 식빵 이미지
const BREAD_IMAGE = "/ChatGPT Image 2026년 5월 2일 오후 10_02_52.png"; 

type ViewState = "home" | "eat";
type Mode = "none" | "typing" | "drawing";

export default function AmgiBreadV2() {
  const [view, setView] = useState<ViewState>("home");
  const [mode, setMode] = useState<Mode>("none");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [aiContent, setAiContent] = useState("");
  const [userText, setUserText] = useState("");
  const [biteCount, setBiteCount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // --- API 호출: 지정하신 new GoogleGenAI({ apiKey }) 방식 준수 ---
  const handleScan = async (base64: string) => {
    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
      const ai = new GoogleGenAI({ apiKey }); 
      const imageData = base64.split(",")[1];

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: "이 공부 내용을 체계적으로 요약해줘. 중요한 부분은 [괄호]로 표시해줘." },
              { inlineData: { data: imageData, mimeType: "image/jpeg" } }
            ]
          }
        ]
      });

      if (response && response.text) {
        setAiContent(response.text);
      }
    } catch (err) {
      console.error("AI 분석 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 그리기 로직: [중요] rect 안전 예외 처리 적용 ---
  const startDrawing = (e: any) => {
    if (mode !== "drawing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    if (!rect) return; // [강조] 알려주신 안전 장치 적용

    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
    
    const ctx = canvas.getContext("2d");
    ctx?.beginPath();
    ctx?.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing || mode !== "drawing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect) return; // [강조] 알려주신 안전 장치 적용

    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#4a3311"; 
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  };

  return (
    <div className="flex justify-center bg-[#FDFBF7] min-h-screen font-sans text-[#5a3e1b]">
      <div className="relative w-full max-w-[430px] bg-[#FFFCF5] shadow-2xl min-h-screen flex flex-col overflow-hidden">
        
        <header className="p-6 flex justify-center border-b bg-white sticky top-0 z-50">
          <h1 className="text-2xl font-black tracking-tight text-[#d97706]">암기빵 V2</h1>
        </header>

        <main className="flex-1 p-6 pb-32 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === "home" ? (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                
                {/* 메인 빵 레이아웃: 오리지널 이미지 고정 */}
                <div className="relative w-full aspect-[1/1.5] rounded-[60px] overflow-hidden shadow-2xl border-b-8 border-[#c2a382]">
                  <img src={BREAD_IMAGE} className="absolute inset-0 w-full h-full object-cover" alt="bread-bg" />
                  
                  {image && <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply pointer-events-none" />}
                  
                  <div className="absolute inset-0 p-12 overflow-y-auto no-scrollbar pointer-events-none">
                    <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{aiContent}</p>
                  </div>

                  {mode === "typing" && (
                    <textarea 
                      className="absolute inset-0 bg-transparent p-12 text-sm font-bold border-none focus:ring-0 resize-none z-20 text-[#4a3311]"
                      value={userText} onChange={(e) => setUserText(e.target.value)}
                      placeholder="내용을 입력하세요..."
                    />
                  )}
                  {mode !== "typing" && <div className="absolute inset-0 p-12 text-sm font-bold pointer-events-none z-20 whitespace-pre-wrap">{userText}</div>}

                  <canvas 
                    ref={canvasRef} width={400} height={600}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)}
                    className={`absolute inset-0 w-full h-full z-30 ${mode === "drawing" ? "cursor-crosshair" : "pointer-events-none"}`}
                  />

                  {!image && !userText && !aiContent && (
                    <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 cursor-pointer z-10 backdrop-blur-[1px]">
                      <div className="bg-white/90 p-5 rounded-full shadow-lg mb-4 text-orange-500"><Camera size={40} /></div>
                      <p className="font-black text-[#5a3e1b]">여기에 사진을 구워주세요!</p>
                    </div>
                  )}

                  {loading && (
                    <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center z-50">
                      <Loader2 className="animate-spin text-orange-500" size={48} />
                      <p className="mt-2 font-black text-orange-600 text-center">AI 암기빵 굽는 중...</p>
                    </div>
                  )}
                </div>

                {/* 모드 선택 버튼 */}
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setMode("typing")} className={`py-4 rounded-2xl font-bold flex items-center justify-center border-2 ${mode === 'typing' ? 'bg-[#5a3e1b] text-white border-[#5a3e1b]' : 'bg-white text-[#5a3e1b] border-orange-100'}`}>
                    <Type size={18} className="mr-2" /> 직접 쓰기
                  </button>
                  <button onClick={() => setMode("drawing")} className={`py-4 rounded-2xl font-bold flex items-center justify-center border-2 ${mode === 'drawing' ? 'bg-[#5a3e1b] text-white border-[#5a3e1b]' : 'bg-white text-[#5a3e1b] border-orange-100'}`}>
                    <Pencil size={18} className="mr-2" /> 그리기 모드
                  </button>
                </div>

                <button onClick={() => setView("eat")} className="w-full py-5 bg-orange-500 text-white rounded-[30px] font-black text-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <Check size={24} /> 완성! 암기하기
                </button>

                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if(file) {
                    const r = new FileReader();
                    r.onload = () => { setImage(r.result as string); handleScan(r.result as string); };
                    r.readAsDataURL(file);
                  }
                }} />
              </motion.div>
            ) : (
              /* [먹기 모드] */
              <motion.div key="eat" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-8">
                <div className="relative w-full aspect-[1/1.5] rounded-[60px] overflow-hidden shadow-2xl" 
                     style={{ clipPath: getBitePath(biteCount) }}
                     onClick={() => biteCount < 4 && setBiteCount(b => b + 1)}>
                  <img src={BREAD_IMAGE} className="absolute inset-0 w-full h-full object-cover" alt="bread-eat" />
                  {image && <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply" />}
                  <div className="absolute inset-0 p-12 text-sm font-bold whitespace-pre-wrap">{aiContent || userText}</div>
                </div>

                {biteCount >= 4 ? (
                  <button onClick={() => { setView("home"); setBiteCount(0); setImage(null); setAiContent(""); setUserText(""); setMode("none"); }}
                          className="w-full py-5 bg-[#5a3e1b] text-white rounded-[30px] font-black text-xl shadow-lg flex items-center justify-center gap-2">
                    <RotateCcw size={24} /> 다시 굽기 (처음으로)
                  </button>
                ) : (
                  <p className="font-black text-orange-500 text-lg animate-pulse">빵을 터치해 냠냠 먹으며 외워요!</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <nav className="h-24 bg-white border-t flex justify-around items-center absolute bottom-0 w-full px-10 pb-4 rounded-t-[40px] shadow-lg">
          <button className="flex flex-col items-center text-orange-500 font-bold"><Home size={28} /><span className="text-[10px]">홈</span></button>
          <button className="flex flex-col items-center text-gray-300 font-bold"><BookOpen size={28} /><span className="text-[10px]">노트</span></button>
          <button className="flex flex-col items-center text-gray-300 font-bold"><User size={28} /><span className="text-[10px]">내정보</span></button>
        </nav>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

function getBitePath(count: number) {
  if (count === 0) return "none";
  if (count === 1) return "polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 20%, 15% 15%, 0 5%)";
  if (count === 2) return "polygon(0 0, 85% 5%, 100% 20%, 90% 40%, 100% 100%, 0 100%, 0 20%, 15% 15%, 0 5%)";
  if (count === 3) return "polygon(15% 15%, 85% 15%, 85% 85%, 15% 85%, 20% 50%)";
  return "circle(0% at 50% 50%)";
}