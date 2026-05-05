"use client";
import { useState, useRef, useEffect } from "react";
import { Home, BookOpen, UserCircle, RotateCcw, Image as ImageIcon, Type, Pencil, Check, RefreshCcw, Search, Loader2, Sparkles } from "lucide-react";

const BREAD_IMG_URL = "https://i.postimg.cc/rmTBY3qQ/Qkd-(1).png";

export default function MemoryBreadApp() {
  // --- [기본 상태 변수] ---
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

  // --- [AI 및 노트 관련 추가 상태] ---
  const [notes, setNotes] = useState<any[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"normal" | "masking" | "quiz-setup" | "quiz-loading" | "quiz">("normal");
  const [quizCount, setQuizCount] = useState(5);

  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const colorChips = ["#5a3e1b", "#000000", "#D9534F", "#F0AD4E", "#5CB85C", "#4A90E2"];

  // --- [캔버스 초기화 및 텍스트 렌더링] ---
  useEffect(() => {
    [textCanvasRef, drawingCanvasRef].forEach(ref => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = 800; canvas.height = 1000;
      ctx.scale(2, 2); ctx.lineCap = "round"; ctx.lineJoin = "round";
    });
  }, []);

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
    paragraphs.forEach((para) => { ctx.fillText(para, 200, y); y += 30; });
  }, [inputText, textColor]);

  // --- [AI 지능형 분석 로직] ---
  const runAIAnalysis = (rawText: string) => {
    // 1. 10종 과목 분류
    const subjectRules = [
      { name: "국어", keywords: ["문학", "비문학", "작법", "시", "소설", "언어", "문법"] },
      { name: "심리", keywords: ["마음", "프로이트", "행동", "인지", "상담", "심리", "자아"] },
      { name: "과학", keywords: ["물리", "생물", "화학", "지구", "에너지", "원소", "분자"] },
      { name: "지리", keywords: ["지형", "기후", "지도", "도시", "지역", "영토", "위도"] },
      { name: "국사", keywords: ["조선", "고려", "왕", "혁명", "유물", "근현대", "독립"] },
      { name: "수학", keywords: ["함수", "미분", "통계", "계산", "도형", "방정식", "기하"] },
      { name: "영어", keywords: ["the", "grammar", "voca", "english", "word", "sentence"] },
      { name: "과탐실", keywords: ["실험", "탐구", "가설", "검증", "보고서", "관찰", "변인"] },
      { name: "사회", keywords: ["정치", "경제", "법", "문화", "사회학", "현상", "제도"] },
      { name: "음악", keywords: ["악기", "작곡", "음계", "베토벤", "클래식", "노래", "화성"] }
    ];

    let detectedSubject = "기타";
    for (const rule of subjectRules) {
      if (rule.keywords.some(k => rawText.includes(k))) {
        detectedSubject = rule.name;
        break;
      }
    }

    // 2. AI 제목 생성
    const cleanLines = rawText.split("\n").filter(l => l.trim().length > 0);
    const generatedTitle = cleanLines.length > 0 ? `${cleanLines[0].substring(0, 10)}...` : "새로운 암기빵";

    // 3. AI 체계적 요약 정리 (불렛포인트 구조화)
    const structuredSummary = `[${detectedSubject} 핵심 요약]\n\n• 주제: ${cleanLines[0] || '분석된 주제'}\n• 세부내용: ${cleanLines.slice(1).join(' ') || '핵심 내용 분석 완료'}\n• 학습포인트: 이 내용은 ${detectedSubject} 과목의 기초 필수 개념입니다.`;

    // 4. 지능형 마스킹 (중요 단어 선별)
    const allWords = rawText.split(/\s+/).filter(w => w.length >= 2);
    const maskingWords = allWords.sort(() => 0.5 - Math.random()).slice(0, 4);

    return { subject: detectedSubject, title: generatedTitle, summary: structuredSummary, masks: maskingWords };
  };

  // --- [액션 핸들러] ---
  const handleFullReset = () => {
    setImage(null); setBite(0); setMode("none"); setHistory([]); setInputText(""); setIsFinished(false);
    textCanvasRef.current?.getContext("2d")?.clearRect(0, 0, 400, 500);
    drawingCanvasRef.current?.getContext("2d")?.clearRect(0, 0, 400, 500);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onFinishBread = () => {
    const noteId = Date.now().toString();
    setIsFinished(true);

    const placeholderNote = {
      id: noteId,
      title: "AI 분석 중...",
      subject: "분석 중",
      text: inputText,
      isAnalyzing: true,
      createdAt: new Date().toLocaleDateString(),
    };
    setNotes(prev => [placeholderNote, ...prev]);

    setTimeout(() => {
      const result = runAIAnalysis(inputText);
      setNotes(prev => prev.map(n => n.id === noteId ? {
        ...n,
        title: result.title,
        subject: result.subject,
        aiSummary: result.summary,
        maskingKeywords: result.masks,
        isAnalyzing: false
      } : n));
    }, 2500);
  };

  const handleReEat = (note: any) => {
    setImage(note.image);
    setInputText(note.text);
    setBite(0);
    setIsFinished(true);
    setSelectedNote(null);
    setShowNotes(false);
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

  // 드로잉 로직 (기본 코드 유지)
  const getPos = (e: React.PointerEvent) => {
    const rect = drawingCanvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (400 / rect.width), y: (e.clientY - rect.top) * (500 / rect.height) };
  };

  const startDraw = (e: React.PointerEvent) => {
    if (mode !== "drawing" || isFinished) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    if (drawingCanvasRef.current) setHistory(prev => [...prev, drawingCanvasRef.current!.toDataURL()]);
    drawingRef.current = true;
    pointsRef.current = [getPos(e)];
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
      ctx.beginPath(); ctx.moveTo((pts[i-1].x + pts[i].x)/2, (pts[i-1].y + pts[i].y)/2);
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midPoint.x, midPoint.y); ctx.stroke();
    }
  };

  const stopDraw = (e: React.PointerEvent) => {
    drawingRef.current = false;
    pointsRef.current = [];
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch (err) {}
  };

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans overflow-hidden text-[#5a3e1b]">
      <div className="w-full max-w-[430px] bg-[#FEFBF2] min-h-screen flex flex-col shadow-2xl relative">
        <header className="px-6 py-4 flex justify-between items-center z-30">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setShowNotes(false); setSelectedNote(null);}}>
            <span className="text-2xl">🍞</span><h1 className="text-xl font-black">암기빵</h1>
          </div>
          <button onClick={handleFullReset} className="p-2 text-gray-400"><RefreshCcw size={22} /></button>
        </header>

        <main className="flex-1 px-4 flex flex-col items-center pt-2 relative">
          <div className={`relative w-full aspect-[4/5] transition-all duration-500 ${shake ? "animate-shake" : ""}`}>
            {bite === 4 && (
              <div className="absolute inset-0 flex items-end justify-center z-50 pb-20">
                <button onClick={handleFullReset} className="py-5 px-12 bg-[#FF8A3D] text-white rounded-[32px] font-black text-xl shadow-[0_8px_0_#D97706] active:translate-y-1">빵 다시 굽기 🍞</button>
              </div>
            )}
            <div className={`w-full h-full relative transition-all duration-500 ${bite === 4 ? "opacity-0 scale-95" : "opacity-100"}`} 
                 style={{ clipPath: ["none", "polygon(0% 100%, 100% 100%, 100% 30%, 0% 15%)", "polygon(0% 100%, 100% 100%, 100% 55%, 0% 45%)", "polygon(0% 100%, 100% 100%, 100% 85%, 0% 80%)", "circle(0% at 50% 50%)"][bite] }}>
              <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-contain" />
              <div className="absolute inset-0 p-[15%_10%_12%_10%]">
                {image && <img src={image} className="w-full h-full object-contain mix-blend-multiply opacity-85" />}
                <canvas ref={textCanvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
                <canvas ref={drawingCanvasRef} className="absolute inset-0 w-full h-full z-20 touch-none pointer-events-auto" 
                        onPointerDown={startDraw} onPointerMove={draw} onPointerUp={stopDraw} onPointerLeave={stopDraw} />
              </div>
            </div>
            {crumbs.map((c) => <div key={c.id} className="absolute bg-[#D97706] rounded-full animate-fall" style={{ width: c.size, height: c.size, left: c.x, top: "40%" }} />)}
          </div>

          {!isFinished ? (
            <div className="w-full mt-6 flex flex-col gap-3 z-40">
              {mode === "typing" ? (
                <div className="bg-white p-4 rounded-[28px] shadow-xl border border-orange-50">
                  <textarea value={inputText} onChange={(e)=>setInputText(e.target.value)} placeholder="암기 내용을 적어보세요..." className="w-full h-24 p-2 outline-none resize-none text-sm font-medium" />
                  <div className="flex justify-between items-center border-t pt-3">
                    <div className="flex gap-1.5">{colorChips.map(c => <button key={c} onClick={() => {setTextColor(c); setIsTextPickerUsed(false);}} className="w-6 h-6 rounded-full" style={{background: c}} />)}</div>
                    <button onClick={()=>setMode("none")} className="p-2 bg-orange-500 text-white rounded-xl"><Check size={18}/></button>
                  </div>
                </div>
              ) : mode === "drawing" ? (
                <div className="bg-white p-4 rounded-[28px] shadow-xl border border-orange-50 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTool("pen")} className={`flex-1 py-2 rounded-xl font-bold ${tool === 'pen' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100'}`}>펜</button>
                    <button onClick={() => setTool("eraser")} className={`flex-1 py-2 rounded-xl font-bold ${tool === 'eraser' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100'}`}>지우개</button>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <div className="flex gap-1.5">{colorChips.map(c => <button key={c} onClick={() => setDrawingColor(c)} className="w-6 h-6 rounded-full" style={{background: c}} />)}</div>
                    <button onClick={() => setMode("none")} className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-lg font-bold">확인</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button onClick={() => fileRef.current?.click()} className="w-full py-4 bg-white border-2 border-orange-100 rounded-[20px] flex items-center justify-center gap-2 font-bold shadow-sm"><ImageIcon className="text-orange-500" /> 스캔 (AI 이미지 분석)</button>
                  <input ref={fileRef} type="file" hidden accept="image/*" onChange={(e) => {
                     const file = e.target.files?.[0]; if (!file) return;
                     const img = new Image(); const reader = new FileReader();
                     reader.onload = (ev) => { img.src = ev.target?.result as string; };
                     img.onload = () => {
                       const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d");
                       if (!ctx) return; canvas.width = 400; canvas.height = 500;
                       ctx.filter = "contrast(1.6) grayscale(1)"; ctx.drawImage(img, 0, 0, 400, 500);
                       setImage(canvas.toDataURL());
                     };
                     reader.readAsDataURL(file);
                  }} />
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={()=>setMode("typing")} className="py-4 bg-white border-2 border-orange-100 rounded-[20px] font-bold">직접 쓰기</button>
                    <button onClick={()=>setMode("drawing")} className="py-4 bg-white border-2 border-orange-100 rounded-[20px] font-bold">그리기</button>
                  </div>
                  <button onClick={onFinishBread} className="w-full py-4 bg-[#FF8A3D] text-white rounded-[24px] font-black text-lg shadow-[0_5px_0_#D97706] active:translate-y-1">굽기 완성 (AI 분석)</button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full mt-8 flex flex-col gap-4">
              <button onClick={handleEat} className="w-full py-6 bg-[#FF8A3D] text-white rounded-[36px] font-black text-2xl shadow-[0_8px_0_#D97706] active:translate-y-1 transition-all">한 입 먹기 🍴</button>
              <button onClick={() => setIsFinished(false)} className="text-orange-400 font-bold underline text-center">수정하기</button>
            </div>
          )}
        </main>

        <footer className="h-20 bg-white border-t border-gray-50 flex items-center justify-around px-8 z-30 pb-2">
          <div className="flex flex-col items-center gap-1 text-orange-500 cursor-pointer" onClick={() => {setShowNotes(false); setSelectedNote(null);}}><Home size={24} /><span className="text-[10px] font-bold">홈</span></div>
          <div className="flex flex-col items-center gap-1 text-gray-300 cursor-pointer" onClick={() => setShowNotes(true)}><BookOpen size={24} /><span className="text-[10px] font-bold">노트</span></div>
          <div className="flex flex-col items-center gap-1 text-gray-300 cursor-pointer"><UserCircle size={24} /><span className="text-[10px] font-bold">내정보</span></div>
        </footer>

        {/* --- [노트 보관함 오버레이] --- */}
        {showNotes && (
          <div className="absolute inset-0 bg-[#FEFBF2] z-[100] flex flex-col animate-in fade-in">
            <header className="px-6 py-4 flex justify-between items-center border-b bg-white">
              <button onClick={() => setShowNotes(false)} className="p-2 text-gray-400 text-xl">✕</button>
              <h2 className="text-lg font-bold">AI 학습 보관함</h2>
              <div className="w-10"></div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {notes.map(note => (
                <div key={note.id} onClick={() => {setSelectedNote(note); setViewMode("normal");}} className="bg-white p-4 rounded-[24px] shadow-sm border border-orange-50 flex items-center gap-4 cursor-pointer active:scale-95 transition-all">
                  <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-xl">🍞</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${note.isAnalyzing ? 'bg-orange-100 text-orange-500 animate-pulse' : 'bg-orange-100 text-[#5a3e1b]'}`}>{note.isAnalyzing ? "AI 분석 중" : note.subject}</span>
                    </div>
                    <h3 className="font-bold text-gray-700 truncate">{note.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- [AI 학습 상세 및 퀴즈 상세] --- */}
        {selectedNote && (
          <div className="absolute inset-0 bg-[#FEFBF2] z-[110] flex flex-col animate-in slide-in-from-bottom">
            <header className="px-6 py-4 flex justify-between items-center bg-white border-b">
              <button onClick={() => setSelectedNote(null)} className="p-2 text-gray-400 text-xl">✕</button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-orange-500 flex items-center gap-1"><Sparkles size={10}/> AI 정리 모드</span>
                <h2 className="text-lg font-black">{selectedNote.title}</h2>
              </div>
              <div className="w-10"></div>
            </header>
            
            <div className="flex-1 flex flex-col items-center p-6 overflow-y-auto">
              {viewMode === "quiz-setup" ? (
                <div className="w-full flex flex-col gap-4 items-center justify-center py-10">
                  <h3 className="text-xl font-black mb-4">몇 개의 문제를 풀까요?</h3>
                  {[5, 10, 15].map(num => (
                    <button key={num} onClick={() => {setQuizCount(num); setViewMode("quiz-loading"); setTimeout(()=>setViewMode("quiz"), 2000);}} className="w-full py-4 bg-white border-2 border-orange-100 rounded-2xl font-bold text-lg hover:bg-orange-50">{num} 문제</button>
                  ))}
                </div>
              ) : viewMode === "quiz-loading" ? (
                <div className="w-full flex flex-col gap-4 items-center justify-center py-20 text-center">
                  <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                  <p className="font-bold text-lg">AI가 노트를 학습하여<br/>퀴즈를 생성하고 있습니다...</p>
                </div>
              ) : viewMode === "quiz" ? (
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="w-full bg-white p-6 rounded-3xl shadow-md border border-orange-100">
                    <span className="text-orange-500 font-bold">Quiz 01 / {quizCount}</span>
                    <p className="text-lg font-bold mt-2">다음 중 '{selectedNote.subject}' 학습 내용과 관련된 핵심 키워드는?</p>
                  </div>
                  {selectedNote.maskingKeywords.map((ans: string) => (
                    <button key={ans} onClick={() => alert('정답입니다! 암기 완료!')} className="w-full py-4 bg-white border rounded-2xl font-medium shadow-sm active:bg-green-50">{ans}</button>
                  ))}
                  <button onClick={() => setViewMode("normal")} className="mt-4 text-gray-400 underline">돌아가기</button>
                </div>
              ) : (
                <>
                  <div className="relative w-full aspect-[4/5] mb-8 drop-shadow-xl">
                    <img src={BREAD_IMG_URL} className="absolute inset-0 w-full h-full object-contain" />
                    <div className="absolute inset-0 p-12 flex flex-col items-center justify-center text-center">
                      {viewMode === "masking" ? (
                        <div className="text-sm leading-relaxed font-bold">
                          {selectedNote.aiSummary.split(/(\s+)/).map((word: string, i: number) => (
                            selectedNote.maskingKeywords?.some((k: string) => word.includes(k)) ? 
                            <span key={i} className="bg-orange-400 text-transparent rounded px-1 mx-0.5 cursor-pointer inline-block" onClick={(e) => e.currentTarget.classList.toggle('text-transparent')}> {word} </span> 
                            : <span key={i}>{word}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#5a3e1b] font-bold text-sm whitespace-pre-wrap leading-relaxed">{selectedNote.aiSummary}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-4">
                    <button onClick={() => handleReEat(selectedNote)} className="py-4 bg-white border border-orange-200 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 shadow-sm"><RotateCcw size={16}/>다시먹기</button>
                    <button onClick={() => setViewMode(viewMode === "masking" ? "normal" : "masking")} className={`py-4 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 shadow-sm ${viewMode === 'masking' ? 'bg-orange-500 text-white' : 'bg-white border'}`}><Check size={16}/>가리기모드</button>
                    <button onClick={() => setViewMode("quiz-setup")} className="py-4 bg-white border border-orange-200 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 shadow-sm"><Sparkles size={16}/>퀴즈모드</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
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