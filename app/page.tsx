"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Home, BookOpen, User, Type, Pencil, 
  RotateCcw, Check, Undo2, Eraser 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 사용자님이 생성하신 이미지 직접 링크
const BREAD_IMG_URL = "https://i.postimg.cc/zDpJ9vwX/bread-1.png";

export default function MemoryBreadV2() {
  const [view, setView] = useState<"home" | "eat">("home");
  const [mode, setMode] = useState<"none" | "typing" | "drawing">("none");
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [userText, setUserText] = useState("");
  const [bite, setBite] = useState(0);
  const [brushSize, setBrushSize] = useState(6);
  const [color, setColor] = useState("#5a3e1b");
  const [history, setHistory] = useState<string[]>([]); // 뒤로가기(Undo) 기록

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  // 캔버스 초기 설정 (해상도 보정)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    
    canvas.width = 400;
    canvas.height = 600;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [mode]);

  // 좌표 계산 함수
  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (400 / rect.width),
      y: (clientY - rect.top) * (600 / rect.height)
    };
  };

  const startDraw = (e: any) => {
    if (mode !== "drawing") return;
    drawingRef.current = true;
    
    // 현재 캔버스 상태 저장 (뒤로가기용)
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
    
    // 지우개/펜 모드 전환
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";

    // 부드러운 곡선 보정 (V1 로직)
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

  const stopDraw = () => {
    drawingRef.current = false;
    pointsRef.current = [];
  };

  // [복구] 뒤로가기(Undo) 기능
  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    const img = new Image();
    img.src = lastState;
    img.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 400, 600);
        ctx.drawImage(img, 0, 0);
        setHistory(prev => prev.slice(0, -1));
      }
    };
  };

  const handleReset = () => {
    setBite(0);
    setUserText("");
    setHistory([]);
    setView("home");
    setMode("none");
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, 400, 600);
  };

  // V1 스타일 한 입 먹기 애니메이션 (ClipPath)
  const biteClips = [
    "none", 
    "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 20%, 15% 15%, 0% 5%)", 
    "polygon(0% 0%, 85% 5%, 100% 20%, 85% 35%, 100% 100%, 0% 100%, 0% 45%, 25% 30%, 0% 15%)", 
    "polygon(15% 15%, 85% 15%, 85% 85%, 15% 85%, 20% 50%)", 
    "circle(0% at 50% 50%)"
  ];

  return (
    <div className="flex justify-center bg-[#FDFBF7] min-h-screen font-sans text-[#5a3e1b]">
      <div className="relative w-full max-w-[430px] bg-[#FFFCF5] shadow-2xl min-h-screen flex flex-col overflow-hidden">
        
        {/* 헤더 */}
        <header className="p-6 flex justify-between items-center bg-white border-b z-50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black">암기빵</h1>
          </div>
          <User className="text-gray-300" />
        </header>

        {/* 메인 영역 */}
        <main className="flex-1 p-6 pb-32">
          <AnimatePresence mode="wait">
            {view === "home" ? (
              <motion.div key="home" className="flex flex-col gap-6 h-full">
                {/* 식빵 캔버스 영역 */}
                <div className="relative w-full aspect-[1/1.5] rounded-[60px] overflow-hidden shadow-2xl border-b-8 border-[#c2a382] bg-white">
                  {/* 배경 이미지 (사용자 링크) */}
                  <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-cover" alt="bread" />
                  
                  {/* 타이핑 텍스트 레이어 */}
                  <textarea 
                    className={`absolute inset-0 bg-transparent p-12 text-sm font-bold border-none focus:ring-0 resize-none z-20 text-[#4a3311] ${mode !== 'typing' ? 'pointer-events-none' : ''}`}
                    value={userText} onChange={(e) => setUserText(e.target.value)}
                    placeholder={mode === "typing" ? "암기할 내용을 입력하세요..." : ""}
                  />
                  {mode !== "typing" && <div className="absolute inset-0 p-12 text-sm font-bold pointer-events-none z-20 whitespace-pre-wrap">{userText}</div>}

                  {/* 그리기 캔버스 레이어 */}
                  <canvas 
                    ref={canvasRef}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                    className={`absolute inset-0 w-full h-full z-30 ${mode === 'drawing' ? 'cursor-crosshair' : 'pointer-events-none'}`}
                  />
                </div>

                {/* 도구 모음 */}
                {mode === "drawing" ? (
                  <div className="flex flex-col gap-4 bg-[#FEF3C7] p-5 rounded-3xl shadow-inner animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center gap-4">
                      <input type="range" min="2" max="30" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="flex-1 accent-orange-500" />
                      <div className="flex gap-2">
                        <button onClick={handleUndo} className="p-3 bg-white rounded-xl text-orange-500 shadow-sm active:scale-90 transition-transform" title="뒤로가기">
                          <Undo2 size={20}/>
                        </button>
                        <button onClick={() => setTool(tool === "pen" ? "eraser" : "pen")} className={`p-3 rounded-xl shadow-sm ${tool === 'eraser' ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'}`} title="지우개">
                          {tool === "eraser" ? <Pencil size={20}/> : <Eraser size={20}/>}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {["#5a3e1b", "#D9534F", "#5CB85C", "#4A90E2"].map(c => (
                          <button key={c} onClick={() => {setColor(c); setTool("pen");}} className={`w-8 h-8 rounded-full border-2 ${color === c && tool === "pen" ? 'border-white ring-2 ring-orange-500' : 'border-transparent'}`} style={{background: c}} />
                        ))}
                      </div>
                      <button onClick={() => setMode("none")} className="px-5 py-2 bg-white rounded-full text-xs font-black shadow-sm">그리기 완료</button>
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
                      <Check size={24} className="inline mr-2" /> 암기 시작 (냠냠!)
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* 먹기 모드 (V1 모션 재현) */
              <motion.div key="eat" className="flex flex-col items-center gap-8">
                <div 
                  className="relative w-full aspect-[1/1.5] rounded-[60px] overflow-hidden shadow-2xl cursor-pointer" 
                  style={{ clipPath: biteClips[bite] }}
                  onClick={() => bite < 4 && setBite(b => b + 1)}
                >
                  <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 p-12 text-sm font-bold whitespace-pre-wrap">{userText}</div>
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

        {/* 하단 네비게이션 (장식용) */}
        <nav className="h-24 bg-white border-t flex justify-around items-center absolute bottom-0 w-full px-10 pb-4 rounded-t-[40px] shadow-lg">
          <button className="flex flex-col items-center text-orange-500"><Home size={28} /><span className="text-[10px] font-bold">홈</span></button>
          <button className="flex flex-col items-center text-gray-300"><BookOpen size={28} /><span className="text-[10px] font-bold">노트</span></button>
          <button className="flex flex-col items-center text-gray-300"><User size={28} /><span className="text-[10px] font-bold">정보</span></button>
        </nav>
      </div>
    </div>
  );
}