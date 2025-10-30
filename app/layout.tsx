import { ThemeProvider } from "@/src/presentation/components/providers/ThemeProvider";
import type { Metadata } from "next";
import "../public/styles/index.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dummy Legends - แข่งขันเกมไพ่ดัมมี่ออนไลน์",
    template: "%s | Dummy Legends",
  },
  description:
    "Dummy Legends แพลตฟอร์มแข่งขันเกมไพ่ดัมมี่ออนไลน์ระดับโปร รองรับทัวร์นาเมนต์ จัดอันดับ พร้อมระบบคอมมูนิตี้ครบวงจร",
  keywords: [
    "ดัมมี่",
    "Dummy",
    "Dummy Legends",
    "เกมไพ่ไทย",
    "การแข่งขันออนไลน์",
    "ทัวร์นาเมนต์",
    "Leaderboard",
    "Esports",
    "Community",
    "Card Game",
    "Online Card Tournament",
  ],
  authors: [{ name: "Dummy Legends Team" }],
  creator: "Dummy Legends",
  publisher: "Dummy Legends",
  category: "Gaming",
  openGraph: {
    title: "Dummy Legends - แข่งขันเกมไพ่ดัมมี่ออนไลน์",
    description:
      "เล่นเกมไพ่ดัมมี่ออนไลน์ แข่งขันทัวร์นาเมนต์ระดับโลก พร้อมระบบจัดอันดับและคอมมูนิตี้",
    url: siteUrl,
    siteName: "Dummy Legends",
    type: "website",
    locale: "th_TH",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dummy Legends - แข่งขันเกมไพ่ดัมมี่ออนไลน์",
    description:
      "ร่วมเล่นเกมไพ่ดัมมี่ออนไลน์ แข่งขันทัวร์นาเมนต์ จัดอันดับ พร้อมคอมมูนิตี้สำหรับโปรดัมมี่",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
