"use client";

import { useState, useEffect, useRef } from 'react'; // ★ useRef を追加
import Link from "next/link";
import { PREFECTURES, PREFECTURE_DATA, APP_CONFIG } from '@/constants';
import { calculateDistance } from '@/utils/utils';
import { LinesResponse } from '@/types';
import { useStationSearch } from '@/hooks/useStationSearch';
import { useGachaLogic } from '@/hooks/useGachaLogic';
import ResultCard from '@/components/ResultCard';
import SearchForm from '@/components/SearchForm';

export default function Home() {
  // 1. スクロール先の目印（Ref）を作成
  const resultRef = useRef<HTMLDivElement>(null);

  const {
    departureStation, setDepartureStation,
    suggestions, showSuggestions, setShowSuggestions,
    currentCoords, setCurrentCoords
  } = useStationSearch();

  const {
    loading, statusMessage, resultStation, setResultStation, executeGacha
  } = useGachaLogic();

  const [selectedPref, setSelectedPref] = useState<string>("全国");
  const [lines, setLines] = useState<string[]>([]);
  const [maxTime, setMaxTime] = useState<string>("60");
  const [displayPrefectures, setDisplayPrefectures] = useState<string[]>(PREFECTURES);
  const [selectedLine, setSelectedLine] = useState<string>("すべて");

  useEffect(() => {
    setSelectedLine("すべて");
    if (selectedPref === "全国") {
      setLines([]);
      return;
    }

    const fetchLines = async () => {
      try {
        let searchPref = selectedPref;
        if (selectedPref.includes("東京都")) searchPref = "東京都";

        const res = await fetch(`https://express.heartrails.com/api/json?method=getLines&prefecture=${encodeURIComponent(searchPref)}`);
        const data: LinesResponse = await res.json();
        setLines(data?.response?.line || []);
      } catch (error) {
        console.error("路線の取得に失敗しました", error);
      }
    };
    fetchLines();
  }, [selectedPref]);

  useEffect(() => {
    if (!currentCoords || maxTime === "0") {
      setDisplayPrefectures(PREFECTURES);
      return;
    }
    const maxDist = (parseInt(maxTime) / 60) * APP_CONFIG.SPEED_KMH;
    const searchRadius = maxDist + APP_CONFIG.DISTANCE_MARGIN;
    const filteredPrefs = PREFECTURE_DATA.filter(pref => {
      const dist = calculateDistance(currentCoords.lat, currentCoords.lon, pref.y, pref.x);
      return dist <= searchRadius;
    }).map(d => d.name);
    setDisplayPrefectures(filteredPrefs);
  }, [currentCoords, maxTime]);

  // 2. スクロール処理を含む実行ハンドラにアップグレード
  const onGachaClick = async () => {
    // ガチャを実行
    await executeGacha({
      departureStation,
      currentCoords,
      selectedPref,
      selectedLine,
      maxTime,
      lines,
      displayPrefectures
    });

    // 3. 結果の描画を待ってからスクロール
    // executeGachaの中で resultStation が更新されるため、
    // setTimeoutでマウント後のDOMを捕捉します
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 150);
  };

  return (
    <main className="min-h-screen bg-[#0c0e14] flex flex-col items-center justify-start p-6 overflow-x-hidden">
      <div className="w-full max-w-md flex justify-end mb-6 mt-4">
        <Link href="/history" className="pixel-button text-[10px] py-2 px-4 flex items-center gap-2">
          <span>📜</span> ぼうけんの きろく
        </Link>
      </div>

      <div className="pixel-box w-full max-w-md animate-in fade-in zoom-in-95 duration-500 bg-[#0c0e14]">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-[#ffd700] tracking-[0.2em]">
            ▼ えきガチャ クエスト
          </h1>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">
            Travel Command Center
          </p>
        </div>

        {/* handleGacha の代わりに onGachaClick を渡す */}
        <SearchForm
          departureStation={departureStation}
          setDepartureStation={setDepartureStation}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          setCurrentCoords={setCurrentCoords}
          setResultStation={setResultStation}
          maxTime={maxTime}
          setMaxTime={setMaxTime}
          selectedPref={selectedPref}
          setSelectedPref={setSelectedPref}
          displayPrefectures={displayPrefectures}
          lines={lines}
          selectedLine={selectedLine}
          setSelectedLine={setSelectedLine}
          loading={loading}
          handleGacha={onGachaClick}
        />

        {statusMessage && (
          <div className="mt-6 p-4 bg-black border border-slate-800">
            <p className="text-center text-[10px] text-[#00ff41] animate-pulse leading-relaxed">
              ▶ {statusMessage}
            </p>
          </div>
        )}

        {/* 4. スクロール位置の着地点を Ref で指定 (scroll-mt で上部に余白を確保) */}
        <div ref={resultRef} className="scroll-mt-10">
          {resultStation && (
            <div className="mt-8 pt-8 border-t-2 border-dashed border-[#4a5568] animate-in slide-in-from-top-4 duration-500">
              <div className="text-[#ffd700] text-[10px] font-bold mb-4 text-center">
                ▼ 目的地が あらわれた！
              </div>
              <ResultCard
                resultStation={resultStation}
                departureStation={departureStation}
              />
            </div>
          )}
        </div>
      </div>

      <footer className="mt-12 text-center pb-10">
        <p className="text-[10px] text-slate-600 font-bold tracking-widest uppercase">
          Powered by HeartRails Express
        </p>
      </footer>
    </main>
  );
}