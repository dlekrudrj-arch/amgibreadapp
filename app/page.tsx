"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Home, BookOpen, User, Camera, Loader2, 
  Type, Pencil, RotateCcw, Check, Undo2, Eraser
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";

// [고정] 사용자 제공 오리지널 식빵 이미지 (세 번째 사진)
const BREAD_IMAGE = "/ChatGPT Image 2026년 5월 2일 오후 10_02_52.png"; 

export default function AmgiBreadV2() {
  // --- 상태 관리 ---
  const [view, setView] = useState<"home" | "eat">("home");
  const [mode, setMode] = useState<"none" | "typing" | "drawing">("none");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [aiContent, setAiContent] = useState("");
  const [userText, setUserText] = useState("");
  const [bite, setBite] = useState(0);
  const [shake, setShake] = useState(false);
  const [brushSize, setBrushSize] = useState(6);
  const [color, setColor] = useState("#5a3e1b");
  const [history, setHistory] = useState<string[]>([]);

  // --- Refs ---
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  // --- 초기화: 캔버스 설정 ---
  useEffect(() => {
    [textCanvasRef, drawingCanvasRef].forEach(ref => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = 400;
      canvas.height = 600;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    });
  }, []);

  // --- AI 스캔 (최신 규격) ---
  const handleScan = async (base64: string) => {
    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
      const ai = new GoogleGenAI({ apiKey }); // 알려주신 정석 방식
      const imageData = base64.split(",")[1];

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{
          role: "user",
          parts: [
            { text: "이 내용을 암기하기 좋게 핵심 위주로 요약해줘." },
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
          ]
        }]
      });

      if (response && response.text) setAiContent(response.text);
    } catch (err) {
      console.error("AI Scan Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 그리기 로직 (부드러운 보정 적용) ---
  const getPos = (e: any) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 }; // 알려주신 안전 처리

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
    const pos = getPos(e);
    pointsRef.current = [pos];
  };

  const draw = (e: any) => {
    if (!drawingRef.current || mode !== "drawing") return;
    const ctx = drawingCanvasRef.current?.getContext("2d");
    if (!ctx) return;

    const currentPos = getPos(e);
    pointsRef.current.push(currentPos);

    ctx.lineWidth = brushSize;
    ctx.strokeStyle = color;
    ctx.globalCompositeOperation = "source-over";

    if (pointsRef.current.length > 2) {
      const pts = pointsRef.current;
      const i = pts.length - 2;
      const midPoint = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
      const prevMidPoint = pts.length > 3 
        ? { x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 }
        : pts[i - 1];

      ctx.beginPath();
      ctx.moveTo(prevMidPoint.x, prevMidPoint.y);
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midPoint.x, midPoint.y);
      ctx.stroke();
    }
  };

  const stopDraw = () => { drawingRef.current = false; pointsRef.current = []; };

  // --- 냠냠 로직 ---
  const handleEat = () => {
    if (bite < 4) {
      setShake(true); setTimeout(() => setShake(false), 200);
      setBite(prev => prev + 1);
    }
  };

  const biteClips = ["none", 
    "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 25%, 15% 15%, 0% 5%)", 
    "polygon(0% 0%, 85% 5%, 100% 20%, 85% 35%, 100% 100%, 0% 100%, 0% 45%, 25% 30%, 0% 15%)", 
    "polygon(15% 15%, 85% 15%, 85% 85%, 15% 85%, 20% 50%)", 
    "circle(0% at 50% 50%)"
  ];

  const handleReset = () => {
    setView("home"); setMode("none"); setBite(0); setImage(null); 
    setAiContent(""); setUserText(""); setHistory([]);
    [textCanvasRef, drawingCanvasRef].forEach(ref => {
      const ctx = ref.current?.getContext("2d");
      ctx?.clearRect(0, 0, 400, 600);
    });
  };

  return (
    <div className="flex justify-center bg-[#FDFBF7] min-h-screen font-sans text-[#5a3e1b]">
      <div className="relative w-full max-w-[430px] bg-[#FFFCF5] shadow-2xl min-h-screen flex flex-col overflow-hidden">
        
        {/* 헤더 (첫 번째 사진 구성) */}
        <header className="p-6 flex justify-between items-center bg-white border-b sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black">암기빵</h1>
          </div>
          <User className="text-gray-300" />
        </header>

        <main className="flex-1 p-6 pb-32 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === "home" ? (
              <motion.div key="home" className="flex flex-col gap-6">
                
                {/* 메인 빵 영역 (세 번째 사진 고정) */}
                <div className={`relative w-full aspect-[1/1.5] rounded-[60px] overflow-hidden shadow-2xl border-b-8 border-[#c2a382] bg-white transition-transform ${shake ? "animate-shake" : ""}`}>
                  <img src={BREAD_IMAGE} className="absolute inset-0 w-full h-full object-cover" alt="bread" />
                  
                  {/* 스캔 이미지 레이어 */}
                  {image && <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-multiply" />}
                  
                  {/* AI 텍스트 레이어 */}
                  <div className="absolute inset-0 p-12 overflow-y-auto no-scrollbar pointer-events-none z-10">
                    <p className="text-sm font-bold leading-relaxed">{aiContent}</p>
                  </div>

                  {/* 타이핑 레이어 */}
                  {mode === "typing" && (
                    <textarea 
                      className="absolute inset-0 bg-transparent p-12 text-sm font-bold border-none focus:ring-0 resize-none z-20 text-[#4a3311]"
                      value={userText} onChange={(e) => setUserText(e.target.value)}
                      placeholder="내용을 입력하세요..."
                    />
                  )}
                  {mode !== "typing" && <div className="absolute inset-0 p-12 text-sm font-bold pointer-events-none z-20 whitespace-pre-wrap">{userText}</div>}

                  {/* 그리기 레이어 (두 번째 사진 구성) */}
                  <canvas 
                    ref={drawingCanvasRef}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                    className={`absolute inset-0 w-full h-full z-30 ${mode === 'drawing' ? 'cursor-crosshair' : 'pointer-events-none'}`}
                  />

                  {/* 사진 업로드 가이드 */}
                  {!image && !aiContent && !userText && (
                    <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 cursor-pointer z-10 backdrop-blur-[1px]">
                      <div className="bg-white/90 p-5 rounded-full shadow-lg mb-4 text-orange-500"><Camera size={40} /></div>
                      <p className="font-black text-[#5a3e1b]">사진을 찍거나 업로드하세요!</p>
                    </div>
                  )}

                  {loading && (
                    <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center z-50">
                      <Loader2 className="animate-spin text-orange-500" size={48} />
                      <p className="mt-2 font-black">AI 스캔 중...</p>
                    </div>
                  )}
                </div>

                {/* 모드 선택 및 그리기 UI (두 번째 사진 레이아웃 참고) */}
                {mode === "drawing" ? (
                  <div className="flex flex-col gap-4 bg-[#FEF3C7] p-4 rounded-3xl animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center gap-4">
                      <input type="range" min="2" max="25" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="flex-1 accent-orange-500" />
                      <button onClick={() => {
                        const img = new Image(); img.src = history[history.length - 1];
                        img.onload = () => {
                          const ctx = drawingCanvasRef.current?.getContext("2d");
                          if (ctx) { ctx.clearRect(0, 0, 400, 600); ctx.drawImage(img, 0, 0); setHistory(prev => prev.slice(0, -1)); }
                        };
                      }} className="p-2 bg-white rounded-full text-orange-500 shadow-sm"><Undo2 size={20}/></button>
                    </div>
                    <div className="flex justify-around">
                      {["#5a3e1b", "#D9534F", "#F0AD4E", "#5CB85C", "#4A90E2"].map(c => (
                        <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-white ring-2 ring-orange-500' : 'border-transparent'}`} style={{background: c}} />
                      ))}
                      <button onClick={() => setMode("none")} className="px-4 py-1 bg-white rounded-full text-xs font-bold shadow-sm">닫기</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setMode("typing")} className="py-4 rounded-2xl font-bold bg-white border-2 border-orange-100 text-[#5a3e1b] flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
                      <Type size={18} /> 직접 쓰기
                    </button>
                    <button onClick={() => setMode("drawing")} className="py-4 rounded-2xl font-bold bg-white border-2 border-orange-100 text-[#5a3e1b] flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
                      <Pencil size={18} /> 그리기 모드
                    </button>
                  </div>
                )}

                <button onClick={() => setView("eat")} className="w-full py-5 bg-orange-500 text-white rounded-[30px] font-black text-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Check size={24} /> 완성! 암기하기
                </button>
              </motion.div>
            ) : (
              /* 먹기 화면 (V1 냠냠 계승) */
              <motion.div key="eat" className="flex flex-col items-center gap-8">
                <div 
                  className="relative w-full aspect-[1/1.5] rounded-[60px] overflow-hidden shadow-2xl transition-all duration-300" 
                  style={{ clipPath: biteClips[bite] }}
                  onClick={handleEat}
                >
                  <img src={BREAD_IMAGE} className="absolute inset-0 w-full h-full object-cover" />
                  {image && <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-multiply" />}
                  <div className="absolute inset-0 p-12 text-sm font-bold whitespace-pre-wrap">{aiContent || userText}</div>
                </div>

                {bite >= 4 ? (
                  <button onClick={handleReset} className="w-full py-5 bg-[#5a3e1b] text-white rounded-[30px] font-black text-xl shadow-lg flex items-center justify-center gap-2 animate-bounce">
                    <RotateCcw size={24} /> 다시 굽기
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="font-black text-orange-500 text-lg animate-pulse mb-2">빵을 터치해 냠냠 먹으세요!</p>
                    <button onClick={() => setView("home")} className="text-sm text-gray-400 underline">수정하기</button>
                  </div>
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