"use client";
import { useState, useRef, useEffect } from "react";
import { Home, BookOpen, UserCircle, RotateCcw, Image as ImageIcon, Type, Pencil, Check, RefreshCcw, BrainCircuit, Play, X } from "lucide-react";

const BREAD_IMG_URL = "https://i.postimg.cc/rmTBY3qQ/Qkd-(1).png";

export default function MemoryBreadApp() {
  // --- [원본 상태 및 참조 변수: 절대 누락 없음] ---
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

  // --- [AI 및 노트 기능을 위한 추가 상태] ---
  const [view, setView] = useState<"home" | "notes" | "detail" | "quiz">("home");
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [maskedKeywords, setMaskedKeywords] = useState<string[]>([]);
  const [quizStep, setQuizStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // --- [원본 로직: 캔버스 초기화] ---
  useEffect(() => {
    [textCanvasRef, drawingCanvasRef].forEach(ref => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = 800; canvas.height = 1000;
      ctx.scale(2, 2); ctx.lineCap = "round"; ctx.lineJoin = "round";
    });
  }, [view]);

  // --- [원본 로직: 드로잉 및 스캔 (생략 없이 모두 포함)] ---
  const handleFullReset = () => {
    setImage(null); setBite(0); setMode("none"); setHistory([]); setInputText(""); setIsFinished(false);
    textCanvasRef.current?.getContext("2d")?.clearRect(0, 0, 400, 500);
    drawingCanvasRef.current?.getContext("2d")?.clearRect(0, 0, 400, 500);
    if (fileRef.current) fileRef.current.value = "";
    setView("home");
  };

  useEffect(() => {
    const ctx = textCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 400, 500);
    if (!inputText) return;
    ctx.font = "bold 22px sans-serif"; ctx.fillStyle = textColor; ctx.textAlign = "center";
    const paragraphs = inputText.split("\n");
    let y = 140; paragraphs.forEach((para) => { ctx.fillText(para, 200, y); y += 30; });
  }, [inputText, textColor]);

  const saveHistory = () => { if (drawingCanvasRef.current) setHistory(prev => [...prev, drawingCanvasRef.current!.toDataURL()]); };
  const handleUndo = () => {
    if (history.length === 0) return;
    const img = new Image(); img.src = history[history.length - 1];
    img.onload = () => {
      const ctx = drawingCanvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, 400, 500); ctx.drawImage(img, 0, 0, 400, 500);
      setHistory(prev => prev.slice(0, -1));
    };
  };

  const getPos = (e: React.PointerEvent) => {
    const rect = drawingCanvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (400 / rect.width), y: (e.clientY - rect.top) * (500 / rect.height) };
  };
  const startDraw = (e: React.PointerEvent) => {
    if (mode !== "drawing" || isFinished) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    saveHistory(); drawingRef.current = true; pointsRef.current = [getPos(e)];
  };
  const draw = (e: React.PointerEvent) => {
    if (!drawingRef.current || mode !== "drawing") return;
    const ctx = drawingCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    const currentPos = getPos(e); pointsRef.current.push(currentPos);
    ctx.lineWidth = tool === "eraser" ? 25 : brushSize;
    ctx.strokeStyle = drawingColor;
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    if (pointsRef.current.length > 2) {
      const pts = pointsRef.current; const i = pts.length - 2;
      const midPoint = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
      ctx.beginPath(); ctx.moveTo((pts[i-1].x + pts[i].x)/2, (pts[i-1].y + pts[i].y)/2);
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midPoint.x, midPoint.y); ctx.stroke();
    }
  };
  const stopDraw = (e: React.PointerEvent) => { drawingRef.current = false; try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {} };

  const handleEat = () => {
    if (bite < 4) {
      setShake(true); setTimeout(() => setShake(false), 200); setBite(prev => prev + 1);
      const newCrumbs = Array.from({ length: 12 }).map((_, i) => ({ id: Date.now() + i, x: Math.random() * 300 + 50, size: Math.random() * 5 + 2 }));
      setCrumbs(prev => [...prev, ...newCrumbs]); setTimeout(() => setCrumbs(prev => prev.slice(12)), 700);
    }
  };
  const biteClips = ["none", "polygon(0% 100%, 100% 100%, 100% 30%, 85% 42%, 70% 35%, 55% 45%, 40% 35%, 0% 15%)", "polygon(0% 100%, 100% 100%, 100% 55%, 82% 65%, 68% 52%, 48% 68%, 28% 48%, 0% 45%)", "polygon(0% 100%, 100% 100%, 100% 85%, 75% 95%, 50% 80%, 25% 95%, 0% 80%)", "circle(0% at 50% 50%)"];

  // --- [신규: AI 기능 시뮬레이션] ---
  const processWithAi = async () => {
    setIsAiProcessing(true);
    // 실제 환경에서는 여기서 AI API(OpenAI, Gemini 등)를 호출합니다.
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    const aiGeneratedNote = {
      id: Date.now(),
      title: inputText.slice(0, 10) || "스캔된 암기빵",
      content: inputText || "이미지에서 추출된 텍스트 내용입니다.",
      keywords: ["핵심단어1", "중요개념", "암기포인트"], // AI가 추출한 키워드
      quiz: {
        q: "이 빵의 핵심 내용은 무엇인가요?",
        options: ["정답 선택지", "오답 1", "오답 2", "오답 3"],
        ans: 0
      },
      date: new Date().toLocaleDateString()
    };
    setNotes([aiGeneratedNote, ...notes]);
    setIsAiProcessing(false);
    setIsFinished(true);
  };

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans overflow-hidden text-[#5a3e1b]">
      <div className="w-full max-w-[430px] bg-[#FEFBF2] min-h-screen flex flex-col shadow-2xl relative">
        
        {/* 헤더 */}
        <header className="px-6 py-4 flex justify-between items-center z-30">
          <div className="flex items-center gap-2" onClick={() => setView("home")}>
            <span className="text-2xl">🍞</span><h1 className="text-xl font-black">암기빵</h1>
          </div>
          <button onClick={handleFullReset} className="p-2 text-gray-400 hover:text-orange-500"><RefreshCcw size={22} /></button>
        </header>

        <main className="flex-1 px-4 flex flex-col items-center pt-2 relative">
          {view === "home" && (
            <>
              {/* 메인 암기빵 영역 (원본 로직 유지) */}
              <div className={`relative w-full aspect-[4/5] transition-all duration-500 ${shake ? "animate-shake" : ""}`}>
                {bite === 4 && (
                  <div className="absolute inset-0 flex items-end justify-center z-50 pb-20">
                    <button onClick={handleFullReset} className="py-5 px-12 bg-[#FF8A3D] text-white rounded-[32px] font-black text-xl shadow-[0_8px_0_#D97706] active:translate-y-1">새 빵 굽기 🍞</button>
                  </div>
                )}
                <div className={`w-full h-full relative ${bite === 4 ? "opacity-0 scale-95" : "opacity-100"}`} style={{ clipPath: biteClips[bite] }}>
                  <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-contain" />
                  <div className="absolute inset-0">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 pointer-events-none" style={{ padding: '15% 10% 12% 10%' }}>
                        {image && <img src={image} className="w-full h-full object-contain mix-blend-multiply opacity-85" />}
                      </div>
                      <canvas ref={textCanvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
                      <canvas ref={drawingCanvasRef} className="absolute inset-0 w-full h-full z-20 touch-none pointer-events-auto" onPointerDown={startDraw} onPointerMove={draw} onPointerUp={stopDraw} onPointerLeave={stopDraw} onPointerCancel={stopDraw} />
                    </div>
                  </div>
                </div>
                {crumbs.map((c) => <div key={c.id} className="absolute bg-[#D97706] rounded-full animate-fall" style={{ width: c.size, height: c.size, left: c.x, top: "40%" }} />)}
              </div>

              {/* 하단 컨트롤 영역 (원본 유지 + AI 연동) */}
              {!isFinished ? (
                <div className="w-full mt-6 flex flex-col gap-3 z-40">
                  {mode === "typing" && (
                    <div className="bg-white p-4 rounded-[28px] shadow-xl border border-orange-50 flex flex-col gap-3">
                      <textarea value={inputText} onChange={(e)=>setInputText(e.target.value)} placeholder="암기 내용을 적어보세요..." className="w-full h-24 p-2 outline-none resize-none text-sm font-medium" autoFocus />
                      <div className="flex justify-between items-center border-t pt-3">
                        <div className="flex gap-1.5">
                          {colorChips.map(c => <button key={c} onClick={() => {setTextColor(c); setIsTextPickerUsed(false);}} className={`w-6 h-6 rounded-full ${textColor === c && !isTextPickerUsed ? 'ring-2 ring-orange-400' : ''}`} style={{background: c}} />)}
                        </div>
                        <button onClick={()=>setMode("none")} className="p-2 bg-orange-500 text-white rounded-xl"><Check size={18}/></button>
                      </div>
                    </div>
                  )}
                  {mode === "drawing" && (
                    <div className="bg-white p-4 rounded-[28px] shadow-xl border border-orange-50 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setTool("pen")} className={`flex-1 py-2 rounded-xl font-bold text-sm ${tool === "pen" ? "bg-orange-500 text-white shadow-inner" : "bg-gray-100 text-gray-400"}`}>펜</button>
                        <button onClick={() => setTool("eraser")} className={`flex-1 py-2 rounded-xl font-bold text-sm ${tool === "eraser" ? "bg-orange-500 text-white shadow-inner" : "bg-gray-100 text-gray-400"}`}>지우개</button>
                        <button onClick={handleUndo} className="p-2 bg-gray-50 rounded-xl text-gray-400"><RotateCcw size={18}/></button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1.5">
                          {colorChips.map(c => <button key={c} onClick={() => {setDrawingColor(c); setIsDrawingPickerUsed(false);}} className={`w-6 h-6 rounded-full ${drawingColor === c && !isDrawingPickerUsed ? 'ring-2 ring-orange-300' : ''}`} style={{background: c}} />)}
                        </div>
                        <button onClick={() => setMode("none")} className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-lg font-bold text-xs">확인</button>
                      </div>
                    </div>
                  )}
                  {mode === "none" && (
                    <div className="flex flex-col gap-3">
                      <button onClick={() => fileRef.current?.click()} className="w-full py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold text-gray-600 text-sm active:bg-orange-50 transition-colors"><ImageIcon className="text-orange-500" size={20} /> 스캔</button>
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
                        <button onClick={()=>setMode("typing")} className="py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold text-gray-600 text-sm"><Type size={18} className="text-orange-500" /> 직접 쓰기</button>
                        <button onClick={()=>setMode("drawing")} className="py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold text-gray-600 text-sm"><Pencil size={18} className="text-orange-500" /> 그리기</button>
                      </div>
                      <button onClick={processWithAi} disabled={isAiProcessing} className="w-full py-4 bg-[#FF8A3D] text-white rounded-[24px] font-black text-lg shadow-[0_5px_0_#D97706] active:translate-y-1 flex items-center justify-center gap-2">
                        {isAiProcessing ? "AI 분석 중..." : "AI 암기빵 완성 ✨"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full mt-8 flex flex-col gap-4">
                  <button onClick={handleEat} className="w-full py-6 bg-[#FF8A3D] text-white rounded-[36px] font-black text-2xl shadow-[0_8px_0_#D97706] active:translate-y-1">한 입 먹기 🍴</button>
                  <button onClick={() => setIsFinished(false)} className="text-orange-400 font-bold underline text-sm text-center">수정하러 가기</button>
                </div>
              )}
            </>
          )}

          {/* --- [노트 탭 화면] --- */}
          {view === "notes" && (
            <div className="w-full flex flex-col gap-4 overflow-y-auto pb-10">
              <h2 className="text-2xl font-black mb-2 flex items-center gap-2"><BookOpen className="text-orange-500" /> 내 보관함</h2>
              {notes.map(note => (
                <div key={note.id} onClick={() => { setSelectedNote(note); setView("detail"); }} className="bg-white p-5 rounded-[24px] border border-orange-100 shadow-sm flex justify-between items-center active:scale-95 transition-all">
                  <div>
                    <h3 className="font-bold text-gray-800">{note.title}</h3>
                    <p className="text-xs text-gray-400">{note.date}</p>
                  </div>
                  <BrainCircuit className="text-orange-300" />
                </div>
              ))}
            </div>
          )}

          {/* --- [상세 페이지: AI 가리기 기능] --- */}
          {view === "detail" && selectedNote && (
            <div className="w-full flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <button onClick={() => setView("notes")} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                <h3 className="font-black text-lg">{selectedNote.title}</h3>
                <div className="w-10"></div>
              </div>
              <div className="bg-white p-8 rounded-[32px] shadow-xl min-h-[300px] relative border-2 border-orange-50">
                <p className="text-gray-700 leading-relaxed text-lg mb-8">{selectedNote.content}</p>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                  <span className="w-full text-xs font-bold text-orange-400 mb-1">AI 추출 핵심 키워드 (클릭하여 가리기)</span>
                  {selectedNote.keywords.map((kw: string, i: number) => (
                    <button key={i} onClick={() => setMaskedKeywords(prev => prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw])}
                      className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${maskedKeywords.includes(kw) ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600"}`}>
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setView("quiz")} className="w-full py-4 bg-[#FF8A3D] text-white rounded-[24px] font-black flex items-center justify-center gap-2 shadow-lg"><Play size={20}/> AI 복습 퀴즈 시작</button>
            </div>
          )}

          {/* --- [퀴즈 모드] --- */}
          {view === "quiz" && selectedNote && (
            <div className="w-full flex flex-col gap-8 text-center pt-10">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"><BrainCircuit size={40} className="text-orange-500" /></div>
              <h2 className="text-xl font-bold text-gray-800">{selectedNote.quiz.q}</h2>
              <div className="grid gap-3">
                {selectedNote.quiz.options.map((opt: string, i: number) => (
                  <button key={i} onClick={() => setSelectedAnswer(i)} className={`p-5 rounded-2xl border-2 font-bold transition-all ${selectedAnswer === i ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-100 bg-white"}`}>
                    {opt}
                  </button>
                ))}
              </div>
              {selectedAnswer !== null && (
                <button onClick={() => { setView("notes"); setSelectedAnswer(null); }} className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold">확인 완료</button>
              )}
            </div>
          )}
        </main>

        {/* 하단 내비게이션 */}
        <footer className="h-20 bg-white border-t border-gray-50 flex items-center justify-around px-8 z-30 pb-2">
          <div onClick={() => setView("home")} className={`flex flex-col items-center gap-1 cursor-pointer ${view === "home" ? "text-orange-500" : "text-gray-300"}`}><Home size={24} /><span className="text-[10px] font-bold">홈</span></div>
          <div onClick={() => setView("notes")} className={`flex flex-col items-center gap-1 cursor-pointer ${view !== "home" ? "text-orange-500" : "text-gray-300"}`}><BookOpen size={24} /><span className="text-[10px] font-bold">노트</span></div>
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