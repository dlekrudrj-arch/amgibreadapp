"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AmgiBreadApp() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>(""); 
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ok' | 'fail'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    setApiKeyStatus(key && key.length > 10 ? 'ok' : 'fail');
  }, []);

  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    setErrorMsg(""); 
    setQuiz("");

    try {
      const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!key) throw new Error("API 키가 없습니다. Vercel 설정을 확인해주세요.");
      
      // 라이브러리 설치 없이 구글 서버에 직접 말을 거는 주소입니다.
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
      
      const imageData = base64Image.split(',')[1];

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "이 사진의 내용을 공부하기 쉽게 요약하고 관련 퀴즈 2개를 만들어줘." },
              { inlineData: { mimeType: "image/jpeg", data: imageData } }
            ]
          }]
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "AI 응답 에러");
      }

      // 결과 텍스트 추출
      const resultText = data.candidates[0].content.parts[0].text;
      setQuiz(resultText);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "연결 실패");
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
    <div className="flex justify-center bg-[#FFF9E6] min-h-screen text-black">
      <div className="w-full max-w-[430px] bg-white shadow-2xl min-h-screen flex flex-col p-6 gap-6">
        <header className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black text-[#5a3e1b]">가벼운 암기빵</h1>
          </div>
          <div className="text-[10px] font-bold">
            {apiKeyStatus === 'ok' ? (
              <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={12}/> AI 연결됨</span>
            ) : (
              <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12}/> 키 없음</span>
            )}
          </div>
        </header>

        <div 
          onClick={() => fileInputRef.current?.click()} 
          className="w-full aspect-square bg-orange-50 border-4 border-dashed border-orange-200 rounded-[40px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all hover:bg-orange-100"
        >
          {image ? (
            <img src={image} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Camera size={48} className="text-orange-300" />
              <p className="text-orange-400 font-bold text-sm">터치해서 사진 넣기</p>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Loader2 className="animate-spin text-orange-500" size={40}/>
            </div>
          )}
        </div>
        
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-[11px] font-mono break-all leading-tight">
            <p className="font-bold mb-1">❌ 안내:</p>
            {errorMsg}
          </div>
        )}

        {quiz && (
          <div className="p-5 bg-orange-50 rounded-3xl border border-orange-100 text-sm whitespace-pre-wrap leading-relaxed animate-in fade-in">
            {quiz}
          </div>
        )}
      </div>
    </div>
  );
}