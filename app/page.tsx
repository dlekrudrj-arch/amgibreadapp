"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
// 1. 가져오는 곳이 @google/genai로 바뀌었습니다!
import { createGoogleGenerativeAI } from "@google/genai";

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
      if (!key) throw new Error("API 키가 없습니다.");
      
      // 2. 최신 문서 방식의 초기화
      const ai = createGoogleGenerativeAI({ apiKey: key });

      // 3. 모델 이름도 최신 문서에 적힌 대로!
      const imageData = base64Image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash", // 문서 추천 모델
        contents: [
          {
            role: "user",
            parts: [
              { text: "이 사진 내용을 요약하고 퀴즈 2개 만들어줘." },
              { inlineData: { data: imageData, mimeType: "image/jpeg" } }
            ]
          }
        ]
      });

      setQuiz(response.text);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "에러 발생");
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
        <header className="flex justify-between items-center">
          <h1 className="text-xl font-black text-[#5a3e1b]">🍞 최신형 암기빵</h1>
          <div className="text-[10px] font-bold">
            {apiKeyStatus === 'ok' ? <span className="text-green-500">● 연결됨</span> : <span className="text-red-500">● 키 없음</span>}
          </div>
        </header>

        <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-square bg-orange-50 border-4 border-dashed border-orange-200 rounded-[40px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden">
          {image ? <img src={image} className="w-full h-full object-cover" /> : <Camera size={48} className="text-orange-300" />}
          {loading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40}/></div>}
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-mono break-all">
            {errorMsg}
          </div>
        )}

        {quiz && <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 text-sm whitespace-pre-wrap">{quiz}</div>}
      </div>
    </div>
  );
}
