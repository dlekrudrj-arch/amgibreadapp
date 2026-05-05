"use client";
import { useState, useRef, useEffect } from "react";
import { Settings, Home, BookOpen, UserCircle, RotateCcw, Image as ImageIcon, Type, Pencil, Check, RefreshCcw } from "lucide-react";

// 요청하신 새로운 빵 이미지 URL
const BREAD_IMG_URL = "https://i.postimg.cc/rmTBY3qQ/Qkd-(1).png";

export default function MemoryBreadApp() {
  const [image, setImage] = useState<string | null>(null);
  const [bite, setBite] = useState(0);
  const [mode, setMode] = useState<"none" | "typing" | "drawing">("none");
  const [tool, setTool] = useState<"pen" | "eraser" | null>("pen");
  
  const [textColor, setTextColor] = useState("#5a3e1b");
  const [drawingColor, setDrawingColor] = useState("#5a3e1b");
  const [brushSize, setBrushSize] = useState(6);
  
  const [shake, setShake] = useState(false);
  const [crumbs, setCrumbs] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [isTextPickerUsed, setIsTextPickerUsed] = useState(false);
  const [isDrawingPickerUsed, setIsDrawingPickerUsed] = useState(false);

  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const colorChips = ["#5a3e1b", "#000000", "#D9534F", "#F0AD4E", "#5CB85C", "#4A90E2"];

  useEffect(() => {
    [textCanvasRef, drawingCanvasRef].forEach(ref => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = 800;
      canvas.height = 1000;
      ctx.scale(2, 2);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    });
  }, []);

  // 모든 데이터를 지우고 처음으로 돌아가는 초기화 함수
  const handleFullReset = () => {
    setImage(null);
    setBite(0);
    setMode("none");
    setHistory([]);
    setInputText("");
    setIsFinished(false);
    const tCtx = textCanvasRef.current?.getContext("2d");
    const dCtx = drawingCanvasRef.current?.getContext("2d");
    tCtx?.clearRect(0, 0, 400, 500);
    dCtx?.clearRect(0, 0, 400, 500);
    if (fileRef.current) fileRef.current.value = "";
  };

  useEffect(() => {
    const ctx = textCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 400, 500);
    if (!inputText) return;
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    const paragraphs = inputText.split("\n");
    let y = 140; // 텍스트 시작 위치 조정
    paragraphs.forEach((para) => {
      ctx.fillText(para, 200, y);
      y += 30;
    });
  }, [inputText, textColor]);

  const saveHistory = () => {
    if (drawingCanvasRef.current) setHistory(prev => [...prev, drawingCanvasRef.current!.toDataURL()]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const img = new Image();
    img.src = history[history.length - 1];
    img.onload = () => {
      const ctx = drawingCanvasRef.current?.getContext("2d");
      ctx?.clearRect(0, 0, 400, 500);
      ctx?.drawImage(img, 0, 0, 400, 500);
      setHistory(prev => prev.slice(0, -1));
    };
  };

  const getPos = (e: any) => {
    const rect = drawingCanvasRef.current!.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (400 / rect.width), y: (clientY - rect.top) * (500 / rect.height) };
  };

  const startDraw = (e: any) => {
    if (mode !== "drawing" || isFinished) return;
    saveHistory();
    drawingRef.current = true;
    pointsRef.current = [getPos(e)];
  };

  const draw = (e: any) => {
    if (!drawingRef.current || mode !== "drawing") return;
    const ctx = drawingCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    const currentPos = getPos(e);
    pointsRef.current.push(currentPos);
    ctx.lineWidth = tool === "eraser" ? 25 : brushSize;
    ctx.strokeStyle = drawingColor;
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    
    if (pointsRef.current.length > 2) {
      const pts = pointsRef.current;
      const i = pts.length - 2;
      const midPoint = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
      ctx.beginPath();
      ctx.moveTo((pts[i-1].x + pts[i].x)/2, (pts[i-1].y + pts[i].y)/2);
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midPoint.x, midPoint.y);
      ctx.stroke();
    }
  };

  const handleEat = () => {
    if (bite < 4) {
      setShake(true); setTimeout(() => setShake(false), 200);
      setBite(prev => prev + 1);
      const newCrumbs = Array.from({ length: 12 }).map((_, i) => ({ id: Date.now() + i, x: Math.random() * 300 + 50, size: Math.random() * 5 + 2 }));
      setCrumbs(prev => [...prev, ...newCrumbs]);
      setTimeout(() => setCrumbs(prev => prev.slice(12)), 700);
    }
  };

  const biteClips = [
    "none", 
    "polygon(0% 100%, 100% 100%, 100% 30%, 85% 42%, 70% 35%, 55% 45%, 40% 35%, 0% 15%)", 
    "polygon(0% 100%, 100% 100%, 100% 55%, 82% 65%, 68% 52%, 48% 68%, 28% 48%, 0% 45%)", 
    "polygon(0% 100%, 100% 100%, 100% 85%, 75% 95%, 50% 80%, 25% 95%, 0% 80%)", 
    "circle(0% at 50% 50%)"
  ];

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans overflow-hidden text-[#5a3e1b]">
      <div className="w-full max-w-[430px] bg-[#FEFBF2] min-h-screen flex flex-col shadow-2xl relative">
        
        <header className="px-6 py-4 flex justify-between items-center z-30">
          <div className="flex items-center gap-2"><span className="text-2xl">🍞</span><h1 className="text-xl font-black">암기빵</h1></div>
          <button onClick={handleFullReset} className="p-2 text-gray-400 hover:text-orange-500 transition-colors" title="전체 초기화">
            <RefreshCcw size={22} />
          </button>
        </header>

        <main className="flex-1 px-4 flex flex-col items-center pt-2 relative">
          {/* 빵 사이즈를 100%로 미세하게 줄임 */}
          <div className={`relative w-full aspect-[4/5] transition-all duration-500 ${shake ? "animate-shake" : ""}`}>
            
            {bite === 4 && (
              <div className="absolute inset-0 flex items-end justify-center z-50 pb-20">
                <button onClick={handleFullReset} className="py-5 px-12 bg-[#FF8A3D] text-white rounded-[32px] font-black text-xl shadow-[0_8px_0_#D97706] active:translate-y-1 active:shadow-none">빵 다시 굽기 🍞</button>
              </div>
            )}

            <div 
              className={`w-full h-full relative transition-all duration-500 ${bite === 4 ? "opacity-0 scale-95" : "opacity-100"}`}
              style={{ clipPath: biteClips[bite] }}
            >
              <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-contain" />
              
              {/* 캔버스는 빵 이미지 전체(padding 0)를 덮도록 설정 */}
              <div className="absolute inset-0">
                <div className="relative w-full h-full">
                  {/* 업로드 이미지/텍스트 영역은 안쪽 패딩을 줄여서 키움 */}
                  <div className="absolute inset-0 pointer-events-none" style={{ padding: '15% 10% 12% 10%' }}>
                    {image && <img src={image} className="w-full h-full object-contain mix-blend-multiply opacity-85" />}
                  </div>
                  <canvas ref={textCanvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
                  {/* 그리기용 캔버스는 전체 영역 차지 */}
                  <canvas 
                    ref={drawingCanvasRef} 
                    className="absolute inset-0 w-full h-full touch-none z-20" 
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => {drawingRef.current=false;}} 
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => {drawingRef.current=false;}} 
                  />
                </div>
              </div>
            </div>
            {crumbs.map((c) => <div key={c.id} className="absolute bg-[#D97706] rounded-full animate-fall" style={{ width: c.size, height: c.size, left: c.x, top: "40%" }} />)}
          </div>

          {!isFinished && (
            <div className="w-full mt-6 flex flex-col gap-3 z-40">
              {mode === "typing" && (
                <div className="bg-white p-4 rounded-[28px] shadow-xl border border-orange-50 flex flex-col gap-3">
                  <textarea value={inputText} onChange={(e)=>setInputText(e.target.value)} placeholder="암기 내용을 적어보세요..." className="w-full h-24 p-2 outline-none resize-none text-sm font-medium" autoFocus />
                  <div className="flex justify-between items-center border-t pt-3">
                    <div className="flex gap-1.5">
                      {colorChips.map(c => (
                        <button key={c} onClick={() => {setTextColor(c); setIsTextPickerUsed(false);}} className={`w-6 h-6 rounded-full ${textColor === c && !isTextPickerUsed ? 'ring-2 ring-orange-400 scale-110' : ''}`} style={{background: c}} />
                      ))}
                      <div className={`relative w-6 h-6 rounded-full border ${isTextPickerUsed ? 'ring-2 ring-orange-400' : ''}`} style={{background: isTextPickerUsed ? textColor : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"}}>
                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>{setTextColor(e.target.value); setIsTextPickerUsed(true);}} />
                      </div>
                    </div>
                    <button onClick={()=>setMode("none")} className="p-2 bg-orange-500 text-white rounded-xl shadow-md active:scale-95"><Check size={18}/></button>
                  </div>
                </div>
              )}

              {mode === "drawing" && (
                <div className="bg-white p-4 rounded-[28px] shadow-xl border border-orange-50 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTool("pen")} className={`flex-1 py-2 rounded-xl font-bold text-sm ${tool === "pen" ? "bg-orange-500 text-white shadow-inner" : "bg-gray-100 text-gray-400"}`}>펜</button>
                    <button onClick={() => setTool("eraser")} className={`flex-1 py-2 rounded-xl font-bold text-sm ${tool === "eraser" ? "bg-orange-500 text-white shadow-inner" : "bg-gray-100 text-gray-400"}`}>지우개</button>
                    <button onClick={handleUndo} className="p-2 bg-gray-50 rounded-xl text-gray-400 active:scale-90 transition-transform"><RotateCcw size={18}/></button>
                  </div>
                  <div className="px-1"><input type="range" min="1" max="25" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full accent-orange-500 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer" /></div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1.5">
                      {colorChips.map(c => (
                        <button key={c} onClick={() => {setDrawingColor(c); setIsDrawingPickerUsed(false);}} className={`w-6 h-6 rounded-full ${drawingColor === c && !isDrawingPickerUsed ? 'ring-2 ring-orange-300 scale-110' : ''}`} style={{background: c}} />
                      ))}
                      <div className={`relative w-6 h-6 rounded-full border ${isDrawingPickerUsed ? 'ring-2 ring-orange-300' : ''}`} style={{background: isDrawingPickerUsed ? drawingColor : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"}}>
                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>{setDrawingColor(e.target.value); setIsDrawingPickerUsed(true);}} />
                      </div>
                    </div>
                    <button onClick={() => setMode("none")} className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-lg font-bold text-xs active:bg-orange-200">확인</button>
                  </div>
                </div>
              )}

              {mode === "none" && (
                <div className="flex flex-col gap-3">
                  <button onClick={() => fileRef.current?.click()} className="w-full py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold text-gray-600 text-sm shadow-sm active:bg-orange-50 transition-colors"><ImageIcon className="text-orange-500" size={20} /> 스캔해서 올리기</button>
                  <input ref={fileRef} type="file" hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const img = new Image(); const reader = new FileReader();
                    reader.onload = (ev) => { img.src = ev.target?.result as string; };
                    img.onload = () => {
                      const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d");
                      if (!ctx) return; canvas.width = 400; canvas.height = 500;
                      ctx.filter = "contrast(2.4) grayscale(1)"; ctx.drawImage(img, 0, 0, 400, 500);
                      const data = ctx.getImageData(0,0,400,500);
                      for(let i=0; i<data.data.length; i+=4) { if(data.data[i]>145) data.data[i+3]=0; else {data.data[i]=74; data.data[i+1]=42; data.data[i+2]=15;}}
                      ctx.putImageData(data,0,0); setImage(canvas.toDataURL());
                    };
                    reader.readAsDataURL(file);
                  }} />
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={()=>setMode("typing")} className="py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold text-gray-600 text-sm active:bg-orange-50 transition-colors"><Type size={18} className="text-orange-500" /> 직접 쓰기</button>
                    <button onClick={()=>setMode("drawing")} className="py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold text-gray-600 text-sm active:bg-orange-50 transition-colors"><Pencil size={18} className="text-orange-500" /> 그리기</button>
                  </div>
                  <button onClick={() => setIsFinished(true)} className="w-full py-4 bg-[#FF8A3D] text-white rounded-[24px] font-black text-lg shadow-[0_5px_0_#D97706] active:translate-y-1 active:shadow-none transition-all">완성! 암기하기 ✨</button>
                </div>
              )}
            </div>
          )}

          {isFinished && bite < 4 && (
            <div className="w-full mt-8 flex flex-col gap-4">
              <button onClick={handleEat} className="w-full py-6 bg-[#FF8A3D] text-white rounded-[36px] font-black text-2xl shadow-[0_8px_0_#D97706] active:translate-y-1 active:shadow-none transition-all">한 입 먹기 🍴</button>
              <button onClick={() => setIsFinished(false)} className="text-orange-400 font-bold underline text-sm text-center">수정하러 가기</button>
            </div>
          )}
        </main>

        <footer className="h-20 bg-white border-t border-gray-50 flex items-center justify-around px-8 z-30 pb-2">
          <div className="flex flex-col items-center gap-1 text-orange-500 cursor-pointer"><Home size={24} /><span className="text-[10px] font-bold">홈</span></div>
          <div className="flex flex-col items-center gap-1 text-gray-300 cursor-pointer"><BookOpen size={24} /><span className="text-[10px] font-bold">노트</span></div>
          <div className="flex flex-col items-center gap-1 text-gray-300 cursor-pointer"><UserCircle size={24} /><span className="text-[10px] font-bold">내정보</span></div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out; }
        @keyframes fall { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(150px) scale(0.5); opacity: 0; } }
        .animate-fall { animation: fall 0.7s forwards ease-in; }
      `}</style>
    </div>
  );
}