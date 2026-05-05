"use client";
import { useState, useRef, useEffect } from "react";
import { Settings, Home, BookOpen, UserCircle, RotateCcw, Image as ImageIcon, Type, Pencil, Check } from "lucide-react";

const BREAD_IMG_URL = "https://i.postimg.cc/rybtvfNW/bread-pyeonjibham.png";

export default function MemoryBreadApp() {
  const [image, setImage] = useState<string | null>(null);
  const [bite, setBite] = useState(0);
  const [mode, setMode] = useState<"none" | "typing" | "drawing">("none");
  const [tool, setTool] = useState<"pen" | "eraser" | null>("pen");
  const [color, setColor] = useState("#5a3e1b");
  const [brushSize, setBrushSize] = useState(6);
  const [shake, setShake] = useState(false);
  const [crumbs, setCrumbs] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [isPickerUsed, setIsPickerUsed] = useState(false);

  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const colorChips = ["#5a3e1b", "#000000", "#D9534F", "#F0AD4E", "#5CB85C", "#4A90E2"];

  // 초기 캔버스 설정 (한 번만 실행되도록 유지)
  useEffect(() => {
    [textCanvasRef, drawingCanvasRef].forEach(ref => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = 800; // 고해상도
      canvas.height = 1000;
      ctx.scale(2, 2);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    });
  }, []);

  // 텍스트 그리기
  useEffect(() => {
    const ctx = textCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 400, 500);
    if (!inputText) return;
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    const words = inputText.split("");
    let line = "";
    let y = 120;
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n];
      if (ctx.measureText(testLine).width > 240) {
        ctx.fillText(line, 200, y);
        line = words[n]; y += 32;
      } else { line = testLine; }
    }
    ctx.fillText(line, 200, y);
  }, [inputText, color]);

  const handleReset = () => {
    setBite(0); setImage(null); setMode("none"); setIsFinished(false);
    setInputText(""); setIsPickerUsed(false); setHistory([]);
    [textCanvasRef, drawingCanvasRef].forEach(ref => {
      const ctx = ref.current?.getContext("2d");
      ctx?.clearRect(0, 0, 800, 1000);
    });
  };

  const getPos = (e: any) => {
    const rect = drawingCanvasRef.current!.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { 
      x: (clientX - rect.left) * (400 / rect.width), 
      y: (clientY - rect.top) * (500 / rect.height) 
    };
  };

  const startDraw = (e: any) => {
    if (mode !== "drawing" || isFinished) return;
    drawingRef.current = true;
    // 이전 상태 저장 (취소 기능용)
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
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    
    if (pointsRef.current.length > 2) {
      const pts = pointsRef.current;
      const i = pts.length - 2;
      const midPoint = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
      const prevMid = pts.length > 3 ? { x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 } : pts[i - 1];
      ctx.beginPath();
      ctx.moveTo(prevMid.x, prevMid.y);
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midPoint.x, midPoint.y);
      ctx.stroke();
    }
  };

  const handleEat = () => {
    if (bite < 4) {
      setShake(true); setTimeout(() => setShake(false), 200);
      setBite(prev => prev + 1);
      const newCrumbs = Array.from({ length: 15 }).map((_, i) => ({ id: Date.now() + i, x: Math.random() * 300 + 50, size: Math.random() * 6 + 2 }));
      setCrumbs(prev => [...prev, ...newCrumbs]);
      setTimeout(() => setCrumbs(prev => prev.slice(15)), 700);
    }
  };

  const biteClips = [
    "none", 
    "polygon(0% 100%, 100% 100%, 100% 25%, 85% 35%, 70% 28%, 55% 38%, 40% 28%, 0% 10%)", 
    "polygon(0% 100%, 100% 100%, 100% 50%, 82% 60%, 68% 48%, 48% 62%, 28% 42%, 0% 40%)", 
    "polygon(0% 100%, 100% 100%, 100% 80%, 75% 92%, 50% 75%, 25% 92%, 0% 75%)", 
    "circle(0% at 50% 50%)"
  ];

  return (
    <div className="flex justify-center bg-gray-200 min-h-screen font-sans overflow-hidden">
      <div className="w-full max-w-[430px] bg-[#FEFBF2] min-h-screen flex flex-col shadow-2xl relative">
        
        {/* 상단 헤더 */}
        <header className="px-6 py-4 flex justify-between items-center z-30">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black text-[#5a3e1b] tracking-tight">암기빵</h1>
          </div>
          <Settings className="text-gray-400 w-6 h-6" />
        </header>

        {/* 메인 빵 영역 */}
        <main className="flex-1 px-6 flex flex-col items-center justify-start pt-4 relative">
          <div className={`relative w-full aspect-[4/5] transition-all duration-500 ${shake ? "animate-shake" : ""}`}>
            
            {/* 빵 다시굽기 버튼 (식빵 정중앙 위치) */}
            {bite === 4 && (
              <div className="absolute inset-0 flex items-center justify-center z-50 animate-in fade-in zoom-in duration-500">
                <button 
                  onClick={handleReset} 
                  className="py-5 px-12 bg-[#FF8A3D] text-white rounded-[24px] font-black text-xl shadow-[0_8px_0_#D97706] active:translate-y-1 active:shadow-none transition-all"
                >
                  빵 다시 굽기 🍞
                </button>
              </div>
            )}

            {/* 메인 빵 컨테이너 (그림자 및 넘침 방지) */}
            <div 
              className={`w-full h-full relative transition-all duration-500 ${bite === 4 ? "opacity-0 scale-75" : "opacity-100"}`}
              style={{ 
                clipPath: biteClips[bite], 
                filter: "drop-shadow(0 20px 40px rgba(90,62,27,0.2))"
              }}
            >
              {/* 기본 식빵 이미지 */}
              <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-contain" alt="bread" />
              
              {/* 이미지/그림/글자 제한 영역 (식빵 안쪽으로만 보이게 설정) */}
              <div className="absolute inset-0 overflow-hidden" style={{ padding: '12% 10% 10% 10%' }}>
                <div className="relative w-full h-full">
                  {/* 스캔 이미지 */}
                  {image && <img src={image} className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-90" />}
                  {/* 텍스트 캔버스 */}
                  <canvas ref={textCanvasRef} className="absolute inset-0 w-full h-full z-10" />
                  {/* 드로잉 캔버스 */}
                  <canvas 
                    ref={drawingCanvasRef} 
                    className={`absolute inset-0 w-full h-full touch-none z-20 ${mode === 'drawing' ? 'cursor-crosshair' : 'cursor-default'}`} 
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => {drawingRef.current=false;}} 
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => {drawingRef.current=false;}} 
                  />
                </div>
              </div>
            </div>

            {/* 부스러기 애니메이션 */}
            {crumbs.map((c) => <div key={c.id} className="absolute bg-[#D97706] rounded-full animate-fall" style={{ width: c.size, height: c.size, left: c.x, top: "50%" }} />)}
          </div>

          {/* 컨트롤 영역 */}
          {!isFinished && (
            <div className="w-full mt-10 flex flex-col gap-4 z-40">
              
              {/* 그리기 도구함 */}
              {mode === "drawing" && (
                <div className="bg-white p-5 rounded-[32px] shadow-xl border border-orange-100 flex flex-col gap-4 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTool("pen")} className={`flex-1 py-3 rounded-2xl font-bold ${tool === "pen" ? "bg-orange-500 text-white shadow-inner" : "bg-gray-100 text-gray-400"}`}>펜</button>
                    <button onClick={() => setTool("eraser")} className={`flex-1 py-3 rounded-2xl font-bold ${tool === "eraser" ? "bg-orange-500 text-white shadow-inner" : "bg-gray-100 text-gray-400"}`}>지우개</button>
                    <button onClick={() => {
                        if(history.length === 0) return;
                        const img = new Image(); img.src = history[history.length-1];
                        img.onload = () => { drawingCanvasRef.current?.getContext("2d")?.clearRect(0,0,800,1000); drawingCanvasRef.current?.getContext("2d")?.drawImage(img,0,0,400,500); setHistory(h=>h.slice(0,-1)); }
                    }} className="p-3 bg-gray-50 rounded-2xl text-gray-400 active:bg-gray-200"><RotateCcw size={20}/></button>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <div className="flex gap-2">
                      {colorChips.map(c => (
                        <button key={c} onClick={() => {setColor(c); setIsPickerUsed(false);}} className={`w-7 h-7 rounded-full transition-transform ${color === c && !isPickerUsed ? 'scale-125 ring-2 ring-orange-300' : 'opacity-80'}`} style={{background: c}} />
                      ))}
                      <div className={`relative w-7 h-7 rounded-full border-2 ${isPickerUsed ? 'scale-125 ring-2 ring-orange-300' : ''}`} style={{background: isPickerUsed ? color : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"}}>
                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>{setColor(e.target.value); setIsPickerUsed(true);}} />
                      </div>
                    </div>
                    <button onClick={() => setMode("none")} className="px-4 py-2 bg-orange-100 text-orange-600 rounded-xl font-bold text-sm">확인</button>
                  </div>
                </div>
              )}

              {/* 글쓰기 입력창 */}
              {mode === "typing" && (
                <div className="bg-white p-4 rounded-[24px] shadow-lg border border-orange-100 flex items-center gap-3 animate-in slide-in-from-bottom-4">
                  <input type="text" value={inputText} onChange={(e)=>setInputText(e.target.value)} placeholder="빵에 적을 내용..." className="flex-1 bg-transparent outline-none font-medium" autoFocus />
                  <button onClick={()=>setMode("none")} className="p-3 bg-orange-500 text-white rounded-2xl shadow-md"><Check size={20}/></button>
                </div>
              )}

              {/* 기본 버튼 세트 (홈 화면) */}
              {mode === "none" && (
                <div className="flex flex-col gap-4">
                  <button onClick={() => fileRef.current?.click()} className="w-full py-5 bg-white border-2 border-orange-100 rounded-[24px] flex items-center justify-center gap-3 font-bold text-gray-700 shadow-sm active:bg-orange-50 transition-colors">
                    <ImageIcon className="text-orange-500" size={24} /> 스캔해서 올리기
                  </button>
                  <input ref={fileRef} type="file" hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const img = new Image(); const reader = new FileReader();
                    reader.onload = (ev) => { img.src = ev.target?.result as string; };
                    img.onload = () => {
                      const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d");
                      if (!ctx) return; canvas.width = 400; canvas.height = 500;
                      ctx.filter = "contrast(2.5) grayscale(1)";
                      ctx.drawImage(img, 0, 0, 400, 500);
                      const data = ctx.getImageData(0,0,400,500);
                      for(let i=0; i<data.data.length; i+=4) { if(data.data[i]>140) data.data[i+3]=0; else {data.data[i]=74; data.data[i+1]=42; data.data[i+2]=15;}}
                      ctx.putImageData(data,0,0); setImage(canvas.toDataURL());
                    };
                    reader.readAsDataURL(file);
                  }} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={()=>setMode("typing")} className="py-5 bg-white border-2 border-orange-100 rounded-[24px] flex items-center justify-center gap-2 font-bold text-gray-700 shadow-sm active:bg-orange-50">
                      <Type size={20} className="text-orange-500" /> 직접 쓰기
                    </button>
                    <button onClick={()=>setMode("drawing")} className="py-5 bg-white border-2 border-orange-100 rounded-[24px] flex items-center justify-center gap-2 font-bold text-gray-700 shadow-sm active:bg-orange-50">
                      <Pencil size={20} className="text-orange-500" /> 그리기
                    </button>
                  </div>
                  
                  <button onClick={() => setIsFinished(true)} className="w-full py-6 bg-[#FF8A3D] text-white rounded-[28px] font-black text-2xl shadow-[0_6px_0_#D97706] mt-2 active:translate-y-1 active:shadow-none transition-all">
                    완성! 암기하기 ✨
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 완성 후 먹기 모드 */}
          {isFinished && bite < 4 && (
            <div className="w-full mt-10 flex flex-col gap-6 animate-in slide-in-from-bottom-8">
              <button onClick={handleEat} className="w-full py-7 bg-[#FF8A3D] text-white rounded-[36px] font-black text-3xl shadow-[0_10px_0_#D97706] active:translate-y-1 active:shadow-none transition-all">
                한 입 먹기 🍴
              </button>
              <button onClick={() => setIsFinished(false)} className="text-orange-400 font-bold underline text-base text-center">수정하러 가기</button>
            </div>
          )}
        </main>

        {/* 하단 네비바 */}
        <footer className="h-24 bg-white border-t border-gray-100 flex items-center justify-around px-8 z-30 pb-4">
          <div className="flex flex-col items-center gap-1.5 text-orange-500">
            <Home size={28} /> <span className="text-xs font-bold">홈</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-gray-300">
            <BookOpen size={28} /> <span className="text-xs font-bold">노트</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-gray-300">
            <UserCircle size={28} /> <span className="text-xs font-bold">내정보</span>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        .animate-shake { animation: shake 0.2s ease-in-out; }
        @keyframes fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(250px) rotate(45deg); opacity: 0; } }
        .animate-fall { animation: fall 0.7s forwards ease-in; }
      `}</style>
    </div>
  );
}