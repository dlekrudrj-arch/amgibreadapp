"use client";

import React, { useState, useRef } from "react";
import { Home, BookOpen, User, Settings, Camera, Loader2, AlertCircle } from "lucide-react";
// 정석: 구글 최신 SDK에서 GoogleGenAI를 가져옵니다.
import { GoogleGenAI } from "@google/genai";

export default function Page() {
  const [tab, setTab] = useState("home");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Vercel 환경변수에 API 키가 없습니다.");

      // 정석: 클라이언트 초기화
      const client = new GoogleGenAI({ apiKey });
      const imageData = base64Image.split(",")[1];

      // 정석: 최신 generateContent 호출 방식
      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: "사진 속 공부 내용을 3줄 요약하고 암기용 퀴즈 2개를 한국어로 만들어줘." },
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

      // 에러 해결: 응답 텍스트를 안전하게 가져옵니다.
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

  return (
    <div className="flex justify-center bg-[#FFF9E6] min-h-screen text-black">
      <div className="relative w-full max-w-[430px] bg-white shadow-2xl min-h-screen flex flex-col overflow-hidden">
        
        <header className="px-6 py-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black text-[#5a3e1b]">암기빵</h1>
          </div>
          <Settings className="text-gray-400 cursor-pointer" />
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-24">
          {tab === "home" && (
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">무엇을 암기할까요?</h2>
                <p className="text-gray-400 text-sm">공부할 내용을 찍어주세요</p>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square bg-[#FFF9E6] border-4 border-dashed border-orange-200 rounded-[40px] flex items-center justify-center cursor-pointer overflow-hidden relative hover:bg-orange-50 transition-colors"
              >
                {image ? (
                  <img src={image} className={`w-full h-full object-cover ${loading ? "opacity-30" : ""}`} />
                ) : (
                  <div className="text-orange-400 flex flex-col items-center gap-2">
                    <Camera size={48} />
                    <p className="font-bold">사진 선택</p>
                  </div>
                )}

                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40">
                    <Loader2 className="animate-spin text-orange-500 mb-2" size={40} />
                    <p className="font-bold text-orange-600">AI 분석 중...</p>
                  </div>
                )}
              </div>

              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

              {errorMsg && (
                <div className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-2 text-red-600 text-sm">
                  <AlertCircle className="shrink-0" size={18} />
                  <p className="break-all">{errorMsg}</p>
                </div>
              )}

              {quiz && (
                <div className="w-full p-6 bg-orange-50 rounded-3xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
                  <h3 className="font-bold text-orange-800 mb-2 underline decoration-orange-200 decoration-4 underline-offset-4">🍞 따끈따끈한 결과</h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{quiz}</p>
                </div>
              )}
            </div>
          )}
        </main>

        <nav className="absolute bottom-0 w-full h-20 bg-white border-t flex justify-around items-center rounded-t-[32px] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <button onClick={() => setTab("home")} className={`flex flex-col items-center gap-1 ${tab === "home" ? "text-orange-500" : "text-gray-300"}`}>
            <Home size={24} /><span className="text-[10px] font-bold">홈</span>
          </button>
          <button onClick={() => setTab("notes")} className={`flex flex-col items-center gap-1 ${tab === "notes" ? "text-orange-500" : "text-gray-300"}`}>
            <BookOpen size={24} /><span className="text-[10px] font-bold">노트</span>
          </button>
          <button onClick={() => setTab("profile")} className={`flex flex-col items-center gap-1 ${tab === "profile" ? "text-orange-500" : "text-gray-300"}`}>
            <User size={24} /><span className="text-[10px] font-bold">내정보</span>
          </button>
        </nav>
      </div>
    </div>
  );
}