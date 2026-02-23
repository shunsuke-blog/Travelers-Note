export type Station = {
  name: string;
  line: string;
  prefecture: string;
  postal: string;
  x: number;
  y: number;
  prev?: string;
  next?: string;
  estimatedTime?: number;
};

export type LinesResponse = {
  response: { line: string[] };
};

export type StationsResponse = {
  response: { station: Station[] };
};

export type Coordinates = {
  lat: number;
  lon: number;
};

// 履歴データ用の拡張型
export interface HistoryRecord extends Station {
  date: string;
}
