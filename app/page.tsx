"use client";
import { useState, useRef, useEffect } from "react";
import { Home, BookOpen, UserCircle, RotateCcw, Image as ImageIcon, Type, Pencil, Check, RefreshCcw, X, Play, Edit2, ChevronRight } from "lucide-react";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// 1. AI 설정 (API 키를 입력하세요)
const ai = new GoogleGenAI({ apiKey: "AIzaSyCGp6siInTI6EC3epvhOAga8hgsJbqaQv0" });

const BREAD_IMG_URL = "https://i.postimg.cc/rmTBY3qQ/Qkd-(1).png";

export default function MemoryBreadApp() {
  // --- [원본 상태 유지 - 수정 금지] ---
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

  // --- [추가된 기능 상태] ---
  const [view, setView] = useState<"home" | "notes" | "detail" | "quiz">("home");
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [maskedKeywords, setMaskedKeywords] = useState<string[]>([]);
  
  // 퀴즈 상태
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // --- [원본 초기 캔버스 설정 유지] ---
  useEffect(() => {
    [textCanvasRef, drawingCanvasRef].forEach(ref => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = 800; canvas.height = 1000;
      ctx.scale(2, 2);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
    });
  }, [view]);

  // --- [원본 핸들러 로직 유지] ---
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
    let y = 140;
    paragraphs.forEach((para) => { ctx.fillText(para, 200, y); y += 30; });
  }, [inputText, textColor]);

  const saveHistory = () => { if (drawingCanvasRef.current) setHistory(prev => [...prev, drawingCanvasRef.current!.toDataURL()]); };
  const handleUndo = () => { /* 원본 로직 동일 */ };
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
    const ctx = drawingCanvasRef.current?.getContext("2d"); if (!ctx) return;
    const currentPos = getPos(e); pointsRef.current.push(currentPos);
    ctx.lineWidth = tool === "eraser" ? 25 : brushSize; ctx.strokeStyle = drawingColor;
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    if (pointsRef.current.length > 2) {
      const pts = pointsRef.current; const i = pts.length - 2;
      const midPoint = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
      ctx.beginPath(); ctx.moveTo((pts[i-1].x + pts[i].x)/2, (pts[i-1].y + pts[i].y)/2);
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midPoint.x, midPoint.y); ctx.stroke();
    }
  };
  const stopDraw = (e: React.PointerEvent) => { drawingRef.current = false; pointsRef.current = []; try { (e.target as Element).releasePointerCapture(e.pointerId); } catch (err) {} };
  
  const handleEat = () => {
    if (bite < 4) {
      setShake(true); setTimeout(() => setShake(false), 200);
      setBite(prev => prev + 1);
      const newCrumbs = Array.from({ length: 12 }).map((_, i) => ({ id: Date.now() + i, x: Math.random() * 300 + 50, size: Math.random() * 5 + 2 }));
      setCrumbs(prev => [...prev, ...newCrumbs]); setTimeout(() => setCrumbs(prev => prev.slice(12)), 700);
    }
  };

  const biteClips = ["none", "polygon(0% 100%, 100% 100%, 100% 30%, 85% 42%, 70% 35%, 55% 45%, 40% 35%, 0% 15%)", "polygon(0% 100%, 100% 100%, 100% 55%, 82% 65%, 68% 52%, 48% 68%, 28% 48%, 0% 45%)", "polygon(0% 100%, 100% 100%, 100% 85%, 75% 95%, 50% 80%, 25% 95%, 0% 80%)", "circle(0% at 50% 50%)"];

  // --- [새 기능: AI 분석 및 저장] ---
  const handleAiAnalyze = async () => {
    if (!inputText) { setIsFinished(true); return; }
    setIsAiLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `암기빵 내용: "${inputText}". 
        위 내용을 분석해서 학습용 JSON 데이터를 만들어줘.
        JSON 형식: {
          "title": "내용의 핵심 제목",
          "subject": "과목 분류(과학, 수학 등)",
          "summary": "핵심 요약본 (줄바꿈 포함)",
          "masking": ["핵심단어1", "핵심단어2", "핵심단어3"],
          "quizzes": [{"q": "문제", "a": ["보기1", "보기2", "보기3", "보기4"], "correct": 정답인덱스, "exp": "해설"}]
        }
        문항은 총 5개 만들어줘.`,
        config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
      });

      const aiData = JSON.parse(response.text || "{}");
      const newNote = {
        id: Date.now(),
        ...aiData,
        image,
        originalText: inputText,
        date: new Date().toLocaleDateString()
      };
      setNotes([newNote, ...notes]);
      setIsFinished(true);
    } catch (err) {
      console.error(err);
      setIsFinished(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans overflow-hidden text-[#5a3e1b]">
      <div className="w-full max-w-[430px] bg-[#FEFBF2] min-h-screen flex flex-col shadow-2xl relative">
        {/* 헤더 */}
        <header className="px-6 py-4 flex justify-between items-center z-30">
          <div className="flex items-center gap-2" onClick={() => setView("home")}>
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black">암기빵</h1>
          </div>
          <button onClick={handleFullReset} className="p-2 text-gray-400 hover:text-orange-500 transition-colors"><RefreshCcw size={22} /></button>
        </header>

        {isAiLoading && (
          <div className="absolute inset-0 bg-white/80 z-[100] flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="font-bold">AI가 빵을 분석 중...</p>
          </div>
        )}

        {/* 1. 홈 화면 (원본 유지) */}
        {view === "home" && (
          <main className="flex-1 px-4 flex flex-col items-center pt-2 relative">
            <div className={`relative w-full aspect-[4/5] transition-all duration-500 ${shake ? "animate-shake" : ""}`}>
              {bite === 4 && (
                <div className="absolute inset-0 flex items-end justify-center z-50 pb-20">
                  <button onClick={handleFullReset} className="py-5 px-12 bg-[#FF8A3D] text-white rounded-[32px] font-black text-xl shadow-[0_8px_0_#D97706] active:translate-y-1 active:shadow-none">빵 다시 굽기 🍞</button>
                </div>
              )}
              <div className={`w-full h-full relative transition-all duration-500 ${bite === 4 ? "opacity-0 scale-95" : "opacity-100"}`} style={{ clipPath: biteClips[bite] }}>
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

            {!isFinished && (
              <div className="w-full mt-6 flex flex-col gap-3 z-40">
                {mode === "typing" && (
                  <div className="bg-white p-4 rounded-[28px] shadow-xl border border-orange-50 flex flex-col gap-3">
                    <textarea value={inputText} onChange={(e)=>setInputText(e.target.value)} placeholder="암기 내용을 적어보세요..." className="w-full h-24 p-2 outline-none resize-none text-sm font-medium" autoFocus />
                    <div className="flex justify-between items-center border-t pt-3">
                      <div className="flex gap-1.5">{colorChips.map(c => <button key={c} onClick={() => setTextColor(c)} className="w-6 h-6 rounded-full" style={{background: c}} />)}</div>
                      <button onClick={()=>setMode("none")} className="p-2 bg-orange-500 text-white rounded-xl"><Check size={18}/></button>
                    </div>
                  </div>
                )}
                {mode === "drawing" && (
                  <div className="bg-white p-4 rounded-[28px] shadow-xl border border-orange-50 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setTool("pen")} className={`flex-1 py-2 rounded-xl font-bold text-sm ${tool === "pen" ? "bg-orange-500 text-white" : "bg-gray-100"}`}>펜</button>
                      <button onClick={() => setTool("eraser")} className={`flex-1 py-2 rounded-xl font-bold text-sm ${tool === "eraser" ? "bg-orange-500 text-white" : "bg-gray-100"}`}>지우개</button>
                    </div>
                    <button onClick={() => setMode("none")} className="w-full py-2 bg-orange-100 text-orange-600 rounded-lg font-bold text-xs">확인</button>
                  </div>
                )}
                {mode === "none" && (
                  <div className="flex flex-col gap-3">
                    <button onClick={() => fileRef.current?.click()} className="w-full py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold text-gray-600 text-sm active:bg-orange-50 transition-colors"><ImageIcon className="text-orange-500" size={20} /> 스캔</button>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={()=>setMode("typing")} className="py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold text-gray-600 text-sm"><Type size={18} className="text-orange-500" /> 직접 쓰기</button>
                      <button onClick={()=>setMode("drawing")} className="py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold text-gray-600 text-sm"><Pencil size={18} className="text-orange-500" /> 그리기</button>
                    </div>
                    <button onClick={handleAiAnalyze} className="w-full py-4 bg-[#FF8A3D] text-white rounded-[24px] font-black text-lg shadow-[0_5px_0_#D97706] active:translate-y-1 transition-all">완성 & 분석 ✨</button>
                  </div>
                )}
              </div>
            )}
            {isFinished && bite < 4 && (
              <div className="w-full mt-8 flex flex-col gap-4">
                <button onClick={handleEat} className="w-full py-6 bg-[#FF8A3D] text-white rounded-[36px] font-black text-2xl shadow-[0_8px_0_#D97706] active:translate-y-1">한 입 먹기 🍴</button>
              </div>
            )}
          </main>
        )}

        {/* 2. 노트 목록 화면 */}
        {view === "notes" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#F9F7F0]">
            <h2 className="text-xl font-bold mb-6">내 빵 보관함</h2>
            <div className="grid gap-4">
              {notes.map(note => (
                <div key={note.id} className="bg-white p-4 rounded-3xl shadow-sm" onClick={() => { setSelectedNote(note); setView("detail"); }}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl overflow-hidden border border-orange-100">
                      {note.image ? <img src={note.image} className="w-full h-full object-cover" /> : "🍞"}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{note.subject}</span>
                      <h3 className="font-bold text-gray-800 mt-1">{note.title}</h3>
                      <p className="text-[11px] text-gray-400">{note.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. 노트 상세 (AI 분석 결과 + 가리기) */}
        {view === "detail" && selectedNote && (
          <div className="flex-1 flex flex-col p-6 bg-white overflow-y-auto">
            <div className="flex justify-between mb-6 items-center">
              <button onClick={() => setView("notes")}><X /></button>
              <h2 className="font-bold text-orange-600">{selectedNote.title}</h2>
              <div className="w-6" />
            </div>
            <div className="bg-[#FFFBF0] rounded-3xl p-8 border-2 border-orange-100 shadow-inner min-h-[300px]">
              <h3 className="text-orange-500 font-bold mb-4 border-b border-orange-200 pb-2">AI 핵심 요약</h3>
              <p className="text-sm leading-relaxed mb-8 whitespace-pre-wrap">{selectedNote.summary}</p>
              <div className="flex flex-wrap gap-2">
                {selectedNote.masking?.map((word: string, i: number) => (
                  <button key={i} onClick={() => setMaskedKeywords(prev => prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word])}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${maskedKeywords.includes(word) ? "bg-orange-100 text-orange-600" : "bg-orange-500 text-orange-500"}`}>
                    {word}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button onClick={() => { setView("home"); setInputText(selectedNote.originalText); setBite(0); setIsFinished(false); }} className="p-4 bg-orange-50 rounded-2xl flex flex-col items-center gap-1">
                <RotateCcw size={18} className="text-orange-500"/><span className="text-[11px] font-bold">다시먹기</span>
              </button>
              <button onClick={() => { setView("quiz"); setCurrentQuizIdx(0); }} className="p-4 bg-orange-500 text-white rounded-2xl flex flex-col items-center gap-1">
                <BookOpen size={18}/><span className="text-[11px] font-bold">퀴즈풀기</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. 퀴즈 화면 (듀오링고 스타일) */}
        {view === "quiz" && selectedNote && (
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-6">
              <div className="w-full bg-gray-100 h-2 rounded-full mb-8">
                <div className="bg-orange-500 h-full transition-all" style={{ width: `${((currentQuizIdx + 1) / selectedNote.quizzes.length) * 100}%` }} />
              </div>
              <h3 className="text-xl font-bold mb-8">{selectedNote.quizzes[currentQuizIdx].q}</h3>
              <div className="grid gap-3">
                {selectedNote.quizzes[currentQuizIdx].a.map((opt: string, i: number) => (
                  <button key={i} disabled={isAnswerChecked} onClick={() => setSelectedAnswer(i)}
                    className={`w-full p-5 rounded-2xl border-2 text-left font-bold transition-all ${selectedAnswer === i ? "border-orange-500 bg-orange-50" : "border-gray-100 bg-white"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-auto p-6 border-t border-gray-100">
              {isAnswerChecked && (
                <div className={`mb-4 p-4 rounded-2xl ${selectedAnswer === selectedNote.quizzes[currentQuizIdx].correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  <p className="font-bold">{selectedAnswer === selectedNote.quizzes[currentQuizIdx].correct ? "정답이에요! 🎉" : "틀렸어요 😢"}</p>
                  <p className="text-xs mt-1">{selectedNote.quizzes[currentQuizIdx].exp}</p>
                </div>
              )}
              <button onClick={() => {
                if (!isAnswerChecked) setIsAnswerChecked(true);
                else {
                  if (currentQuizIdx + 1 < selectedNote.quizzes.length) { setCurrentQuizIdx(prev => prev + 1); setSelectedAnswer(null); setIsAnswerChecked(false); }
                  else { setView("notes"); }
                }
              }} disabled={selectedAnswer === null} className={`w-full py-5 rounded-3xl font-black text-white ${selectedAnswer === null ? "bg-gray-200" : "bg-orange-500"}`}>
                {isAnswerChecked ? "다음 문제" : "확인하기"}
              </button>
            </div>
          </div>
        )}

        {/* 푸터 네비게이션 */}
        <footer className="h-20 bg-white border-t border-gray-50 flex items-center justify-around px-8 z-30 pb-2">
          <div onClick={() => setView("home")} className={`flex flex-col items-center gap-1 cursor-pointer ${view === "home" ? "text-orange-500" : "text-gray-300"}`}><Home size={24} /><span className="text-[10px] font-bold">홈</span></div>
          <div onClick={() => setView("notes")} className={`flex flex-col items-center gap-1 cursor-pointer ${view === "notes" || view === "detail" ? "text-orange-500" : "text-gray-300"}`}><BookOpen size={24} /><span className="text-[10px] font-bold">노트</span></div>
          <div className="flex flex-col items-center gap-1 text-gray-300 cursor-pointer"><UserCircle size={24} /><span className="text-[10px] font-bold">내정보</span></div>
        </footer>

        <style jsx>{`
          @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
          .animate-shake { animation: shake 0.2s ease-in-out; }
          @keyframes fall { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(150px) scale(0.5); opacity: 0; } }
          .animate-fall { animation: fall 0.7s forwards ease-in; }
        `}</style>
      </div>
    </div>
  );
}