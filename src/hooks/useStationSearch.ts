import { useState, useEffect } from "react";
import { Station, StationsResponse, Coordinates } from "@/types";
import { APP_CONFIG } from "@/constants";

export const useStationSearch = () => {
  const [departureStation, setDepartureStation] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [currentCoords, setCurrentCoords] = useState<Coordinates | null>(null);

  useEffect(() => {
    if (!departureStation) {
      setSuggestions([]);
      setCurrentCoords(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://express.heartrails.com/api/json?method=getStations&name=${encodeURIComponent(departureStation)}`,
          { signal: controller.signal },
        );
        const data: StationsResponse = await res.json();
        const stations = data?.response?.station || [];

        setSuggestions(stations);
        setShowSuggestions(true);
        if (stations.length > 0) {
          setCurrentCoords({ lat: stations[0].y, lon: stations[0].x });
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("候補の取得に失敗しました:", error);
        }
      }
    }, APP_CONFIG.DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort(); // 古いリクエストをキャンセル
    };
  }, [departureStation]);

  return {
    departureStation,
    setDepartureStation,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    currentCoords,
    setCurrentCoords,
  };
};
