"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function AmgiBreadApp() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>(""); 
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ok' | 'fail'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. API 키 연결 상태 확인
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (key && key.length > 10) {
      setApiKeyStatus('ok');
    } else {
      setApiKeyStatus('fail');
    }
  }, []);

  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    setErrorMsg(""); 
    setQuiz(""); // 새 사진 올릴 때 이전 퀴즈 초기화

    try {
      const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!key) throw new Error("Vercel 설정에서 API 키를 찾을 수 없습니다.");
      
      // 2. AI 모델 설정 (가장 에러 없는 gemini-1.5-flash 사용)
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = "이 사진 속의 학습 내용을 3줄로 요약하고, 내용을 잘 이해했는지 확인하는 퀴즈를 2개 만들어줘.";
      
      // 3. 이미지 데이터 처리 (base64 문자열에서 순수 데이터만 추출)
      const imageData = base64Image.split(',')[1];
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData,
            mimeType: "image/jpeg"
          }
        },
      ]);

      const response = await result.response;
      setQuiz(response.text());
    } catch (error: any) {
      console.error("AI 분석 에러:", error);
      // 에러 메시지가 너무 길면 핵심만 표시
      const message = error.message || "알 수 없는 에러가 발생했습니다.";
      setErrorMsg(message.includes("404") ? "모델을 찾을 수 없습니다 (404). API 설정을 확인해주세요." : message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex justify-center bg-[#FFF9E6] min-h-screen text-black font-sans">
      <div className="w-full max-w-[430px] bg-white shadow-2xl min-h-screen flex flex-col p-6 gap-6">
        <header className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black text-[#5a3e1b]">암기빵</h1>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-slate-50">
            {apiKeyStatus === 'ok' ? (
              <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={12}/> AI 연결됨</span>
            ) : (
              <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12}/> API 키 확인 필요</span>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col gap-6">
          <div 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full aspect-[4/3] bg-orange-50 border-4 border-dashed border-orange-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all hover:bg-orange-100"
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover" alt="preview" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Camera size={48} className="text-orange-300" />
                <p className="text-orange-400 font-bold text-sm">공부한 내용을 찍어주세요</p>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-orange-500" size={40}/>
                <p className="text-orange-600 font-bold animate-pulse">AI가 빵 굽는 중...</p>
              </div>
            )}
          </div>
          
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

          {errorMsg && (
            <div className="w-full p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
              <p className="font-bold mb-1 flex items-center gap-1"><AlertCircle size={14}/> 에러가 발생했어요</p>
              <p className="font-mono text-[11px] break-all opacity-80">{errorMsg}</p>
            </div>
          )}

          {quiz && (
            <div className="w-full p-6 bg-[#FFF9E6] rounded-3xl border-2 border-orange-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-[#5a3e1b] font-black mb-4 flex items-center gap-2">✨ AI 암기 퀴즈</h2>
              <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                {quiz}
              </div>
            </div>
          )}
        </main>

        <footer className="text-center text-gray-400 text-[10px] pb-4">
          © 2026 암기빵 - AI 학습 도우미
        </footer>
      </div>
    </div>
  );
}