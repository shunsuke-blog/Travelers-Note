"use client";

import React from 'react';

type Props = {
  resultStation: {
    line: string;
    name: string;
    prefecture: string;
    x: number;
    y: number;
    prev?: string;
    next?: string;
    estimatedTime?: number;
  };
  departureStation: string;
};

export default function ResultCard({ resultStation, departureStation }: Props) {

  const handleSave = () => {
    const visitDate = new Date().toLocaleDateString();
    const currentHistory = JSON.parse(localStorage.getItem("stationHistory") || "[]");

    const newEntry = {
      name: resultStation.name,
      line: resultStation.line,
      date: visitDate,
      prefecture: resultStation.prefecture,
      x: resultStation.x, // 座標も忘れず保存
      y: resultStation.y
    };

    const newHistory = [...currentHistory, newEntry];
    localStorage.setItem("stationHistory", JSON.stringify(newHistory));
    alert(`${resultStation.name} を ぼうけんのきろくに しるした！`);
  };

  return (
    <div className="pixel-box w-full animate-in zoom-in-95 duration-300">

      {/* 路線名：クエストのカテゴリー風 */}
      <p className="text-[10px] text-[#ffd700] font-bold mb-4 tracking-widest text-center">
        ▼ ROUTE: {resultStation.line}
      </p>

      {/* メイン表示エリア */}
      <div className="flex items-center justify-between w-full mb-6 py-4 border-y border-[#4a5568] bg-black/40">

        {/* 左側：前の駅 */}
        <div className="flex-1 flex justify-end items-center min-w-0 opacity-50">
          <div className={`text-[10px] text-white ${!resultStation.prev ? "invisible" : ""}`}>
            <div className="wrap-break-word whitespace-normal leading-tight max-w-20">
              {resultStation.prev}
            </div>
          </div>
          <div className={`text-[#4a5568] mx-1 ${!resultStation.prev ? "invisible" : ""}`}>◀</div>
        </div>

        {/* 中央：当選した駅 */}
        <div className="shrink-0 text-center px-4">
          <h2 className={`
            font-bold text-[#f8f9fa] leading-tight tracking-tight
            ${resultStation.name.length > 8 ? 'text-xl' : 'text-3xl'} 
          `}>
            {resultStation.name}
          </h2>
        </div>

        {/* 右側：次の駅 */}
        <div className="flex-1 flex justify-start items-center min-w-0 opacity-50">
          <div className={`text-[#4a5568] mx-1 ${!resultStation.next ? "invisible" : ""}`}>▶</div>
          <div className={`text-[10px] text-white ${!resultStation.next ? "invisible" : ""}`}>
            <div className="wrap-break-word leading-tight max-w-20 whitespace-normal">
              {resultStation.next}
            </div>
          </div>
        </div>
      </div>

      {/* ステータス情報 */}
      <div className="space-y-2 text-center">
        <p className="text-[10px] text-white font-bold">
          <span className="text-[#ffd700] mr-2">📍</span>
          {resultStation.prefecture}
        </p>

        {resultStation.estimatedTime && (
          <div className="text-[10px] text-[#00ff41] font-bold animate-pulse">
            ▶ {departureStation} から およそ {resultStation.estimatedTime}ふん
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {/* メインアクション：記録ボタン */}
        <button
          onClick={handleSave}
          className="pixel-button w-full py-3 text-xs flex items-center justify-center gap-2"
        >
          <span>🪶</span> この地を きろくする
        </button>

        {/* サブアクション：Google Maps */}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resultStation.name + "駅")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-slate-500 hover:text-[#ffd700] transition-colors text-center uppercase tracking-widest"
        >
          - Open World Map -
        </a>
      </div>
    </div>
  );
}