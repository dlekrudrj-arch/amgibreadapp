"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function AmgiBreadApp() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>(""); // 구체적 에러 메시지 저장용
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ok' | 'fail'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    setApiKeyStatus(key && key.length > 10 ? 'ok' : 'fail');
  }, []);

  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    setErrorMsg(""); 
    try {
      const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!key) throw new Error("Vercel 설정에 API 키가 입력되지 않았습니다.");
      
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

      const prompt = "이 사진 내용을 요약하고 퀴즈 2개 만들어줘.";
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } },
      ]);

      setQuiz(result.response.text());
    } catch (error: any) {
      console.error(error);
      // 에러의 진짜 원인을 화면에 표시
      setErrorMsg(error.message || "알 수 없는 에러가 발생했습니다.");
    }
    setLoading(false);
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
          <h1 className="text-xl font-black text-[#5a3e1b]">🍞 암기빵 디버깅 모드</h1>
          <div className="text-xs font-bold">
            {apiKeyStatus === 'ok' ? <span className="text-green-500">● 키 연결됨</span> : <span className="text-red-500">● 키 미연결</span>}
          </div>
        </header>

        <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-square bg-orange-50 border-4 border-dashed border-orange-200 rounded-[40px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden">
          {image ? <img src={image} className="w-full h-full object-cover" alt="preview" /> : <Camera size={48} className="text-orange-300" />}
          {loading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40}/></div>}
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

        {/* 에러가 나면 여기에 진짜 이유가 뜹니다 */}
        {errorMsg && (
          <div className="w-full p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-mono break-all">
            <p className="font-bold mb-1">❌ 에러 원인:</p>
            {errorMsg}
          </div>
        )}

        {quiz && <div className="w-full p-5 bg-orange-50 rounded-2xl border border-orange-100 text-sm whitespace-pre-wrap">{quiz}</div>}
      </div>
    </div>
  );
}