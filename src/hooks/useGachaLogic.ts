import { useState } from "react";
import {
  Station,
  LinesResponse,
  StationsResponse,
  Coordinates,
} from "../types";
import { APP_CONFIG } from "@/constants";
import { calculateDistance, estimateTime } from "../utils/utils";

// 配列をシャッフルするユーティリティ関数
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const useGachaLogic = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [resultStation, setResultStation] = useState<Station | null>(null);

  const executeGacha = async (params: {
    departureStation: string;
    currentCoords: Coordinates | null;
    selectedPref: string;
    selectedLine: string;
    maxTime: string;
    lines: string[];
    displayPrefectures: string[];
  }) => {
    const {
      departureStation,
      currentCoords,
      selectedPref,
      selectedLine,
      maxTime,
      lines,
      displayPrefectures,
    } = params;

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

      // 座標が未取得の場合はAPIで解決
      if (!currentCoords) {
        const res = await fetch(
          `https://express.heartrails.com/api/json?method=getStations&name=${encodeURIComponent(departureStation)}`,
        );
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

      let targetLines = lines;

      // 全国の場合はランダムに都道府県を選び路線を取得
      if (selectedPref === "全国") {
        const randomPref =
          displayPrefectures[
            Math.floor(Math.random() * displayPrefectures.length)
          ];
        const res = await fetch(
          `https://express.heartrails.com/api/json?method=getLines&prefecture=${encodeURIComponent(randomPref)}`,
        );
        const data: LinesResponse = await res.json();
        targetLines = data?.response?.line || [];
      } else if (selectedLine !== "すべて") {
        targetLines = [selectedLine];
      }

      if (targetLines.length === 0) {
        setStatusMessage("路線データが見つかりませんでした。");
        return;
      }

      // 路線をシャッフルし、最大試行回数（MAX_API_RETRIES）だけAPIを叩く
      const shuffledLines = shuffleArray(targetLines);
      const limit = Math.min(shuffledLines.length, APP_CONFIG.MAX_API_RETRIES);
      let foundStation: Station | null = null;

      for (let i = 0; i < limit; i++) {
        setStatusMessage(`目的地を さがしています...(${i + 1}/${limit})`);
        const targetLine = shuffledLines[i];

        const resStations = await fetch(
          `https://express.heartrails.com/api/json?method=getStations&line=${encodeURIComponent(targetLine)}`,
        );
        const dataStations: StationsResponse = await resStations.json();
        const stations = dataStations?.response?.station || [];

        // 条件によるフィルタリング
        let candidates = stations;
        if (selectedPref !== "全国") {
          if (selectedPref === "東京都(23区内)") {
            candidates = stations.filter(
              (s) => s.postal && s.postal.match(/^1[0-5]/),
            );
          } else if (selectedPref === "東京都(23区外)") {
            candidates = stations.filter(
              (s) =>
                s.prefecture === "東京都" &&
                !(s.postal && s.postal.match(/^1[0-5]/)),
            );
          } else {
            const searchPref =
              selectedPref === "東京都(全域)" ? "東京都" : selectedPref;
            candidates = stations.filter((s) => s.prefecture === searchPref);
          }
        }

        // 距離と時間の計算
        const validCandidates = candidates.filter((candidate) => {
          const dist = calculateDistance(
            deptLat,
            deptLon,
            candidate.y,
            candidate.x,
          );
          const time = estimateTime(dist);
          return maxTime === "0" || time <= parseInt(maxTime);
        });

        if (validCandidates.length > 0) {
          const picked =
            validCandidates[Math.floor(Math.random() * validCandidates.length)];
          const dist = calculateDistance(deptLat, deptLon, picked.y, picked.x);
          foundStation = { ...picked, estimatedTime: estimateTime(dist) };
          break; // 見つかったらループを抜ける
        }
      }

      if (foundStation) {
        setResultStation(foundStation);
        setStatusMessage("");
      } else {
        setStatusMessage("条件に合う目的地が 見つかりませんでした。");
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    statusMessage,
    resultStation,
    setResultStation,
    executeGacha,
  };
};
