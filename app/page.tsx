"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Home, BookOpen, User, Camera, Loader2, 
  Type, Pencil, RotateCcw, Check, Undo2, Eraser
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";

// [고정] 사용자 제공 식빵 이미지
const BREAD_IMAGE = "/ChatGPT Image 2026년 5월 2일 오후 10_02_52.png"; 

export default function AmgiBreadV2() {
  const [view, setView] = useState<"home" | "eat">("home");
  const [mode, setMode] = useState<"none" | "typing" | "drawing">("none");
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [aiContent, setAiContent] = useState("");
  const [userText, setUserText] = useState("");
  const [bite, setBite] = useState(0);
  const [shake, setShake] = useState(false);
  const [brushSize, setBrushSize] = useState(6);
  const [color, setColor] = useState("#5a3e1b");
  const [history, setHistory] = useState<string[]>([]);

  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  // 초기 캔버스 설정
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    canvas.width = 400;
    canvas.height = 600;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // AI 스캔 (사용자 지정 규격 준수)
  const handleScan = async (base64: string) => {
    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
      const ai = new GoogleGenAI({ apiKey }); // [암기] 필수 호출 방식
      const imageData = base64.split(",")[1];

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{
          role: "user",
          parts: [
            { text: "이 내용을 암기하기 좋게 요약해줘." },
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
          ]
        }]
      });
      if (response?.text) setAiContent(response.text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // V1 스타일의 부드러운 드로잉 로직
  const getPos = (e: any) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 }; // [암기] 필수 예외 처리

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDraw = (e: any) => {
    if (mode !== "drawing") return;
    drawingRef.current = true;
    if (drawingCanvasRef.current) setHistory(prev => [...prev, drawingCanvasRef.current!.toDataURL()]);
    pointsRef.current = [getPos(e)];
  };

  const draw = (e: any) => {
    if (!drawingRef.current || mode !== "drawing") return;
    const ctx = drawingCanvasRef.current?.getContext("2d");
    if (!ctx) return;

    const currentPos = getPos(e);
    pointsRef.current.push(currentPos);

    ctx.lineWidth = brushSize;
    ctx.strokeStyle = color;
    // 지우개 기능: V1의 destination-out 적용
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";

    if (pointsRef.current.length > 2) {
      const pts = pointsRef.current;
      const i = pts.length - 2;
      const midPoint = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
      const prevMid = pts.length > 3 ? { x: (pts[i-1].x + pts[i].x)/2, y: (pts[i-1].y + pts[i].y)/2 } : pts[i-1];

      ctx.beginPath();
      ctx.moveTo(prevMid.x, prevMid.y);
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midPoint.x, midPoint.y);
      ctx.stroke();
    }
  };

  // V1 냠냠 모션 (clipPath 방식)
  const biteClips = [
    "none", 
    "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 20%, 15% 15%, 0% 5%)", 
    "polygon(0% 0%, 85% 5%, 100% 20%, 90% 40%, 100% 100%, 0% 100%, 0% 20%, 15% 15%, 0% 5%)", 
    "polygon(15% 15%, 85% 15%, 85% 85%, 15% 85%, 20% 50%)", 
    "circle(0% at 50% 50%)"
  ];

  const handleReset = () => {
    setBite(0); setImage(null); setAiContent(""); setUserText(""); setHistory([]);
    setMode("none"); setView("home");
    const ctx = drawingCanvasRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, 400, 600);
  };

  return (
    <div className="flex justify-center bg-[#FDFBF7] min-h-screen font-sans text-[#5a3e1b]">
      <div className="relative w-full max-w-[430px] bg-[#FFFCF5] shadow-2xl min-h-screen flex flex-col overflow-hidden">
        
        <header className="p-6 flex justify-between items-center bg-white border-b z-50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black">암기빵</h1>
          </div>
          <User className="text-gray-300" />
        </header>

        <main className="flex-1 p-6 pb-32">
          <AnimatePresence mode="wait">
            {view === "home" ? (
              <motion.div key="home" className="flex flex-col gap-6">
                
                {/* 메인 빵 (홈 화면에 딱 떠있는 구성) */}
                <div className={`relative w-full aspect-[1/1.5] rounded-[60px] overflow-hidden shadow-2xl border-b-8 border-[#c2a382] bg-white transition-transform ${shake ? "animate-shake" : ""}`}>
                  <img src={BREAD_IMAGE} className="absolute inset-0 w-full h-full object-cover" alt="bread" />
                  
                  {image && <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-multiply pointer-events-none" />}
                  
                  <div className="absolute inset-0 p-12 overflow-y-auto no-scrollbar pointer-events-none z-10">
                    <p className="text-sm font-bold leading-relaxed">{aiContent}</p>
                  </div>

                  {mode === "typing" && (
                    <textarea 
                      className="absolute inset-0 bg-transparent p-12 text-sm font-bold border-none focus:ring-0 resize-none z-20 text-[#4a3311]"
                      value={userText} onChange={(e) => setUserText(e.target.value)}
                      placeholder="암기할 내용을 적어보세요..."
                    />
                  )}
                  {mode !== "typing" && <div className="absolute inset-0 p-12 text-sm font-bold pointer-events-none z-20 whitespace-pre-wrap">{userText}</div>}

                  <canvas 
                    ref={drawingCanvasRef}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => drawingRef.current = false}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => drawingRef.current = false}
                    className={`absolute inset-0 w-full h-full z-30 ${mode === 'drawing' ? 'cursor-crosshair' : 'pointer-events-none'}`}
                  />

                  {loading && (
                    <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                      <Loader2 className="animate-spin text-orange-500" size={48} />
                      <p className="mt-2 font-black">AI가 빵을 굽고 있어요...</p>
                    </div>
                  )}
                </div>

                {/* 하단 컨트롤 영역 */}
                {mode === "drawing" ? (
                  <div className="flex flex-col gap-4 bg-[#FEF3C7] p-5 rounded-3xl animate-in fade-in slide-in-from-bottom-2 shadow-inner">
                    <div className="flex justify-between items-center gap-4">
                      <input type="range" min="2" max="30" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="flex-1 accent-orange-500" />
                      <button onClick={() => setTool(tool === "pen" ? "eraser" : "pen")} className={`p-3 rounded-xl shadow-sm transition-colors ${tool === 'eraser' ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'}`}>
                        {tool === "eraser" ? <Pencil size={20}/> : <Eraser size={20}/>}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {["#5a3e1b", "#D9534F", "#5CB85C", "#4A90E2"].map(c => (
                          <button key={c} onClick={() => {setColor(c); setTool("pen");}} className={`w-8 h-8 rounded-full border-2 ${color === c && tool === "pen" ? 'border-white ring-2 ring-orange-500' : 'border-transparent'}`} style={{background: c}} />
                        ))}
                      </div>
                      <button onClick={() => setMode("none")} className="px-5 py-2 bg-white rounded-full text-xs font-black shadow-sm">완료</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setMode("typing")} className="py-4 rounded-2xl font-bold bg-white border-2 border-orange-100 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"><Type size={18} /> 타이핑</button>
                      <button onClick={() => setMode("drawing")} className="py-4 rounded-2xl font-bold bg-white border-2 border-orange-100 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"><Pencil size={18} /> 그리기</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => fileInputRef.current?.click()} className="py-4 rounded-2xl font-bold bg-orange-100 text-orange-600 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"><Camera size={18} /> 사진 스캔</button>
                      <button onClick={() => setView("eat")} className="py-4 rounded-2xl font-black bg-orange-500 text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Check size={20} /> 암기 시작</button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              /* 먹기 모드 (V1 모션 완벽 재현) */
              <motion.div key="eat" className="flex flex-col items-center gap-8">
                <div 
                  className="relative w-full aspect-[1/1.5] rounded-[60px] overflow-hidden shadow-2xl cursor-pointer" 
                  style={{ clipPath: biteClips[bite] }}
                  onClick={() => {
                    if(bite < 4) {
                      setShake(true); setTimeout(() => setShake(false), 200);
                      setBite(b => b + 1);
                    }
                  }}
                >
                  <img src={BREAD_IMAGE} className="absolute inset-0 w-full h-full object-cover" />
                  {image && <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-multiply" />}
                  <div className="absolute inset-0 p-12 text-sm font-bold whitespace-pre-wrap">{aiContent || userText}</div>
                </div>

                {bite >= 4 ? (
                  <button onClick={handleReset} className="w-full py-5 bg-[#5a3e1b] text-white rounded-[30px] font-black text-xl shadow-lg flex items-center justify-center gap-2 animate-bounce">
                    <RotateCcw size={24} /> 다시 만들기
                  </button>
                ) : (
                  <p className="font-black text-orange-500 text-lg animate-pulse">빵을 눌러서 한 입씩 먹어보세요!</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if(file) {
            const r = new FileReader();
            r.onload = () => { setImage(r.result as string); handleScan(r.result as string); };
            r.readAsDataURL(file);
          }
        }} />

        <nav className="h-24 bg-white border-t flex justify-around items-center absolute bottom-0 w-full px-10 pb-4 rounded-t-[40px] shadow-lg">
          <button className="flex flex-col items-center text-orange-500"><Home size={28} /><span className="text-[10px] font-bold">홈</span></button>
          <button className="flex flex-col items-center text-gray-300"><BookOpen size={28} /><span className="text-[10px] font-bold">노트</span></button>
          <button className="flex flex-col items-center text-gray-300"><User size={28} /><span className="text-[10px] font-bold">내정보</span></button>
        </nav>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}