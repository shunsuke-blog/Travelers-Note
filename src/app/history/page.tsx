"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Record = {
  name: string;
  line: string;
  date: string;
  prefecture: string;
  x?: number;
  y?: number;
};

const PREF_CODE_MAP: { [key: string]: string } = {
  "北海道": "1", "青森県": "2", "岩手県": "3", "宮城県": "4", "秋田県": "5", "山形県": "6", "福島県": "7",
  "茨城県": "8", "栃木県": "9", "群馬県": "10", "埼玉県": "11", "千葉県": "12", "東京都": "13", "神奈川県": "14",
  "新潟県": "15", "富山県": "16", "石川県": "17", "福井県": "18", "山梨県": "19", "長野県": "20", "岐阜県": "21", "静岡県": "22", "愛知県": "23",
  "三重県": "24", "滋賀県": "25", "京都府": "26", "大阪府": "27", "兵庫県": "28", "奈良県": "29", "和歌山県": "30",
  "鳥取県": "31", "島根県": "32", "岡山県": "33", "広島県": "34", "山口県": "35", "徳島県": "36", "香川県": "37", "愛媛県": "38", "高知県": "39",
  "福岡県": "40", "佐賀県": "41", "長崎県": "42", "熊本県": "43", "大分県": "44", "宮崎県": "45", "鹿児島県": "46", "沖縄県": "47"
};

const CODE_TO_NAME = Object.fromEntries(Object.entries(PREF_CODE_MAP).map(([k, v]) => [v, k]));

export default function HistoryPage() {
  const [history, setHistory] = useState<Record[]>([]);
  const [mapSvg, setMapSvg] = useState<string>("");
  const [selectedPrefCode, setSelectedPrefCode] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<string>("すべて");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [pendingStation, setPendingStation] = useState<any | null>(null);

  // ★ どの駅の地図を開いているかを管理するState
  const [openMapStation, setOpenMapStation] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`https://express.heartrails.com/api/json?method=getStations&name=${searchQuery}`);
        const data = await res.json();
        if (data.response.station) {
          setSuggestions(data.response.station);
        }
      } catch (err) { console.error(err); }
    };
    const timer = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const saved = localStorage.getItem("stationHistory");
    if (saved) {
      const data: Record[] = JSON.parse(saved);
      const uniqueMap = new Map<string, Record>();
      data.forEach((item) => uniqueMap.set(item.name, item));
      const uniqueData = Array.from(uniqueMap.values());
      setHistory(uniqueData);
      localStorage.setItem("stationHistory", JSON.stringify(uniqueData));
    }

    fetch("https://raw.githubusercontent.com/geolonia/japanese-prefectures/master/map-polygon.svg")
      .then((res) => res.text())
      .then((svg) => setMapSvg(svg));
  }, []);

  useEffect(() => {
    setSelectedLine("すべて");
    // 都道府県が切り替わったら開いている地図を閉じる
    setOpenMapStation(null);
  }, [selectedPrefCode]);

  const handleSelectSuggestion = (station: any) => {
    setPendingStation(station);
    setSearchQuery(station.name);
    setSuggestions([]);
  };

  const handleFinalSave = () => {
    if (!pendingStation) return;
    if (history.some(h => h.name === pendingStation.name)) {
      alert("その えきは すでに きろくされている！");
      setPendingStation(null);
      setSearchQuery("");
      return;
    }
    const newEntry = {
      name: pendingStation.name,
      line: pendingStation.line,
      prefecture: pendingStation.prefecture,
      date: new Date().toLocaleDateString(),
      // ★ 検索からの追加時も座標を保存するように修正
      x: pendingStation.x,
      y: pendingStation.y
    };
    const newHistory = [newEntry, ...history];
    setHistory(newHistory);
    localStorage.setItem("stationHistory", JSON.stringify(newHistory));
    setPendingStation(null);
    setSearchQuery("");
    alert(`${pendingStation.name} を ぼうけんの書に しるした！`);
  };

  const prefFilteredHistory = history.filter(h =>
    selectedPrefCode && PREF_CODE_MAP[h.prefecture] === selectedPrefCode
  );

  const availableLines = Array.from(new Set(prefFilteredHistory.map(h => h.line))).filter(Boolean);

  const finalFilteredHistory = prefFilteredHistory.filter(h =>
    selectedLine === "すべて" || h.line === selectedLine
  );

  const handleMapClick = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    const prefElement = target.closest(".prefecture") as HTMLElement;
    if (prefElement) {
      const code = prefElement.dataset.code || null;
      setSelectedPrefCode(code);
    } else {
      setSelectedPrefCode(null);
    }
  };

  const handleDelete = (name: string) => {
    if (confirm(`${name} の きろくを すてますか？`)) {
      const newHistory = history.filter((item) => item.name !== name);
      setHistory(newHistory);
      localStorage.setItem("stationHistory", JSON.stringify(newHistory));
    }
  };

  const visitedPrefCodes = Array.from(new Set(
    history.map(h => PREF_CODE_MAP[h.prefecture]).filter(Boolean)
  ));

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto">
        <div className="w-full flex justify-end mb-6 mt-4">
          <Link href="/" className="pixel-button text-[10px] py-2 px-4 flex items-center gap-2">
            <span>◀</span> クエストへ もどる
          </Link>
        </div>
        <h1 className="text-2xl font-black text-[#f8f9fa] mb-8 text-center tracking-widest">
          ▼ ぼうけんの きろく
        </h1>

        {/* 検索・追加フォームエリア */}
        <div className="pixel-box mb-8">
          <p className="text-[#ffd700] text-xs font-bold mb-4 px-1 text-center tracking-widest">
            あらたな ぼうけんを しるす
          </p>
          <div className="relative">
            <div className="bg-black border-2 border-[#4a5568] p-3 flex items-center mb-4 focus-within:border-[#ffd700] transition-all">
              <span className="mr-2 opacity-70">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPendingStation(null);
                }}
                placeholder="えき名を さがす..."
                className="w-full text-sm outline-none bg-transparent font-bold text-[#f8f9fa] placeholder-[#4a5568]"
              />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full -mt-2 bg-black border-2 border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSuggestion(s)}
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
            className={`w-full pixel-button flex items-center justify-center gap-2 ${!pendingStation ? "opacity-30 grayscale cursor-not-allowed" : "animate-pulse"}`}
          >
            <span className={pendingStation ? "animate-bounce" : ""}>📜</span> きろくを しるす
          </button>
          {pendingStation && (
            <p className="text-center text-[10px] text-[#00ff41] mt-3 font-bold">
              ▶ {pendingStation.name} を せんたく中
            </p>
          )}
        </div>

        {/* 日本地図セクション */}
        <div className="pixel-box mb-8 overflow-hidden">
          <h2 className="text-center text-xs font-bold text-[#ffd700] mb-2 tracking-widest">
            {selectedPrefCode ? `▼ ${CODE_TO_NAME[selectedPrefCode]} を そうさ中` : "▼ ちずを タップして じょうほうをみる"}
          </h2>
          <style dangerouslySetInnerHTML={{
            __html: `
            .geolonia-svg-map { 
              width: 100%; 
              max-height: 300px; 
              cursor: pointer; 
              background: #000033; 
              border: 2px solid #ffffff; 
              padding: 15px; 
              image-rendering: pixelated;
            }
            .geolonia-svg-map .prefecture { 
              fill: #223322; 
              stroke: #001100; 
              stroke-width: 0.5; 
              transition: all 0.1s; 
            }
            ${visitedPrefCodes.map(code => `.geolonia-svg-map [data-code="${code}"] { fill: #33aa33 !important; }`).join('\n')}
            ${selectedPrefCode ? `.geolonia-svg-map [data-code="${selectedPrefCode}"] { fill: #ffd700 !important; filter: drop-shadow(0 0 8px #ffd700); }` : ""}
          `}} />
          <div className="w-full flex justify-center items-center p-4 bg-black" onClick={handleMapClick}>
            <div
              className="w-full shadow-[0_0_20px_rgba(255,255,255,0.05)]"
              dangerouslySetInnerHTML={{ __html: mapSvg }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 px-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              Total Discovery: <span className="text-[#ffd700]">{visitedPrefCodes.length}</span> / 47
            </p>
          </div>
        </div>

        {/* リストセクション */}
        <div className="space-y-4">
          {selectedPrefCode ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-1 mb-6">
                <h3 className="text-[#ffd700] text-sm font-bold mb-4 flex items-center">
                  ▼ {CODE_TO_NAME[selectedPrefCode]} で はっけんした えき
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                  <button
                    onClick={() => setSelectedLine("すべて")}
                    className={`px-4 py-2 text-[10px] font-bold transition-all whitespace-nowrap border-2 ${selectedLine === "すべて"
                      ? "bg-[#ffd700] border-[#ffd700] text-black shadow-none translate-y-px"
                      : "bg-black border-white text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                      }`}
                  >
                    すべて ({prefFilteredHistory.length})
                  </button>
                  {availableLines.map(line => (
                    <button
                      key={line}
                      onClick={() => setSelectedLine(line)}
                      className={`px-4 py-2 text-[10px] font-bold transition-all whitespace-nowrap border-2 ${selectedLine === line
                        ? "bg-[#ffd700] border-[#ffd700] text-black shadow-none translate-y-px"
                        : "bg-black border-white text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                        }`}
                    >
                      {line}
                    </button>
                  ))}
                </div>
              </div>

              {finalFilteredHistory.length === 0 ? (
                <div className="pixel-box text-center py-10 opacity-60">
                  <p className="text-sm">ここには まだ なにも ないようだ...</p>
                </div>
              ) : (
                finalFilteredHistory.map((item, index) => {
                  // ★ 地図の表示範囲（0.005だと周辺およそ500m程度）
                  const offset = 0.005;
                  const bbox = item.x && item.y
                    ? `${item.x - offset},${item.y - offset},${item.x + offset},${item.y + offset}`
                    : "";
                  const isOpen = openMapStation === item.name;

                  return (
                    <div key={index} className="pixel-box mb-4 flex flex-col">
                      <div className="flex justify-between items-start w-full">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2">
                            <p className="font-bold text-xl text-white leading-tight wrap-break-words">{item.name}</p>
                            <p className="text-[10px] text-[#ffd700] mt-1">{item.line}</p>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Tochaku: {item.date}</p>
                        </div>

                        {/* アクションボタン群 */}
                        <div className="shrink-0 ml-4 flex flex-col gap-2 items-end">
                          {/* 座標データがある場合のみ「まちをみる」ボタンを表示 */}
                          {item.x && item.y && (
                            <button
                              onClick={() => setOpenMapStation(isOpen ? null : item.name)}
                              className="px-3 py-1.5 bg-[#1a202c] border border-[#f8f9fa] text-white text-[10px] font-bold hover:bg-[#2d3748] hover:border-[#ffd700] hover:text-[#ffd700] transition-all whitespace-nowrap flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-none hover:translate-y-px"
                            >
                              <span>📜</span> {isOpen ? "ちずをとじる" : "まちをみる"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item.name)}
                            className="px-3 py-1 bg-red-900/30 border border-red-500 text-red-500 text-[10px] font-bold hover:bg-red-600 hover:text-white transition-all whitespace-nowrap w-full"
                          >
                            すてる
                          </button>
                        </div>
                      </div>

                      {/* ★ 古代の宝の地図風エリア（isOpen の時だけ展開） */}
                      {isOpen && item.x && item.y && (
                        <div className="mt-4 pt-4 border-t border-dashed border-[#8c7355] animate-in slide-in-from-top-2">
                          <p className="text-[#d4c596] text-[10px] mb-2 font-bold tracking-widest text-center" style={{ textShadow: "1px 1px 0 #000" }}>
                            ▼ {item.name} 周辺の 古地図
                          </p>

                          {/* マップの外枠：羊皮紙のようなベージュ背景と、茶色の枠線 */}
                          <div className="w-full h-48 bg-[#e6d8ad] border-4 double border-[#8c7355] relative overflow-hidden flex items-center justify-center rounded shadow-lg">

                            {/* OpenStreetMap 本体 */}
                            {/* 変更前：OpenStreetMap 本体 */}
                            {/* 変更後：国土地理院地図（地図記号バッチリ！） */}
                            <iframe
                              /* ★ サイズをさらに大きくして上にずらし、メニューを完全に枠外へ消し去ります */
                              className="w-[140%] h-[140%] absolute -top-[25%] -left-[20%] pointer-events-none mix-blend-multiply"
                              style={{
                                filter: "grayscale(100%) sepia(80%) contrast(130%) brightness(100%) hue-rotate(-10deg)",
                                imageRendering: "pixelated"
                              }}
                              /* ★ z=16 を z=14 に変更（14〜15あたりが広くておすすめです） */
                              src={`https://maps.gsi.go.jp/?ll=${item.y},${item.x}&z=14&base=std`}
                            />
                            {/* 中心位置（駅）を示すカーソル：地図に馴染む深い赤色に */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#800000] animate-bounce text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] z-10" style={{ filter: "sepia(100%)" }}>
                              📍
                            </div>

                            {/* 1. 縁の焼け焦げ表現（内側への強い影） */}
                            <div className="absolute inset-0 pointer-events-none"
                              style={{
                                boxShadow: "inset 0 0 50px 20px rgba(85, 50, 20, 0.8)",
                                mixBlendMode: "multiply"
                              }}
                            ></div>

                            {/* 2. 紙のザラザラしたノイズテクスチャ */}
                            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJYdWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC43IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=')] mix-blend-overlay"></div>

                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="pixel-box text-center py-12">
              <p className="text-[#ffd700] text-sm animate-pulse tracking-widest">
                ▼ ちずを ひらいて じょうほうを えよ
              </p>
            </div>
          )}
        </div>

        {/* ページ最下部の戻るボタン */}
        <div className="mt-12 text-center pb-20">
          <Link
            href="/"
            className="pixel-button inline-block px-10 py-4 text-base tracking-[0.2em] group relative"
          >
            <span className="absolute left-3 opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
            たびを つづける
          </Link>
          <p className="mt-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Return to Base
          </p>
        </div>
      </div>
    </div>
  );
}