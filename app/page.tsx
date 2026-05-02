"use client";

import React, { useState, useRef } from 'react';
import { Home, BookOpen, User, Settings, Camera, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function AmgiBreadApp() {
  const [tab, setTab] = useState('home');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI에게 사진 분석 시키는 함수
  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = "이 사진은 공부 노트나 책이야. 사진 속의 핵심 내용을 파악해서 3줄 요약해주고, 암기하기 좋게 퀴즈를 2개만 만들어줘. 한국어로 친절하게 알려줘.";

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } },
      ]);

      setQuiz(result.response.text());
    } catch (error) {
      console.error("AI 에러:", error);
      alert("AI가 사진을 읽는데 실패했어요. API 키 설정을 확인해주세요!");
    }
    setLoading(false);
  };

  // 사진 업로드 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        analyzeImage(base64); // 사진 올라가자마자 AI 실행
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex justify-center bg-[#FFF9E6] min-h-screen">
      <div className="relative w-full max-w-[430px] bg-white shadow-2xl min-h-screen flex flex-col overflow-hidden">
        
        <header className="px-6 py-4 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black text-[#5a3e1b]">암기빵</h1>
          </div>
          <Settings className="text-gray-400 cursor-pointer" />
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-24">
          {tab === 'home' && (
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">무엇을 암기할까요?</h2>
                <p className="text-gray-400 text-sm">사진을 찍어 빵을 구워보세요</p>
              </div>
              
              {/* 사진 업로드 버튼 공간 */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square bg-[#FFF9E6] border-4 border-dashed border-orange-200 rounded-[40px] flex flex-col items-center justify-center cursor-pointer hover:bg-orange-100 transition-all overflow-hidden relative"
              >
                {image ? (
                  <img src={image} alt="uploaded" className="w-full h-full object-cover opacity-50" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-orange-400">
                    <Camera size={48} />
                    <p className="font-bold">사진 선택하기</p>
                  </div>
                )}
                
                {loading && (
                  <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-orange-500 mb-2" size={40} />
                    <p className="font-bold text-orange-600">AI가 빵 굽는 중...</p>
                  </div>
                )}
              </div>

              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

              {/* AI 결과창 */}
              {quiz && (
                <div className="w-full p-6 bg-orange-50 rounded-3xl border-2 border-orange-100 animate-in fade-in slide-in-from-top-4">
                  <h3 className="font-bold text-orange-800 mb-2">🍞 따끈따끈한 요약 & 퀴즈</h3>
                  <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {quiz}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        <nav className="absolute bottom-0 w-full h-20 bg-white border-t flex justify-around items-center rounded-t-[32px] shadow-lg">
          <button onClick={() => setTab('home')} className={`flex flex-col items-center ${tab === 'home' ? 'text-orange-500' : 'text-gray-300'}`}>
            <Home size={24} /><span className="text-[10px] font-bold">홈</span>
          </button>
          <button onClick={() => setTab('notes')} className={`flex flex-col items-center ${tab === 'notes' ? 'text-orange-500' : 'text-gray-300'}`}>
            <BookOpen size={24} /><span className="text-[10px] font-bold">노트</span>
          </button>
          <button onClick={() => setTab('profile')} className={`flex flex-col items-center ${tab === 'profile' ? 'text-orange-500' : 'text-gray-300'}`}>
            <User size={24} /><span className="text-[10px] font-bold">내정보</span>
          </button>
        </nav>
      </div>
    </div>
  );
}