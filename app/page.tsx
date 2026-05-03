"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Home, BookOpen, User, Settings, Camera, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function AmgiBreadApp() {
  const [tab, setTab] = useState('home');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<string>("");
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ok' | 'fail'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API 키가 잘 들어왔는지 체크
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
    try {
      const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!key) throw new Error("API 키가 없습니다.");
      
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = "이 사진 속 내용을 3줄 요약하고 관련 퀴즈 2개를 만들어줘.";
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } },
      ]);

      setQuiz(result.response.text());
    } catch (error) {
      console.error(error);
      alert("에러 발생! Vercel 설정에서 API 키를 다시 확인해주세요.");
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
    <div className="flex justify-center bg-[#FFF9E6] min-h-screen">
      <div className="relative w-full max-w-[430px] bg-white shadow-2xl min-h-screen flex flex-col overflow-hidden text-black">
        <header className="px-6 py-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black text-[#5a3e1b]">암기빵 테스트</h1>
          </div>
          {/* API 키 상태 표시등 */}
          <div className="flex items-center gap-1 text-xs font-bold">
            {apiKeyStatus === 'ok' ? (
              <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={14}/>연결됨</span>
            ) : (
              <span className="text-red-500 flex items-center gap-1"><AlertCircle size={14}/>키 없음</span>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 flex flex-col items-center gap-6 overflow-y-auto pb-24">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square bg-orange-50 border-4 border-dashed border-orange-200 rounded-[40px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
          >
            {image ? <img src={image} className="w-full h-full object-cover" /> : <Camera size={48} className="text-orange-300" />}
            {loading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40}/></div>}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          
          {quiz && (
            <div className="w-full p-5 bg-orange-50 rounded-2xl border border-orange-100 whitespace-pre-wrap text-sm">
              {quiz}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
