"use client";
import { useState, useRef, useEffect } from "react";
import { Settings, User, Home, BookOpen, UserCircle, RotateCcw, Image as ImageIcon, Type, Pencil, Check } from "lucide-react";

const BREAD_IMG_URL = "https://i.postimg.cc/rybtvfNW/bread-pyeonjibham.png";

export default function MemoryBreadApp() {
  const [image, setImage] = useState<string | null>(null);
  const [bite, setBite] = useState(0);
  const [mode, setMode] = useState<"none" | "typing" | "drawing">("none");
  const [tool, setTool] = useState<"pen" | "eraser" | null>(null);
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

  // 고해상도 캔버스 설정 (식빵 크기에 맞춰 조정)
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
  }, [mode]);

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
    let y = 100;
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n];
      if (ctx.measureText(testLine).width > 300) {
        ctx.fillText(line, 200, y);
        line = words[n]; y += 32;
      } else { line = testLine; }
    }
    ctx.fillText(line, 200, y);
  }, [inputText, color]);

  const handleReset = () => {
    setBite(0); setImage(null); setMode("none"); setTool(null); setHistory([]); setInputText(""); setIsFinished(false);
    setIsPickerUsed(false);
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
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans overflow-hidden">
      <div className="w-full max-w-[430px] bg-[#FEFBF2] min-h-screen flex flex-col shadow-2xl relative">
        
        {/* 상단 헤더 (앱 스타일) */}
        <header className="px-6 py-4 flex justify-between items-center bg-[#FEFBF2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">🍞</div>
            <h1 className="text-xl font-bold text-[#5a3e1b]">암기빵</h1>
          </div>
          <Settings className="text-gray-400 w-6 h-6" />
        </header>

        {/* 메인 빵 영역 (크게 강조) */}
        <main className="flex-1 px-6 flex flex-col items-center">
          <div className={`relative w-full aspect-[4/5] mt-4 transition-all duration-500 ${shake ? "animate-shake" : ""}`}>
            
            {/* 엔딩: 다시 굽기 버튼 */}
            {bite === 4 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in">
                <button onClick={handleReset} className="py-4 px-12 bg-[#FF8A3D] text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all">
                  빵 다시 굽기 🍞
                </button>
              </div>
            )}

            {/* 메인 빵 컨테이너 */}
            <div 
              className={`w-full h-full relative transition-all ${bite === 4 ? "opacity-0 scale-90" : "opacity-100"}`}
              style={{ 
                clipPath: biteClips[bite], 
                transition: "clip-path 0.4s ease-in-out, opacity 0.3s",
                filter: "drop-shadow(0 20px 30px rgba(90,62,27,0.15))"
              }}
            >
              <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
              
              <div className="relative w-full h-full pointer-events-none">
                {image && <img src={image} className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-90" />}
                <canvas ref={textCanvasRef} className="absolute inset-0 w-full h-full z-10" />
              </div>
              
              <canvas 
                ref={drawingCanvasRef} 
                className={`absolute inset-0 w-full h-full touch-none z-20 ${mode === 'drawing' ? 'cursor-crosshair' : 'cursor-default'}`} 
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => {drawingRef.current=false;}} 
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => {drawingRef.current=false;}} 
              />
            </div>

            {/* 부스러기 */}
            {crumbs.map((c) => <div key={c.id} className="absolute bg-[#D97706] rounded-full animate-fall" style={{ width: c.size, height: c.size, left: c.x, top: "50%" }} />)}
          </div>

          {/* 앱 레이아웃 버튼 그룹 */}
          {!isFinished && (
            <div className="w-full mt-8 flex flex-col gap-4 animate-in slide-in-from-bottom-6">
              
              {/* 직접 쓰기/그리기 모드 선택 시 나타나는 도구함 */}
              {mode === "drawing" && (
                <div className="bg-white p-4 rounded-3xl shadow-md border border-orange-100 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setTool("pen")} className={`flex-1 py-2 rounded-xl font-bold text-sm ${tool === "pen" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}>펜</button>
                    <button onClick={() => setTool("eraser")} className={`flex-1 py-2 rounded-xl font-bold text-sm ${tool === "eraser" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}>지우개</button>
                    <button onClick={() => {
                        const img = new Image(); img.src = history[history.length-1];
                        img.onload = () => { drawingCanvasRef.current?.getContext("2d")?.drawImage(img,0,0,400,500); setHistory(h=>h.slice(0,-1)); }
                    }} className="px-3 py-2 bg-gray-50 rounded-xl"><RotateCcw size={18}/></button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {colorChips.map(c => (
                        <button key={c} onClick={() => {setColor(c); setIsPickerUsed(false);}} className={`w-6 h-6 rounded-full ${color === c && !isPickerUsed ? 'ring-2 ring-orange-400' : ''}`} style={{background: c}} />
                      ))}
                      <div className={`relative w-6 h-6 rounded-full border ${isPickerUsed ? 'ring-2 ring-orange-400' : ''}`} style={{background: isPickerUsed ? color : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"}}>
                        <input type="color" className="absolute inset-0 opacity-0" onChange={(e)=>{setColor(e.target.value); setIsPickerUsed(true);}} />
                      </div>
                    </div>
                    <button onClick={() => setMode("none")} className="text-xs font-bold text-orange-500">닫기</button>
                  </div>
                </div>
              )}

              {mode === "typing" && (
                <div className="bg-white p-4 rounded-3xl shadow-md border border-orange-100 flex items-center gap-2">
                  <input type="text" value={inputText} onChange={(e)=>setInputText(e.target.value)} placeholder="내용을 입력하세요..." className="flex-1 bg-transparent outline-none" />
                  <button onClick={()=>setMode("none")} className="p-2 bg-orange-500 text-white rounded-xl"><Check size={18}/></button>
                </div>
              )}

              {/* 메인 버튼 레이아웃 (이미지 기획안 참고) */}
              {mode === "none" && (
                <div className="flex flex-col gap-3">
                  <button onClick={() => fileRef.current?.click()} className="w-full py-4 bg-white border-2 border-orange-100 rounded-2xl flex items-center justify-center gap-3 font-bold text-gray-700 shadow-sm">
                    <ImageIcon className="text-orange-500" /> 스캔
                  </button>
                  <input ref={fileRef} type="file" hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const img = new Image(); const reader = new FileReader();
                    reader.onload = (ev) => { img.src = ev.target?.result as string; };
                    img.onload = () => {
                      const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d");
                      if (!ctx) return; canvas.width = 400; canvas.height = 500;
                      ctx.filter = "contrast(3) grayscale(1)";
                      ctx.drawImage(img, 0, 0, 400, 500);
                      const data = ctx.getImageData(0,0,400,500);
                      for(let i=0; i<data.data.length; i+=4) { if(data.data[i]>130) data.data[i+3]=0; else {data.data[i]=74; data.data[i+1]=42; data.data[i+2]=15;}}
                      ctx.putImageData(data,0,0); setImage(canvas.toDataURL());
                    };
                    reader.readAsDataURL(file);
                  }} />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={()=>setMode("typing")} className="py-4 bg-white border-2 border-orange-100 rounded-2xl flex items-center justify-center gap-2 font-bold text-gray-700">
                      <Type size={18} className="text-orange-500" /> 쓰기
                    </button>
                    <button onClick={()=>setMode("drawing")} className="py-4 bg-white border-2 border-orange-100 rounded-2xl flex items-center justify-center gap-2 font-bold text-gray-700">
                      <Pencil size={18} className="text-orange-500" /> 그리기
                    </button>
                  </div>
                  
                  <button onClick={() => setIsFinished(true)} className="w-full py-5 bg-[#FF8A3D] text-white rounded-3xl font-black text-xl shadow-lg mt-2 active:scale-95 transition-all">
                    완성
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 먹기 모드 버튼 */}
          {isFinished && bite < 4 && (
            <div className="w-full mt-12 flex flex-col gap-4 animate-in slide-in-from-bottom-8">
              <button onClick={handleEat} className="w-full py-6 bg-[#FF8A3D] text-white rounded-[32px] font-black text-2xl shadow-xl active:scale-95 transition-all">
                한 입 먹기 🍴
              </button>
              <button onClick={() => setIsFinished(false)} className="text-orange-400 font-bold underline text-sm">다시 수정할래요</button>
            </div>
          )}
        </main>

        {/* 하단 네비게이션 바 (앱 스타일 고정) */}
        <footer className="h-20 bg-white border-t flex items-center justify-around px-6">
          <div className="flex flex-col items-center gap-1 text-orange-500">
            <Home size={24} /> <span className="text-[10px] font-bold">홈</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-gray-300">
            <BookOpen size={24} /> <span className="text-[10px] font-bold">노트</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-gray-300">
            <UserCircle size={24} /> <span className="text-[10px] font-bold">내정보</span>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        .animate-shake { animation: shake 0.2s ease-in-out; }
        @keyframes fall { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(200px) scale(0.5); opacity: 0; } }
        .animate-fall { animation: fall 0.7s forwards ease-in; }
      `}</style>
    </div>
  );
}