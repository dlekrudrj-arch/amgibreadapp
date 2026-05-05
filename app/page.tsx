"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Type, Pencil, RotateCcw, Check, Undo2, Eraser, User 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BREAD_IMG_URL = "https://i.postimg.cc/zDpJ9vwX/bread-1.png";

export default function MemoryBreadV2() {
  const [view, setView] = useState<"home" | "eat">("home");
  const [mode, setMode] = useState<"none" | "typing" | "drawing">("none");
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [userText, setUserText] = useState("");
  const [bite, setBite] = useState(0);
  const [brushSize, setBrushSize] = useState(6);
  const [color, setColor] = useState("#5a3e1b");
  const [history, setHistory] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    
    // 식빵 이미지 비율에 맞춘 캔버스 사이즈 (원본 이미지 비율 고려)
    canvas.width = 400;
    canvas.height = 550;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [mode]);

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
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
    if (canvasRef.current) {
      setHistory(prev => [...prev, canvasRef.current!.toDataURL()]);
    }
    pointsRef.current = [getPos(e)];
  };

  const draw = (e: any) => {
    if (!drawingRef.current || mode !== "drawing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const currentPos = getPos(e);
    pointsRef.current.push(currentPos);
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = color;
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

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    const img = new Image();
    img.src = lastState;
    img.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 400, 550);
        ctx.drawImage(img, 0, 0);
        setHistory(prev => prev.slice(0, -1));
      }
    };
  };

  const biteClips = [
    "none", 
    "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 25%, 15% 15%, 0% 5%)", 
    "polygon(0% 0%, 85% 5%, 100% 20%, 85% 45%, 100% 100%, 0% 100%, 0% 45%, 25% 30%, 0% 15%)", 
    "polygon(15% 15%, 85% 15%, 85% 85%, 15% 85%, 25% 50%)", 
    "circle(0% at 50% 50%)"
  ];

  return (
    <div className="flex justify-center bg-[#FDFBF7] min-h-screen font-sans text-[#5a3e1b]">
      <div className="relative w-full max-w-[430px] bg-[#FFFCF5] shadow-2xl min-h-screen flex flex-col overflow-hidden">
        
        <header className="p-6 flex justify-between items-center bg-white border-b z-50">
          <div className="flex items-center gap-2"><span className="text-2xl">🍞</span><h1 className="text-xl font-black">암기빵</h1></div>
          <User className="text-gray-300" />
        </header>

        <main className="flex-1 p-6 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div key={view} className="flex flex-col gap-6 h-full flex-1">
              
              {/* 식빵 컨테이너: 이미지 비율 유지 수정 */}
              <div 
                className="relative w-full aspect-[1/1.3] rounded-[40px] overflow-hidden shadow-2xl bg-[#fdf2d7] border-4 border-orange-100"
                style={{ clipPath: view === "eat" ? biteClips[bite] : "none" }}
                onClick={() => view === "eat" && bite < 4 && setBite(b => b + 1)}
              >
                {/* object-contain으로 사진 전체가 보이도록 수정 */}
                <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                
                <textarea 
                  className={`absolute inset-0 bg-transparent p-12 pt-16 text-center text-lg font-bold border-none focus:ring-0 resize-none z-20 text-[#5a3e1b] ${mode !== 'typing' ? 'pointer-events-none' : ''}`}
                  value={userText} onChange={(e) => setUserText(e.target.value)}
                  placeholder={mode === "typing" ? "암기할 내용을 입력..." : ""}
                />
                {mode !== "typing" && <div className="absolute inset-0 p-12 pt-16 text-center text-lg font-bold pointer-events-none z-20 whitespace-pre-wrap">{userText}</div>}

                <canvas 
                  ref={canvasRef}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => drawingRef.current = false}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => drawingRef.current = false}
                  className={`absolute inset-0 w-full h-full z-30 ${mode === 'drawing' ? 'cursor-crosshair' : 'pointer-events-none'}`}
                />
              </div>

              {/* 하단 제어부 */}
              {view === "home" ? (
                mode === "drawing" ? (
                  <div className="bg-[#FEF3C7] p-5 rounded-3xl shadow-lg space-y-4">
                    <div className="flex items-center gap-3">
                      <input type="range" min="2" max="30" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="flex-1 accent-orange-500" />
                      <button onClick={handleUndo} className="p-2 bg-white rounded-lg shadow-sm text-orange-500 active:scale-90"><Undo2 size={20}/></button>
                      <button onClick={() => setTool(tool === "pen" ? "eraser" : "pen")} className={`p-2 rounded-lg shadow-sm ${tool === 'eraser' ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'}`}>
                        {tool === "eraser" ? <Pencil size={20}/> : <Eraser size={20}/>}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {["#5a3e1b", "#D9534F", "#5CB85C", "#4A90E2"].map(c => (
                          <button key={c} onClick={() => {setColor(c); setTool("pen");}} className={`w-7 h-7 rounded-full border-2 ${color === c && tool === "pen" ? 'border-white ring-2 ring-orange-400' : 'border-transparent'}`} style={{background: c}} />
                        ))}
                      </div>
                      <button onClick={() => setMode("none")} className="px-4 py-1.5 bg-white rounded-full text-xs font-black shadow-sm">그리기 완료</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setMode("typing")} className="py-4 bg-white rounded-2xl font-bold border-2 border-orange-100 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                      <Type size={18} /> 직접 쓰기
                    </button>
                    <button onClick={() => setMode("drawing")} className="py-4 bg-white rounded-2xl font-bold border-2 border-orange-100 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                      <Pencil size={18} /> 그리기
                    </button>
                    <button onClick={() => setView("eat")} className="col-span-2 py-5 bg-orange-500 text-white rounded-[30px] font-black text-xl shadow-lg active:scale-95 transition-all">
                      <Check size={24} className="inline mr-2" /> 암기 시작!
                    </button>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                  {bite >= 4 ? (
                    <button onClick={() => {setBite(0); setView("home");}} className="w-full py-5 bg-[#5a3e1b] text-white rounded-[30px] font-black text-xl shadow-lg"><RotateCcw size={24} className="inline mr-2" /> 다시 만들기</button>
                  ) : (
                    <p className="font-black text-orange-500 text-lg animate-pulse">빵을 눌러서 냠냠! 🍞</p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}