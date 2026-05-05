"use client";
import { useState, useRef, useEffect } from "react";

// 편집하신 새로운 식빵 이미지 링크
const BREAD_IMG_URL = "https://i.postimg.cc/rybtvfNW/bread-pyeonjibham.png";

export default function MemoryBread() {
  const [image, setImage] = useState<string | null>(null);
  const [bite, setBite] = useState(0);
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

  // 요청하신 6가지 컬러칩
  const colorChips = ["#5a3e1b", "#000000", "#D9534F", "#F0AD4E", "#5CB85C", "#4A90E2"];

  useEffect(() => {
    [textCanvasRef, drawingCanvasRef].forEach(ref => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = 600;
      canvas.height = 440;
      ctx.scale(2, 2); // 고해상도 대응
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    });
  }, []);

  // 텍스트 실시간 캔버스 렌더링
  useEffect(() => {
    const ctx = textCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 300, 220);
    if (!inputText) return;

    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    
    const words = inputText.split("");
    let line = "";
    let y = 70;
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n];
      if (ctx.measureText(testLine).width > 220) {
        ctx.fillText(line, 150, y);
        line = words[n]; y += 26;
      } else { line = testLine; }
    }
    ctx.fillText(line, 150, y);
  }, [inputText, color]);

  const handleReset = () => {
    setBite(0); setImage(null); setTool(null); setHistory([]); setInputText(""); setIsFinished(false);
    setIsPickerUsed(false);
    [textCanvasRef, drawingCanvasRef].forEach(ref => {
      const ctx = ref.current?.getContext("2d");
      ctx?.clearRect(0, 0, 600, 440);
    });
  };

  const getPos = (e: any) => {
    const rect = drawingCanvasRef.current!.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { 
      x: (clientX - rect.left) * (300 / rect.width), 
      y: (clientY - rect.top) * (220 / rect.height) 
    };
  };

  const startDraw = (e: any) => {
    if (!tool || isFinished) return;
    drawingRef.current = true;
    if (drawingCanvasRef.current) setHistory(prev => [...prev, drawingCanvasRef.current!.toDataURL()]);
    const pos = getPos(e);
    pointsRef.current = [pos];
  };

  const draw = (e: any) => {
    if (!drawingRef.current || !tool || isFinished) return;
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
      const newCrumbs = Array.from({ length: 12 }).map((_, i) => ({ id: Date.now() + i, x: Math.random() * 260 + 20, size: Math.random() * 5 + 2 }));
      setCrumbs(prev => [...prev, ...newCrumbs]);
      setTimeout(() => setCrumbs(prev => prev.slice(12)), 700);
    }
  };

  // V1 먹기 모션용 ClipPath
  const biteClips = [
    "none", 
    "polygon(0% 100%, 100% 100%, 100% 30%, 85% 42%, 70% 35%, 55% 45%, 40% 35%, 0% 15%)", 
    "polygon(0% 100%, 100% 100%, 100% 55%, 82% 65%, 68% 52%, 48% 68%, 28% 48%, 0% 45%)", 
    "polygon(0% 100%, 100% 100%, 100% 85%, 75% 95%, 50% 80%, 25% 95%, 0% 80%)", 
    "circle(0% at 50% 50%)"
  ];

  return (
    <div className="min-h-screen bg-[#FFF9E6] flex flex-col items-center justify-center p-4 font-sans select-none overflow-hidden relative">
      <h1 className={`text-2xl font-bold text-[#5a3e1b] transition-all duration-500 ${isFinished ? (bite === 4 ? "mb-8" : "fixed top-8") : "mb-6"}`}>암기빵 🍞</h1>

      {/* 식빵 메인 영역 */}
      <div className={`relative w-[300px] h-[220px] transition-all duration-500 flex items-center justify-center ${isFinished && bite < 4 ? "scale-[1.4] mb-24" : "mb-0"} ${shake ? "animate-shake" : ""}`}>
        
        {/* 다 먹었을 때 엔딩 화면 (V1 방식) */}
        {bite === 4 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in">
            <button onClick={handleReset} className="py-4 px-20 bg-[#D97706] text-white rounded-2xl font-bold text-lg shadow-[0_6px_0_#92400E] active:translate-y-1 active:shadow-none">빵 다시 굽기 🍞</button>
          </div>
        )}

        {/* 식빵 이미지 및 캔버스 레이어 */}
        <div 
          className={`w-full h-full relative transition-opacity ${bite === 4 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          style={{ 
            clipPath: biteClips[bite], 
            transition: "clip-path 0.3s ease-out, opacity 0.3s",
            filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))" // 바탕 그림자 추가
          }}
        >
          {/* 요청하신 편집 이미지 */}
          <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-contain pointer-events-none" alt="bread" />
          
          <div className="relative w-full h-full pointer-events-none">
            {/* 스캔된 투명 배경 이미지 */}
            {image && <img src={image} className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-95" />}
            <canvas ref={textCanvasRef} style={{ width: '300px', height: '220px' }} className="absolute inset-0 z-10" />
          </div>
          
          <canvas 
            ref={drawingCanvasRef} 
            style={{ width: '300px', height: '220px' }} 
            className={`absolute inset-0 touch-none z-20 ${isFinished ? "cursor-default" : (!tool ? "cursor-default" : "cursor-crosshair")}`} 
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => {drawingRef.current=false; pointsRef.current=[];}} onMouseLeave={() => {drawingRef.current=false; pointsRef.current=[];}} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => {drawingRef.current=false; pointsRef.current=[];}} 
          />
        </div>
        
        {/* 부스러기 효과 */}
        {crumbs.map((c) => <div key={c.id} className="absolute bg-[#D97706] rounded-full animate-fall" style={{ width: c.size, height: c.size, left: c.x, top: "50%" }} />)}
      </div>

      {/* 하단 컨트롤 영역 (편집 모드) */}
      {!isFinished && (
        <div className="mt-8 flex flex-col gap-3 w-full max-w-[320px] animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex gap-2 bg-white p-2 rounded-xl border border-orange-200">
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="암기 내용 입력..." className="flex-1 px-2 py-1 outline-none text-sm" />
          </div>

          <div className="flex gap-2 bg-[#FEF3C7] p-1 rounded-xl shadow-inner">
            <button onClick={() => setTool(tool === "pen" ? null : "pen")} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${tool === "pen" ? "bg-[#F59E0B] text-white shadow-md" : "text-[#B45309]"}`}>펜</button>
            <button onClick={() => setTool(tool === "eraser" ? null : "eraser")} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${tool === "eraser" ? "bg-[#F59E0B] text-white shadow-md" : "text-[#B45309]"}`}>지우개</button>
            <button onClick={() => {
               if (history.length === 0) return;
               const img = new Image(); img.src = history[history.length - 1];
               img.onload = () => {
                 const ctx = drawingCanvasRef.current?.getContext("2d");
                 if (ctx) { ctx.clearRect(0,0,600,440); ctx.drawImage(img,0,0,300,220); setHistory(prev => prev.slice(0,-1)); }
               }
            }} className="flex-1 py-2 rounded-lg font-bold bg-white text-[#B45309] border border-[#FDE68A] text-xs">↩ 취소</button>
          </div>

          {/* 컬러칩 & 컬러피커 영역 */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-[#FEF3C7] flex flex-col gap-3">
            <input type="range" min="2" max="25" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-1.5 bg-[#FDE68A] rounded-lg appearance-none cursor-pointer accent-[#F59E0B]" />
            <div className="flex items-center justify-between px-1">
              <div className="flex items-end gap-2 h-8">
                {colorChips.map(v => (
                  <button 
                    key={v} 
                    onClick={() => { setColor(v); setTool("pen"); setIsPickerUsed(false); }} 
                    className={`w-6 h-6 rounded-full transition-all duration-300 shadow-sm ${color === v && !isPickerUsed && tool === "pen" ? 'w-8 h-8 -translate-y-1.5 shadow-md ring-2 ring-orange-200 opacity-100' : 'opacity-70 hover:opacity-100 hover:-translate-y-0.5'}`} 
                    style={{ background: v }} 
                  />
                ))}
              </div>
              
              {/* 무지개 컬러 피커 */}
              <div 
                className={`relative w-8 h-8 rounded-full overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 ${tool === 'pen' ? 'scale-100' : 'opacity-40'} ${isPickerUsed && tool === 'pen' ? 'w-10 h-10 -translate-y-1.5 ring-2 ring-orange-200' : ''}`} 
                style={{ 
                  background: isPickerUsed ? color : "conic-gradient(#F0A8A8 0% 16%, #F0F0A8 16% 32%, #A8F0A8 32% 48%, #A8F0F0 48% 64%, #A8A8F0 64% 80%, #F0A8F0 80% 100%)" 
                }}
              >
                <input type="color" value={color} onChange={(e) => { setColor(e.target.value); setTool("pen"); setIsPickerUsed(true); }} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {/* V1 스캔 기능 복구 (배경제거 로직 포함) */}
            <button onClick={() => fileRef.current?.click()} className="flex-1 py-3 bg-[#F59E0B] text-white rounded-xl font-bold shadow-[0_4px_0_#B45309] active:translate-y-1 active:shadow-none text-sm">스캔</button>
            <input ref={fileRef} type="file" hidden accept="image/*" onChange={(e) => {
               const file = e.target.files?.[0]; if (!file) return;
               const img = new Image(); const reader = new FileReader();
               reader.onload = (ev) => { img.src = ev.target?.result as string; };
               img.onload = () => {
                 const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d");
                 if (!ctx) return; canvas.width = 600; canvas.height = 440;
                 ctx.filter = "contrast(2.8) brightness(1.1) grayscale(1)"; // 글자 선명도 강화
                 ctx.drawImage(img, 0, 0, 600, 440);
                 const data = ctx.getImageData(0, 0, 600, 440);
                 for (let i = 0; i < data.data.length; i += 4) {
                   const avg = (data.data[i] + data.data[i+1] + data.data[i+2]) / 3;
                   // 밝은 배경은 투명하게, 어두운 글자만 남김
                   if (avg > 140) data.data[i+3] = 0;
                   else { data.data[i]=74; data.data[i+1]=42; data.data[i+2]=15; data.data[i+3]=255; }
                 }
                 ctx.putImageData(data, 0, 0); setImage(canvas.toDataURL());
               };
               reader.readAsDataURL(file);
            }} />
            <button onClick={handleReset} className="flex-1 py-3 bg-white border-2 border-[#D97706] text-[#D97706] rounded-xl font-bold text-xs">초기화</button>
          </div>
          <button onClick={() => setIsFinished(true)} className="w-full py-4 bg-[#D97706] text-white rounded-xl font-bold text-lg shadow-[0_5px_0_#92400E] active:translate-y-1 active:shadow-none mt-2">완성 ✨</button>
        </div>
      )}

      {/* 완성 후 (먹기 모드) */}
      {isFinished && bite < 4 && (
        <div className="mt-8 w-full max-w-[320px] animate-in slide-in-from-bottom-4">
          <button onClick={handleEat} className="w-full py-5 bg-[#D97706] text-white rounded-2xl font-bold text-xl shadow-[0_6px_0_#92400E] active:translate-y-1 active:shadow-none">한 입 먹기 🍴</button>
          <button onClick={() => setIsFinished(false)} className="w-full mt-4 py-2 text-[#D97706] font-bold text-sm underline opacity-70 text-center hover:opacity-100 transition-opacity">수정하러 가기</button>
        </div>
      )}

      <style jsx>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out; }
        @keyframes fall { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(120px) scale(0.5); opacity: 0; } }
        .animate-fall { animation: fall 0.7s forwards ease-in; }
      `}</style>
    </div>
  );
}