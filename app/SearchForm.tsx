"use client";

import React from 'react';

// お手本に基づいたRPGスタイル定義
const inputStyle = `
  w-full 
  bg-black 
  border-2 
  border-[#4a5568] 
  p-3 
  text-sm 
  text-[#f8f9fa] 
  outline-none 
  focus:border-[#ffd700] 
  focus:bg-[#1a202c] 
  transition-all 
  placeholder-[#4a5568]
  appearance-none
`;

const labelStyle = "block text-[#ffd700] text-[10px] font-bold mb-2 tracking-widest";

export default function SearchForm({
  departureStation,
  setDepartureStation,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  setCurrentCoords,
  maxTime,
  setMaxTime,
  selectedPref,
  setSelectedPref,
  displayPrefectures,
  lines,
  selectedLine,
  setSelectedLine,
  loading,
  handleGacha
}: any) {

  return (
    <div className="space-y-6">
      {/* 1. 出発駅入力 */}
      <div className="relative">
        <label className={labelStyle}>▼ しゅっぱつ地点 (ひっす)</label>
        <div className="relative flex items-center">
          <span className="absolute left-3 opacity-50 text-[#ffd700]">🔍</span>
          <input
            type="text"
            className={`${inputStyle} pl-10`}
            value={departureStation}
            onChange={(e) => {
              setDepartureStation(e.target.value);
              // 仮選択の解除などは呼び出し元に任せる
            }}
            placeholder="えき名を さがす..."
          />
        </div>

        {/* 候補リスト：お手本と同じ黒背景・白枠 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-black border-2 border-white max-h-40 overflow-y-auto">
            {suggestions.map((s: any, i: number) => (
              <button
                key={i}
                className="w-full text-left px-4 py-3 text-xs text-[#f8f9fa] hover:bg-[#2d3748] border-b border-[#4a5568] last:border-none"
                onClick={() => {
                  setDepartureStation(s.name);
                  setCurrentCoords({ lat: s.y, lon: s.x });
                  setShowSuggestions(false);
                }}
              >
                <span className="text-[#ffd700] font-bold">{s.name}</span>
                <span className="ml-2 text-[10px] opacity-60">{s.line}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. 条件設定：プルダウン */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelStyle}>▼ たびの はんい</label>
          <div className="relative">
            <select
              className={inputStyle}
              value={maxTime}
              onChange={(e) => setMaxTime(e.target.value)}
            >
              <option value="30">30ぷん以内</option>
              <option value="60">60ぷん以内</option>
              <option value="120">120ぷん以内</option>
              <option value="0">むせいげん</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs">▼</span>
          </div>
        </div>

        <div>
          <label className={labelStyle}>▼ とどうふけん</label>
          <div className="relative">
            <select
              className={inputStyle}
              value={selectedPref}
              onChange={(e) => setSelectedPref(e.target.value)}
            >
              <option value="全国">ぜんこく</option>
              {displayPrefectures.map((p: string) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs">▼</span>
          </div>
        </div>
      </div>

      {/* 3. 路線選択 */}
      {lines.length > 0 && (
        <div className="animate-in fade-in duration-300">
          <label className={labelStyle}>▼ つかう ろせん (任意)</label>
          <div className="relative">
            <select
              className={inputStyle}
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
            >
              <option value="すべて">すべての ろせん</option>
              {lines.map((l: string) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs">▼</span>
          </div>
        </div>
      )}

      {/* 4. 実行ボタン：履歴ページの「きろくを しるす」をベースに巨大化 */}
      <button
        onClick={handleGacha}
        disabled={loading}
        className={`w-full pixel-button py-5 text-sm tracking-[0.4em] mt-6 
          ${loading ? 'opacity-50' : 'animate-pulse'}`}
      >
        {loading ? "うらなっています..." : (departureStation ? "たびに出る" : "しゅっぱつ地点を いれる")}
      </button>
    </div>
  );
}