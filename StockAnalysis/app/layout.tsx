import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "국민연금 공시 대시보드",
  description: "공시 기반 지분율 변동 정보를 확인하는 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
