"use client";
import { useState, useRef, useEffect } from "react";
import { Home, BookOpen, UserCircle, RotateCcw, Image as ImageIcon, Type, Pencil, Check, RefreshCcw, Search, MoreVertical } from "lucide-react";

const BREAD_IMG_URL = "https://i.postimg.cc/rmTBY3qQ/Qkd-(1).png";

export default function MemoryBreadApp() {
  // --- [기본 상태] ---
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
  
  // --- [v2 확장 상태] ---
  const [notes, setNotes] = useState<any[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"normal" | "masking" | "quiz">("normal");

  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const colorChips = ["#5a3e1b", "#000000", "#D9534F", "#F0AD4E", "#5CB85C", "#4A90E2"];

  // 초기 캔버스 설정
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

  // 텍스트 렌더링
  useEffect(() => {
    const ctx = textCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 400, 500);
    if (!inputText) return;
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    const paragraphs = inputText.split("\n");
    let y = 140;
    paragraphs.forEach((para) => {
      ctx.fillText(para, 200, y);
      y += 30;
    });
  }, [inputText, textColor]);

  // --- [로직 함수들] ---
  const handleFullReset = () => {
    setImage(null); setBite(0); setMode("none"); setHistory([]); setInputText(""); setIsFinished(false);
    textCanvasRef.current?.getContext("2d")?.clearRect(0, 0, 400, 500);
    drawingCanvasRef.current?.getContext("2d")?.clearRect(0, 0, 400, 500);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onFinishBread = () => {
    const newNote = {
      id: Date.now().toString(),
      title: inputText.substring(0, 10) || "그림 암기빵",
      subject: "분류 중...",
      image: image,
      drawing: drawingCanvasRef.current?.toDataURL(),
      text: inputText,
      createdAt: new Date().toLocaleDateString(),
      isAnalyzing: true,
      maskingKeywords: ["광합성", "엽록체", "포도당", "에너지", "이산화탄소"]
    };
    setNotes(prev => [newNote, ...prev]);
    setIsFinished(true);
    // AI 분석 시뮬레이션
    setTimeout(() => {
      setNotes(prev => prev.map(n => n.id === newNote.id ? { ...n, subject: "과학", isAnalyzing: false } : n));
    }, 1500);
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

  const startDraw = (e: React.PointerEvent) => {
    if (mode !== "drawing" || isFinished) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    setHistory(prev => [...prev, drawingCanvasRef.current!.toDataURL()]);
    drawingRef.current = true;
    const rect = drawingCanvasRef.current!.getBoundingClientRect();
    pointsRef.current = [{ x: (e.clientX - rect.left) * (400 / rect.width), y: (e.clientY - rect.top) * (500 / rect.height) }];
  };

  const draw = (e: React.PointerEvent) => {
    if (!drawingRef.current || mode !== "drawing") return;
    const ctx = drawingCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    const rect = drawingCanvasRef.current!.getBoundingClientRect();
    const currentPos = { x: (e.clientX - rect.left) * (400 / rect.width), y: (e.clientY - rect.top) * (500 / rect.height) };
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

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans overflow-hidden text-[#5a3e1b]">
      <div className="w-full max-w-[430px] bg-[#FEFBF2] min-h-screen flex flex-col shadow-2xl relative">
        {/* 헤더 */}
        <header className="px-6 py-4 flex justify-between items-center z-30">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setShowNotes(false); setSelectedNote(null);}}>
            <span className="text-2xl">🍞</span><h1 className="text-xl font-black">암기빵</h1>
          </div>
          <button onClick={handleFullReset} className="p-2 text-gray-400 hover:text-orange-500"><RefreshCcw size={22} /></button>
        </header>

        {/* 메인 영역 */}
        <main className="flex-1 px-4 flex flex-col items-center pt-2 relative">
          <div className={`relative w-full aspect-[4/5] transition-all duration-500 ${shake ? "animate-shake" : ""}`}>
            <div className={`w-full h-full relative transition-all duration-500 ${bite === 4 ? "opacity-0 scale-95" : "opacity-100"}`} 
                 style={{ clipPath: ["none", "polygon(0% 100%, 100% 100%, 100% 30%, 0% 15%)", "polygon(0% 100%, 100% 100%, 100% 55%, 0% 45%)", "polygon(0% 100%, 100% 100%, 100% 85%, 0% 80%)", "circle(0% at 50% 50%)"][bite] }}>
              <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-contain" />
              <div className="absolute inset-0" style={{ padding: '15% 10% 12% 10%' }}>
                {image && <img src={image} className="w-full h-full object-contain mix-blend-multiply opacity-85" />}
                <canvas ref={textCanvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
                <canvas ref={drawingCanvasRef} className="absolute inset-0 w-full h-full z-20 touch-none pointer-events-auto" 
                        onPointerDown={startDraw} onPointerMove={draw} onPointerUp={() => {drawingRef.current = false; pointsRef.current = [];}} />
              </div>
            </div>
            {crumbs.map((c) => <div key={c.id} className="absolute bg-[#D97706] rounded-full animate-fall" style={{ width: c.size, height: c.size, left: c.x, top: "40%" }} />)}
          </div>

          {!isFinished ? (
            <div className="w-full mt-6 flex flex-col gap-3 z-40">
              {mode === "typing" ? (
                <div className="bg-white p-4 rounded-[28px] shadow-xl border border-orange-50 flex flex-col gap-3">
                  <textarea value={inputText} onChange={(e)=>setInputText(e.target.value)} placeholder="암기 내용을 적어보세요..." className="w-full h-24 p-2 outline-none resize-none text-sm font-medium" />
                  <div className="flex justify-between items-center border-t pt-3">
                    <div className="flex gap-1.5">{colorChips.map(c => <button key={c} onClick={() => setTextColor(c)} className="w-6 h-6 rounded-full" style={{background: c}} />)}</div>
                    <button onClick={()=>setMode("none")} className="p-2 bg-orange-500 text-white rounded-xl"><Check size={18}/></button>
                  </div>
                </div>
              ) : mode === "drawing" ? (
                <div className="bg-white p-4 rounded-[28px] shadow-xl border border-orange-50 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTool("pen")} className={`flex-1 py-2 rounded-xl font-bold ${tool === 'pen' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}>펜</button>
                    <button onClick={() => setTool("eraser")} className={`flex-1 py-2 rounded-xl font-bold ${tool === 'eraser' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}>지우개</button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1.5">{colorChips.map(c => <button key={c} onClick={() => setDrawingColor(c)} className="w-6 h-6 rounded-full" style={{background: c}} />)}</div>
                    <button onClick={() => setMode("none")} className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-lg font-bold">확인</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button onClick={() => fileRef.current?.click()} className="w-full py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold"><ImageIcon className="text-orange-500" /> 스캔</button>
                  <input ref={fileRef} type="file" hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const img = new Image(); const reader = new FileReader();
                    reader.onload = (ev) => { img.src = ev.target?.result as string; };
                    img.onload = () => {
                      const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d");
                      if (!ctx) return; canvas.width = 400; canvas.height = 500;
                      ctx.filter = "contrast(2) grayscale(1)"; ctx.drawImage(img, 0, 0, 400, 500);
                      setImage(canvas.toDataURL());
                    };
                    reader.readAsDataURL(file);
                  }} />
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={()=>setMode("typing")} className="py-4 bg-white border-2 border-orange-100 rounded-[20px] font-bold">직접 쓰기</button>
                    <button onClick={()=>setMode("drawing")} className="py-4 bg-white border-2 border-orange-100 rounded-[20px] font-bold">그리기</button>
                  </div>
                  <button onClick={onFinishBread} className="w-full py-4 bg-[#FF8A3D] text-white rounded-[24px] font-black text-lg shadow-[0_5px_0_#D97706] active:translate-y-1 active:shadow-none">완성 ✨</button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full mt-8 flex flex-col gap-4">
              <button onClick={handleEat} className="w-full py-6 bg-[#FF8A3D] text-white rounded-[36px] font-black text-2xl shadow-[0_8px_0_#D97706] active:translate-y-1">한 입 먹기 🍴</button>
              <button onClick={() => setIsFinished(false)} className="text-orange-400 font-bold underline text-center">수정하기</button>
            </div>
          )}
        </main>

        {/* 푸터 */}
        <footer className="h-20 bg-white border-t border-gray-50 flex items-center justify-around px-8 z-30 pb-2">
          <div className="flex flex-col items-center gap-1 text-orange-500 cursor-pointer" onClick={() => {setShowNotes(false); setSelectedNote(null);}}><Home size={24} /><span className="text-[10px] font-bold">홈</span></div>
          <div className="flex flex-col items-center gap-1 text-gray-300 cursor-pointer" onClick={() => setShowNotes(true)}><BookOpen size={24} /><span className="text-[10px] font-bold">노트</span></div>
          <div className="flex flex-col items-center gap-1 text-gray-300 cursor-pointer"><UserCircle size={24} /><span className="text-[10px] font-bold">내정보</span></div>
        </footer>

        {/* --- [노트 리스트 오버레이] --- */}
        {showNotes && (
          <div className="absolute inset-0 bg-[#FEFBF2] z-[100] flex flex-col">
            <header className="px-6 py-4 flex justify-between items-center border-b bg-white">
              <button onClick={() => setShowNotes(false)} className="p-2 text-gray-400 text-xl">✕</button>
              <h2 className="text-lg font-bold text-[#5a3e1b]">내 빵 노트</h2>
              <button className="p-2 text-gray-400"><Search size={20}/></button>
            </header>
            
            {/* 카테고리 탭 */}
            <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
              {["전체", "과학", "영어", "역사", "기타"].map((tab, i) => (
                <button key={tab} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${i === 0 ? 'bg-orange-500 text-white' : 'bg-white border text-gray-400'}`}>{tab}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {notes.length === 0 ? <p className="text-center py-20 text-gray-400">저장된 암기빵이 없어요 🍞</p> : 
                notes.map(note => (
                  <div key={note.id} onClick={() => {setSelectedNote(note); setViewMode("normal");}} className="bg-white p-4 rounded-[24px] shadow-sm border border-orange-50 flex items-center gap-4 active:scale-95 transition-transform cursor-pointer">
                    <div className="w-16 h-16 bg-orange-50 rounded-xl overflow-hidden flex items-center justify-center">
                      <img src={note.image || note.drawing || BREAD_IMG_URL} className="w-full h-full object-cover opacity-60" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${note.subject === '과학' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{note.isAnalyzing ? "분석 중..." : note.subject}</span>
                        <span className="text-[10px] text-gray-300">{note.createdAt}</span>
                      </div>
                      <h3 className="font-bold text-gray-700 truncate">{note.title}</h3>
                    </div>
                    <MoreVertical size={16} className="text-gray-300" />
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* --- [노트 상세 및 가리기/퀴즈] --- */}
        {selectedNote && (
          <div className="absolute inset-0 bg-[#FEFBF2] z-[110] flex flex-col animate-in slide-in-from-bottom duration-300">
            <header className="px-6 py-4 flex justify-between items-center bg-white border-b">
              <button onClick={() => setSelectedNote(null)} className="p-2 text-gray-400">✕</button>
              <h2 className="text-lg font-bold">{selectedNote.title}</h2>
              <div className="w-10"></div>
            </header>
            <div className="flex-1 flex flex-col items-center p-6 overflow-y-auto">
              <div className="relative w-full aspect-[4/5] mb-8">
                <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-contain" />
                <div className="absolute inset-0 p-10 flex flex-col items-center justify-center text-center">
                  {viewMode === "masking" ? (
                    <div className="text-base leading-relaxed font-bold">
                      {selectedNote.text.split(/(\s+)/).map((word: string, i: number) => (
                        selectedNote.maskingKeywords.some((k: string) => word.includes(k)) ? 
                        <span key={i} className="bg-orange-200 text-transparent rounded px-1 mx-0.5 cursor-pointer hover:bg-orange-100 transition-colors inline-block" onClick={(e) => e.currentTarget.classList.toggle('text-transparent')}> {word} </span> 
                        : <span key={i}>{word}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      {selectedNote.image && <img src={selectedNote.image} className="max-h-40 object-contain mix-blend-multiply opacity-80" />}
                      <p className="text-[#5a3e1b] font-bold whitespace-pre-wrap">{selectedNote.text}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                <button onClick={() => setViewMode("normal")} className={`py-4 rounded-2xl font-bold text-xs ${viewMode === 'normal' ? 'bg-orange-500 text-white' : 'bg-white border'}`}>다시보기</button>
                <button onClick={() => setViewMode("masking")} className={`py-4 rounded-2xl font-bold text-xs ${viewMode === 'masking' ? 'bg-orange-500 text-white' : 'bg-white border'}`}>가리기모드</button>
                <button onClick={() => alert('퀴즈 모드 준비 중!')} className="py-4 bg-white border text-gray-400 rounded-2xl font-bold text-xs">퀴즈모드</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out; }
        @keyframes fall { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(150px) scale(0.5); opacity: 0; } }
        .animate-fall { animation: fall 0.7s forwards ease-in; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}