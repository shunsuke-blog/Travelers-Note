"use client";

import { useState, useEffect } from 'react';
import { PREFECTURES, PREFECTURE_DATA } from './constants';
import { calculateDistance, estimateTime } from './utils';
import ResultCard from './ResultCard';
import SearchForm from './SearchForm';
import Link from "next/link";

// 型定義
type LinesResponse = {
  response: { line: string[]; }
};

type StationsResponse = {
  response: {
    station: {
      name: string;
      line: string;
      prefecture: string;
      postal: string;
      x: number;
      y: number;
      prev?: string;
      next?: string;
    }[];
  }
};

export default function Home() {
  const [selectedPref, setSelectedPref] = useState<string>("全国");
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [departureStation, setDepartureStation] = useState<string>("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [maxTime, setMaxTime] = useState<string>("60");
  const [resultStation, setResultStation] = useState<any>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number, lon: number } | null>(null);
  const [displayPrefectures, setDisplayPrefectures] = useState<string[]>(PREFECTURES);
  const [selectedLine, setSelectedLine] = useState<string>("すべて");

  // 1. 都道府県が変わったら路線を取得
  useEffect(() => {
    setSelectedLine("すべて");
    if (selectedPref === "全国") {
      setLines([]);
      return;
    }
    const fetchLines = async () => {
      setLoading(true);
      setStatusMessage("じょうほうを あつめています...");
      try {
        let searchPref = selectedPref;
        if (selectedPref.includes("東京都")) searchPref = "東京都";

        const res = await fetch(`https://express.heartrails.com/api/json?method=getLines&prefecture=${encodeURIComponent(searchPref)}`);
        const data: LinesResponse = await res.json();
        setLines(data?.response?.line || []);
        setStatusMessage("");
      } catch (error) {
        console.error(error);
        setStatusMessage("じょうほうの しゅとくに しっぱいしました");
      } finally {
        setLoading(false);
      }
    };
    fetchLines();
  }, [selectedPref]);

  // 2. 出発駅の入力処理
  useEffect(() => {
    if (!departureStation) {
      setSuggestions([]);
      setCurrentCoords(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://express.heartrails.com/api/json?method=getStations&name=${encodeURIComponent(departureStation)}`);
        const data: StationsResponse = await res.json();
        const stations = data?.response?.station || [];
        setSuggestions(stations);
        setShowSuggestions(true);
        if (stations.length > 0) {
          setCurrentCoords({ lat: stations[0].y, lon: stations[0].x });
        }
      } catch (error) {
        console.error("候補の取得に失敗", error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [departureStation]);

  // 3. 都道府県リストの再計算
  useEffect(() => {
    if (!currentCoords || maxTime === "0") {
      setDisplayPrefectures(PREFECTURES);
      return;
    }
    const speedKmh = 40;
    const maxDist = (parseInt(maxTime) / 60) * speedKmh;
    const searchRadius = maxDist + 80;

    const filteredPrefs = PREFECTURE_DATA.filter(pref => {
      const dist = calculateDistance(currentCoords.lat, currentCoords.lon, pref.y, pref.x);
      return dist <= searchRadius;
    }).map(d => d.name);

    setDisplayPrefectures(filteredPrefs);
    if (selectedPref !== "全国" && !filteredPrefs.includes(selectedPref)) {
      setSelectedPref("全国");
    }
  }, [currentCoords, maxTime, selectedPref]);

  // ガチャ実行ボタン
  const handleGacha = async () => {
    if (!departureStation) {
      alert("しゅっぱつ地点を おしえてください！");
      return;
    }
    setLoading(true);
    setResultStation(null);
    setStatusMessage("行き先を うらなっています...");

    try {
      let deptLat = currentCoords?.lat || 0;
      let deptLon = currentCoords?.lon || 0;

      if (!currentCoords) {
        const res = await fetch(`https://express.heartrails.com/api/json?method=getStations&name=${encodeURIComponent(departureStation)}`);
        const data = await res.json();
        const station = data?.response?.station?.[0];
        if (!station) {
          alert("その地点は 地図にのっていないようです。");
          setLoading(false);
          setStatusMessage("");
          return;
        }
        deptLat = station.y;
        deptLon = station.x;
      }

      let foundStation = null;
      let retryCount = 0;
      const MAX_RETRIES = 100;

      while (retryCount < MAX_RETRIES) {
        retryCount++;
        setStatusMessage(retryCount > 1 ? `目的地を さがしています...(${retryCount})` : "うらなっています...");

        let targetLines = lines;
        if (selectedPref === "全国") {
          const randomPref = displayPrefectures[Math.floor(Math.random() * displayPrefectures.length)];
          const res = await fetch(`https://express.heartrails.com/api/json?method=getLines&prefecture=${encodeURIComponent(randomPref)}`);
          const data: LinesResponse = await res.json();
          targetLines = data?.response?.line || [];
          if (targetLines.length === 0) continue;
        } else if (selectedLine !== "すべて") {
          targetLines = [selectedLine];
        }

        const randomLine = targetLines[Math.floor(Math.random() * targetLines.length)];
        const resStations = await fetch(`https://express.heartrails.com/api/json?method=getStations&line=${encodeURIComponent(randomLine)}`);
        const dataStations: StationsResponse = await resStations.json();
        const stations = dataStations.response.station;

        let candidates = stations;
        if (selectedPref !== "全国") {
          if (selectedPref === "東京都(23区内)") {
            candidates = stations.filter(s => s.postal && s.postal.match(/^1[0-5]/));
          } else if (selectedPref === "東京都(23区外)") {
            candidates = stations.filter(s => s.prefecture === "東京都" && !(s.postal && s.postal.match(/^1[0-5]/)));
          } else {
            let searchPref = selectedPref === "東京都(全域)" ? "東京都" : selectedPref;
            candidates = stations.filter(s => s.prefecture === searchPref);
          }
        }

        if (candidates.length === 0) continue;
        const candidate = candidates[Math.floor(Math.random() * candidates.length)];
        const dist = calculateDistance(deptLat, deptLon, candidate.y, candidate.x);
        const time = estimateTime(dist);

        if (maxTime === "0" || time <= parseInt(maxTime)) {
          foundStation = candidate;
          (foundStation as any).estimatedTime = time;
          break;
        }
      }

      if (foundStation) {
        setResultStation(foundStation);
        setStatusMessage("");
      } else {
        setStatusMessage("目的地が 見つかりませんでした。条件を かえてみましょう。");
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("魔力が たりないようです（エラー発生）");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0c0e14] flex flex-col items-center justify-start p-6 overflow-x-hidden">

      {/* ナビゲーション */}
      <div className="w-full max-w-md flex justify-end mb-6 mt-4">
        <Link href="/history" className="pixel-button text-[10px] py-2 px-4 flex items-center gap-2">
          <span>📜</span> ぼうけんの きろく
        </Link>
      </div>

      {/* メインクエストボード：bg-[#0c0e14] を明示して余計な白を排除 */}
      <div className="pixel-box w-full max-w-md animate-in fade-in zoom-in-95 duration-500 bg-[#0c0e14]">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-[#ffd700] tracking-[0.2em]">
            ▼ えきガチャ クエスト
          </h1>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">
            Travel Command Center
          </p>
        </div>

        {/* フォーム：SearchForm.tsx も黒背景＋黄枠に書き換えるのが前提 */}
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
          currentCoords={currentCoords}
          handleGacha={handleGacha}
        />

        {/* ステータスウィンドウ：お手本に合わせて黒背景 */}
        {statusMessage && (
          <div className="mt-6 p-4 bg-black border border-slate-800">
            <p className="text-center text-[10px] text-[#00ff41] animate-pulse leading-relaxed">
              ▶ {statusMessage}
            </p>
          </div>
        )}

        {/* リザルト：出現演出 */}
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

      <footer className="mt-12 text-center pb-10">
        <p className="text-[10px] text-slate-600 font-bold tracking-widest uppercase">
          Powered by HeartRails Express
        </p>
      </footer>
    </main>
  );
}