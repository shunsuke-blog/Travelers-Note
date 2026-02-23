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