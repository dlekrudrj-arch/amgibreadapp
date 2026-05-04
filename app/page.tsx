"use client";

import React, { useState, useRef } from "react";
import { Home, BookOpen, User, Settings, Camera, Loader2, AlertCircle, Utensils } from "lucide-react";
// 정석: 구글 최신 SDK에서 GoogleGenAI를 가져옵니다.
import { GoogleGenAI } from "@google/genai";

export default function Page() {
  const [tab, setTab] = useState("home");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isEaten, setIsEaten] = useState(false); // 빵을 먹었는지 상태 추가
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    setErrorMsg("");
    setQuiz("");
    setIsEaten(false);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Vercel 환경변수에 API 키가 없습니다.");

      const client = new GoogleGenAI({ apiKey });
      const imageData = base64Image.split(",")[1];

      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: "사진 속 공부 내용을 3줄 요약하고 암기용 퀴즈 2개를 한국어로 만들어줘. 정중하고 친절한 말투로 해줘." },
              {
                inlineData: {
                  data: imageData,
                  mimeType: "image/jpeg",
                },
              },
            ],
          },
        ],
      });

      if (response && response.text) {
        setQuiz(response.text);
      } else {
        throw new Error("AI로부터 응답을 받지 못했습니다.");
      }
      
    } catch (error: any) {
      console.error("분석 에러:", error);
      setErrorMsg(error.message || "에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImage(base64);
      analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleEatBread = () => {
    setIsEaten(true);
    alert("냠냠! 암기빵을 먹었습니다. 핵심 내용이 머릿속에 저장되었어요! 🧠✨");
  };

  return (
    <div className="flex justify-center bg-[#FFF9E6] min-h-screen text-black">
      <div className="relative w-full max-w-[430px] bg-white shadow-2xl min-h-screen flex flex-col overflow-hidden text-[#5a3e1b]">
        
        {/* 헤더 */}
        <header className="px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-orange-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black">암기빵</h1>
          </div>
          <Settings className="text-gray-400 cursor-pointer hover:rotate-90 transition-transform" />
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto p-6 pb-24 bg-[#FFFCF5]">
          {tab === "home" && (
            <div className="flex flex-col items-center gap-8">
              
              <div className="text-center">
                <h2 className="text-2xl font-bold">무엇을 암기할까요?</h2>
                <p className="text-gray-500 text-sm mt-1">책이나 노트를 찍어 빵을 구워보세요!</p>
              </div>

              {/* 업로드 영역 */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square bg-white border-4 border-dashed border-orange-200 rounded-[40px] flex items-center justify-center cursor-pointer overflow-hidden relative shadow-sm hover:border-orange-400 transition-colors"
              >
                {image ? (
                  <img src={image} className={`w-full h-full object-cover ${loading ? "opacity-30" : ""}`} />
                ) : (
                  <div className="text-orange-300 flex flex-col items-center gap-3">
                    <div className="p-5 bg-orange-50 rounded-full">
                      <Camera size={48} />
                    </div>
                    <p className="font-bold">사진 찍기 / 업로드</p>
                  </div>
                )}

                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60">
                    <Loader2 className="animate-spin text-orange-500 mb-3" size={48} />
                    <p className="font-black text-orange-600 animate-bounce">AI가 빵 굽는 중...</p>
                  </div>
                )}
              </div>

              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

              {errorMsg && (
                <div className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-2 text-red-600 text-sm">
                  <AlertCircle className="shrink-0" size={18} />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* AI 결과: 식빵 카드 UI */}
              {quiz && (
                <div className={`w-full mt-2 animate-in fade-in slide-in-from-top-4 duration-700 ${isEaten ? 'opacity-50 scale-95 transition-all' : ''}`}>
                  <div className="relative mx-auto w-full">
                    {/* 식빵 윗부분 */}
                    <div className="h-12 bg-[#fcd34d] rounded-t-[60px] border-t-4 border-x-4 border-[#d97706] mb-[-4px]"></div>
                    
                    {/* 식빵 몸통 */}
                    <div className="bg-[#FFF9E6] border-x-4 border-b-8 border-[#d97706] rounded-b-[40px] p-6 shadow-xl relative overflow-hidden">
                      {/* 식빵 안쪽 면 */}
                      <div className="bg-white/90 rounded-3xl p-6 min-h-[250px] shadow-inner border border-orange-100">
                        <h3 className="font-black text-lg mb-4 flex items-center gap-2 border-b border-orange-50 pb-2">
                          <span>✨</span> 따끈따끈한 결과
                        </h3>
                        <div className="text-[#5a3e1b] font-medium whitespace-pre-wrap text-sm leading-relaxed">
                          {quiz}
                        </div>
                      </div>
                      {isEaten && (
                        <div className="absolute top-0 right-0 p-4 bg-orange-100/80 rounded-bl-3xl font-black text-orange-600">
                          완료!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 먹기 버튼 */}
                  {!isEaten && (
                    <button 
                      onClick={handleEatBread}
                      className="w-full mt-8 py-5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xl rounded-[24px] shadow-lg shadow-orange-200 transform transition active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Utensils size={24} />
                      암기빵 먹기
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* 하단 네비게이션 */}
        <nav className="h-24 bg-white border-t border-orange-50 flex justify-around items-center px-6 pb-4">
          <button onClick={() => setTab("home")} className={`flex flex-col items-center gap-1 transition-colors ${tab === "home" ? "text-orange-500" : "text-gray-300"}`}>
            <Home size={28} strokeWidth={tab === "home" ? 3 : 2} />
            <span className="text-xs font-black">홈</span>
          </button>
          <button onClick={() => setTab("notes")} className={`flex flex-col items-center gap-1 transition-colors ${tab === "notes" ? "text-orange-500" : "text-gray-300"}`}>
            <BookOpen size={28} strokeWidth={tab === "notes" ? 3 : 2} />
            <span className="text-xs font-black">노트</span>
          </button>
          <button onClick={() => setTab("profile")} className={`flex flex-col items-center gap-1 transition-colors ${tab === "profile" ? "text-orange-500" : "text-gray-300"}`}>
            <User size={28} strokeWidth={tab === "profile" ? 3 : 2} />
            <span className="text-xs font-black">내정보</span>
          </button>
        </nav>
      </div>
    </div>
  );
}