"use client";

import React from 'react';
import { Station, Coordinates } from '@/types';

// スタイル定義をコンポーネント外に配置（再レンダリング時の計算コスト抑制）
const inputStyle = `
  w-full bg-black border-2 border-[#4a5568] p-3 text-sm text-[#f8f9fa] 
  outline-none focus:border-[#ffd700] focus:bg-[#1a202c] transition-all 
  placeholder-[#4a5568] appearance-none
`;

const labelStyle = "block text-[#ffd700] text-[10px] font-bold mb-2 tracking-widest";

interface SearchFormProps {
  departureStation: string;
  setDepartureStation: (val: string) => void;
  suggestions: Station[];
  showSuggestions: boolean;
  setShowSuggestions: (val: boolean) => void;
  setCurrentCoords: (coords: Coordinates | null) => void;
  setResultStation: (station: Station | null) => void;
  maxTime: string;
  setMaxTime: (val: string) => void;
  selectedPref: string;
  setSelectedPref: (val: string) => void;
  displayPrefectures: string[];
  lines: string[];
  selectedLine: string;
  setSelectedLine: (val: string) => void;
  loading: boolean;
  handleGacha: () => void;
}

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
}: SearchFormProps) {

  return (
    <div className="space-y-6">
      {/* 1. 出発駅入力 */}
      <div className="relative">
        <label htmlFor="departure" className={labelStyle}>▼ しゅっぱつ地点 (ひっす)</label>
        <div className="relative flex items-center">
          <span className="absolute left-3 opacity-50 text-[#ffd700]">🔍</span>
          <input
            id="departure"
            type="text"
            className={`${inputStyle} pl-10`}
            value={departureStation}
            onChange={(e) => setDepartureStation(e.target.value)}
            placeholder="えき名を さがす..."
            autoComplete="off"
          />
        </div>

        {/* 候補リスト */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-black border-2 border-white max-h-40 overflow-y-auto shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {suggestions.map((s, i) => (
              <button
                key={`${s.name}-${s.line}-${i}`}
                type="button"
                className="w-full text-left px-4 py-3 text-xs text-[#f8f9fa] hover:bg-[#2d3748] border-b border-[#4a5568] last:border-none transition-colors"
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

      {/* 2. 条件設定 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="maxTime" className={labelStyle}>▼ たびの はんい</label>
          <div className="relative">
            <select
              id="maxTime"
              className={inputStyle}
              value={maxTime}
              onChange={(e) => setMaxTime(e.target.value)}
            >
              <option value="30">30ぷん以内</option>
              <option value="60">60ぷん以内</option>
              <option value="120">120ぷん以内</option>
              <option value="0">むせいげん</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px]">▼</span>
          </div>
        </div>

        <div>
          <label htmlFor="prefecture" className={labelStyle}>▼ とどうふけん</label>
          <div className="relative">
            <select
              id="prefecture"
              className={inputStyle}
              value={selectedPref}
              onChange={(e) => setSelectedPref(e.target.value)}
            >
              <option value="全国">ぜんこく</option>
              {displayPrefectures.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px]">▼</span>
          </div>
        </div>
      </div>

      {/* 3. 路線選択 */}
      {lines.length > 0 && (
        <div className="animate-in fade-in duration-300">
          <label htmlFor="line" className={labelStyle}>▼ つかう ろせん (任意)</label>
          <div className="relative">
            <select
              id="line"
              className={inputStyle}
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
            >
              <option value="すべて">すべての ろせん</option>
              {lines.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px]">▼</span>
          </div>
        </div>
      )}

      {/* 4. 実行ボタン */}
      <button
        onClick={handleGacha}
        disabled={loading}
        className={`w-full pixel-button py-5 text-sm tracking-[0.4em] mt-6 transition-all
          ${loading ? 'opacity-50 cursor-not-allowed' : 'animate-pulse active:scale-95'}`}
      >
        {loading ? "うらなっています..." : (departureStation ? "たびに出る" : "しゅっぱつ地点を いれる")}
      </button>
    </div>
  );
}