"use client";
import { useState, useRef, useEffect } from "react";
import { Home, BookOpen, UserCircle, RotateCcw, Image as ImageIcon, Type, Pencil, Check, RefreshCcw, Loader2, X } from "lucide-react";
import { GoogleGenAI } from "@google/genai";

// 1. 요청하신 최신 규격으로 AI 초기화
const ai = new GoogleGenAI({ apiKey: "AIzaSyCGp6siInTI6EC3epvhOAga8hgsJbqaQv0" });
const BREAD_IMG_URL = "https://i.postimg.cc/rmTBY3qQ/Qkd-(1).png";

export default function MemoryBreadApp() {
  const [image, setImage] = useState<string | null>(null);
  const [bite, setBite] = useState(0);
  const [mode, setMode] = useState<"none" | "typing" | "drawing" | "quiz">("none");
  const [tool, setTool] = useState<"pen" | "eraser" | null>("pen");
  
  const [textColor, setTextColor] = useState("#5a3e1b");
  const [drawingColor, setDrawingColor] = useState("#5a3e1b");
  const [brushSize, setBrushSize] = useState(6);
  
  const [shake, setShake] = useState(false);
  const [crumbs, setCrumbs] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 퀴즈 데이터 상태
  const [quizData, setQuizData] = useState<{question: string, options: string[], answer: string} | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const colorChips = ["#5a3e1b", "#000000", "#D9534F", "#F0AD4E", "#5CB85C", "#4A90E2"];

  // 캔버스 초기화
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

  // --- [AI 핵심 로직: 요청하신 형식을 엄수] ---
  async function runAI(base64Image: string) {
    setIsAiLoading(true);
    try {
      const base64Data = base64Image.split(",")[1];
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "image/png", data: base64Data } },
              { text: "이 이미지 내용을 3줄로 요약하고 퀴즈를 만들어줘. 반드시 JSON으로만 답해: { \"summary\": \"요약내용\", \"question\": \"질문\", \"options\": [\"보기1\",\"보기2\",\"보기3\",\"보기4\"], \"answer\": \"정답텍스트\" }" }
            ]
          }
        ],
      });

      const text = response.text;
      if (!text) throw new Error("No response text");
      const parsed = JSON.parse(text.replace(/```json|```/g, ""));
      
      setInputText(parsed.summary);
      setQuizData(parsed);
    } catch (error) {
      console.error("AI 분석 실패:", error);
    } finally {
      setIsAiLoading(false);
    }
  }

  // 기존 드로잉 및 먹기 로직 (생략 없이 유지)
  const handleFullReset = () => {
    setImage(null); setBite(0); setMode("none"); setHistory([]); setInputText("");
    setIsFinished(false); setQuizData(null); setSelectedOption(null); setIsCorrect(null);
    textCanvasRef.current?.getContext("2d")?.clearRect(0, 0, 400, 500);
    drawingCanvasRef.current?.getContext("2d")?.clearRect(0, 0, 400, 500);
  };

  useEffect(() => {
    const ctx = textCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 400, 500);
    if (!inputText) return;
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    const paragraphs = inputText.split("\n");
    let y = 140;
    paragraphs.forEach((para) => { ctx.fillText(para, 200, y); y += 28; });
  }, [inputText, textColor]);

  const saveHistory = () => { if (drawingCanvasRef.current) setHistory(prev => [...prev, drawingCanvasRef.current!.toDataURL()]); };
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
  const stopDraw = (e: React.PointerEvent) => { drawingRef.current = false; pointsRef.current = []; };
  
  const handleEat = () => {
    if (bite < 4) {
      setShake(true); setTimeout(() => setShake(false), 200);
      setBite(prev => prev + 1);
      const newCrumbs = Array.from({ length: 12 }).map((_, i) => ({ id: Date.now() + i, x: Math.random() * 300 + 50, size: Math.random() * 5 + 2 }));
      setCrumbs(prev => [...prev, ...newCrumbs]);
      setTimeout(() => setCrumbs(prev => prev.slice(12)), 700);
    }
  };

  // --- [UI 레이아웃 시작] ---
  if (mode === "quiz" && quizData) {
    return (
      <div className="flex justify-center bg-white min-h-screen font-sans">
        <div className="w-full max-w-[430px] flex flex-col p-6">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setMode("none")} className="text-gray-400"><X /></button>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#58CC02] w-full transition-all" />
            </div>
          </div>
          <h2 className="text-2xl font-black mb-8 text-[#4B4B4B]">정답을 맞춰보세요!</h2>
          <div className="flex items-start gap-4 mb-8">
            <div className="text-5xl">🍞</div>
            <div className="flex-1 p-4 border-2 border-gray-200 rounded-2xl relative shadow-sm font-bold text-[#4B4B4B]">
              {quizData.question}
              <div className="absolute left-[-9px] top-4 w-4 h-4 bg-white border-l-2 border-b-2 border-gray-200 rotate-45" />
            </div>
          </div>
          <div className="grid gap-3">
            {quizData.options.map((opt, i) => (
              <button key={i} onClick={() => { if(!selectedOption){setSelectedOption(opt); setIsCorrect(opt === quizData.answer);} }}
                className={`w-full p-5 rounded-2xl border-2 font-bold text-left transition-all shadow-[0_4px_0_#E5E5E5] active:shadow-none active:translate-y-1
                ${selectedOption === opt ? (isCorrect ? "border-[#58CC02] bg-[#D7FFB7] text-[#58CC02]" : "border-[#EA2B2B] bg-[#FFDFE0] text-[#EA2B2B]") : "border-gray-200 text-[#4B4B4B]"}
              `}>{opt}</button>
            ))}
          </div>
          {selectedOption && (
            <div className={`fixed bottom-0 left-0 right-0 p-6 flex flex-col items-center ${isCorrect ? "bg-[#D7FFB7]" : "bg-[#FFDFE0]"}`}>
              <h3 className={`text-xl font-black mb-4 ${isCorrect ? "text-[#58CC02]" : "text-[#EA2B2B]"}`}>{isCorrect ? "정답입니다!" : "틀렸어요!"}</h3>
              <button onClick={handleFullReset} className={`w-full max-w-[400px] py-4 rounded-2xl font-black text-white ${isCorrect ? "bg-[#58CC02]" : "bg-[#EA2B2B]"}`}>계속하기</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function handleUndo(event: React.MouseEvent<HTMLButtonElement>): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans overflow-hidden text-[#5a3e1b]">
      <div className="w-full max-w-[430px] bg-[#FEFBF2] min-h-screen flex flex-col shadow-2xl relative">
        <header className="px-6 py-4 flex justify-between items-center z-30">
          <div className="flex items-center gap-2 font-black text-xl text-orange-500"><span>🍞</span> AI 암기빵</div>
          <button onClick={handleFullReset} className="p-2 text-gray-400 hover:text-orange-500"><RefreshCcw size={22} /></button>
        </header>

        <main className="flex-1 px-4 flex flex-col items-center pt-2 relative">
          <div className={`relative w-full aspect-[4/5] transition-all duration-500 ${shake ? "animate-shake" : ""}`}>
            {isAiLoading && (
              <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-3xl">
                <Loader2 className="animate-spin text-orange-500 mb-2" size={40} />
                <p className="font-bold text-orange-600">AI 분석 중...</p>
              </div>
            )}
            <div className={`w-full h-full relative transition-all duration-500 ${bite === 4 ? "opacity-0 scale-95" : "opacity-100"}`} style={{ clipPath: ["none", "polygon(0% 100%, 100% 100%, 100% 30%, 85% 42%, 70% 35%, 55% 45%, 40% 35%, 0% 15%)", "polygon(0% 100%, 100% 100%, 100% 55%, 82% 65%, 68% 52%, 48% 68%, 28% 48%, 0% 45%)", "polygon(0% 100%, 100% 100%, 100% 85%, 75% 95%, 50% 80%, 25% 95%, 0% 80%)", "circle(0% at 50% 50%)"][bite] }}>
              <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-contain" />
              <div className="absolute inset-0">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 pointer-events-none" style={{ padding: '15% 10% 12% 10%' }}>
                    {image && <img src={image} className="w-full h-full object-contain mix-blend-multiply opacity-85" />}
                  </div>
                  <canvas ref={textCanvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
                  <canvas ref={drawingCanvasRef} className="absolute inset-0 w-full h-full z-20 touch-none pointer-events-auto" onPointerDown={startDraw} onPointerMove={draw} onPointerUp={stopDraw} />
                </div>
              </div>
            </div>
            {crumbs.map((c) => <div key={c.id} className="absolute bg-[#D97706] rounded-full animate-fall" style={{ width: c.size, height: c.size, left: c.x, top: "40%" }} />)}
          </div>

          {!isFinished && (
            <div className="w-full mt-6 flex flex-col gap-3 z-40">
              {mode === "typing" && (
                <div className="bg-white p-4 rounded-[28px] shadow-xl border flex flex-col gap-3 animate-in fade-in zoom-in duration-200">
                  <textarea value={inputText} onChange={(e)=>setInputText(e.target.value)} placeholder="암기 내용을 적어보세요..." className="w-full h-24 p-2 outline-none resize-none text-sm font-medium" autoFocus />
                  <div className="flex justify-between items-center border-t pt-3">
                    <div className="flex gap-1.5">{colorChips.map(c => <button key={c} onClick={() => setTextColor(c)} className={`w-6 h-6 rounded-full ${textColor === c ? 'ring-2 ring-orange-400 scale-110' : ''}`} style={{background: c}} />)}</div>
                    <button onClick={()=>setMode("none")} className="p-2 bg-orange-500 text-white rounded-xl"><Check size={18}/></button>
                  </div>
                </div>
              )}

              {mode === "drawing" && (
                <div className="bg-white p-4 rounded-[28px] shadow-xl border flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTool("pen")} className={`flex-1 py-2 rounded-xl font-bold text-sm ${tool === "pen" ? "bg-orange-500 text-white" : "bg-gray-100"}`}>펜</button>
                    <button onClick={() => setTool("eraser")} className={`flex-1 py-2 rounded-xl font-bold text-sm ${tool === "eraser" ? "bg-orange-500 text-white" : "bg-gray-100"}`}>지우개</button>
                    <button onClick={handleUndo} className="p-2 bg-gray-50 rounded-xl"><RotateCcw size={18}/></button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1.5">{colorChips.map(c => <button key={c} onClick={() => setDrawingColor(c)} className={`w-6 h-6 rounded-full ${drawingColor === c ? 'ring-2 ring-orange-300 scale-110' : ''}`} style={{background: c}} />)}</div>
                    <button onClick={() => setMode("none")} className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-lg font-bold text-xs">확인</button>
                  </div>
                </div>
              )}

              {mode === "none" && (
                <div className="flex flex-col gap-3">
                  <button onClick={() => fileRef.current?.click()} className="w-full py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold text-gray-600 shadow-sm active:bg-orange-50 transition-all"><ImageIcon className="text-orange-500" size={20} /> AI 스캔 (분석 & 요약)</button>
                  <input ref={fileRef} type="file" hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => runAI(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }} />
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={()=>setMode("typing")} className="py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold text-gray-600 shadow-sm active:bg-orange-50"><Type size={18} className="text-orange-500" /> 직접 쓰기</button>
                    <button onClick={()=>setMode("drawing")} className="py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold text-gray-600 shadow-sm active:bg-orange-50"><Pencil size={18} className="text-orange-500" /> 그리기</button>
                  </div>
                  <button onClick={() => setIsFinished(true)} className="w-full py-4 bg-[#FF8A3D] text-white rounded-[24px] font-black text-lg shadow-[0_5px_0_#D97706] active:translate-y-1 active:shadow-none">완성 ✨</button>
                </div>
              )}
            </div>
          )}

          {isFinished && bite < 4 && (
            <div className="w-full mt-8 flex flex-col gap-4">
              {quizData && (
                <button onClick={() => setMode("quiz")} className="w-full py-5 bg-[#58CC02] text-white rounded-[36px] font-black text-2xl shadow-[0_8px_0_#46A302] active:translate-y-1 active:shadow-none animate-bounce">퀴즈 풀기 ⚡</button>
              )}
              <button onClick={handleEat} className="w-full py-6 bg-[#FF8A3D] text-white rounded-[36px] font-black text-2xl shadow-[0_8px_0_#D97706] active:translate-y-1 active:shadow-none">한 입 먹기 🍴</button>
              <button onClick={() => setIsFinished(false)} className="text-orange-400 font-bold underline text-sm text-center">수정하기</button>
            </div>
          )}
        </main>

        <footer className="h-20 bg-white border-t flex items-center justify-around px-8 z-30 pb-2">
          <div className="flex flex-col items-center gap-1 text-orange-500"><Home size={24} /><span className="text-[10px] font-bold">홈</span></div>
          <div className="flex flex-col items-center gap-1 text-gray-300"><BookOpen size={24} /><span className="text-[10px] font-bold">노트</span></div>
          <div className="flex flex-col items-center gap-1 text-gray-300"><UserCircle size={24} /><span className="text-[10px] font-bold">내정보</span></div>
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