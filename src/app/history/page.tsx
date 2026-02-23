"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Station } from "@/types";
import { PREF_CODE_MAP } from "@/constants";

// 既存のStation型に日付を加えた履歴用型定義
interface HistoryRecord extends Station {
  date: string;
}

const CODE_TO_NAME = Object.fromEntries(
  Object.entries(PREF_CODE_MAP).map(([k, v]) => [v, k])
);

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [mapSvg, setMapSvg] = useState<string>("");
  const [selectedPrefCode, setSelectedPrefCode] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<string>("すべて");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [pendingStation, setPendingStation] = useState<Station | null>(null);
  const [openMapStation, setOpenMapStation] = useState<string | null>(null);

  // 駅名検索ロジック
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`https://express.heartrails.com/api/json?method=getStations&name=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.response.station) {
          setSuggestions(data.response.station);
        }
      } catch (err) {
        console.error("検索エラー:", err);
      }
    };
    const timer = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 初期ロード：履歴と地図SVGの取得
  useEffect(() => {
    const saved = localStorage.getItem("stationHistory");
    if (saved) {
      const data: HistoryRecord[] = JSON.parse(saved);
      // 重複排除ロジック
      const uniqueData = Array.from(new Map(data.map(item => [item.name, item])).values());
      setHistory(uniqueData);
      localStorage.setItem("stationHistory", JSON.stringify(uniqueData));
    }

    fetch("https://raw.githubusercontent.com/geolonia/japanese-prefectures/master/map-polygon.svg")
      .then((res) => res.text())
      .then((svg) => setMapSvg(svg))
      .catch(err => console.error("地図取得エラー:", err));
  }, []);

  // 都道府県切り替え時のリセット
  useEffect(() => {
    setSelectedLine("すべて");
    setOpenMapStation(null);
  }, [selectedPrefCode]);

  const handleFinalSave = () => {
    if (!pendingStation) return;
    if (history.some(h => h.name === pendingStation.name)) {
      alert("その えきは すでに ぼうけんの書に しるされている！");
      return;
    }

    const newEntry: HistoryRecord = {
      ...pendingStation,
      date: new Date().toLocaleDateString(),
    };

    const newHistory = [newEntry, ...history];
    setHistory(newHistory);
    localStorage.setItem("stationHistory", JSON.stringify(newHistory));
    setPendingStation(null);
    setSearchQuery("");
    alert(`${pendingStation.name} を ぼうけんの書に しるした！`);
  };

  const handleDelete = (name: string) => {
    if (confirm(`${name} の きろくを すてますか？`)) {
      const newHistory = history.filter((item) => item.name !== name);
      setHistory(newHistory);
      localStorage.setItem("stationHistory", JSON.stringify(newHistory));
    }
  };

  // フィルタリングロジック
  const prefFilteredHistory = history.filter(h =>
    selectedPrefCode && PREF_CODE_MAP[h.prefecture] === selectedPrefCode
  );

  const availableLines = Array.from(new Set(prefFilteredHistory.map(h => h.line))).filter(Boolean);

  const finalFilteredHistory = prefFilteredHistory.filter(h =>
    selectedLine === "すべて" || h.line === selectedLine
  );

  const visitedPrefCodes = Array.from(new Set(
    history.map(h => PREF_CODE_MAP[h.prefecture]).filter(Boolean)
  ));

  return (
    <div className="min-h-screen p-6 bg-black text-[#f8f9fa]">
      <div className="max-w-md mx-auto">
        {/* ヘッダーエリア */}
        <div className="w-full flex justify-end mb-6 mt-4">
          <Link href="/" className="pixel-button text-[10px] py-2 px-4 flex items-center gap-2">
            <span>◀</span> クエストへ もどる
          </Link>
        </div>

        <h1 className="text-2xl font-black mb-8 text-center tracking-[0.2em]">
          ▼ ぼうけんの きろく
        </h1>

        {/* 1. 追加フォーム */}
        <section className="pixel-box mb-8">
          <p className="text-[#ffd700] text-[10px] font-bold mb-4 text-center tracking-widest uppercase">
            - Register New Discovery -
          </p>
          <div className="relative mb-4">
            <div className="bg-[#1a202c] border-2 border-[#4a5568] p-3 flex items-center focus-within:border-[#ffd700] transition-all">
              <span className="mr-2 opacity-70">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPendingStation(null);
                }}
                placeholder="えき名を さがす..."
                className="w-full text-sm outline-none bg-transparent font-bold placeholder-[#4a5568]"
              />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-black border-2 border-white shadow-xl max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.name}-${i}`}
                    onClick={() => {
                      setPendingStation(s);
                      setSearchQuery(s.name);
                      setSuggestions([]);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#2d3748] border-b border-[#4a5568] last:border-none transition-colors"
                  >
                    <p className="font-bold text-[#ffd700] text-sm">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.line} / {s.prefecture}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleFinalSave}
            disabled={!pendingStation}
            className={`w-full pixel-button flex items-center justify-center gap-2 py-3 ${!pendingStation ? "opacity-30 grayscale cursor-not-allowed" : "animate-pulse"}`}
          >
            <span>📜</span> きろくを しるす
          </button>
        </section>

        {/* 2. 日本地図セクション（演出維持） */}
        <section className="pixel-box mb-8">
          <h2 className="text-center text-[10px] font-bold text-[#ffd700] mb-3 tracking-widest uppercase">
            {selectedPrefCode ? `▼ ${CODE_TO_NAME[selectedPrefCode]} を そうさ中` : "▼ Discovery Map"}
          </h2>
          <div
            className="w-full bg-[#000033] border-2 border-white p-4 cursor-pointer overflow-hidden"
            onClick={(e) => {
              const target = e.target as SVGElement;
              const prefElement = target.closest(".prefecture") as HTMLElement;
              setSelectedPrefCode(prefElement?.dataset.code || null);
            }}
          >
            <style dangerouslySetInnerHTML={{
              __html: `
              .geolonia-svg-map .prefecture { fill: #223322; stroke: #001100; stroke-width: 0.5; transition: fill 0.2s; }
              ${visitedPrefCodes.map(code => `.geolonia-svg-map [data-code="${code}"] { fill: #33aa33 !important; }`).join('\n')}
              ${selectedPrefCode ? `.geolonia-svg-map [data-code="${selectedPrefCode}"] { fill: #ffd700 !important; }` : ""}
            `}} />
            <div dangerouslySetInnerHTML={{ __html: mapSvg }} className="geolonia-svg-map" />
          </div>
          <div className="mt-3 flex justify-between px-1 text-[10px] font-bold text-slate-500 uppercase">
            <span>Progress</span>
            <span><span className="text-[#ffd700]">{visitedPrefCodes.length}</span> / 47 Prefectures</span>
          </div>
        </section>

        {/* 3. 駅リスト */}
        <section className="space-y-4">
          {selectedPrefCode ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <h3 className="text-[#ffd700] text-[10px] font-bold mb-4 tracking-widest uppercase px-1">
                  ▼ Stations in {CODE_TO_NAME[selectedPrefCode]}
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {["すべて", ...availableLines].map(line => (
                    <button
                      key={line}
                      onClick={() => setSelectedLine(line)}
                      className={`px-4 py-2 text-[10px] font-bold border-2 transition-all whitespace-nowrap ${selectedLine === line
                        ? "bg-[#ffd700] border-[#ffd700] text-black"
                        : "bg-black border-white text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                        }`}
                    >
                      {line === "すべて" ? `すべて (${prefFilteredHistory.length})` : line}
                    </button>
                  ))}
                </div>
              </div>

              {finalFilteredHistory.map((item, index) => {
                const isOpen = openMapStation === item.name;
                return (
                  <div key={`${item.name}-${index}`} className="pixel-box mb-4">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <h4 className="font-bold text-xl leading-tight">{item.name}</h4>
                        <p className="text-[10px] text-[#ffd700] mt-1">{item.line}</p>
                        <p className="text-[9px] text-slate-500 mt-2 uppercase">Arrival: {item.date}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {item.x && item.y && (
                          <button
                            onClick={() => setOpenMapStation(isOpen ? null : item.name)}
                            className="px-3 py-1.5 bg-[#1a202c] border border-white text-[10px] font-bold hover:text-[#ffd700] hover:border-[#ffd700] transition-all"
                          >
                            {isOpen ? "閉じる" : "街をみる"}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.name)}
                          className="px-3 py-1 bg-red-900/20 border border-red-500 text-red-500 text-[10px] font-bold hover:bg-red-500 hover:text-white transition-all"
                        >
                          消去
                        </button>
                      </div>
                    </div>

                    {/* 古地図風マップエリア（演出はそのまま維持） */}
                    {isOpen && item.x && item.y && (
                      <div className="mt-4 pt-4 border-t border-dashed border-[#8c7355] animate-in slide-in-from-top-2">
                        <div className="w-full h-48 bg-[#e6d8ad] border-4 border-[#8c7355] relative overflow-hidden rounded shadow-inner">
                          <iframe
                            className="w-[140%] h-[140%] absolute -top-[20%] -left-[20%] pointer-events-none mix-blend-multiply"
                            style={{
                              filter: "grayscale(100%) sepia(80%) contrast(120%) brightness(100%)",
                              imageRendering: "pixelated"
                            }}
                            src={`https://maps.gsi.go.jp/?ll=${item.y},${item.x}&z=14&base=std`}
                          />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl z-10">📍</div>
                          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(85,50,20,0.6)]" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pixel-box text-center py-12 opacity-50">
              <p className="text-sm tracking-widest">▼ ちずを ひらいて じょうほうを えよ</p>
            </div>
          )}
        </section>

        <div className="mt-12 text-center pb-10">
          <Link href="/" className="pixel-button inline-block px-8 py-4 text-sm tracking-[0.2em]">
            たびを つづける
          </Link>
        </div>
      </div>
    </div>
  );
}