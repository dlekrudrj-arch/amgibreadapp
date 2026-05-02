"use client";

import React, { useState } from 'react';
import { Home, BookOpen, User, Settings, Camera, PenTool, Eraser, Trash2 } from 'lucide-react';

export default function AmgiBreadApp() {
  const [tab, setTab] = useState('home'); // 'home', 'notes', 'profile' 중 하나

  return (
    <div className="flex justify-center bg-[#FFF9E6] min-h-screen">
      {/* 스마트폰 화면 크기로 고정 */}
      <div className="relative w-full max-w-[430px] bg-white shadow-2xl min-h-screen flex flex-col overflow-hidden">
        
        {/* [1] 상단 바 */}
        <header className="px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-black text-[#5a3e1b]">암기빵</h1>
          </div>
          <Settings className="text-gray-400 cursor-pointer hover:rotate-90 transition-transform" />
        </header>

        {/* [2] 메인 콘텐츠 공간 */}
        <main className="flex-1 overflow-y-auto p-6 pb-24">
          {tab === 'home' ? (
            <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">무엇을 암기할까요?</h2>
                <p className="text-gray-400 text-sm italic">책이나 노트를 찍어보세요!</p>
              </div>
              
              {/* 빵이 들어갈 자리 (임시 박스) */}
              <div className="w-full aspect-[4/5] bg-[#FFF9E6] border-4 border-dashed border-orange-200 rounded-[40px] flex items-center justify-center relative group cursor-pointer hover:bg-orange-100 transition-all shadow-inner">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Camera className="text-orange-400" size={36} />
                  </div>
                  <p className="font-extrabold text-orange-400">사진 찍기 / 업로드</p>
                </div>
              </div>

              {/* 하단 버튼들 */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <button className="flex items-center justify-center gap-2 p-5 bg-orange-50 rounded-3xl font-bold text-orange-700 hover:bg-orange-100 transition-all border-b-4 border-orange-200">
                  <PenTool size={20} /> 직접 쓰기
                </button>
                <button className="flex items-center justify-center gap-2 p-5 bg-[#FFB800] rounded-3xl font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-500 transition-all border-b-4 border-orange-600">
                  🍴 먹기
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
               <p className="text-lg font-bold italic">준비 중인 페이지예요!</p>
            </div>
          )}
        </main>

        {/* [3] 하단 탭 메뉴 (가장 중요!) */}
        <nav className="absolute bottom-0 w-full h-20 bg-white border-t border-gray-100 flex justify-around items-center px-4 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-20">
          <TabButton icon={<Home />} label="홈" active={tab === 'home'} onClick={() => setTab('home')} />
          <TabButton icon={<BookOpen />} label="노트" active={tab === 'notes'} onClick={() => setTab('notes')} />
          <TabButton icon={<User />} label="내정보" active={tab === 'profile'} onClick={() => setTab('profile')} />
        </nav>

      </div>
    </div>
  );
}

// 탭 버튼 컴포넌트 (반복되는 코드를 줄여줘요)
function TabButton({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-orange-500 scale-110' : 'text-gray-300'}`}>
      {React.cloneElement(icon, { size: 24, strokeWidth: active ? 3 : 2 })}
      <span className="text-[10px] font-black">{label}</span>
    </button>
  );
}