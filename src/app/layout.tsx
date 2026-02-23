import type { Metadata } from "next";
import { DotGothic16 } from "next/font/google"; // ★ドットフォントを読み込む
import "./globals.css";

// ★フォントの設定
const dotGothic = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "えきガチャ クエスト", // タイトルもRPG風に
  description: "駅との出会いを 記録する ぼうけんの書",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`
          ${dotGothic.className} 
          antialiased 
          bg-[#0c0e14] 
          text-[#f8f9fa]
        `}
      >
        {children}
      </body>
    </html>
  );
}